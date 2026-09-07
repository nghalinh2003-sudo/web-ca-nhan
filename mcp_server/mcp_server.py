#!/usr/bin/env python3
"""
mcp_server.py — HnilahHub Content MCP Server
Cho phép Antigravity quản trị nội dung website qua Supabase (OAuth JWT).

Transport: stdio (chạy trực tiếp bởi Antigravity)
Auth: Supabase JWT (tự động refresh khi hết hạn)
"""

import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ============================================================
# PHẦN 1: CẤU HÌNH & QUẢN LÝ TOKEN
# ============================================================

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL  = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON = os.getenv("SUPABASE_ANON_KEY", "")
TOKEN_FILE    = Path(__file__).parent / ".mcp_token"

# Cache token trong bộ nhớ để không đọc file liên tục
_token_cache: dict = {}


def _load_token_file() -> dict:
    """Đọc token từ file .mcp_token."""
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            "Chưa có token. Hãy chạy: python get_token.py"
        )
    return json.loads(TOKEN_FILE.read_text(encoding="utf-8"))


def _save_token_file(data: dict):
    """Lưu token mới vào file."""
    TOKEN_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


async def _refresh_token(refresh_token: str) -> dict:
    """Gọi Supabase để refresh access token."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    headers = {
        "apikey": SUPABASE_ANON,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            url, headers=headers, json={"refresh_token": refresh_token}
        )
    if resp.status_code != 200:
        raise Exception(f"Refresh token thất bại: {resp.text}")
    return resp.json()


async def get_valid_token() -> str:
    """
    Trả về access token còn hạn.
    Tự động refresh nếu token sắp hết hạn (còn < 5 phút).
    """
    global _token_cache

    # Tải lần đầu hoặc khi cache rỗng
    if not _token_cache:
        _token_cache = _load_token_file()

    token_data    = _token_cache
    access_token  = token_data.get("access_token", "")
    refresh_tok   = token_data.get("refresh_token", "")
    expires_in    = token_data.get("expires_in", 3600)    # giây
    created_at    = token_data.get("created_at", 0)       # Supabase trả về epoch

    # Nếu Supabase không trả về created_at, lấy thời điểm file được ghi lần cuối
    if created_at == 0:
        created_at = int(TOKEN_FILE.stat().st_mtime)

    # Kiểm tra token còn hạn không (trừ 5 phút buffer)
    expires_at = created_at + expires_in - 300
    if time.time() > expires_at:
        # Tự động refresh
        new_data = await _refresh_token(refresh_tok)
        new_data["created_at"] = int(time.time())
        _save_token_file(new_data)
        _token_cache = new_data
        return new_data["access_token"]

    return access_token


# ============================================================
# PHẦN 2: HELPER GỌI SUPABASE API
# ============================================================

async def supabase_get(table: str, params: dict = None) -> list:
    """SELECT từ Supabase REST API."""
    token = await get_valid_token()
    headers = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url, headers=headers, params=params or {})
    resp.raise_for_status()
    return resp.json()


async def supabase_post(table: str, data: dict) -> dict:
    """INSERT vào Supabase REST API."""
    token = await get_valid_token()
    headers = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(url, headers=headers, json=data)
    resp.raise_for_status()
    result = resp.json()
    return result[0] if isinstance(result, list) else result


async def supabase_patch(table: str, record_id: str, data: dict) -> dict:
    """UPDATE theo id trong Supabase REST API."""
    token = await get_valid_token()
    headers = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"id": f"eq.{record_id}"}
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.patch(url, headers=headers, json=data, params=params)
    resp.raise_for_status()
    result = resp.json()
    return result[0] if isinstance(result, list) and result else data


async def supabase_delete(table: str, record_id: str) -> bool:
    """DELETE theo id trong Supabase REST API."""
    token = await get_valid_token()
    headers = {
        "apikey": SUPABASE_ANON,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"id": f"eq.{record_id}"}
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.delete(url, headers=headers, params=params)
    resp.raise_for_status()
    return True


# ============================================================
# PHẦN 3: ĐỊNH NGHĨA CÁC TOOL MCP
# ============================================================

# Danh sách đầy đủ các tool
TOOLS = [
    # --- POSTS ---
    Tool(
        name="list_posts",
        description="Lấy danh sách bài viết blog. Có thể lọc theo status (draft/published/archived) và category.",
        inputSchema={
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "description": "Lọc theo trạng thái: 'draft', 'published', 'archived'. Bỏ trống = tất cả.",
                    "enum": ["draft", "published", "archived"],
                },
                "limit": {
                    "type": "integer",
                    "description": "Số lượng kết quả tối đa (mặc định: 20).",
                    "default": 20,
                },
            },
        },
    ),
    Tool(
        name="create_post",
        description="Tạo bài viết blog mới.",
        inputSchema={
            "type": "object",
            "required": ["title", "content"],
            "properties": {
                "title":       {"type": "string",  "description": "Tiêu đề bài viết"},
                "content":     {"type": "string",  "description": "Nội dung bài viết (HTML hoặc Markdown)"},
                "excerpt":     {"type": "string",  "description": "Tóm tắt ngắn (tùy chọn)"},
                "slug":        {"type": "string",  "description": "URL slug (tùy chọn, tự tạo nếu bỏ trống)"},
                "cover_image": {"type": "string",  "description": "URL ảnh bìa (tùy chọn)"},
                "status":      {
                    "type": "string",
                    "description": "Trạng thái: 'draft' hoặc 'published' (mặc định: draft)",
                    "enum": ["draft", "published"],
                    "default": "draft",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách tag, ví dụ: ['marketing', 'tiktok']",
                },
                "seo_title":  {"type": "string",  "description": "Tiêu đề SEO (tùy chọn)"},
                "seo_desc":   {"type": "string",  "description": "Meta description SEO (tùy chọn)"},
            },
        },
    ),
    Tool(
        name="update_post",
        description="Sửa nội dung hoặc trạng thái bài viết theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id":          {"type": "string",  "description": "UUID của bài viết cần sửa"},
                "title":       {"type": "string",  "description": "Tiêu đề mới (tùy chọn)"},
                "content":     {"type": "string",  "description": "Nội dung mới (tùy chọn)"},
                "excerpt":     {"type": "string",  "description": "Tóm tắt mới (tùy chọn)"},
                "cover_image": {"type": "string",  "description": "URL ảnh bìa mới (tùy chọn)"},
                "status":      {
                    "type": "string",
                    "enum": ["draft", "published", "archived"],
                    "description": "Trạng thái mới (tùy chọn)",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Tags mới (tùy chọn)",
                },
                "seo_title":  {"type": "string"},
                "seo_desc":   {"type": "string"},
            },
        },
    ),
    Tool(
        name="delete_post",
        description="Xóa vĩnh viễn bài viết theo ID. Cẩn thận: không thể hoàn tác!",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": {"type": "string", "description": "UUID của bài viết cần xóa"},
            },
        },
    ),

    # --- CATEGORIES ---
    Tool(
        name="list_categories",
        description="Lấy danh sách danh mục bài viết.",
        inputSchema={"type": "object", "properties": {}},
    ),
    Tool(
        name="create_category",
        description="Tạo danh mục mới.",
        inputSchema={
            "type": "object",
            "required": ["name", "slug"],
            "properties": {
                "name":        {"type": "string", "description": "Tên danh mục"},
                "slug":        {"type": "string", "description": "URL slug (viết thường, dùng dấu -)"},
                "description": {"type": "string", "description": "Mô tả ngắn (tùy chọn)"},
            },
        },
    ),
    Tool(
        name="delete_category",
        description="Xóa danh mục theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": {"type": "string", "description": "UUID của danh mục cần xóa"},
            },
        },
    ),

    # --- PORTFOLIO ---
    Tool(
        name="list_portfolio",
        description="Lấy danh sách các dự án portfolio.",
        inputSchema={
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Lọc theo loại: 'video', 'social', 'strategy'. Bỏ trống = tất cả.",
                },
            },
        },
    ),
    Tool(
        name="create_portfolio",
        description="Thêm dự án portfolio mới.",
        inputSchema={
            "type": "object",
            "required": ["title", "category"],
            "properties": {
                "title":         {"type": "string", "description": "Tên dự án"},
                "description":   {"type": "string", "description": "Mô tả ngắn kết quả nổi bật"},
                "category":      {
                    "type": "string",
                    "enum": ["video", "social", "strategy"],
                    "description": "Loại dự án",
                },
                "image_url":     {"type": "string", "description": "URL ảnh thumbnail"},
                "problem":       {"type": "string", "description": "Mô tả vấn đề của khách hàng"},
                "solution":      {"type": "string", "description": "Giải pháp đã thực hiện"},
                "results": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách kết quả, ví dụ: ['1.2M views', '+500% follower']",
                },
                "display_order": {"type": "integer", "description": "Thứ tự hiển thị (số nhỏ = lên trên)"},
            },
        },
    ),
    Tool(
        name="update_portfolio",
        description="Sửa thông tin dự án portfolio theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id":            {"type": "string"},
                "title":         {"type": "string"},
                "description":   {"type": "string"},
                "category":      {"type": "string", "enum": ["video", "social", "strategy"]},
                "image_url":     {"type": "string"},
                "problem":       {"type": "string"},
                "solution":      {"type": "string"},
                "results":       {"type": "array", "items": {"type": "string"}},
                "is_visible":    {"type": "boolean", "description": "Ẩn/hiện dự án"},
                "display_order": {"type": "integer"},
            },
        },
    ),
    Tool(
        name="delete_portfolio",
        description="Xóa dự án portfolio theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": {"type": "string"},
            },
        },
    ),

    # --- SERVICES ---
    Tool(
        name="list_services",
        description="Lấy danh sách các dịch vụ đang hiển thị trên trang chính.",
        inputSchema={"type": "object", "properties": {}},
    ),
    Tool(
        name="update_service",
        description="Sửa thông tin dịch vụ theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id":          {"type": "string"},
                "title":       {"type": "string"},
                "description": {"type": "string"},
                "icon":        {"type": "string", "description": "Font Awesome class, ví dụ: 'fas fa-video'"},
                "features": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Danh sách tính năng dịch vụ",
                },
                "is_visible":    {"type": "boolean"},
                "display_order": {"type": "integer"},
            },
        },
    ),

    # --- CONTACTS ---
    Tool(
        name="list_contacts",
        description="Lấy danh sách form liên hệ đã gửi. Có thể lọc theo status.",
        inputSchema={
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["new", "done"],
                    "description": "Lọc theo trạng thái: 'new' (chưa xử lý) hoặc 'done' (đã xử lý). Bỏ trống = tất cả.",
                },
                "limit": {
                    "type": "integer",
                    "description": "Số lượng kết quả (mặc định: 30)",
                    "default": 30,
                },
            },
        },
    ),
    Tool(
        name="update_contact_status",
        description="Đổi trạng thái form liên hệ (ví dụ: từ 'new' sang 'done' sau khi đã xử lý).",
        inputSchema={
            "type": "object",
            "required": ["id", "status"],
            "properties": {
                "id":     {"type": "string", "description": "UUID của form liên hệ"},
                "status": {"type": "string", "enum": ["new", "done"]},
            },
        },
    ),
    Tool(
        name="delete_contact",
        description="Xóa form liên hệ theo ID.",
        inputSchema={
            "type": "object",
            "required": ["id"],
            "properties": {
                "id": {"type": "string"},
            },
        },
    ),
]


# ============================================================
# PHẦN 4: XỬ LÝ LOGIC CÁC TOOL
# ============================================================

def _ok(data: Any) -> list[TextContent]:
    """Trả về kết quả thành công dạng JSON."""
    return [TextContent(type="text", text=json.dumps(data, ensure_ascii=False, indent=2))]


def _err(msg: str) -> list[TextContent]:
    """Trả về thông báo lỗi."""
    return [TextContent(type="text", text=f"❌ Lỗi: {msg}")]


def _make_slug(title: str) -> str:
    """Tạo slug từ tiêu đề (đơn giản hóa)."""
    import re
    slug = title.lower()
    slug = re.sub(r"[àáạảãâầấậẩẫăằắặẳẵ]", "a", slug)
    slug = re.sub(r"[èéẹẻẽêềếệểễ]", "e", slug)
    slug = re.sub(r"[ìíịỉĩ]", "i", slug)
    slug = re.sub(r"[òóọỏõôồốộổỗơờớợởỡ]", "o", slug)
    slug = re.sub(r"[ùúụủũưừứựửữ]", "u", slug)
    slug = re.sub(r"[ỳýỵỷỹ]", "y", slug)
    slug = re.sub(r"đ", "d", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug.strip())
    return slug[:80]


async def handle_tool(name: str, args: dict) -> list[TextContent]:
    """Router: điều hướng tool call đến handler tương ứng."""
    try:
        # --- POSTS ---
        if name == "list_posts":
            params = {"select": "*", "order": "created_at.desc"}
            if "status" in args:
                params["status"] = f"eq.{args['status']}"
            limit = args.get("limit", 20)
            params["limit"] = str(limit)
            rows = await supabase_get("posts", params)
            return _ok({"total": len(rows), "posts": rows})

        elif name == "create_post":
            payload = {
                "title":   args["title"],
                "content": args["content"],
                "status":  args.get("status", "draft"),
                "slug":    args.get("slug") or _make_slug(args["title"]),
            }
            # Thêm các field tùy chọn nếu có
            for field in ("excerpt", "cover_image", "seo_title", "seo_desc"):
                if field in args:
                    payload[field] = args[field]
            if "tags" in args:
                payload["tags"] = json.dumps(args["tags"])
            result = await supabase_post("posts", payload)
            return _ok({"message": "✅ Tạo bài viết thành công!", "post": result})

        elif name == "update_post":
            post_id = args.pop("id")
            if "tags" in args:
                args["tags"] = json.dumps(args["tags"])
            result = await supabase_patch("posts", post_id, args)
            return _ok({"message": "✅ Cập nhật bài viết thành công!", "post": result})

        elif name == "delete_post":
            await supabase_delete("posts", args["id"])
            return _ok({"message": "✅ Đã xóa bài viết thành công!"})

        # --- CATEGORIES ---
        elif name == "list_categories":
            rows = await supabase_get("categories", {"select": "*", "order": "name.asc"})
            return _ok({"total": len(rows), "categories": rows})

        elif name == "create_category":
            result = await supabase_post("categories", args)
            return _ok({"message": "✅ Tạo danh mục thành công!", "category": result})

        elif name == "delete_category":
            await supabase_delete("categories", args["id"])
            return _ok({"message": "✅ Đã xóa danh mục!"})

        # --- PORTFOLIO ---
        elif name == "list_portfolio":
            params = {"select": "*", "order": "display_order.asc"}
            if "category" in args:
                params["category"] = f"eq.{args['category']}"
            rows = await supabase_get("portfolio_items", params)
            return _ok({"total": len(rows), "portfolio": rows})

        elif name == "create_portfolio":
            payload = dict(args)
            if "results" in payload:
                payload["results"] = json.dumps(payload["results"])
            result = await supabase_post("portfolio_items", payload)
            return _ok({"message": "✅ Thêm portfolio thành công!", "item": result})

        elif name == "update_portfolio":
            item_id = args.pop("id")
            if "results" in args:
                args["results"] = json.dumps(args["results"])
            result = await supabase_patch("portfolio_items", item_id, args)
            return _ok({"message": "✅ Cập nhật portfolio thành công!", "item": result})

        elif name == "delete_portfolio":
            await supabase_delete("portfolio_items", args["id"])
            return _ok({"message": "✅ Đã xóa portfolio!"})

        # --- SERVICES ---
        elif name == "list_services":
            rows = await supabase_get("services", {"select": "*", "order": "display_order.asc"})
            return _ok({"total": len(rows), "services": rows})

        elif name == "update_service":
            svc_id = args.pop("id")
            if "features" in args:
                args["features"] = json.dumps(args["features"])
            result = await supabase_patch("services", svc_id, args)
            return _ok({"message": "✅ Cập nhật dịch vụ thành công!", "service": result})

        # --- CONTACTS ---
        elif name == "list_contacts":
            params = {"select": "*", "order": "created_at.desc"}
            if "status" in args:
                params["status"] = f"eq.{args['status']}"
            limit = args.get("limit", 30)
            params["limit"] = str(limit)
            rows = await supabase_get("contacts", params)
            return _ok({"total": len(rows), "contacts": rows})

        elif name == "update_contact_status":
            result = await supabase_patch(
                "contacts", args["id"], {"status": args["status"]}
            )
            return _ok({"message": f"✅ Đã đổi trạng thái sang '{args['status']}'!"})

        elif name == "delete_contact":
            await supabase_delete("contacts", args["id"])
            return _ok({"message": "✅ Đã xóa liên hệ!"})

        else:
            return _err(f"Tool '{name}' không tồn tại.")

    except FileNotFoundError as e:
        return _err(str(e))
    except httpx.HTTPStatusError as e:
        return _err(f"Supabase API lỗi {e.response.status_code}: {e.response.text}")
    except Exception as e:
        return _err(str(e))


# ============================================================
# PHẦN 5: KHỞI ĐỘNG MCP SERVER
# ============================================================

async def main():
    """Khởi động MCP server với stdio transport."""
    server = Server("hnilah-content-mcp")

    @server.list_tools()
    async def list_tools():
        return TOOLS

    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        return await handle_tool(name, arguments)

    # Chạy qua stdio (Antigravity sẽ tự khởi động process này)
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
