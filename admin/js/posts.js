// admin/js/posts.js
// Quản lý bài viết, dự án, dịch vụ — dùng chung với editor.html

const POSTS_PER_PAGE = 20;

// === Slug Generator (Tiếng Việt) ===
function generateSlug(title) {
    if (!title) return '';
    let slug = title.toLowerCase();
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
    slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
    slug = slug.replace(/đ/gi, 'd');
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
    slug = slug.replace(/ /gi, "-");
    slug = slug.replace(/\-\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-/gi, '-');
    slug = slug.replace(/\-\-/gi, '-');
    slug = '@' + slug + '@';
    slug = slug.replace(/\@\-|\-\@|\@/gi, '');
    return slug;
}

// === MỞ TRANG EDITOR ===
// type: 'blog' | 'project' | 'service'
function openEditor(itemId = '', type = 'blog') {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            alert('Bạn chưa đăng nhập!');
            return;
        }
        let url = `editor.html?access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=${type}`;
        if (itemId) url += `&id=${itemId}`;
        window.location.href = url;
    });
}

// ===================================================================
// DASHBOARD — CRUD Bài viết Blog
// ===================================================================
async function loadPosts(filter = 'all') {
    const tbody = document.getElementById('posts-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';
    
    try {
        let query = supabaseClient.from('posts').select('*, categories(name)').order('created_at', { ascending: false });
        if (filter !== 'all') query = query.eq('status', filter);
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (filter === 'all') {
            document.getElementById('posts-total').textContent = data.length;
            document.getElementById('posts-published').textContent = data.filter(p => p.status === 'published').length;
            document.getElementById('posts-draft').textContent = data.filter(p => p.status === 'draft').length;
        }
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">Chưa có bài viết nào</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(post => {
            let statusBadge = '';
            if (post.status === 'published') statusBadge = '<span class="badge badge-published">Đã xuất bản</span>';
            else if (post.status === 'draft') statusBadge = '<span class="badge badge-draft">Bản nháp</span>';
            else statusBadge = '<span class="badge badge-archived">Lưu trữ</span>';
            
            const catName = post.categories ? post.categories.name : 'Chưa phân loại';
            const views = post.view_count || 0;
            
            return `
                <tr>
                    <td><strong>${escapeHtml(post.title)}</strong></td>
                    <td>${escapeHtml(catName)}</td>
                    <td>${statusBadge}</td>
                    <td>${views}</td>
                    <td><small>${formatDate(post.created_at)}</small></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="openEditor('${post.id}', 'blog')" title="Sửa"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete" onclick="deletePost('${post.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch(err) {
        console.error('Lỗi tải bài viết:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger)">Lỗi tải dữ liệu</td></tr>';
    }
}

function filterPosts(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.filter-btn[data-filter="${filter}"]`)?.classList.add('active');
    loadPosts(filter);
}

function searchPosts(query) {
    const rows = document.querySelectorAll('#posts-tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

async function deletePost(id) {
    if (!confirm('Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.')) return;
    try {
        const { error } = await supabaseClient.from('posts').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa bài viết');
        loadPosts();
    } catch (err) {
        showToast('Lỗi xóa bài viết', 'error');
    }
}

// ===================================================================
// DASHBOARD — CRUD Danh mục
// ===================================================================
async function loadCategoriesAdmin() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';
    
    try {
        const { data, error } = await supabaseClient.from('categories').select('*').order('display_order');
        if (error) throw error;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Chưa có danh mục nào</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(cat => `
            <tr>
                <td><strong>${escapeHtml(cat.name)}</strong></td>
                <td>${escapeHtml(cat.slug)}</td>
                <td>${escapeHtml(cat.description || '')}</td>
                <td>-</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteCategory('${cat.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch(err) {
        console.error('Lỗi tải danh mục:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger)">Lỗi tải dữ liệu</td></tr>';
    }
}

async function deleteCategory(id) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
        const { error } = await supabaseClient.from('categories').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa danh mục');
        loadCategoriesAdmin();
    } catch (err) {
        showToast('Lỗi xóa danh mục', 'error');
    }
}

// ===================================================================
// EDITOR — Khởi tạo chung
// ===================================================================
let quill;
let currentPostId = null;
let currentEditorType = 'blog'; // 'blog' | 'project' | 'service'

async function initEditor() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    currentPostId = itemId;
    currentEditorType = urlParams.get('type') || 'blog';

    // Thiết lập giao diện theo type
    applyEditorType(currentEditorType);

    // Khởi tạo Quill
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // Chèn ảnh qua Media Picker
    quill.getModule('toolbar').addHandler('image', () => {
        openMediaPicker((url) => {
            const range = quill.getSelection();
            quill.insertEmbed(range.index, 'image', url);
        });
    });

    // Cập nhật word count khi nhập
    quill.on('text-change', updateWordCount);

    // Blog-specific events
    if (currentEditorType === 'blog') {
        quill.on('text-change', updateSEO);
        document.getElementById('post-title').addEventListener('input', (e) => {
            const slugInput = document.getElementById('post-slug');
            if (!slugInput.dataset.manual) slugInput.value = generateSlug(e.target.value);
            updateSEO();
        });
        document.getElementById('post-slug').addEventListener('input', (e) => {
            e.target.dataset.manual = 'true';
            updateSEO();
        });
        ['meta-title', 'meta-desc', 'featured-image', 'og-image', 'meta-keywords'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', updateSEO);
        });
        initTagsInput();
        await loadCategoriesDropdown();
    }

    // Tải dữ liệu nếu đang sửa
    if (itemId) {
        await loadItemForEdit(itemId, currentEditorType);
    }

    startAutoSave();
}

// Áp dụng giao diện và tiêu đề theo type
function applyEditorType(type) {
    const titles = { blog: 'Viết bài Blog', project: 'Viết bài Dự án', service: 'Viết trang Dịch vụ' };
    const placeholders = { blog: 'Nhập tiêu đề bài viết...', project: 'Nhập tên dự án...', service: 'Nhập tên dịch vụ...' };

    document.getElementById('editor-page-title').textContent = titles[type] || 'Soạn thảo';
    document.getElementById('post-title').placeholder = placeholders[type] || 'Nhập tiêu đề...';
    document.title = titles[type] + ' - Admin Panel';

    // Hiện/ẩn panel đúng type
    document.getElementById('panel-blog').style.display = (type === 'blog') ? 'block' : 'none';
    document.getElementById('panel-project').style.display = (type === 'project') ? 'block' : 'none';
    document.getElementById('panel-service').style.display = (type === 'service') ? 'block' : 'none';

    // Nút lưu nháp chỉ dành cho Blog
    document.getElementById('btn-draft').style.display = (type === 'blog') ? 'inline-flex' : 'none';
}

// Tải dữ liệu hiện có vào editor để sửa
async function loadItemForEdit(id, type) {
    document.getElementById('editor-loading').style.display = 'flex';
    try {
        let data, error;
        if (type === 'blog') {
            ({ data, error } = await supabaseClient.from('posts').select('*').eq('id', id).single());
            if (error) throw error;
            document.getElementById('post-title').value = data.title;
            document.getElementById('post-slug').value = data.slug;
            document.getElementById('post-slug').dataset.manual = 'true';
            document.getElementById('post-excerpt').value = data.excerpt || '';
            document.getElementById('post-category').value = data.category_id || '';
            document.getElementById('post-status').value = data.status;
            document.getElementById('featured-image').value = data.featured_image || '';
            if (data.featured_image) updateImagePreview('featured-image', 'featured-preview');
            document.getElementById('og-image').value = data.og_image || '';
            if (data.og_image) updateImagePreview('og-image', 'og-preview-img');
            document.getElementById('meta-title').value = data.meta_title || '';
            document.getElementById('meta-desc').value = data.meta_description || '';
            document.getElementById('meta-keywords').value = data.meta_keywords || '';
            quill.root.innerHTML = data.content || '';
            await loadPostTagsAdmin(id);
            updateSEO();

        } else if (type === 'project') {
            ({ data, error } = await supabaseClient.from('portfolio_items').select('*').eq('id', id).single());
            if (error) throw error;
            document.getElementById('post-title').value = data.title;
            document.getElementById('pf_category').value = data.category;
            document.getElementById('pf_visible').value = data.is_visible ? 'true' : 'false';
            document.getElementById('pf_order').value = data.display_order || 0;
            document.getElementById('pf_image').value = data.image_url || '';
            document.getElementById('pf_desc').value = data.description || '';
            document.getElementById('pf_problem').value = data.problem || '';
            document.getElementById('pf_solution').value = data.solution || '';
            // Kết quả: array → mỗi dòng 1 ý
            const results = Array.isArray(data.results) ? data.results : (data.results ? JSON.parse(data.results) : []);
            document.getElementById('pf_results').value = results.join('\n');
            // Ảnh preview
            if (data.image_url) {
                const prev = document.getElementById('pf_image_preview');
                prev.src = data.image_url;
                prev.style.display = 'block';
            }
            quill.root.innerHTML = data.content || '';

        } else if (type === 'service') {
            ({ data, error } = await supabaseClient.from('services').select('*').eq('id', id).single());
            if (error) throw error;
            document.getElementById('post-title').value = data.title;
            document.getElementById('sv_icon').value = data.icon || 'fas fa-star';
            document.getElementById('sv_visible').value = data.is_visible ? 'true' : 'false';
            document.getElementById('sv_order').value = data.display_order || 0;
            document.getElementById('sv_desc').value = data.description || '';
            const features = Array.isArray(data.features) ? data.features : (data.features ? JSON.parse(data.features) : []);
            document.getElementById('sv_features').value = features.join('\n');
            quill.root.innerHTML = data.content || '';
            previewServiceIcon();
        }
    } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        showToast('Lỗi tải dữ liệu', 'error');
    } finally {
        document.getElementById('editor-loading').style.display = 'none';
    }
}

// ===================================================================
// EDITOR — Lưu (phân nhánh theo type)
// ===================================================================
async function savePost(forceStatus = null) {
    const title = document.getElementById('post-title').value.trim();
    if (!title) {
        showToast('Vui lòng nhập tiêu đề', 'error');
        return;
    }

    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
        if (currentEditorType === 'blog') {
            await saveBlogPost(forceStatus);
        } else if (currentEditorType === 'project') {
            await saveProjectPost();
        } else if (currentEditorType === 'service') {
            await saveServicePost();
        }

        const saveTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('save-status').innerHTML = `<i class="fas fa-check-circle"></i> Đã lưu lúc ${saveTime}`;

    } catch (err) {
        console.error(err);
        showToast('Lỗi khi lưu: ' + (err.message || 'Error'), 'error');
        document.getElementById('save-status').innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Lỗi khi lưu`;
    } finally {
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu lại';
    }
}

// Lưu bài Blog
async function saveBlogPost(forceStatus) {
    const userSession = await supabaseClient.auth.getSession();
    const userId = userSession.data.session?.user?.id;
    const status = forceStatus || document.getElementById('post-status').value;
    const title = document.getElementById('post-title').value.trim();
    const slug = document.getElementById('post-slug').value || generateSlug(title);

    const payload = {
        title,
        slug,
        excerpt: document.getElementById('post-excerpt').value,
        content: quill.root.innerHTML,
        featured_image: document.getElementById('featured-image').value,
        category_id: document.getElementById('post-category').value || null,
        status,
        meta_title: document.getElementById('meta-title').value,
        meta_description: document.getElementById('meta-desc').value,
        meta_keywords: document.getElementById('meta-keywords').value,
        og_image: document.getElementById('og-image').value,
        updated_at: new Date().toISOString()
    };
    if (status === 'published') payload.published_at = new Date().toISOString();

    let res;
    if (currentPostId) {
        res = await supabaseClient.from('posts').update(payload).eq('id', currentPostId).select().single();
    } else {
        payload.author_id = userId;
        res = await supabaseClient.from('posts').insert(payload).select().single();
    }
    if (res.error) throw res.error;

    currentPostId = res.data.id;
    window.history.replaceState({}, '', `editor.html?type=blog&id=${currentPostId}`);
    await savePostTags(currentPostId);
    showToast(forceStatus === 'draft' ? 'Đã lưu nháp' : 'Đã lưu bài viết');
}

// Lưu bài Dự án
async function saveProjectPost() {
    const title = document.getElementById('post-title').value.trim();
    const resultsRaw = document.getElementById('pf_results').value;
    const resultsArray = resultsRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
        title,
        category: document.getElementById('pf_category').value,
        image_url: document.getElementById('pf_image').value.trim(),
        description: document.getElementById('pf_desc').value.trim(),
        problem: document.getElementById('pf_problem').value.trim(),
        solution: document.getElementById('pf_solution').value.trim(),
        results: resultsArray,
        content: quill.root.innerHTML,
        display_order: parseInt(document.getElementById('pf_order').value) || 0,
        is_visible: document.getElementById('pf_visible').value === 'true',
        updated_at: new Date().toISOString()
    };

    let res;
    if (currentPostId) {
        res = await supabaseClient.from('portfolio_items').update(payload).eq('id', currentPostId).select().single();
    } else {
        res = await supabaseClient.from('portfolio_items').insert(payload).select().single();
    }
    if (res.error) throw res.error;

    currentPostId = res.data.id;
    window.history.replaceState({}, '', `editor.html?type=project&id=${currentPostId}`);
    showToast('Đã lưu dự án');
}

// Lưu trang Dịch vụ
async function saveServicePost() {
    const title = document.getElementById('post-title').value.trim();
    const featuresRaw = document.getElementById('sv_features').value;
    const featuresArray = featuresRaw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
        title,
        icon: document.getElementById('sv_icon').value.trim() || 'fas fa-star',
        description: document.getElementById('sv_desc').value.trim(),
        features: featuresArray,
        content: quill.root.innerHTML,
        display_order: parseInt(document.getElementById('sv_order').value) || 0,
        is_visible: document.getElementById('sv_visible').value === 'true',
        updated_at: new Date().toISOString()
    };

    let res;
    if (currentPostId) {
        res = await supabaseClient.from('services').update(payload).eq('id', currentPostId).select().single();
    } else {
        res = await supabaseClient.from('services').insert(payload).select().single();
    }
    if (res.error) throw res.error;

    currentPostId = res.data.id;
    window.history.replaceState({}, '', `editor.html?type=service&id=${currentPostId}`);
    showToast('Đã lưu dịch vụ');
}

// ===================================================================
// EDITOR — Các hàm hỗ trợ
// ===================================================================

// Cập nhật word count (dùng chung cho mọi type)
function updateWordCount() {
    const text = quill.root.innerHTML.replace(/<[^>]*>?/gm, ' ');
    const wordCount = countWords(text);
    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('read-time').textContent = calculateReadingTime(wordCount);
}

function updateImagePreview(inputId, previewId) {
    const url = document.getElementById(inputId).value;
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = url
            ? `<img src="${escapeHtml(url)}" style="max-width:100%; border-radius:4px; margin-top:8px; max-height:150px;">`
            : '';
    }
}

// Preview icon dịch vụ real-time
function previewServiceIcon() {
    const iconClass = document.getElementById('sv_icon').value || 'fas fa-star';
    document.getElementById('sv_icon_preview').innerHTML = `<i class="${escapeHtml(iconClass)}"></i>`;
}

// Chọn ảnh cho Dự án
function selectProjectImage() {
    openMediaPicker((url) => {
        document.getElementById('pf_image').value = url;
        const prev = document.getElementById('pf_image_preview');
        prev.src = url;
        prev.style.display = 'block';
    });
}

// Media Pickers cho Blog
function selectFeaturedImage() {
    openMediaPicker((url) => {
        document.getElementById('featured-image').value = url;
        updateImagePreview('featured-image', 'featured-preview');
        updateSEO();
    });
}

function selectOgImage() {
    openMediaPicker((url) => {
        document.getElementById('og-image').value = url;
        updateImagePreview('og-image', 'og-preview-img');
        updateSEO();
    });
}

// Auto-save mỗi 60 giây
let lastSavedContent = '';
function startAutoSave() {
    setInterval(() => {
        const currentContent = quill.root.innerHTML + document.getElementById('post-title').value;
        if (currentContent !== lastSavedContent && document.getElementById('post-title').value.trim() !== '') {
            lastSavedContent = currentContent;
            document.getElementById('save-status').innerHTML = '<i class="fas fa-sync fa-spin"></i> Đang tự lưu...';
            const statusEl = document.getElementById('post-status');
            savePost(statusEl ? statusEl.value : null);
        }
    }, 60000);
}

// ===================================================================
// EDITOR — Tags (Blog only)
// ===================================================================
let selectedTags = [];

function initTagsInput() {
    const input = document.getElementById('post-tags-input');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = input.value.trim().replace(/,+$/, '');
            if (val) addTag(val);
            input.value = '';
        }
    });
    input.addEventListener('blur', () => {
        const val = input.value.trim().replace(/,+$/, '');
        if (val) addTag(val);
        input.value = '';
    });
}

function addTag(name) {
    const slug = generateSlug(name);
    if (!slug || selectedTags.find(t => t.slug === slug)) return;
    selectedTags.push({ name: name.trim(), slug });
    renderTagsPreview();
}

function removeTag(slug) {
    selectedTags = selectedTags.filter(t => t.slug !== slug);
    renderTagsPreview();
}

function renderTagsPreview() {
    const container = document.getElementById('tags-preview');
    if (!container) return;
    container.innerHTML = selectedTags.map(t => `
        <span style="display:inline-flex; align-items:center; gap:4px; background:rgba(99,102,241,0.15); color:var(--accent,#6366f1); padding:3px 10px; border-radius:20px; font-size:0.8rem;">
            #${escapeHtml(t.name)}
            <button type="button" onclick="removeTag('${escapeHtml(t.slug)}')" style="background:none; border:none; color:inherit; cursor:pointer; padding:0; line-height:1; font-size:1rem;">&times;</button>
        </span>
    `).join('');
}

async function loadPostTagsAdmin(postId) {
    try {
        const { data, error } = await supabaseClient.from('post_tags').select('tags(name, slug)').eq('post_id', postId);
        if (error) throw error;
        selectedTags = (data || []).map(pt => ({ name: pt.tags.name, slug: pt.tags.slug }));
        renderTagsPreview();
    } catch(err) {
        console.warn('Lỗi load tags:', err);
    }
}

async function savePostTags(postId) {
    if (postId) await supabaseClient.from('post_tags').delete().eq('post_id', postId);
    if (!postId || selectedTags.length === 0) return;
    try {
        const tagUpserts = selectedTags.map(t => ({ name: t.name, slug: t.slug }));
        await supabaseClient.from('tags').upsert(tagUpserts, { onConflict: 'slug', ignoreDuplicates: true });
        const { data: tagRows } = await supabaseClient.from('tags').select('id, slug').in('slug', selectedTags.map(t => t.slug));
        if (tagRows && tagRows.length > 0) {
            await supabaseClient.from('post_tags').insert(tagRows.map(t => ({ post_id: postId, tag_id: t.id })));
        }
    } catch(err) {
        console.warn('Lỗi lưu tags:', err);
    }
}

async function loadCategoriesDropdown() {
    try {
        const { data, error } = await supabaseClient.from('categories').select('id, name').order('display_order');
        if (error) throw error;
        const select = document.getElementById('post-category');
        if (select) {
            select.innerHTML = '<option value="">Chọn danh mục</option>' + data.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        }
    } catch(err) {
        console.error('Lỗi tải danh mục', err);
    }
}

// Gọi updateSEO từ seo.js (nếu tồn tại)
function updateSEO() {
    const data = {
        title: document.getElementById('post-title')?.value || '',
        metaTitle: document.getElementById('meta-title')?.value || '',
        metaDescription: document.getElementById('meta-desc')?.value || '',
        slug: document.getElementById('post-slug')?.value || '',
        featuredImage: document.getElementById('featured-image')?.value || '',
        ogImage: document.getElementById('og-image')?.value || '',
        content: quill?.root.innerHTML || '',
        keywords: document.getElementById('meta-keywords')?.value || ''
    };

    const titleCounter = document.getElementById('meta-title-counter');
    if (titleCounter) titleCounter.textContent = `${data.metaTitle.length}/60`;
    const descCounter = document.getElementById('meta-desc-counter');
    if (descCounter) descCounter.textContent = `${data.metaDescription.length}/160`;

    updateWordCount();

    if (typeof calculateSEOScore === 'function') {
        const seoResult = calculateSEOScore(data);
        renderSEOPanel(seoResult);
        renderOGPreview(data);
    }
}
