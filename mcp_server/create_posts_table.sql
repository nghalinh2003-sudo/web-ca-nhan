-- ============================================================
-- CREATE_POSTS_TABLE.SQL
-- Chạy file này 1 lần trong Supabase SQL Editor
-- Tạo bảng posts (blog) với đầy đủ RLS policies
-- ============================================================

-- Tạo bảng categories trước (vì posts tham chiếu đến nó)
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT        NOT NULL UNIQUE,
    slug        TEXT        NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể xem danh mục
CREATE POLICY "Ai cũng có thể xem categories"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

-- Chỉ admin mới được thêm, sửa, xóa
CREATE POLICY "Chỉ admin mới thêm category"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Chỉ admin mới sửa category"
    ON categories FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới xóa category"
    ON categories FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================
-- BẢNG POSTS — Bài viết blog
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    title         TEXT        NOT NULL,
    slug          TEXT        NOT NULL UNIQUE,
    content       TEXT,                       -- Nội dung HTML/Markdown
    excerpt       TEXT,                       -- Tóm tắt ngắn
    cover_image   TEXT,                       -- URL ảnh bìa
    category_id   UUID        REFERENCES categories(id) ON DELETE SET NULL,
    status        TEXT        DEFAULT 'draft'
                              CHECK (status IN ('draft', 'published', 'archived')),
    view_count    INTEGER     DEFAULT 0,
    tags          JSONB,                      -- Mảng tag ["marketing", "tiktok"]
    seo_title     TEXT,                       -- Tiêu đề SEO (override)
    seo_desc      TEXT,                       -- Meta description
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể xem bài đã published
CREATE POLICY "Ai cũng xem bài đã xuất bản"
    ON posts FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admin xem tất cả (kể cả draft)
CREATE POLICY "Admin xem tất cả bài viết"
    ON posts FOR SELECT
    TO authenticated
    USING (true);

-- Chỉ admin mới được thêm, sửa, xóa
CREATE POLICY "Chỉ admin mới thêm bài viết"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Chỉ admin mới sửa bài viết"
    ON posts FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ admin mới xóa bài viết"
    ON posts FOR DELETE
    TO authenticated
    USING (true);


-- ============================================================
-- Trigger: tự động cập nhật updated_at khi sửa bài
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- ============================================================
-- Dữ liệu mẫu — Categories
-- ============================================================
INSERT INTO categories (name, slug, description) VALUES
    ('Marketing', 'marketing', 'Chiến lược và kinh nghiệm marketing'),
    ('Content', 'content', 'Sản xuất và quản lý nội dung'),
    ('TikTok', 'tiktok', 'Tips & tricks TikTok'),
    ('Social Media', 'social-media', 'Quản lý mạng xã hội')
ON CONFLICT (slug) DO NOTHING;
