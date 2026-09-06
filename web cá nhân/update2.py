import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Services section:
# Remove 'Tư vấn Content Strategy'
# Let's find the service-card for 'Tư vấn Content Strategy' and remove it.
service_pattern = r'<!-- Dịch vụ 3: Tư vấn Content Strategy -->[\s\S]*?</div>\s*</div><!-- /\.services-grid -->'
html = re.sub(service_pattern, '</div><!-- /.services-grid -->', html)

# Make service cards jump to #contact
html = html.replace('<div class="service-card" data-animate>', '<div class="service-card" data-animate onclick="window.location.href=\'#contact\'" style="cursor: pointer;">')

# 2. Portfolio section:
# Remove 'Chiến lược' tab
html = re.sub(r'<button class="filter-btn" data-filter="strategy">Chiến lược</button>\s*', '', html)

# Replace Project 3 with Xây kênh TikTok
html = html.replace(
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-3" style="color: inherit; text-decoration: none;">YouTube Channel — Thương hiệu Giáo dục</a></h3>',
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-3" style="color: inherit; text-decoration: none;">Xây kênh TikTok</a></h3>'
)
html = html.replace(
    'Sản xuất 20+ video dài cho kênh YouTube, đạt <strong>500K+ views</strong> và tăng 150% subscriber.',
    'Xây dựng và phát triển kênh TikTok từ con số 0, sáng tạo nội dung viral và thu hút đúng tệp khách hàng mục tiêu.'
)
html = html.replace('<h3 id="modal-title-3">YouTube Channel — Thương hiệu Giáo dục</h3>', '<h3 id="modal-title-3">Xây kênh TikTok</h3>')
html = html.replace(
    'Thương hiệu giáo dục trực tuyến muốn xây dựng kênh YouTube để thu hút học viên mới, nhưng không biết bắt đầu từ đâu và thiếu đội ngũ sản xuất video chuyên nghiệp.',
    'Khách hàng muốn xây dựng kênh TikTok để quảng bá sản phẩm nhưng chưa có định hướng nội dung và kịch bản thu hút.'
)
html = html.replace(
    'Nghiên cứu keyword YouTube, xây dựng content map theo phễu (Awareness → Interest → Decision), sản xuất 20+ video chất lượng cao với script tối ưu retention.',
    'Nghiên cứu thị hiếu người dùng TikTok, xây dựng concept kênh độc đáo, viết kịch bản trend và trực tiếp quay dựng video ngắn chuẩn xu hướng.'
)
html = html.replace(
    '<li><strong>500K+</strong> tổng lượt xem</li>\n                                <li><strong>+150%</strong> subscriber tăng trưởng</li>\n                                <li><strong>8 phút</strong> avg. watch time (ngành trung bình: 4 phút)</li>\n                                <li><strong>+80%</strong> leads từ YouTube</li>',
    '<li><strong>1M+</strong> tổng lượt xem sau 1 tháng</li>\n                                <li><strong>+50,000</strong> follower tự nhiên</li>\n                                <li><strong>Nhiều video</strong> lọt xu hướng (trending)</li>\n                                <li><strong>Tăng trưởng</strong> doanh thu rõ rệt</li>'
)

# Replace Project 4 with Quản lý fanpage Facebook
html = html.replace(
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-4" style="color: inherit; text-decoration: none;">Content Strategy — Startup Công nghệ</a></h3>',
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-4" style="color: inherit; text-decoration: none;">Quản lý fanpage Facebook</a></h3>'
)
html = html.replace(
    'Xây dựng chiến lược nội dung đa nền tảng, giúp startup tăng <strong>400% brand awareness</strong> trong 3 tháng.',
    'Chăm sóc fanpage toàn diện, thiết kế hình ảnh, viết nội dung chuẩn SEO và tăng tương tác tự nhiên.'
)
html = html.replace('<div class="portfolio-card" data-category="strategy" data-animate>', '<div class="portfolio-card" data-category="social" data-animate>')
html = html.replace(
    '<span class="portfolio-category">Chiến lược</span>\n                        <h3 id="modal-title-4">Content Strategy — Startup Công nghệ</h3>',
    '<span class="portfolio-category">Social Media</span>\n                        <h3 id="modal-title-4">Quản lý fanpage Facebook</h3>'
)
html = html.replace(
    'Startup SaaS B2B cần xây dựng nhận diện thương hiệu từ con số 0, chưa có content framework và thiếu nguồn lực triển khai nội dung đa nền tảng.',
    'Doanh nghiệp không có nhiều thời gian chăm sóc fanpage, hình ảnh chưa đồng nhất và lượt tiếp cận tự nhiên rất thấp.'
)
html = html.replace(
    'Xây dựng content strategy framework toàn diện: brand voice, content pillars, editorial calendar, và quy trình sản xuất nội dung. Triển khai đồng bộ trên LinkedIn, Facebook, Blog, YouTube.',
    'Xây dựng kế hoạch nội dung hàng tháng, thiết kế hình ảnh chuyên nghiệp, viết bài tương tác và quản lý cộng đồng thường xuyên.'
)
html = html.replace(
    '<li><strong>+400%</strong> brand awareness (khảo sát)</li>\n                                <li><strong>+250%</strong> organic traffic</li>\n                                <li><strong>15 bài</strong> được featured trên các trang tin uy tín</li>\n                                <li><strong>Content system</strong> tự vận hành sau 3 tháng</li>',
    '<li><strong>+200%</strong> lượng người tiếp cận tự nhiên</li>\n                                <li><strong>Hình ảnh</strong> thương hiệu đồng bộ, chuyên nghiệp</li>\n                                <li><strong>Tăng trưởng</strong> tỷ lệ tương tác (engagement rate)</li>\n                                <li><strong>Tiết kiệm</strong> thời gian và chi phí cho doanh nghiệp</li>'
)
html = html.replace('<span class="portfolio-category">Chiến lược</span>', '<span class="portfolio-category">Social Media</span>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
