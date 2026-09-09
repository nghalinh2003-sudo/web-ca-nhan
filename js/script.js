document.addEventListener('DOMContentLoaded', () => {
    // === TIỆN ÍCH (UTILITIES) ===
    
    // Hàm debounce để tối ưu hóa sự kiện scroll
    const debounce = (func, wait = 10, immediate = true) => {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    // === 1. STICKY NAVBAR & 9. BACK TO TOP BUTTON ===
    const navbar = document.getElementById('navbar');
    const backToTopBtn = document.getElementById('backToTop');
    
    const handleScroll = debounce(() => {
        const scrollY = window.scrollY;
        
        // Sticky Navbar
        if (navbar) {
            if (scrollY > 50) {
                navbar.classList.add('navbar--scrolled');
            } else {
                navbar.classList.remove('navbar--scrolled');
            }
        }
        
        // Back To Top Button
        if (backToTopBtn) {
            if (scrollY > 500) {
                backToTopBtn.classList.add('back-to-top--visible');
            } else {
                backToTopBtn.classList.remove('back-to-top--visible');
            }
        }
    });

    window.addEventListener('scroll', handleScroll);

    // Xử lý click Back to Top
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // === 2. MOBILE MENU TOGGLE ===
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const navItems = document.querySelectorAll('#navLinks a, .nav-link'); 

    const toggleMenu = () => {
        const isOpen = menuToggle.classList.toggle('menu-toggle--active');
        navLinks.classList.toggle('nav-links--open');
        mobileOverlay.classList.toggle('overlay--visible');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
        if (menuToggle && menuToggle.classList.contains('menu-toggle--active')) {
            menuToggle.classList.remove('menu-toggle--active');
            navLinks.classList.remove('nav-links--open');
            mobileOverlay.classList.remove('overlay--visible');
            document.body.style.overflow = '';
        }
    };

    if (menuToggle && navLinks && mobileOverlay) {
        menuToggle.addEventListener('click', toggleMenu);
        mobileOverlay.addEventListener('click', closeMenu);
        
        navItems.forEach(item => {
            item.addEventListener('click', closeMenu);
        });
    }

    // === 3. SMOOTH SCROLL ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Lấy chiều cao của navbar để offset
                const navbarHeight = navbar ? navbar.offsetHeight : 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - navbarHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // === 4. TYPING EFFECT (Hero Section) ===
    const typingTextElement = document.getElementById('typingText');
    if (typingTextElement) {
        const roles = ['Content Creator', 'Video Producer', 'Social Media Strategist', 'Brand Storyteller'];
        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        const typeEffect = () => {
            const currentRole = roles[roleIndex];
            
            if (isDeleting) {
                typingTextElement.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingTextElement.textContent = currentRole.substring(0, charIndex + 1);
                charIndex++;
            }
            
            let typingSpeed = isDeleting ? 40 : 70;
            
            if (!isDeleting && charIndex === currentRole.length) {
                typingSpeed = 2000; // Dừng lại sau khi gõ xong
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typingSpeed = 500; // Tạm dừng trước khi gõ từ tiếp theo
            }
            
            setTimeout(typeEffect, typingSpeed);
        };
        
        // Khởi động hiệu ứng sau 0.5s
        setTimeout(typeEffect, 500);
    }

    // === 5. COUNTER ANIMATION ===
    const animateCounter = (element) => {
        const target = +element.getAttribute('data-target');
        const duration = 2000; // ms
        const startTime = performance.now();
        
        // Easing function: ease-out
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        
        const updateCounter = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            const currentValue = Math.floor(target * easeOut(progress));
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target; // Đảm bảo số cuối cùng chính xác
            }
        };
        
        requestAnimationFrame(updateCounter);
    };

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target); // Chỉ chạy 1 lần
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
        counterObserver.observe(counter);
    });

    // === 8. SCROLL ANIMATIONS (Intersection Observer) ===
    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target); // Chỉ animate 1 lần
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-animate]').forEach((el, index) => {
        // Thêm staggered delay cho các thẻ con trong danh sách hoặc lưới (grid)
        if (el.parentElement.classList.contains('grid-container') || 
            el.classList.contains('portfolio-card') || 
            el.classList.contains('service-card') || 
            el.classList.contains('stat-item')) {
            el.style.transitionDelay = `${(index % 4) * 0.1}s`;
        }
        animationObserver.observe(el);
    });

    // === 6. PORTFOLIO FILTER ===
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    const portfolioCards = document.querySelectorAll('.portfolio-card[data-category]');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Cập nhật trạng thái active cho nút bấm
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            portfolioCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                // Bắt đầu hiệu ứng fade out
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                card.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    if (filterValue === 'all' || filterValue === category) {
                        card.classList.remove('hidden');
                        card.style.display = ''; // Khôi phục hiển thị
                        
                        // Kích hoạt fade in
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }
                }, 300); // Đợi CSS transition kết thúc
            });
        });
    });

    // === 7. PORTFOLIO MODAL ===
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close');
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');

    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('modal--open');
            document.body.style.overflow = 'hidden'; // Ngăn cuộn trang
        }
    };

    const closeModal = () => {
        modals.forEach(modal => {
            modal.classList.remove('modal--open');
        });
        document.body.style.overflow = ''; // Cho phép cuộn trang trở lại
    };

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modalBackdrops.forEach(backdrop => {
        backdrop.addEventListener('click', closeModal);
    });

    // Cho phép đóng modal bằng phím Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // === KHỞI ĐỘNG: Tải dữ liệu khi trang load xong ===
    loadPortfolio();
    loadServices();

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
});

// ============================================================
// === SUPABASE: TẢI DỮ LIỆU ĐỘNG ===
// ============================================================

// --- PORTFOLIO ---
const CATEGORY_LABELS = {
    video: 'Video Content',
    social: 'Social Media',
    strategy: 'Chiến lược'
};

function renderPortfolioCard(item) {
    return `
        <div class="portfolio-card" data-category="${item.category}" data-animate>
            <div class="portfolio-thumbnail">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop'}" 
                     alt="${item.title}" loading="lazy">
                <div class="portfolio-overlay">
                    <button class="btn-view-detail" 
                            data-modal="modal-db-${item.id}"
                            aria-label="Xem chi tiết dự án">
                        <i class="fas fa-expand"></i> Xem chi tiết
                    </button>
                </div>
            </div>
            <div class="portfolio-info">
                <span class="portfolio-category">${CATEGORY_LABELS[item.category] || item.category}</span>
                <h3 class="portfolio-title">${item.title}</h3>
                <p class="portfolio-desc">${item.description || ''}</p>
                <button class="portfolio-link" data-modal="modal-db-${item.id}">
                    Xem chi tiết <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

function renderPortfolioModal(item) {
    let resultsHTML = '';
    if (item.results) {
        const results = Array.isArray(item.results) ? item.results : JSON.parse(item.results);
        resultsHTML = results.map(r => `<li>${r}</li>`).join('');
    }

    return `
        <div class="modal" id="modal-db-${item.id}" role="dialog" aria-modal="true">
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Đóng">&times;</button>
                <div class="modal-body">
                    <div class="modal-media">
                        <img src="${item.image_url || ''}" alt="${item.title}" loading="lazy">
                    </div>
                    <div class="modal-info">
                        <span class="portfolio-category">${CATEGORY_LABELS[item.category] || item.category}</span>
                        <h3>${item.title}</h3>
                        ${item.problem ? `
                        <div class="modal-section">
                            <h4><i class="fas fa-exclamation-circle"></i> Vấn đề</h4>
                            <p>${item.problem}</p>
                        </div>` : ''}
                        ${item.solution ? `
                        <div class="modal-section">
                            <h4><i class="fas fa-lightbulb"></i> Giải pháp</h4>
                            <p>${item.solution}</p>
                        </div>` : ''}
                        ${resultsHTML ? `
                        <div class="modal-section">
                            <h4><i class="fas fa-chart-bar"></i> Kết quả</h4>
                            <ul class="modal-results">${resultsHTML}</ul>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadPortfolio() {
    // Hỗ trợ cả trang chủ (home-portfolio-grid) lẫn trang portfolio đầy đủ
    const grid = document.querySelector('.portfolio-grid');
    const modalsContainer = document.getElementById('portfolio-modals-container');
    if (!grid) return;

    // Kiểm tra xem đây có phải trang chủ không (chỉ lấy 3 dự án đầu)
    const isHomePage = grid.id === 'home-portfolio-grid';
    const limit = isHomePage ? 3 : 100;

    try {
        let query = supabaseClient
            .from('portfolio_items')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        if (isHomePage) query = query.limit(limit);

        const { data, error } = await query;

        if (error) throw error;

        grid.innerHTML = data.map(renderPortfolioCard).join('');
        if (modalsContainer) {
            modalsContainer.innerHTML = data.map(renderPortfolioModal).join('');
        }

        initPortfolioFilter();
        initPortfolioModals();
        
        // Re-apply animation
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.portfolio-card').forEach(el => obs.observe(el));

    } catch (err) {
        console.error('Lỗi tải portfolio:', err);
        grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1">Không thể tải dự án.</p>';
    }
}

function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-filter');
            document.querySelectorAll('.portfolio-card[data-category]').forEach(card => {
                const category = card.getAttribute('data-category');
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                card.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    if (filterValue === 'all' || filterValue === category) {
                        card.classList.remove('hidden');
                        card.style.display = '';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.classList.add('hidden');
                        card.style.display = 'none';
                    }
                }, 300);
            });
        });
    });
}

function initPortfolioModals() {
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('modal--open');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('modal--open'));
            document.body.style.overflow = '';
        });
    });
}

// --- SERVICES ---
function renderServiceCard(service) {
    let featuresHTML = '';
    if (service.features) {
        const features = Array.isArray(service.features) ? service.features : JSON.parse(service.features);
        featuresHTML = features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('');
    }

    return `
        <div class="service-card" data-animate>
            <div class="service-icon">
                <i class="${service.icon || 'fas fa-star'}"></i>
            </div>
            <h3 class="service-title">${service.title}</h3>
            <p class="service-desc">${service.description || ''}</p>
            <ul class="service-checklist">
                ${featuresHTML}
            </ul>
            <a href="contact.html" class="service-cta">
                Liên hệ báo giá <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
}

async function loadServices() {
    const grid = document.querySelector('.services-grid');
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from('services')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        if (error) throw error;
        grid.innerHTML = data.map(renderServiceCard).join('');

        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.service-card').forEach(el => obs.observe(el));

    } catch (err) {
        console.error('Lỗi tải dịch vụ:', err);
        grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1">Không thể tải dịch vụ.</p>';
    }
}

// --- FORM LIÊN HỆ ---
async function handleContactFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = 'red';
        } else {
            field.style.borderColor = '';
        }
    });

    if (!isValid) {
        showFormMessage(form, 'Vui lòng điền đầy đủ các trường bắt buộc.', 'error');
        return;
    }

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    try {
        const { error } = await supabaseClient
            .from('contacts')
            .insert({
                name:    form.querySelector('[name="name"]').value.trim(),
                email:   form.querySelector('[name="email"]').value.trim(),
                service: form.querySelector('[name="service"]')?.value || null,
                message: form.querySelector('[name="message"]').value.trim()
            });

        if (error) throw error;
        showFormMessage(form, '🎉 Cảm ơn bạn! Tin nhắn đã được gửi. Mình sẽ phản hồi sớm nhất có thể.', 'success');
        form.reset();
    } catch (err) {
        console.error('Lỗi gửi form:', err);
        showFormMessage(form, 'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
    }
}

function showFormMessage(form, message, type) {
    const existing = form.querySelector('.form-message');
    if (existing) existing.remove();

    const msg = document.createElement('div');
    msg.className = 'form-message';
    msg.style.cssText = `
        margin-top: 1rem;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        font-size: 0.95rem;
        background: ${type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'};
        color: ${type === 'success' ? '#22c55e' : '#ef4444'};
        border: 1px solid ${type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'};
    `;
    msg.textContent = message;
    form.appendChild(msg);

    if (type === 'success') setTimeout(() => msg.remove(), 6000);
}
