-- ---------------------------------------------------------------
-- MIGRATION 002: Phân quy?n ngu?i dùng (User Roles)
-- Ch?y script này trên Supabase Dashboard ? SQL Editor ? New query
-- ---------------------------------------------------------------

-- --------------------------------------------------
-- B?NG: user_roles — Vai trò c?a t?ng user
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'editor'
               CHECK (role IN ('admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B?t Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Ngu?i dùng dã dang nh?p có th? xem role c?a chính mình
CREATE POLICY "User xem role c?a mình"
    ON user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Ch? admin (role = 'admin') m?i du?c xem t?t c? roles
CREATE POLICY "Admin xem t?t c? roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Ch? admin m?i du?c thêm/s?a/xóa roles
CREATE POLICY "Admin qu?n lý roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );


-- --------------------------------------------------
-- HÀM HELPER: L?y role c?a user hi?n t?i
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;


-- --------------------------------------------------
-- HU?NG D?N S? D?NG
-- --------------------------------------------------
-- Sau khi ch?y script:
--
-- 1. Gán role admin cho tài kho?n c?a b?n:
--    INSERT INTO user_roles (user_id, role)
--    VALUES ('<UUID_C?A_B?N>', 'admin')
--    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--
--    Tìm UUID tài kho?n: Supabase Dashboard ? Authentication ? Users
--
-- 2. Phân quy?n theo role:
--    admin  ? Toàn quy?n: bài vi?t, portfolio, d?ch v?, user
--    editor ? Vi?t/s?a bài c?a mình, xem tin nh?n
--    viewer ? Ch? xem dashboard
-- --------------------------------------------------
