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

    // === 10. CONTACT FORM BASIC VALIDATION ===
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            const requiredFields = contactForm.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'red'; // Chỉ báo lỗi trực quan
                } else {
                    field.style.borderColor = ''; // Xóa báo lỗi
                }
            });
            
            if (isValid) {
                // Xử lý gửi thành công
                alert('Cảm ơn bạn! Tin nhắn đã được gửi thành công. Tôi sẽ phản hồi sớm nhất có thể.');
                contactForm.reset();
                
                // Ở phiên bản Production, form data sẽ được gửi tới Formspree
            } else {
                alert('Vui lòng điền đầy đủ các trường bắt buộc.');
            }
        });
    }
});
