// admin/js/posts.js

const POSTS_PER_PAGE = 20;

// === Slug Generator (Tiếng Việt) ===
function generateSlug(title) {
    if (!title) return '';
    let slug = title.toLowerCase();
    
    // Đổi ký tự có dấu thành không dấu
    slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
    slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
    slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
    slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
    slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
    slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
    slug = slug.replace(/đ/gi, 'd');
    
    // Xóa các ký tự đặc biệt
    slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
    
    // Đổi khoảng trắng thành ký tự gạch ngang
    slug = slug.replace(/ /gi, "-");
    
    // Đổi nhiều ký tự gạch ngang liên tiếp thành 1 ký tự gạch ngang
    slug = slug.replace(/\-\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-\-/gi, '-');
    slug = slug.replace(/\-\-\-/gi, '-');
    slug = slug.replace(/\-\-/gi, '-');
    
    // Xóa các ký tự gạch ngang ở đầu và cuối
    slug = '@' + slug + '@';
    slug = slug.replace(/\@\-|\-\@|\@/gi, '');
    
    return slug;
}

// === MỞ TRANG EDITOR TRÊN FILE:// ===
function openEditor(postId = '') {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            alert('Bạn chưa đăng nhập!');
            return;
        }
        // Gắn token vào URL để editor.html có thể đọc được (khắc phục lỗi localStorage file://)
        const url = `editor.html?access_token=${session.access_token}&refresh_token=${session.refresh_token}${postId ? '&id='+postId : ''}`;
        window.location.href = url;
    });
}

// === CRUD Bài viết (Dành cho Dashboard) ===
async function loadPosts(filter = 'all') {
    const tbody = document.getElementById('posts-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';
    
    try {
        let query = supabaseClient.from('posts').select('*, categories(name)').order('created_at', { ascending: false });
        if (filter !== 'all') {
            query = query.eq('status', filter);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Cập nhật thống kê
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
                            <button class="btn-icon" onclick="openEditor('${post.id}')" title="Sửa"><i class="fas fa-edit"></i></button>
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

// === CRUD Danh mục (Dành cho Dashboard) ===
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
    if (!confirm('Bạn có chắc muốn xóa danh mục này? Các bài viết thuộc danh mục này có thể bị ảnh hưởng.')) return;
    try {
        const { error } = await supabaseClient.from('categories').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa danh mục');
        loadCategoriesAdmin();
    } catch (err) {
        showToast('Lỗi xóa danh mục', 'error');
    }
}

// === Editor functions (dùng trong editor.html) ===
let quill;
let currentPostId = null;

async function initEditor() {
    // Parse URL for id
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    currentPostId = postId;

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

    // Handle Image upload in Quill
    quill.getModule('toolbar').addHandler('image', () => {
        openMediaPicker((url) => {
            const range = quill.getSelection();
            quill.insertEmbed(range.index, 'image', url);
        });
    });

    // Events cho auto-update SEO & UI
    quill.on('text-change', updateSEO);
    document.getElementById('post-title').addEventListener('input', (e) => {
        const slugInput = document.getElementById('post-slug');
        if (!slugInput.dataset.manual) {
            slugInput.value = generateSlug(e.target.value);
        }
        updateSEO();
    });
    document.getElementById('post-slug').addEventListener('input', (e) => {
        e.target.dataset.manual = 'true';
        updateSEO();
    });
    const inputs = ['meta-title', 'meta-desc', 'featured-image', 'og-image', 'meta-keywords'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updateSEO);
    });

    // Tải danh mục
    await loadCategoriesDropdown();

    // Nếu sửa bài
    if (postId) {
        document.getElementById('editor-loading').style.display = 'flex';
        try {
            const { data: post, error } = await supabaseClient.from('posts').select('*').eq('id', postId).single();
            if (error) throw error;

            document.getElementById('post-title').value = post.title;
            document.getElementById('post-slug').value = post.slug;
            document.getElementById('post-slug').dataset.manual = 'true';
            document.getElementById('post-excerpt').value = post.excerpt || '';
            document.getElementById('post-category').value = post.category_id || '';
            document.getElementById('post-status').value = post.status;
            
            document.getElementById('featured-image').value = post.featured_image || '';
            if (post.featured_image) updateImagePreview('featured-image', 'featured-preview');
            
            document.getElementById('og-image').value = post.og_image || '';
            if (post.og_image) updateImagePreview('og-image', 'og-preview-img');

            document.getElementById('meta-title').value = post.meta_title || '';
            document.getElementById('meta-desc').value = post.meta_description || '';
            document.getElementById('meta-keywords').value = post.meta_keywords || '';

            quill.root.innerHTML = post.content || '';
            
            updateSEO();
        } catch (err) {
            console.error(err);
            showToast('Lỗi tải bài viết', 'error');
        } finally {
            document.getElementById('editor-loading').style.display = 'none';
        }
    }

    startAutoSave();
}

function updateImagePreview(inputId, previewId) {
    const url = document.getElementById(inputId).value;
    const preview = document.getElementById(previewId);
    if (preview) {
        if (url) {
            preview.innerHTML = `<img src="${escapeHtml(url)}" style="max-width:100%; border-radius:4px; margin-top:8px; max-height:150px;">`;
        } else {
            preview.innerHTML = '';
        }
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

function updateSEO() {
    const data = {
        title: document.getElementById('post-title').value,
        metaTitle: document.getElementById('meta-title').value,
        metaDescription: document.getElementById('meta-desc').value,
        slug: document.getElementById('post-slug').value,
        featuredImage: document.getElementById('featured-image').value,
        ogImage: document.getElementById('og-image').value,
        content: quill.root.innerHTML,
        keywords: document.getElementById('meta-keywords').value
    };

    // Update Counters
    const titleCounter = document.getElementById('meta-title-counter');
    if (titleCounter) titleCounter.textContent = `${data.metaTitle.length}/60`;
    const descCounter = document.getElementById('meta-desc-counter');
    if (descCounter) descCounter.textContent = `${data.metaDescription.length}/160`;

    // Cập nhật Footer info
    const wordCount = countWords(data.content.replace(/<[^>]*>?/gm, ' '));
    document.getElementById('word-count').textContent = wordCount;
    document.getElementById('read-time').textContent = calculateReadingTime(wordCount);

    if (typeof calculateSEOScore === 'function') {
        const seoResult = calculateSEOScore(data);
        renderSEOPanel(seoResult);
        renderOGPreview(data);
    }
}

async function savePost(forceStatus = null) {
    const title = document.getElementById('post-title').value.trim();
    if (!title) {
        showToast('Vui lòng nhập tiêu đề bài viết', 'error');
        return;
    }

    const saveBtn = document.getElementById('btn-save');
    if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    try {
        const userSession = await supabaseClient.auth.getSession();
        const userId = userSession.data.session?.user?.id;

        const status = forceStatus || document.getElementById('post-status').value;
        const slug = document.getElementById('post-slug').value || generateSlug(title);
        const category_id = document.getElementById('post-category').value || null;

        const payload = {
            title,
            slug,
            excerpt: document.getElementById('post-excerpt').value,
            content: quill.root.innerHTML,
            featured_image: document.getElementById('featured-image').value,
            category_id,
            status,
            meta_title: document.getElementById('meta-title').value,
            meta_description: document.getElementById('meta-desc').value,
            meta_keywords: document.getElementById('meta-keywords').value,
            og_image: document.getElementById('og-image').value,
            updated_at: new Date().toISOString()
        };

        if (status === 'published') {
            payload.published_at = new Date().toISOString(); // Cập nhật published_at nếu publish
        }

        let res;
        if (currentPostId) {
            res = await supabaseClient.from('posts').update(payload).eq('id', currentPostId).select().single();
        } else {
            payload.author_id = userId;
            res = await supabaseClient.from('posts').insert(payload).select().single();
        }

        if (res.error) throw res.error;

        currentPostId = res.data.id;
        
        // Update URL to prevent new insert on reload
        const newUrl = window.location.pathname + '?id=' + currentPostId;
        window.history.replaceState({}, '', newUrl);

        showToast(forceStatus === 'draft' ? 'Đã lưu nháp' : 'Đã lưu bài viết');
        
        const saveTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' });
        document.getElementById('save-status').innerHTML = `<i class="fas fa-check-circle"></i> Đã lưu lúc ${saveTime}`;
        
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi lưu bài viết: ' + (err.message || 'Error'), 'error');
        document.getElementById('save-status').innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--danger)"></i> Lỗi khi lưu`;
    } finally {
        if(saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu bài';
    }
}

let autoSaveTimer = null;
let lastSavedContent = '';

function startAutoSave() {
    setInterval(() => {
        const currentContent = quill.root.innerHTML + document.getElementById('post-title').value;
        // Chỉ lưu nếu có thay đổi
        if (currentContent !== lastSavedContent && document.getElementById('post-title').value.trim() !== '') {
            lastSavedContent = currentContent;
            document.getElementById('save-status').innerHTML = '<i class="fas fa-sync fa-spin"></i> Đang tự lưu...';
            // Không thay đổi trạng thái nếu nó đang published, chỉ update data
            savePost(document.getElementById('post-status').value).then(() => {
                // done
            });
        }
    }, 60000); // Tự động lưu mỗi 60s
}

// Media Pickers for specific inputs
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
