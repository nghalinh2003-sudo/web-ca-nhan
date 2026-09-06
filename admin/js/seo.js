// admin/js/seo.js

// === SEO Analyzer ===
function calculateSEOScore(data) {
    const { title, metaTitle, metaDescription, slug, featuredImage, ogImage, content, keywords } = data;
    
    let score = 0;
    const items = [];
    const htmlContent = content || '';
    const textContent = htmlContent.replace(/<[^>]*>?/gm, ' ').trim();
    const wordCount = countWords(textContent);

    // Meta Title (15đ)
    if (!metaTitle) {
        items.push({ label: 'Tiêu đề SEO', status: 'error', message: 'Thiếu Meta Title', points: 0 });
    } else if (metaTitle.length < 30 || metaTitle.length > 60) {
        items.push({ label: 'Tiêu đề SEO', status: 'warning', message: `Độ dài không tối ưu (${metaTitle.length} ký tự). Nên từ 30-60.`, points: 7 });
        score += 7;
    } else {
        items.push({ label: 'Tiêu đề SEO', status: 'success', message: 'Độ dài tối ưu.', points: 15 });
        score += 15;
    }

    // Meta Description (15đ)
    if (!metaDescription) {
        items.push({ label: 'Mô tả SEO', status: 'error', message: 'Thiếu Meta Description', points: 0 });
    } else if (metaDescription.length < 120 || metaDescription.length > 160) {
        items.push({ label: 'Mô tả SEO', status: 'warning', message: `Độ dài không tối ưu (${metaDescription.length} ký tự). Nên từ 120-160.`, points: 7 });
        score += 7;
    } else {
        items.push({ label: 'Mô tả SEO', status: 'success', message: 'Độ dài tối ưu.', points: 15 });
        score += 15;
    }

    // Slug (10đ)
    if (!slug) {
        items.push({ label: 'Đường dẫn (Slug)', status: 'error', message: 'Thiếu Slug', points: 0 });
    } else if (/[^a-z0-9-]/.test(slug)) {
        items.push({ label: 'Đường dẫn (Slug)', status: 'warning', message: 'Slug chứa ký tự không hợp lệ.', points: 5 });
        score += 5;
    } else {
        items.push({ label: 'Đường dẫn (Slug)', status: 'success', message: 'Slug hợp lệ.', points: 10 });
        score += 10;
    }

    // Ảnh đại diện (10đ)
    if (!featuredImage) {
        items.push({ label: 'Ảnh đại diện', status: 'error', message: 'Thiếu ảnh đại diện bài viết', points: 0 });
    } else {
        items.push({ label: 'Ảnh đại diện', status: 'success', message: 'Đã có ảnh đại diện.', points: 10 });
        score += 10;
    }

    // OG Image (10đ)
    if (!ogImage && !featuredImage) {
        items.push({ label: 'Ảnh chia sẻ (OG)', status: 'error', message: 'Thiếu ảnh chia sẻ mxh', points: 0 });
    } else {
        items.push({ label: 'Ảnh chia sẻ (OG)', status: 'success', message: 'Đã có ảnh chia sẻ.', points: 10 });
        score += 10;
    }

    // Nội dung (15đ)
    if (wordCount < 100) {
        items.push({ label: 'Độ dài nội dung', status: 'error', message: `Quá ngắn (${wordCount} từ). Nên >= 300 từ.`, points: 0 });
    } else if (wordCount < 300) {
        items.push({ label: 'Độ dài nội dung', status: 'warning', message: `Nội dung hơi ngắn (${wordCount} từ).`, points: 7 });
        score += 7;
    } else {
        items.push({ label: 'Độ dài nội dung', status: 'success', message: `Độ dài tốt (${wordCount} từ).`, points: 15 });
        score += 15;
    }

    // Heading trong bài (10đ)
    if (!/<h[2-3]/.test(htmlContent)) {
        items.push({ label: 'Cấu trúc Heading', status: 'error', message: 'Nội dung thiếu thẻ H2/H3.', points: 0 });
    } else {
        items.push({ label: 'Cấu trúc Heading', status: 'success', message: 'Có sử dụng thẻ heading.', points: 10 });
        score += 10;
    }

    // Alt text ảnh (10đ)
    const imgTags = htmlContent.match(/<img[^>]*>/g) || [];
    let hasMissingAlt = false;
    imgTags.forEach(img => {
        if (!/alt=["'][^"']+["']/.test(img)) {
            hasMissingAlt = true;
        }
    });
    
    if (imgTags.length === 0) {
        items.push({ label: 'Alt ảnh trong bài', status: 'warning', message: 'Bài viết chưa có ảnh minh họa.', points: 5 });
        score += 5;
    } else if (hasMissingAlt) {
        items.push({ label: 'Alt ảnh trong bài', status: 'error', message: 'Một số ảnh thiếu thuộc tính alt.', points: 0 });
    } else {
        items.push({ label: 'Alt ảnh trong bài', status: 'success', message: 'Tất cả ảnh đều có alt.', points: 10 });
        score += 10;
    }

    // Keywords (5đ)
    if (!keywords) {
        items.push({ label: 'Từ khóa SEO', status: 'warning', message: 'Chưa nhập từ khóa SEO', points: 0 });
    } else {
        items.push({ label: 'Từ khóa SEO', status: 'success', message: 'Đã thiết lập từ khóa.', points: 5 });
        score += 5;
    }

    return { score, items };
}

function renderSEOPanel(result) {
    const panel = document.getElementById('seo-panel');
    if (!panel) return;

    let badgeClass = 'seo-red';
    if (result.score >= 80) badgeClass = 'seo-green';
    else if (result.score >= 50) badgeClass = 'seo-yellow';

    let html = `
        <div class="seo-score-container">
            <h3>Điểm SEO: <span class="seo-badge ${badgeClass}">${result.score}/100</span></h3>
        </div>
        <div class="seo-items-list">
    `;

    result.items.forEach(item => {
        let icon = '';
        let color = '';
        if (item.status === 'success') { icon = 'fa-check-circle'; color = 'var(--success)'; }
        else if (item.status === 'warning') { icon = 'fa-exclamation-triangle'; color = 'var(--warning)'; }
        else { icon = 'fa-times-circle'; color = 'var(--danger)'; }

        html += `
            <div class="seo-item" style="margin-bottom: 8px; font-size: 0.9rem;">
                <i class="fas ${icon}" style="color:${color}; width: 20px;"></i>
                <strong>${item.label}:</strong> <span style="color:var(--text-muted)">${item.message}</span>
            </div>
        `;
    });

    html += `</div>`;
    panel.innerHTML = html;
}

function renderOGPreview(data) {
    const previewContainer = document.getElementById('og-preview');
    if (!previewContainer) return;

    const title = data.metaTitle || data.title || 'Tiêu đề bài viết';
    const desc = data.metaDescription || 'Mô tả bài viết sẽ hiển thị ở đây...';
    const domain = window.location.hostname || 'hnilahhub.com';
    const url = `https://${domain}/post/${data.slug || 'slug'}`;
    const image = data.ogImage || data.featuredImage || 'https://via.placeholder.com/600x315?text=No+Image';

    previewContainer.innerHTML = `
        <div class="og-preview-tabs" style="margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <h4>Google Search Preview</h4>
            <div style="background:#fff; padding:15px; border-radius:8px; margin-bottom:15px; font-family: arial,sans-serif;">
                <div style="font-size:14px; color:#202124;">${url}</div>
                <div style="color:#1a0dab; font-size:20px; text-decoration:none; margin: 4px 0;">${title}</div>
                <div style="color:#4d5156; font-size:14px; line-height:1.58;">${desc}</div>
            </div>

            <h4>Facebook Share Preview</h4>
            <div style="background:#fff; border:1px solid #dadde1; border-radius:0; overflow:hidden; font-family: Helvetica, Arial, sans-serif;">
                <div style="width:100%; height:200px; background-image:url('${image}'); background-size:cover; background-position:center;"></div>
                <div style="padding:10px 12px; background:#f2f3f5; border-top:1px solid #dadde1;">
                    <div style="font-size:12px; color:#606770; text-transform:uppercase;">${domain.toUpperCase()}</div>
                    <div style="font-size:16px; font-weight:600; color:#1d2129; margin:5px 0 3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                    <div style="font-size:14px; color:#606770; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${desc}</div>
                </div>
            </div>
        </div>
    `;
}

function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
}

function calculateReadingTime(wordCount) {
    return Math.max(1, Math.ceil(wordCount / 200));
}
