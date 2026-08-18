// ============================================================
// supabase-config.js — Cấu hình kết nối Supabase
// 
// ⚠️  QUAN TRỌNG: Thay 2 giá trị bên dưới bằng thông tin thật
//     của bạn sau khi tạo project trên supabase.com
// ============================================================

const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Khởi tạo Supabase client — dùng chung cho toàn bộ website
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
