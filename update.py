import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Change fonts
html = html.replace('family=Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600', 'family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600')

# 2. Change logo
html = html.replace('Creative<span>Hub</span>', ' Hnilah<span>Hub</span>')
html = html.replace('CreativeHub', 'HnilahHub')

# 3. Remove other social links from header, contact, footer
social_patterns = [
    r'<a href="[^"]*" target="_blank" aria-label="YouTube"[^>]*><i class="fab fa-youtube"></i></a>\n\s*',
    r'<a href="[^"]*" target="_blank" aria-label="Instagram"[^>]*><i class="fab fa-instagram"></i></a>\n\s*',
    r'<a href="[^"]*" target="_blank" aria-label="LinkedIn"[^>]*><i class="fab fa-linkedin-in"></i></a>\n\s*'
]
for pattern in social_patterns:
    html = re.sub(pattern, '', html)

# 4. Add links to titles in Portfolio
def repl(match):
    prefix = match.group(1)
    title = match.group(2)
    suffix = match.group(3)
    modal_id = match.group(4)
    return f'{prefix}<h3 class="portfolio-title"><a href="javascript:void(0)" data-modal="{modal_id}" style="color: inherit; text-decoration: none;">{title}</a></h3>{suffix}'

html = re.sub(
    r'(<div class="portfolio-card" data-category="[^"]*" data-animate>[\s\S]*?<div class="portfolio-info">[\s\S]*?)<h3 class="portfolio-title">(.*?)</h3>([\s\S]*?<button class="portfolio-link" data-modal="(modal-project-\d+)">)',
    repl,
    html
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Change Poppins to Be Vietnam Pro in CSS
css = css.replace("font-family: 'Poppins', sans-serif;", "font-family: 'Be Vietnam Pro', sans-serif;")
css = css.replace("--font-heading: 'Poppins', sans-serif;", "--font-heading: 'Be Vietnam Pro', sans-serif;")
css = css.replace("family=Poppins", "family=Be+Vietnam+Pro")

with open('css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Update successful!")
