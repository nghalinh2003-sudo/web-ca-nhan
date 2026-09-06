import os
from mcp.server.fastmcp import FastMCP
from supabase import create_client, Client

# ==========================================
# CẤU HÌNH KẾT NỐI DATABASE (SUPABASE)
# ==========================================
# Thay thế bằng URL và Service Role Key của Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "ĐIỀN_URL_CỦA_BẠN_VÀO_ĐÂY")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "ĐIỀN_SERVICE_ROLE_KEY_VÀO_ĐÂY")

# Khởi tạo MCP Server
mcp = FastMCP("HnilahHub Admin")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Lỗi khởi tạo Supabase: {e}")


# ==========================================
# CÁC CÔNG CỤ QUẢN TRỊ (MCP TOOLS)
# ==========================================

@mcp.tool()
def get_new_messages() -> str:
    """Kiểm tra xem có khách hàng nào để lại tin nhắn liên hệ mới không."""
    try:
        response = supabase.table("contacts").select("*").eq("status", "new").execute()
        messages = response.data
        
        if not messages:
            return "Hiện tại không có tin nhắn mới nào."
        
        result = "Danh sách tin nhắn mới từ khách hàng:\n"
        for msg in messages:
            result += f"- Từ: {msg['name']} ({msg['email']})\n  Dịch vụ quan tâm: {msg.get('service', 'Không rõ')}\n  Nội dung: {msg['message']}\n---\n"
        return result
    except Exception as e:
        return f"Lỗi khi kết nối database: {e}"

@mcp.tool()
def add_portfolio_item(title: str, category: str, problem: str, solution: str) -> str:
    """Thêm một dự án (portfolio) mới lên website. category chỉ được chọn: 'video' hoặc 'social'."""
    if category not in ['video', 'social']:
        return "Lỗi: category phải là một trong: 'video', 'social'"
        
    try:
        data = {
            "title": title,
            "category": category, 
            "problem": problem,
            "solution": solution,
            "is_visible": True
        }
        supabase.table("portfolio_items").insert(data).execute()
        return f"Đã đăng dự án '{title}' lên website thành công!"
    except Exception as e:
        return f"Lỗi khi thêm dự án: {e}"

@mcp.tool()
def list_services() -> str:
    """Xem danh sách các dịch vụ đang hiển thị trên web."""
    try:
        response = supabase.table("services").select("title, is_visible").execute()
        services = response.data
        result = "Các dịch vụ hiện tại:\n"
        for srv in services:
            status = "Đang hiển thị" if srv['is_visible'] else "Đang ẩn"
            result += f"- {srv['title']} ({status})\n"
        return result
    except Exception as e:
        return f"Lỗi khi kết nối database: {e}"

if __name__ == "__main__":
    mcp.run()
