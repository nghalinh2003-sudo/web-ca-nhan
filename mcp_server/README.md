# HnilahHub Content MCP Server

Cho phép **Antigravity** quản trị toàn bộ nội dung website HnilahHub thông qua **Supabase OAuth JWT** — không cần mở trình duyệt.

---

## 📦 Yêu cầu

- Python 3.10 trở lên (xem hướng dẫn cài bên dưới)
- Đã có tài khoản admin trên Supabase project của bạn

---

## 🐍 Cài Python (nếu chưa có)

1. Vào **[python.org/downloads](https://www.python.org/downloads/)** → tải bản **Python 3.11** (Windows installer)
2. Chạy file `.exe` vừa tải
3. ⚠️ **Quan trọng:** Tích chọn ô **"Add Python to PATH"** trước khi nhấn Install
4. Sau khi cài xong, mở lại PowerShell mới và kiểm tra: `python --version`

---

## 🚀 Cài đặt lần đầu (chỉ làm 1 lần)

### Bước 1 — Tạo bảng `posts` trong Supabase

1. Vào [Supabase Dashboard](https://supabase.com/dashboard) → chọn project của bạn
2. Vào **SQL Editor** → nhấn **New query**
3. Copy toàn bộ nội dung file [`create_posts_table.sql`](./create_posts_table.sql) và paste vào
4. Nhấn **Run** ✅

### Bước 2 — Cài thư viện Python

Mở **PowerShell** hoặc **Terminal**, chạy lệnh:

```powershell
cd "C:\Users\Hi\OneDrive\文档\OneDrive\Desktop\web cá nhân\mcp_server"
pip install -r requirements.txt
```

### Bước 3 — Tạo file `.env`

```powershell
copy .env.example .env
```

> File `.env` đã có sẵn thông tin Supabase của bạn, không cần sửa thêm.

### Bước 4 — Đăng nhập để lấy OAuth token

```powershell
python get_token.py
```

Nhập email và mật khẩu admin của bạn khi được hỏi. Token sẽ được lưu vào file `.mcp_token`.

> 🔄 **Auto-refresh:** Token hết hạn sau 1 giờ nhưng MCP server sẽ **tự động gia hạn** bằng refresh token — bạn không cần đăng nhập lại!

---

## ✅ Sử dụng với Antigravity

Sau khi hoàn tất cài đặt, **khởi động lại Antigravity** (hoặc reload workspace). Antigravity sẽ tự động nhận diện MCP server.

Bạn có thể dùng ngôn ngữ tự nhiên:

| Câu lệnh tiếng Việt | Tool được gọi |
|---------------------|---------------|
| "Liệt kê tất cả bài viết draft" | `list_posts` |
| "Tạo bài viết mới về TikTok marketing" | `create_post` |
| "Xuất bản bài viết ID xxx" | `update_post` |
| "Xóa bài viết ID xxx" | `delete_post` |
| "Xem danh sách portfolio" | `list_portfolio` |
| "Thêm dự án mới vào portfolio" | `create_portfolio` |
| "Ẩn dự án ID xxx" | `update_portfolio` |
| "Xem form liên hệ chưa xử lý" | `list_contacts` |
| "Đánh dấu liên hệ ID xxx là đã xử lý" | `update_contact_status` |
| "Xem danh sách dịch vụ" | `list_services` |

---

## 🛠 Danh sách đầy đủ 15 tools

| Tool | Mô tả |
|------|-------|
| `list_posts` | Lấy danh sách bài viết |
| `create_post` | Tạo bài viết mới |
| `update_post` | Sửa bài viết |
| `delete_post` | Xóa bài viết |
| `list_categories` | Lấy danh sách danh mục |
| `create_category` | Tạo danh mục mới |
| `delete_category` | Xóa danh mục |
| `list_portfolio` | Lấy danh sách portfolio |
| `create_portfolio` | Thêm dự án portfolio |
| `update_portfolio` | Sửa dự án portfolio |
| `delete_portfolio` | Xóa dự án portfolio |
| `list_services` | Lấy danh sách dịch vụ |
| `update_service` | Sửa thông tin dịch vụ |
| `list_contacts` | Lấy form liên hệ |
| `update_contact_status` | Đổi trạng thái liên hệ |
| `delete_contact` | Xóa liên hệ |

---

## ❓ Xử lý sự cố

**Lỗi "Chưa có token":**  
→ Chạy lại `python get_token.py`

**Lỗi 401 Unauthorized:**  
→ Token không hợp lệ. Chạy lại `python get_token.py` để đăng nhập mới.

**Lỗi "Module not found":**  
→ Chạy lại `pip install -r requirements.txt`

**MCP server không xuất hiện trong Antigravity:**  
→ Kiểm tra file `.agents/mcp_config.json` tồn tại → Restart Antigravity.
