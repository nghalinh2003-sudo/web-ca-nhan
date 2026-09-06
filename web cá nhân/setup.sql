-- ============================================================
-- SETUP.SQL — Chạy file này 1 lần trong Supabase SQL Editor
-- Tạo toàn bộ bảng, bảo mật (RLS), và dữ liệu mẫu
-- ============================================================


-- ============================================================
-- BẢNG 1: contacts — Lưu tin nhắn từ form liên hệ
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    service     TEXT,
    message     TEXT        NOT NULL,
    status      TEXT        DEFAULT 'new' CHECK (status IN ('new', 'done')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể INSERT (gửi form liên hệ)
CREATE POLICY "Ai cũng có thể gửi form"
    ON contacts FOR INSERT
    TO anon
    WITH CHECK (true);

-- Chỉ người đã đăng nhập (admin) mới được xem, sửa, xóa
CREATE POLICY "Chỉ admin mới đọc được"
    ON contacts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới cập nhật được"
    ON contacts FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới xóa được"
    ON contacts FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================
-- BẢNG 2: portfolio_items — Quản lý dự án
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_items (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    title           TEXT        NOT NULL,
    description     TEXT,
    category        TEXT        NOT NULL CHECK (category IN ('video', 'social', 'strategy')),
    image_url       TEXT,
    problem         TEXT,       -- Mô tả vấn đề của dự án
    solution        TEXT,       -- Giải pháp đã thực hiện
    results         JSONB,      -- Mảng kết quả ["1.2M views", "+500% follower"]
    display_order   INTEGER     DEFAULT 0,
    is_visible      BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể xem dự án (hiển thị trên trang chính)
CREATE POLICY "Ai cũng có thể xem portfolio"
    ON portfolio_items FOR SELECT
    TO anon, authenticated
    USING (is_visible = true);

-- Chỉ admin mới được thêm, sửa, xóa
CREATE POLICY "Chỉ admin mới thêm portfolio"
    ON portfolio_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Chỉ admin mới sửa portfolio"
    ON portfolio_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới xóa portfolio"
    ON portfolio_items FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================
-- BẢNG 3: services — Quản lý dịch vụ
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
    id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    icon            TEXT        DEFAULT 'fas fa-star',  -- Font Awesome class
    title           TEXT        NOT NULL,
    description     TEXT,
    features        JSONB,      -- Mảng tính năng ["Lên concept & script", "Quay & dựng"]
    display_order   INTEGER     DEFAULT 0,
    is_visible      BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể xem dịch vụ
CREATE POLICY "Ai cũng có thể xem dịch vụ"
    ON services FOR SELECT
    TO anon, authenticated
    USING (is_visible = true);

-- Chỉ admin mới được thêm, sửa, xóa
CREATE POLICY "Chỉ admin mới thêm dịch vụ"
    ON services FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Chỉ admin mới sửa dịch vụ"
    ON services FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới xóa dịch vụ"
    ON services FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================
-- DỮ LIỆU MẪU — portfolio_items (4 dự án ban đầu)
-- ============================================================
INSERT INTO portfolio_items (title, description, category, image_url, problem, solution, results, display_order) VALUES
(
    'Chiến dịch TikTok — Thương hiệu Thời trang',
    'Sản xuất series 15 video TikTok, đạt 1.2M views tổng và tăng 500% follower trong 2 tháng.',
    'video',
    'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop',
    'Thương hiệu thời trang local brand muốn tiếp cận Gen Z nhưng chưa có sự hiện diện trên TikTok. Nội dung trên các nền tảng khác không tạo được sự tương tác mong muốn.',
    'Xây dựng content pillar phù hợp TikTok (OOTD, Behind the scenes, Trend mashup), sản xuất series 15 video ngắn với concept bắt trend nhưng giữ được bản sắc thương hiệu.',
    '["1.2M tổng lượt xem", "+500% follower", "3 video lọt trending", "+120% doanh số online từ TikTok"]',
    1
),
(
    'Quản lý Fanpage — Chuỗi F&B',
    'Xây dựng & quản lý nội dung cho 3 fanpage, tăng 300% tương tác và 200% inbox/tháng.',
    'social',
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&h=400&fit=crop',
    'Chuỗi nhà hàng có 3 fanpage nhưng nội dung rời rạc, thiếu nhất quán, tương tác giảm dần theo thời gian. Đội ngũ nội bộ không có chuyên môn về social media.',
    'Xây dựng bộ content guideline thống nhất, lên lịch đăng bài khoa học, phát triển các series nội dung riêng cho từng chi nhánh kết hợp UGC.',
    '["+300% tương tác tổng thể", "+200% inbox/tháng", "Brand voice nhất quán 3 fanpage", "Top 5 fanpage F&B local"]',
    2
),
(
    'YouTube Channel — Thương hiệu Giáo dục',
    'Sản xuất 20+ video dài cho kênh YouTube, đạt 500K+ views và tăng 150% subscriber.',
    'video',
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
    'Thương hiệu giáo dục trực tuyến muốn xây dựng kênh YouTube để thu hút học viên mới, nhưng không biết bắt đầu từ đâu và thiếu đội ngũ sản xuất video chuyên nghiệp.',
    'Nghiên cứu keyword YouTube, xây dựng content map theo phễu (Awareness → Interest → Decision), sản xuất 20+ video chất lượng cao với script tối ưu retention.',
    '["500K+ tổng lượt xem", "+150% subscriber", "8 phút avg. watch time", "+80% leads từ YouTube"]',
    3
),
(
    'Content Strategy — Startup Công nghệ',
    'Xây dựng chiến lược nội dung đa nền tảng, giúp startup tăng 400% brand awareness trong 3 tháng.',
    'strategy',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    'Startup SaaS B2B cần xây dựng nhận diện thương hiệu từ con số 0, chưa có content framework và thiếu nguồn lực triển khai nội dung đa nền tảng.',
    'Xây dựng content strategy framework toàn diện: brand voice, content pillars, editorial calendar, và quy trình sản xuất nội dung. Triển khai đồng bộ trên LinkedIn, Facebook, Blog, YouTube.',
    '["+400% brand awareness", "+250% organic traffic", "15 bài được featured trên trang tin uy tín", "Content system tự vận hành sau 3 tháng"]',
    4
);


-- ============================================================
-- DỮ LIỆU MẪU — services (2 dịch vụ ban đầu)
-- ============================================================
INSERT INTO services (icon, title, description, features, display_order) VALUES
(
    'fas fa-video',
    'Sản xuất Video Content',
    NULL,
    '["Lên ý tưởng content", "Quay & dựng", "Đồng hành sát sao từ đầu kế hoạch"]',
    1
),
(
    'fas fa-mobile-screen-button',
    'Quản lý Social Media',
    NULL,
    '["Lên ý tưởng content up xuyên suốt", "Điều chỉnh lại social cho phù hợp", "Thiết kế hình ảnh phù hợp", "Quay & dựng (nếu cần)"]',
    2
);
