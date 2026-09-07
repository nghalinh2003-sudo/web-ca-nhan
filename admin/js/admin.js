// admin.js

// Kiểm tra auth ban đầu
supabaseClient.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
        // Hiện form đăng nhập, ẩn dashboard
        const loginScreen = document.getElementById('login-screen');
        const dashScreen = document.getElementById('dashboard-screen');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashScreen) dashScreen.style.display = 'none';
    } else {
        // Hiện dashboard, ẩn form
        const loginScreen = document.getElementById('login-screen');
        const dashScreen = document.getElementById('dashboard-screen');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashScreen) dashScreen.style.display = 'flex';
        initAdmin();
    }
}).catch(err => {
    console.error('Lỗi Auth:', err);
});

// Lắng nghe sự kiện đăng nhập trực tiếp trên form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('loginBtn');
        const errDiv = document.getElementById('loginError');
        
        btn.innerHTML = 'Đang xử lý...';
        btn.disabled = true;
        errDiv.style.display = 'none';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            errDiv.textContent = 'Email hoặc mật khẩu không đúng!';
            errDiv.style.display = 'block';
            btn.innerHTML = 'Đăng nhập';
            btn.disabled = false;
        } else {
            // Đăng nhập thành công, tải lại trang để ẩn form và hiện dashboard
            window.location.reload();
        }
    });
}

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Lỗi Code:', msg, 'Dòng:', lineNo);
    return false;
};

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

function initAdmin() {
    // Navigation Tabs
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            const tabElement = document.getElementById(target);
            if (tabElement) {
                tabElement.classList.add('active');
            }
            pageTitle.textContent = item.textContent.trim();

            if (target === 'tab-dashboard') loadDashboard();
            if (target === 'tab-posts' && typeof loadPosts === 'function') loadPosts();
            if (target === 'tab-categories' && typeof loadCategoriesAdmin === 'function') loadCategoriesAdmin();
            if (target === 'tab-media' && typeof loadMediaLibrary === 'function') loadMediaLibrary();
            if (target === 'tab-contacts') loadContacts();
            if (target === 'tab-portfolio') loadPortfolioAdmin();
            if (target === 'tab-services') loadServicesAdmin();
            if (target === 'tab-users') loadUsersAdmin();
        });
    });

    // Kiểm tra & áp dụng phân quyền
    checkAndApplyRole();

    // Load initial tab
    loadDashboard();
}

// === PHÂN QUYỀN (Role-based Access Control) ===
let currentUserRole = 'admin'; // Mặc định admin cho đến khi check xong

async function checkAndApplyRole() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const { data, error } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

        if (error || !data) {
            // Bảng chưa tạo hoặc user chưa có role → coi là admin
            currentUserRole = 'admin';
        } else {
            currentUserRole = data.role;
        }
    } catch (e) {
        // Fallback: nếu có lỗi thì coi là admin
        currentUserRole = 'admin';
    }

    applyRoleUI(currentUserRole);
}

function applyRoleUI(role) {
    // Admin: hiện tab Người dùng
    const navUsers = document.getElementById('nav-users');
    if (navUsers && role === 'admin') {
        navUsers.style.display = 'flex';
    }

    // Viewer: ẩn các nút thêm/sửa/xóa
    if (role === 'viewer') {
        document.querySelectorAll('.btn-primary, .btn-icon.delete, [onclick*="openEditor"], [onclick*="openPortfolioModal"], [onclick*="openServiceModal"], [onclick*="openCategoryModal"]').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// === UTILS ===
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function truncate(str, length = 50) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' });
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// === CONTACTS ===
let currentContacts = [];

async function loadContacts() {
    const tbody = document.getElementById('contacts-tbody');
    const filter = document.getElementById('contact-filter').value;
    const statsContainer = document.getElementById('contacts-stats');
    
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        let query = supabaseClient.from('contacts').select('*').order('created_at', { ascending: false });
        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        currentContacts = data;

        // Cập nhật stats
        const allData = filter === 'all' ? data : (await supabaseClient.from('contacts').select('*')).data || [];
        const newCount = allData.filter(c => c.status === 'new').length;
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-envelope"></i></div>
                <div class="stat-info">
                    <h4>Tổng tin nhắn</h4>
                    <div class="stat-value">${allData.length}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color:var(--success); background:rgba(34,197,94,0.1)"><i class="fas fa-bell"></i></div>
                <div class="stat-info">
                    <h4>Tin nhắn mới</h4>
                    <div class="stat-value">${newCount}</div>
                </div>
            </div>
        `;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Không có dữ liệu</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(contact => {
            const badge = contact.status === 'new' 
                ? `<span class="badge badge-new">Mới</span>` 
                : `<span class="badge badge-done">Đã xử lý</span>`;
                
            return `
                <tr>
                    <td><small style="color:var(--text-muted)">${formatDate(contact.created_at)}</small></td>
                    <td>
                        <strong>${escapeHtml(contact.name)}</strong><br>
                        <small style="color:var(--text-muted)">${escapeHtml(contact.email)}</small>
                    </td>
                    <td>${escapeHtml(contact.service || 'Khác')}</td>
                    <td>${badge}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="viewContact('${contact.id}')" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                            ${contact.status === 'new' ? `<button class="btn-icon" onclick="markContactDone('${contact.id}')" title="Đánh dấu đã xử lý"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn-icon delete" onclick="deleteContact('${contact.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        showToast('Lỗi tải danh sách tin nhắn', 'error');
    }
}

function viewContact(id) {
    const contact = currentContacts.find(c => c.id === id);
    if (!contact) return;

    const content = document.getElementById('contact-detail-content');
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Người gửi:</strong> ${escapeHtml(contact.name)} (<a href="mailto:${escapeHtml(contact.email)}" style="color:var(--accent)">${escapeHtml(contact.email)}</a>)
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Thời gian:</strong> ${formatDate(contact.created_at)}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Dịch vụ quan tâm:</strong> ${escapeHtml(contact.service || 'Khác')}
        </div>
        <div style="margin-bottom: 0.5rem;">
            <strong>Nội dung:</strong>
        </div>
        <div style="background:var(--bg-main); padding:1rem; border-radius:8px; border:1px solid var(--border-color); white-space:pre-wrap; line-height:1.6;">
            ${escapeHtml(contact.message)}
        </div>
    `;
    openModal('contact-modal');
}

async function markContactDone(id) {
    try {
        const { error } = await supabaseClient.from('contacts').update({ status: 'done' }).eq('id', id);
        if (error) throw error;
        showToast('Đã đánh dấu xử lý');
        loadContacts();
    } catch (err) {
        console.error(err);
        showToast('Lỗi cập nhật trạng thái', 'error');
    }
}

async function deleteContact(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
        const { error } = await supabaseClient.from('contacts').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa tin nhắn');
        loadContacts();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi xóa', 'error');
    }
}


// === PORTFOLIO ===
let currentPortfolio = [];

async function loadPortfolioAdmin() {
    const tbody = document.getElementById('portfolio-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        const { data, error } = await supabaseClient.from('portfolio_items').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        
        currentPortfolio = data;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Chưa có dự án nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            const catNames = { video: 'Video Content', social: 'Social Media' };
            const isVisible = item.is_visible ? '<span class="badge badge-new">Hiện</span>' : '<span class="badge badge-done">Ẩn</span>';
            
            return `
                <tr>
                    <td style="width: 80px; text-align: center;">${item.display_order}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div style="width:60px; height:40px; border-radius:4px; background:var(--bg-main); background-image:url('${escapeHtml(item.image_url)}'); background-size:cover; background-position:center;"></div>
                            <div>
                                <strong>${escapeHtml(item.title)}</strong><br>
                                <small style="color:var(--text-muted)">${truncate(escapeHtml(item.description), 40)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${catNames[item.category] || item.category}</td>
                    <td>${isVisible}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="editPortfolio('${item.id}')" title="Sửa"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" onclick="deletePortfolio('${item.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        showToast('Lỗi tải portfolio', 'error');
    }
}

function openPortfolioModal() {
    document.getElementById('portfolio-form').reset();
    document.getElementById('pf_id').value = '';
    document.getElementById('portfolio-modal-title').textContent = 'Thêm dự án mới';
    openModal('portfolio-modal');
}

function editPortfolio(id) {
    const item = currentPortfolio.find(p => p.id === id);
    if (!item) return;

    document.getElementById('portfolio-modal-title').textContent = 'Chỉnh sửa dự án';
    document.getElementById('pf_id').value = item.id;
    document.getElementById('pf_title').value = item.title;
    document.getElementById('pf_category').value = item.category;
    document.getElementById('pf_image').value = item.image_url || '';
    document.getElementById('pf_desc').value = item.description || '';
    document.getElementById('pf_problem').value = item.problem || '';
    document.getElementById('pf_solution').value = item.solution || '';
    document.getElementById('pf_order').value = item.display_order || 0;
    document.getElementById('pf_visible').value = item.is_visible ? 'true' : 'false';

    // Parse results
    let resultsText = '';
    if (item.results) {
        const arr = Array.isArray(item.results) ? item.results : JSON.parse(item.results);
        resultsText = arr.join('\n');
    }
    document.getElementById('pf_results').value = resultsText;

    openModal('portfolio-modal');
}

async function savePortfolio(e) {
    e.preventDefault();
    const btn = document.getElementById('pf_submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;

    try {
        const id = document.getElementById('pf_id').value;
        const resultsRaw = document.getElementById('pf_results').value;
        const resultsArray = resultsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        const payload = {
            title: document.getElementById('pf_title').value.trim(),
            category: document.getElementById('pf_category').value,
            image_url: document.getElementById('pf_image').value.trim(),
            description: document.getElementById('pf_desc').value.trim(),
            problem: document.getElementById('pf_problem').value.trim(),
            solution: document.getElementById('pf_solution').value.trim(),
            results: resultsArray,
            display_order: parseInt(document.getElementById('pf_order').value) || 0,
            is_visible: document.getElementById('pf_visible').value === 'true',
            updated_at: new Date().toISOString()
        };

        let res;
        if (id) {
            res = await supabaseClient.from('portfolio_items').update(payload).eq('id', id);
        } else {
            res = await supabaseClient.from('portfolio_items').insert(payload);
        }

        if (res.error) throw res.error;
        
        showToast('Lưu dự án thành công');
        closeModal('portfolio-modal');
        loadPortfolioAdmin();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi lưu', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function deletePortfolio(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.')) return;
    try {
        const { error } = await supabaseClient.from('portfolio_items').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa dự án');
        loadPortfolioAdmin();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi xóa', 'error');
    }
}


// === SERVICES ===
let currentServices = [];

async function loadServicesAdmin() {
    const tbody = document.getElementById('services-tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        const { data, error } = await supabaseClient.from('services').select('*').order('display_order', { ascending: true });
        if (error) throw error;
        
        currentServices = data;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Chưa có dịch vụ nào</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            const isVisible = item.is_visible ? '<span class="badge badge-new">Hiện</span>' : '<span class="badge badge-done">Ẩn</span>';
            
            return `
                <tr>
                    <td style="width: 80px; text-align: center;">${item.display_order}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div class="stat-icon" style="width:40px; height:40px; font-size:1.2rem;"><i class="${escapeHtml(item.icon)}"></i></div>
                            <div>
                                <strong>${escapeHtml(item.title)}</strong><br>
                                <small style="color:var(--text-muted)">${truncate(escapeHtml(item.description), 60)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${isVisible}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="editService('${item.id}')" title="Sửa"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" onclick="deleteService('${item.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        showToast('Lỗi tải dịch vụ', 'error');
    }
}

function openServiceModal() {
    document.getElementById('service-form').reset();
    document.getElementById('sv_id').value = '';
    document.getElementById('service-modal-title').textContent = 'Thêm dịch vụ mới';
    openModal('service-modal');
}

function editService(id) {
    const item = currentServices.find(s => s.id === id);
    if (!item) return;

    document.getElementById('service-modal-title').textContent = 'Chỉnh sửa dịch vụ';
    document.getElementById('sv_id').value = item.id;
    document.getElementById('sv_title').value = item.title;
    document.getElementById('sv_icon').value = item.icon || '';
    document.getElementById('sv_desc').value = item.description || '';
    document.getElementById('sv_order').value = item.display_order || 0;
    document.getElementById('sv_visible').value = item.is_visible ? 'true' : 'false';

    let featuresText = '';
    if (item.features) {
        const arr = Array.isArray(item.features) ? item.features : JSON.parse(item.features);
        featuresText = arr.join('\n');
    }
    document.getElementById('sv_features').value = featuresText;

    openModal('service-modal');
}

async function saveService(e) {
    e.preventDefault();
    const btn = document.getElementById('sv_submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;

    try {
        const id = document.getElementById('sv_id').value;
        const featuresRaw = document.getElementById('sv_features').value;
        const featuresArray = featuresRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

        const payload = {
            title: document.getElementById('sv_title').value.trim(),
            icon: document.getElementById('sv_icon').value.trim() || 'fas fa-star',
            description: document.getElementById('sv_desc').value.trim(),
            features: featuresArray,
            display_order: parseInt(document.getElementById('sv_order').value) || 0,
            is_visible: document.getElementById('sv_visible').value === 'true',
            updated_at: new Date().toISOString()
        };

        let res;
        if (id) {
            res = await supabaseClient.from('services').update(payload).eq('id', id);
        } else {
            res = await supabaseClient.from('services').insert(payload);
        }

        if (res.error) throw res.error;
        
        showToast('Lưu dịch vụ thành công');
        closeModal('service-modal');
        loadServicesAdmin();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi lưu', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function deleteService(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.')) return;
    try {
        const { error } = await supabaseClient.from('services').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa dịch vụ');
        loadServicesAdmin();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi xóa', 'error');
    }
}

// ═══════════════════════════════════════
// DASHBOARD TỔNG QUAN
// ═══════════════════════════════════════
async function loadDashboard() {
    try {
        // Đếm tổng bài viết
        const { count: postsCount } = await supabaseClient.from('posts').select('*', { count: 'exact', head: true });
        document.getElementById('stat-posts').textContent = postsCount || 0;
        
        // Tổng lượt xem
        const { data: viewsData } = await supabaseClient.from('posts').select('view_count');
        const totalViews = (viewsData || []).reduce((sum, p) => sum + (p.view_count || 0), 0);
        document.getElementById('stat-views').textContent = totalViews;
    } catch(e) {
        // Bảng posts chưa tồn tại — bỏ qua
        console.warn('Chưa có bảng posts:', e.message);
    }

    try {
        // Tin nhắn mới
        const { count: newContacts } = await supabaseClient.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'new');
        document.getElementById('stat-new-contacts').textContent = newContacts || 0;
        
        // Dự án portfolio
        const { count: portfolioCount } = await supabaseClient.from('portfolio_items').select('*', { count: 'exact', head: true });
        document.getElementById('stat-portfolio').textContent = portfolioCount || 0;
    } catch(e) {
        console.warn('Lỗi load stats:', e.message);
    }

    try {
        // 5 bài viết gần đây
        const { data: recentPosts } = await supabaseClient.from('posts').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(5);
        const postsHtml = (recentPosts || []).map(p => `
            <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--admin-border, #2a2d3e);">
                <div style="font-weight: 500;">${escapeHtml(p.title)}</div>
                <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size: 0.8rem;">
                    <span>${formatDate(p.created_at)}</span>
                    <span class="badge badge-${p.status}">${p.status}</span>
                </div>
            </div>
        `).join('');
        document.getElementById('recent-posts').innerHTML = postsHtml || '<div style="color:var(--text-muted)">Chưa có bài viết nào</div>';
    } catch(e) {
        document.getElementById('recent-posts').innerHTML = '<div style="color:var(--text-muted)">Chưa có bài viết nào (cần chạy migration SQL)</div>';
    }

    try {
        // 5 tin nhắn gần đây  
        const { data: recentContacts } = await supabaseClient.from('contacts').select('id, name, email, status, created_at').order('created_at', { ascending: false }).limit(5);
        const contactsHtml = (recentContacts || []).map(c => `
            <div style="margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--admin-border, #2a2d3e);">
                <div style="font-weight: 500;">${escapeHtml(c.name)}</div>
                <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size: 0.8rem;">
                    <span>${escapeHtml(c.email)}</span>
                    <span class="badge ${c.status === 'new' ? 'badge-new' : 'badge-done'}">${c.status === 'new' ? 'Mới' : 'Đã xử lý'}</span>
                </div>
            </div>
        `).join('');
        document.getElementById('recent-contacts').innerHTML = contactsHtml || '<div style="color:var(--text-muted)">Không có tin nhắn nào</div>';
    } catch(e) {
        console.warn('Lỗi load recent contacts:', e.message);
    }
}

// ═══════════════════════════════════════
// TÌM KIẾM & PHÂN TRANG CONTACTS
// ═══════════════════════════════════════
async function searchContacts(query) {
    if (!query) {
        loadContacts();
        return;
    }
    
    const tbody = document.getElementById('contacts-tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tìm...</td></tr>';

    try {
        const { data, error } = await supabaseClient.from('contacts')
            .select('*')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        currentContacts = data;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Không tìm thấy kết quả</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(contact => {
            const badge = contact.status === 'new' 
                ? `<span class="badge badge-new">Mới</span>` 
                : `<span class="badge badge-done">Đã xử lý</span>`;
                
            return `
                <tr>
                    <td><small style="color:var(--text-muted)">${formatDate(contact.created_at)}</small></td>
                    <td>
                        <strong>${escapeHtml(contact.name)}</strong><br>
                        <small style="color:var(--text-muted)">${escapeHtml(contact.email)}</small>
                    </td>
                    <td>${escapeHtml(contact.service || 'Khác')}</td>
                    <td>${badge}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="viewContact('${contact.id}')" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                            ${contact.status === 'new' ? `<button class="btn-icon" onclick="markContactDone('${contact.id}')" title="Đánh dấu đã xử lý"><i class="fas fa-check"></i></button>` : ''}
                            <button class="btn-icon delete" onclick="deleteContact('${contact.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error(err);
        showToast('Lỗi tìm kiếm tin nhắn', 'error');
    }
}

// === QUẢN LÝ NGƯỜI DÙNG ===
async function loadUsersAdmin() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        // Lấy danh sách role từ bảng user_roles
        const { data: roles, error } = await supabaseClient
            .from('user_roles')
            .select('user_id, role, created_at');

        if (error) throw error;

        if (!roles || roles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Chưa có người dùng nào trong bảng user_roles.<br><small>Hãy chạy migration 002 và gán role cho tài khoản của bạn.</small></td></tr>';
            return;
        }

        const roleLabels = { admin: '👑 Admin', editor: '✏️ Editor', viewer: '👁️ Viewer' };

        tbody.innerHTML = roles.map(u => `
            <tr>
                <td><small style="font-family:monospace; color:var(--text-muted)">${u.user_id.substring(0,8)}...</small></td>
                <td>
                    <select onchange="updateUserRole('${u.user_id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-main); color:var(--text-primary)">
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                        <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>✏️ Editor</option>
                        <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>👁️ Viewer</option>
                    </select>
                </td>
                <td><small>${formatDate(u.created_at)}</small></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteUserRole('${u.user_id}')" title="Xóa khỏi danh sách"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--danger)">Lỗi tải dữ liệu người dùng. Hãy chắc chắn đã chạy migration 002.</td></tr>';
    }
}

async function updateUserRole(userId, newRole) {
    try {
        const { error } = await supabaseClient
            .from('user_roles')
            .update({ role: newRole })
            .eq('user_id', userId);
        if (error) throw error;
        showToast(`Đã cập nhật vai trò thành ${newRole}`);
    } catch (err) {
        console.error(err);
        showToast('Lỗi cập nhật vai trò', 'error');
    }
}

async function deleteUserRole(userId) {
    if (!confirm('Xóa người dùng này khỏi hệ thống phân quyền? Họ sẽ không còn truy cập được admin.')) return;
    try {
        const { error } = await supabaseClient.from('user_roles').delete().eq('user_id', userId);
        if (error) throw error;
        showToast('Đã xóa người dùng');
        loadUsersAdmin();
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi xóa', 'error');
    }
}
