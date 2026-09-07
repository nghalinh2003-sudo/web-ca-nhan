#!/usr/bin/env python3
"""
get_token.py — Đăng nhập Supabase & lưu OAuth token
Chạy file này 1 lần để lấy token, sau đó MCP server tự refresh.

Cách dùng:
    python get_token.py
"""

import json
import os
import getpass
from pathlib import Path
import httpx
from dotenv import load_dotenv

# --- Cấu hình ---
load_dotenv()
SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_ANON = os.getenv("SUPABASE_ANON_KEY")
TOKEN_FILE    = Path(__file__).parent / ".mcp_token"


def login(email: str, password: str) -> dict:
    """Đăng nhập bằng email/password, trả về token data."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON,
        "Content-Type": "application/json",
    }
    payload = {"email": email, "password": password}

    response = httpx.post(url, headers=headers, json=payload, timeout=15)
    if response.status_code != 200:
        raise Exception(f"Đăng nhập thất bại: {response.text}")

    return response.json()


def save_token(token_data: dict):
    """Lưu token data vào file .mcp_token."""
    TOKEN_FILE.write_text(json.dumps(token_data, indent=2), encoding="utf-8")
    print(f"✅ Token đã lưu vào: {TOKEN_FILE}")
    print(f"   Access token hết hạn sau: {token_data.get('expires_in', '?')} giây (~1 giờ)")
    print(f"   Refresh token: có sẵn — MCP server sẽ tự gia hạn!")


if __name__ == "__main__":
    print("=" * 50)
    print("  HnilahHub MCP — Đăng nhập Admin")
    print("=" * 50)

    if not SUPABASE_URL or not SUPABASE_ANON:
        print("❌ Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env")
        exit(1)

    email    = input("Email admin: ").strip()
    password = getpass.getpass("Mật khẩu: ")

    try:
        token_data = login(email, password)
        save_token(token_data)
        print("\n🚀 Hoàn tất! Bây giờ Antigravity có thể dùng MCP server.")
    except Exception as e:
        print(f"\n❌ {e}")
        exit(1)
