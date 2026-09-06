-- ==========================================
-- UPDATE DATA IN SUPABASE 
-- ==========================================

-- 1. XÓA DỊCH VỤ CŨ VÀ CẬP NHẬT DỊCH VỤ MỚI
DELETE FROM services WHERE title = 'Tư vấn Content Strategy';

UPDATE services 
SET description = NULL,
    features = '["Lên ý tưởng content", "Quay & dựng", "Đồng hành sát sao từ đầu kế hoạch"]'::jsonb
WHERE title = 'Sản xuất Video Content';

UPDATE services 
SET description = NULL,
    features = '["Lên ý tưởng content up xuyên suốt", "Điều chỉnh lại social cho phù hợp", "Thiết kế hình ảnh phù hợp", "Quay & dựng (nếu cần)"]'::jsonb
WHERE title = 'Quản lý Social Media';


-- 2. XÓA DỰ ÁN CŨ VÀ THÊM DỰ ÁN MỚI
DELETE FROM portfolio_items WHERE title = 'YouTube Channel — Thương hiệu Giáo dục';
DELETE FROM portfolio_items WHERE title = 'Content Strategy — Startup Công nghệ';

-- Xóa các dự án cũ có thể đã được đổi tên (tránh trùng lặp)
DELETE FROM portfolio_items WHERE title = 'Xây kênh TikTok';
DELETE FROM portfolio_items WHERE title = 'Quản lý fanpage Facebook';

-- Thêm 2 dự án mới
INSERT INTO portfolio_items (title, description, category, image_url, problem, solution, results, display_order) VALUES
(
    'Xây kênh TikTok',
    'Xây dựng và phát triển kênh TikTok từ con số 0, sáng tạo nội dung viral và thu hút đúng tệp khách hàng mục tiêu.',
    'video',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
    'Khách hàng muốn xây dựng kênh TikTok để quảng bá sản phẩm nhưng chưa có định hướng nội dung và kịch bản thu hút.',
    'Nghiên cứu thị hiếu người dùng TikTok, xây dựng concept kênh độc đáo, viết kịch bản trend và trực tiếp quay dựng video ngắn chuẩn xu hướng.',
    '["1M+ tổng lượt xem sau 1 tháng", "+50,000 follower tự nhiên", "Nhiều video lọt xu hướng (trending)", "Tăng trưởng doanh thu rõ rệt"]',
    3
),
(
    'Quản lý fanpage Facebook',
    'Chăm sóc fanpage toàn diện, thiết kế hình ảnh, viết nội dung chuẩn SEO và tăng tương tác tự nhiên.',
    'social',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    'Doanh nghiệp không có nhiều thời gian chăm sóc fanpage, hình ảnh chưa đồng nhất và lượt tiếp cận tự nhiên rất thấp.',
    'Xây dựng kế hoạch nội dung hàng tháng, thiết kế hình ảnh chuyên nghiệp, viết bài tương tác và quản lý cộng đồng thường xuyên.',
    '["+200% lượng người tiếp cận tự nhiên", "Hình ảnh thương hiệu đồng bộ, chuyên nghiệp", "Tăng trưởng tỷ lệ tương tác (engagement rate)", "Tiết kiệm thời gian và chi phí cho doanh nghiệp"]',
    4
);
