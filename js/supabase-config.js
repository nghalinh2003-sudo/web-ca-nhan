// ============================================================
// supabase-config.js — Cấu hình kết nối Supabase
// 
// ⚠️  QUAN TRỌNG: Thay 2 giá trị bên dưới bằng thông tin thật
//     của bạn sau khi tạo project trên supabase.com
// ============================================================

const SUPABASE_URL  = 'https://ppsrjmrzwuztjlvrwwty.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3JqbXJ6d3V6dGpsdnJ3d3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjA4MTMsImV4cCI6MjEwMjY5NjgxM30.buvXYk0qnFnuVtnO71A38CkW_KUEN0Bp0e7IE4orTHM';

// Khởi tạo Supabase client — dùng chung cho toàn bộ website
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
