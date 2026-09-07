// Hằng số
const POSTS_PER_PAGE = 9;
let currentPage = 1;
let currentCategory = null;
let currentSearch = null;

// === Hàm tiện ích ===
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function calculateReadingTime(html) {
    if (!html) return 1;
    const text = html.replace(/<[^>]*>?/gm, '');
    const wordCount = text.trim().split(/\s+/).length;
    const time = Math.ceil(wordCount / 200); // Giả sử tốc độ đọc 200 từ/phút
    return time < 1 ? 1 : time;
}

function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// === Trang blog.html — Danh sách bài viết ===
async function loadBlogPosts(page = 1, categorySlug = null, searchQuery = null) {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    
    const loading = document.getElementById('blogLoading');
    if (loading) loading.style.display = 'block';
    grid.innerHTML = '';
    
    currentPage = page;
    currentCategory = categorySlug;
    currentSearch = searchQuery;
    
    let query = supabaseClient.from('posts').select('*, categories!inner(name, slug)', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false });

    if (categorySlug && categorySlug !== 'all') {
        query = query.eq('categories.slug', categorySlug);
    }
    
    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE - 1;
    query = query.range(start, end);

    try {
        const { data, count, error } = await query;
        if (error) throw error;
        
        if (loading) loading.style.display = 'none';
        
        if (data && data.length > 0) {
            grid.innerHTML = data.map(renderPostCard).join('');
            renderPagination(page, Math.ceil(count / POSTS_PER_PAGE));
        } else {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Không tìm thấy bài viết nào.</p>';
            renderPagination(1, 1);
        }
    } catch (err) {
        console.error('Lỗi tải bài viết:', err);
        if (loading) loading.style.display = 'none';
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:red;">Đã có lỗi xảy ra khi tải bài viết.</p>';
    }
}

function renderPostCard(post) {
    const imageUrl = post.featured_image || 'images/default-blog.jpg';
    const categoryName = post.categories ? post.categories.name : 'Chưa phân loại';
    const readTime = calculateReadingTime(post.content);
    
    return `
        <article class="blog-card" data-animate>
            <a href="post.html?slug=${escapeHtml(post.slug)}" class="blog-card-img">
                <span class="blog-card-category">${escapeHtml(categoryName)}</span>
                <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy">
            </a>
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(post.published_at || post.created_at)}</span>
                    <span><i class="far fa-clock"></i> ${readTime} phút đọc</span>
                </div>
                <h3 class="blog-card-title">
                    <a href="post.html?slug=${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a>
                </h3>
                <p class="blog-card-excerpt">${escapeHtml(post.excerpt || '')}</p>
                <a href="post.html?slug=${escapeHtml(post.slug)}" class="blog-card-readmore">Đọc tiếp <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;
}

function renderPagination(currentPage, totalPages) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    // Nút Prev
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="loadBlogPosts(${currentPage - 1}, currentCategory, currentSearch)"><i class="fas fa-chevron-left"></i></button>`;
    
    // Số trang
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadBlogPosts(${i}, currentCategory, currentSearch)">${i}</button>`;
    }
    
    // Nút Next
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="loadBlogPosts(${currentPage + 1}, currentCategory, currentSearch)"><i class="fas fa-chevron-right"></i></button>`;
    
    container.innerHTML = html;
}

async function loadCategories() {
    const filterContainer = document.getElementById('categoryFilters');
    if (!filterContainer) return;

    try {
        const { data, error } = await supabaseClient.from('categories').select('*').order('display_order');
        if (error) throw error;
        
        let html = '<button class="filter-btn active" data-filter="all">Tất cả</button>';
        if (data) {
            data.forEach(cat => {
                html += `<button class="filter-btn" data-filter="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</button>`;
            });
        }
        filterContainer.innerHTML = html;
        
        // Sự kiện click filter
        filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const catSlug = btn.getAttribute('data-filter');
                loadBlogPosts(1, catSlug === 'all' ? null : catSlug, currentSearch);
            });
        });
    } catch (err) {
        console.error('Lỗi tải danh mục:', err);
    }
}

// === Trang post.html — Chi tiết bài viết ===
async function loadPost(slug) {
    if (!slug) {
        window.location.href = 'blog.html';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*, categories(*)')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !data) throw error || new Error('Not found');

        renderPostDetail(data);
        setMetaTags(data);
        incrementViewCount(data.id);
        loadPostTags(data.id);
        if (data.category_id) {
            loadRelatedPosts(data.category_id, data.id);
        } else {
            document.getElementById('relatedPostsSection').style.display = 'none';
        }
    } catch (err) {
        console.error('Lỗi tải bài viết:', err);
        document.querySelector('.article-page .container').innerHTML = '<div class="text-center"><h2>Không tìm thấy bài viết.</h2><a href="blog.html" class="btn btn-primary mt-4">Quay lại Blog</a></div>';
    }
}

function renderPostDetail(post) {
    const categoryName = post.categories ? post.categories.name : 'Chưa phân loại';
    const categorySlug = post.categories ? post.categories.slug : 'all';
    
    // Breadcrumb
    document.getElementById('bcCategory').textContent = categoryName;
    document.getElementById('bcCategory').href = `blog.html?category=${categorySlug}`;
    document.getElementById('bcTitle').textContent = post.title;
    
    // Article Header
    document.getElementById('postCategory').textContent = categoryName;
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postDate').textContent = formatDate(post.published_at || post.created_at);
    document.getElementById('postReadTime').textContent = calculateReadingTime(post.content);
    
    // Feature image
    const imgUrl = post.featured_image || 'images/default-blog.jpg';
    document.getElementById('postImage').src = imgUrl;
    document.getElementById('postImage').alt = post.title;
    
    // Content
    document.getElementById('postContent').innerHTML = post.content || ''; // Render HTML raw
}

async function incrementViewCount(postId) {
    // Sử dụng rpc hoặc query để update (đơn giản hoá: lấy view_count hiện tại rồi +1, thực tế nên dùng rpc)
    try {
        const { data } = await supabaseClient.from('posts').select('view_count').eq('id', postId).single();
        if (data) {
            const newCount = (data.view_count || 0) + 1;
            await supabaseClient.from('posts').update({ view_count: newCount }).eq('id', postId);
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadRelatedPosts(categoryId, currentPostId) {
    const grid = document.getElementById('relatedPostsGrid');
    if (!grid) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('posts')
            .select('*, categories(name, slug)')
            .eq('category_id', categoryId)
            .eq('status', 'published')
            .neq('id', currentPostId)
            .order('published_at', { ascending: false })
            .limit(3);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            grid.innerHTML = data.map(renderPostCard).join('');
        } else {
            document.getElementById('relatedPostsSection').style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('relatedPostsSection').style.display = 'none';
    }
}

async function loadPostTags(postId) {
    const container = document.getElementById('postTags');
    if (!container) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('post_tags')
            .select('tags(name, slug)')
            .eq('post_id', postId);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(pt => `<a href="blog.html?search=${escapeHtml(pt.tags.name)}" class="tag-chip">#${escapeHtml(pt.tags.name)}</a>`).join('');
        } else {
            container.parentElement.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
    }
}

function setMetaTags(post) {
    document.title = `${post.meta_title || post.title} - HnilahHub`;
    
    const desc = post.meta_description || post.excerpt || '';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = desc;
    
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = post.title;
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = desc;
    
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = post.og_image || post.featured_image || 'images/default-blog.jpg';

    // Inject JSON-LD Schema.org Article
    injectJsonLD(post, desc);
}

function injectJsonLD(post, desc) {
    const schema = document.getElementById('json-ld-schema');
    if (!schema) return;

    const publishedDate = post.published_at || post.created_at || new Date().toISOString();
    const modifiedDate = post.updated_at || publishedDate;
    const imageUrl = post.og_image || post.featured_image || '';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'description': desc,
        'datePublished': publishedDate,
        'dateModified': modifiedDate,
        'author': {
            '@type': 'Person',
            'name': 'Nguyễn Hà Linh',
            'url': window.location.origin
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'HnilahHub',
            'logo': {
                '@type': 'ImageObject',
                'url': window.location.origin + '/images/avatar.jpg'
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': window.location.href
        }
    };

    if (imageUrl) {
        jsonLd.image = {
            '@type': 'ImageObject',
            'url': imageUrl
        };
    }

    schema.textContent = JSON.stringify(jsonLd);
}

function sharePost(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
    } else if (platform === 'copy') {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Đã copy link bài viết!');
        });
    }
}

// === Khởi tạo ===
document.addEventListener('DOMContentLoaded', () => {
    // Setup search box
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBlogPosts(1, currentCategory, searchInput.value.trim());
            }
        });
    }

    if (document.getElementById('blogGrid')) {
        // Trang blog.html
        loadCategories();
        
        const catParam = getQueryParam('category');
        const searchParam = getQueryParam('search');
        
        if (searchParam && searchInput) {
            searchInput.value = searchParam;
        }
        
        loadBlogPosts(1, catParam, searchParam);
    }
    
    if (document.getElementById('postContent')) {
        // Trang post.html
        const slug = getQueryParam('slug');
        loadPost(slug);
    }
});
