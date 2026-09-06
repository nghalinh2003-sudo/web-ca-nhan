-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Blog & Media System cho HnilahHub
-- Chạy script này trên Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────
-- BẢNG 1: categories — Danh mục bài viết
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL UNIQUE,
    slug          TEXT NOT NULL UNIQUE,
    description   TEXT,
    display_order INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- BẢNG 2: posts — Bài viết blog
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    excerpt          TEXT,                -- Tóm tắt ngắn hiển thị trên card
    content          TEXT,                -- Nội dung HTML từ Quill editor
    featured_image   TEXT,                -- URL ảnh đại diện
    category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id        UUID NOT NULL REFERENCES auth.users(id),
    status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published', 'archived')),
    -- Trường SEO
    meta_title       TEXT,                -- Tiêu đề SEO riêng
    meta_description TEXT,                -- Mô tả SEO
    meta_keywords    TEXT,                -- Từ khóa SEO
    og_image         TEXT,                -- Ảnh Open Graph riêng
    canonical_url    TEXT,                -- URL chuẩn
    -- Theo dõi
    view_count       INTEGER DEFAULT 0,
    published_at     TIMESTAMPTZ,         -- Thời điểm xuất bản
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- BẢNG 3: tags — Thẻ tag cho bài viết
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE
);

-- ──────────────────────────────────────────────────
-- BẢNG 4: post_tags — Liên kết N-N giữa posts và tags
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ──────────────────────────────────────────────────
-- BẢNG 5: media — Quản lý file ảnh đã upload
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,        -- Đường dẫn trên Supabase Storage
    file_size   INTEGER,              -- Kích thước (bytes)
    mime_type   TEXT,                  -- Loại file (image/jpeg, ...)
    alt_text    TEXT DEFAULT '',       -- Mô tả ảnh cho SEO
    uploaded_by UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────
-- BẢNG 6: site_settings — Cấu hình SEO toàn site
-- ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════
-- TRIGGER: Tự động cập nhật updated_at khi sửa bài viết
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_set_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ══════════════════════════════════════════════════
-- INDEX: Tối ưu truy vấn thường dùng
-- ══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);


-- ══════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════

-- --- Categories ---
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách đọc danh mục"
    ON categories FOR SELECT TO anon USING (true);

CREATE POLICY "Admin toàn quyền danh mục"
    ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Posts ---
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách chỉ xem bài đã xuất bản"
    ON posts FOR SELECT TO anon USING (status = 'published');

CREATE POLICY "Admin toàn quyền bài viết"
    ON posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Tags ---
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách đọc tags"
    ON tags FOR SELECT TO anon USING (true);

CREATE POLICY "Admin toàn quyền tags"
    ON tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Post Tags ---
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách đọc liên kết bài-tag"
    ON post_tags FOR SELECT TO anon USING (true);

CREATE POLICY "Admin toàn quyền liên kết bài-tag"
    ON post_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Media ---
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách đọc media"
    ON media FOR SELECT TO anon USING (true);

CREATE POLICY "Admin toàn quyền media"
    ON media FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --- Site Settings ---
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Khách đọc cài đặt site"
    ON site_settings FOR SELECT TO anon USING (true);

CREATE POLICY "Admin toàn quyền cài đặt site"
    ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════
-- DỮ LIỆU MẪU — Danh mục ban đầu
-- ══════════════════════════════════════════════════
INSERT INTO categories (name, slug, description, display_order) VALUES
    ('Content Marketing', 'content-marketing', 'Chiến lược và mẹo về content marketing', 1),
    ('Video Production', 'video-production', 'Kỹ thuật sản xuất video chuyên nghiệp', 2),
    ('Social Media', 'social-media', 'Quản lý và phát triển mạng xã hội', 3),
    ('Kinh nghiệm', 'kinh-nghiem', 'Chia sẻ kinh nghiệm thực tế trong ngành', 4)
ON CONFLICT (slug) DO NOTHING;

-- Cài đặt mặc định cho site
INSERT INTO site_settings (key, value) VALUES
    ('site_title', '"HnilahHub — Content Creator & Social Media Strategist"'),
    ('site_description', '"Blog chia sẻ kiến thức về content marketing, sản xuất video và quản lý mạng xã hội"'),
    ('default_og_image', '"images/avatar.jpg"')
ON CONFLICT (key) DO NOTHING;


-- ══════════════════════════════════════════════════
-- HƯỚNG DẪN TẠO STORAGE BUCKET (làm thủ công trên Dashboard)
-- ══════════════════════════════════════════════════
-- 1. Vào Supabase Dashboard → Storage → "New bucket"
-- 2. Bucket name: media
-- 3. Public bucket: BẬT (ON) — để ảnh hiển thị công khai
-- 4. File size limit: 5242880 (5MB)
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Sau khi tạo bucket, thêm policy cho bucket:
-- Vào Storage → Policies → media bucket → Add policy:
--
-- Policy 1 (Đọc công khai):
--   Name: "Public read access"
--   Target roles: anon, authenticated
--   Operation: SELECT
--   Policy: true
--
-- Policy 2 (Admin upload):
--   Name: "Auth upload"
--   Target roles: authenticated
--   Operation: INSERT
--   Policy: true
--
-- Policy 3 (Admin xóa):
--   Name: "Auth delete"
--   Target roles: authenticated
--   Operation: DELETE
--   Policy: true
-- ══════════════════════════════════════════════════
