$content = Get-Content -Raw "index.html" -Encoding UTF8

$content = $content -replace 'family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600', 'family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600'
$content = $content -replace 'Creative<span>Hub</span>', ' Hnilah<span>Hub</span>'
$content = $content -replace 'CreativeHub', 'HnilahHub'

$content = $content -replace '(?m)^\s*<a href="[^"]*" target="_blank" aria-label="YouTube"[^>]*><i class="fab fa-youtube"></i></a>\r?\n', ''
$content = $content -replace '(?m)^\s*<a href="[^"]*" target="_blank" aria-label="Instagram"[^>]*><i class="fab fa-instagram"></i></a>\r?\n', ''
$content = $content -replace '(?m)^\s*<a href="[^"]*" target="_blank" aria-label="LinkedIn"[^>]*><i class="fab fa-linkedin-in"></i></a>\r?\n', ''

$content = $content -replace '<h3 class="portfolio-title">Chiến dịch TikTok — Thương hiệu Thời trang</h3>', '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-1" style="color: inherit; text-decoration: none;">Chiến dịch TikTok — Thương hiệu Thời trang</a></h3>'
$content = $content -replace '<h3 class="portfolio-title">Quản lý Fanpage — Chuỗi F&B</h3>', '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-2" style="color: inherit; text-decoration: none;">Quản lý Fanpage — Chuỗi F&B</a></h3>'
$content = $content -replace '<h3 class="portfolio-title">YouTube Channel — Thương hiệu Giáo dục</h3>', '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-3" style="color: inherit; text-decoration: none;">YouTube Channel — Thương hiệu Giáo dục</a></h3>'
$content = $content -replace '<h3 class="portfolio-title">Content Strategy — Startup Công nghệ</h3>', '<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="modal-project-4" style="color: inherit; text-decoration: none;">Content Strategy — Startup Công nghệ</a></h3>'

Set-Content -Path "index.html" -Value $content -Encoding UTF8

$css = Get-Content -Raw "css/style.css" -Encoding UTF8
$css = $css -replace "'Poppins'", "'Be Vietnam Pro'"
$css = $css -replace "family=Poppins", "family=Be+Vietnam+Pro"
Set-Content -Path "css/style.css" -Value $css -Encoding UTF8

Write-Host "Done"
