// admin/js/media.js

// === Hằng số ===
const STORAGE_BUCKET = 'media';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MEDIA_PER_PAGE = 12;

// === Tiện ích ===
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFileName(name) {
    // Bỏ ký tự đặc biệt, khoảng trắng → gạch dưới
    return name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

// === Upload ===
async function uploadMedia(file) {
    // Validate
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Kích thước file vượt quá 5MB.');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Định dạng file không được hỗ trợ.');
    }

    try {
        const sanitizedFileName = sanitizeFileName(file.name);
        const path = `${Date.now()}_${sanitizedFileName}`;

        // Upload lên Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(path, file);

        if (uploadError) throw uploadError;

        // Lấy public URL
        const { data: publicUrlData } = supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

        const url = publicUrlData.publicUrl;

        // Lưu metadata vào bảng media
        const userSession = await supabaseClient.auth.getSession();
        const userId = userSession.data.session?.user?.id;

        const { data: insertData, error: insertError } = await supabaseClient
            .from('media')
            .insert({
                file_name: sanitizedFileName,
                file_path: path,
                file_size: file.size,
                mime_type: file.type,
                uploaded_by: userId || null
            })
            .select()
            .single();

        if (insertError) {
            console.error('Lưu metadata thất bại', insertError);
            // Dù lỗi metadata vẫn trả về url
            return { url, id: null };
        }

        return { url, id: insertData.id };
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function deleteMedia(id, filePath) {
    try {
        // Xóa file khỏi Storage
        const { error: storageError } = await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);
            
        if (storageError) throw storageError;

        // Xóa record khỏi bảng media
        const { error: dbError } = await supabaseClient
            .from('media')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;
        
        return true;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// === Thư viện Media ===
async function loadMediaLibrary(page = 1) {
    const start = (page - 1) * MEDIA_PER_PAGE;
    const end = start + MEDIA_PER_PAGE - 1;

    try {
        const { data, error, count } = await supabaseClient
            .from('media')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) throw error;
        
        return { data, count, page };
    } catch (err) {
        console.error('Lỗi load media:', err);
        showToast('Lỗi tải thư viện ảnh', 'error');
        return { data: [], count: 0, page: 1 };
    }
}

function renderMediaGrid(items, container, onSelect) {
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; grid-column: 1/-1; color: var(--text-muted);">Không có ảnh nào.</div>';
        return;
    }

    container.innerHTML = items.map(item => {
        const publicUrl = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(item.file_path).data.publicUrl;
        return `
            <div class="media-item" data-url="${publicUrl}" data-id="${item.id}" data-path="${item.file_path}">
                <img src="${publicUrl}" alt="${escapeHtml(item.alt_text || item.file_name)}" loading="lazy">
                <div class="media-item-info">
                    <span class="media-name" title="${escapeHtml(item.file_name)}">${truncate(escapeHtml(item.file_name), 20)}</span>
                    <span class="media-size">${formatFileSize(item.file_size)}</span>
                </div>
                <div class="media-overlay">
                    <button class="btn btn-primary btn-sm btn-select" type="button">Chọn</button>
                    <button class="btn btn-danger btn-sm btn-delete" type="button" title="Xóa"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    // Events
    container.querySelectorAll('.btn-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const url = e.target.closest('.media-item').dataset.url;
            if (onSelect) onSelect(url);
        });
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
            
            const itemEl = e.target.closest('.media-item');
            const id = itemEl.dataset.id;
            const path = itemEl.dataset.path;
            
            try {
                await deleteMedia(id, path);
                itemEl.remove();
                showToast('Đã xóa ảnh');
            } catch (err) {
                showToast('Lỗi khi xóa ảnh', 'error');
            }
        });
    });
}

// === Media Picker Modal ===
let currentMediaCallback = null;

function openMediaPicker(callback) {
    currentMediaCallback = callback;
    const modal = document.getElementById('media-modal');
    if (modal) {
        modal.classList.add('active');
        // Reset tabs
        document.getElementById('tab-library-btn').click();
        loadMediaLibraryTab();
    }
}

async function loadMediaLibraryTab(page = 1) {
    const grid = document.getElementById('media-grid');
    grid.innerHTML = '<div style="text-align:center; padding:2rem; grid-column: 1/-1;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
    
    const { data } = await loadMediaLibrary(page);
    renderMediaGrid(data, grid, (url) => {
        if (currentMediaCallback) currentMediaCallback(url);
        closeModal('media-modal');
    });
}

function initMediaUploadZone(dropZoneEl, fileInputEl, previewEl, progressBarEl) {
    if (!dropZoneEl || !fileInputEl) return;

    const handleFiles = async (files) => {
        if (!files.length) return;
        const file = files[0];
        
        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewEl.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:200px; border-radius:8px;">`;
        };
        reader.readAsDataURL(file);

        // Upload
        try {
            progressBarEl.style.width = '50%';
            const result = await uploadMedia(file);
            progressBarEl.style.width = '100%';
            
            showToast('Upload thành công!');
            setTimeout(() => {
                if (currentMediaCallback) currentMediaCallback(result.url);
                closeModal('media-modal');
                progressBarEl.style.width = '0%';
                previewEl.innerHTML = '';
            }, 500);
            
        } catch (err) {
            showToast(err.message || 'Lỗi upload ảnh', 'error');
            progressBarEl.style.width = '0%';
        }
    };

    dropZoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZoneEl.classList.add('dragover');
    });

    dropZoneEl.addEventListener('dragleave', () => {
        dropZoneEl.classList.remove('dragover');
    });

    dropZoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZoneEl.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    dropZoneEl.addEventListener('click', () => {
        fileInputEl.click();
    });

    fileInputEl.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}
