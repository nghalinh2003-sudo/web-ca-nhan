-- ============================================================
-- MIGRATION: Thêm cột content cho portfolio_items & services
-- Chạy 1 lần trong Supabase SQL Editor
-- ============================================================

-- Thêm cột content vào bảng portfolio_items (lưu nội dung bài viết dạng HTML)
ALTER TABLE portfolio_items
    ADD COLUMN IF NOT EXISTS content TEXT;

-- Thêm cột content vào bảng services (lưu nội dung trang dịch vụ dạng HTML)
ALTER TABLE services
    ADD COLUMN IF NOT EXISTS content TEXT;

-- Xác nhận thành công
SELECT 'Migration hoàn thành! Đã thêm cột content vào portfolio_items và services.' AS result;
