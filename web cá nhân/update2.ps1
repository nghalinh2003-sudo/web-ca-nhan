$content = Get-Content -Raw "index.html" -Encoding UTF8

# 1. Services section:
$content = $content -replace '(?s)<!-- Dịch vụ 3: Tư vấn Content Strategy -->.*?</div>\s*</div><!-- /\.services-grid -->', '</div><!-- /.services-grid -->'
$content = $content -replace '<div class="service-card" data-animate>', '<div class="service-card" data-animate onclick="window.location.href=''#contact''" style="cursor: pointer;">'

# 2. Portfolio section:
$content = $content -replace '<button class="filter-btn" data-filter="strategy">Chiến lược</button>\s*', ''

# Replace Project 3 with Xây kênh TikTok
$content = $content.Replace(
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-3" style="color: inherit; text-decoration: none;">YouTube Channel — Thương hiệu Giáo dục</a></h3>',
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-3" style="color: inherit; text-decoration: none;">Xây kênh TikTok</a></h3>'
)
$content = $content.Replace(
    'Sản xuất 20+ video dài cho kênh YouTube, đạt <strong>500K+ views</strong> và tăng 150% subscriber.',
    'Xây dựng và phát triển kênh TikTok từ con số 0, sáng tạo nội dung viral và thu hút đúng tệp khách hàng mục tiêu.'
)
$content = $content.Replace('<h3 id="modal-title-3">YouTube Channel — Thương hiệu Giáo dục</h3>', '<h3 id="modal-title-3">Xây kênh TikTok</h3>')
$content = $content.Replace(
    'Thương hiệu giáo dục trực tuyến muốn xây dựng kênh YouTube để thu hút học viên mới, nhưng không biết bắt đầu từ đâu và thiếu đội ngũ sản xuất video chuyên nghiệp.',
    'Khách hàng muốn xây dựng kênh TikTok để quảng bá sản phẩm nhưng chưa có định hướng nội dung và kịch bản thu hút.'
)
$content = $content.Replace(
    'Nghiên cứu keyword YouTube, xây dựng content map theo phễu (Awareness → Interest → Decision), sản xuất 20+ video chất lượng cao với script tối ưu retention.',
    'Nghiên cứu thị hiếu người dùng TikTok, xây dựng concept kênh độc đáo, viết kịch bản trend và trực tiếp quay dựng video ngắn chuẩn xu hướng.'
)
$content = $content.Replace(
    '<li><strong>500K+</strong> tổng lượt xem</li>
                                <li><strong>+150%</strong> subscriber tăng trưởng</li>
                                <li><strong>8 phút</strong> avg. watch time (ngành trung bình: 4 phút)</li>
                                <li><strong>+80%</strong> leads từ YouTube</li>',
    '<li><strong>1M+</strong> tổng lượt xem sau 1 tháng</li>
                                <li><strong>+50,000</strong> follower tự nhiên</li>
                                <li><strong>Nhiều video</strong> lọt xu hướng (trending)</li>
                                <li><strong>Tăng trưởng</strong> doanh thu rõ rệt</li>'
)

# Replace Project 4 with Quản lý fanpage Facebook
$content = $content.Replace(
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-4" style="color: inherit; text-decoration: none;">Content Strategy — Startup Công nghệ</a></h3>',
    '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-4" style="color: inherit; text-decoration: none;">Quản lý fanpage Facebook</a></h3>'
)
$content = $content.Replace(
    'Xây dựng chiến lược nội dung đa nền tảng, giúp startup tăng <strong>400% brand awareness</strong> trong 3 tháng.',
    'Chăm sóc fanpage toàn diện, thiết kế hình ảnh, viết nội dung chuẩn SEO và tăng tương tác tự nhiên.'
)
$content = $content.Replace('<div class="portfolio-card" data-category="strategy" data-animate>', '<div class="portfolio-card" data-category="social" data-animate>')
$content = $content.Replace(
    '<span class="portfolio-category">Chiến lược</span>
                        <h3 id="modal-title-4">Content Strategy — Startup Công nghệ</h3>',
    '<span class="portfolio-category">Social Media</span>
                        <h3 id="modal-title-4">Quản lý fanpage Facebook</h3>'
)
$content = $content.Replace(
    'Startup SaaS B2B cần xây dựng nhận diện thương hiệu từ con số 0, chưa có content framework và thiếu nguồn lực triển khai nội dung đa nền tảng.',
    'Doanh nghiệp không có nhiều thời gian chăm sóc fanpage, hình ảnh chưa đồng nhất và lượt tiếp cận tự nhiên rất thấp.'
)
$content = $content.Replace(
    'Xây dựng content strategy framework toàn diện: brand voice, content pillars, editorial calendar, và quy trình sản xuất nội dung. Triển khai đồng bộ trên LinkedIn, Facebook, Blog, YouTube.',
    'Xây dựng kế hoạch nội dung hàng tháng, thiết kế hình ảnh chuyên nghiệp, viết bài tương tác và quản lý cộng đồng thường xuyên.'
)
$content = $content.Replace(
    '<li><strong>+400%</strong> brand awareness (khảo sát)</li>
                                <li><strong>+250%</strong> organic traffic</li>
                                <li><strong>15 bài</strong> được featured trên các trang tin uy tín</li>
                                <li><strong>Content system</strong> tự vận hành sau 3 tháng</li>',
    '<li><strong>+200%</strong> lượng người tiếp cận tự nhiên</li>
                                <li><strong>Hình ảnh</strong> thương hiệu đồng bộ, chuyên nghiệp</li>
                                <li><strong>Tăng trưởng</strong> tỷ lệ tương tác (engagement rate)</li>
                                <li><strong>Tiết kiệm</strong> thời gian và chi phí cho doanh nghiệp</li>'
)
$content = $content.Replace('<span class="portfolio-category">Chiến lược</span>', '<span class="portfolio-category">Social Media</span>')

Set-Content -Path "index.html" -Value $content -Encoding UTF8
