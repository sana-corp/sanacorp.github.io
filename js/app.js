/* ==========================================================================
   MAIN SPA ROUTER, SCROLL DYNAMICS & CORE LOGIC
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lenis Smooth Scroll
    let lenis;
    try {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false, // Touch defaults to native scroll for performance
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        
        // Export to window for global access
        window.lenisInstance = lenis;
    } catch (e) {
        console.error("Lenis scrolling failed to initialize:", e);
    }

    // 2. Initialize GSAP & ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Sync ScrollTrigger with Lenis scroll updates
    if (lenis) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time)=>{
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    // 3. Mobile Navigation Drawer Toggle
    const burgerBtn = document.getElementById('burger-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');

    if (burgerBtn && mobileDrawer) {
        burgerBtn.addEventListener('click', () => {
            burgerBtn.classList.toggle('active');
            mobileDrawer.classList.toggle('active');
        });
    }

    const mDropdownTrigger = document.getElementById('mobile-dropdown-trigger');
    const mSubmenu = document.getElementById('mobile-submenu');
    if (mDropdownTrigger && mSubmenu) {
        mDropdownTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            mDropdownTrigger.classList.toggle('open');
            mSubmenu.classList.toggle('active');
        });
    }

    const mDevTrigger = document.getElementById('mobile-dev-trigger');
    const mDevSubmenu = document.getElementById('mobile-dev-submenu');
    if (mDevTrigger && mDevSubmenu) {
        mDevTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            mDevTrigger.classList.toggle('open');
            mDevSubmenu.classList.toggle('active');
        });
    }

    const mFutureTrigger = document.getElementById('mobile-future-trigger');
    const mFutureSubmenu = document.getElementById('mobile-future-submenu');
    if (mFutureTrigger && mFutureSubmenu) {
        mFutureTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            mFutureTrigger.classList.toggle('open');
            mFutureSubmenu.classList.toggle('active');
        });
    }

    // Helper to close mobile menu
    function closeMobileMenu() {
        if (burgerBtn && burgerBtn.classList.contains('active')) {
            burgerBtn.classList.remove('active');
            mobileDrawer.classList.remove('active');
        }
    }

    // 4. Hash Router Logic
    const routes = {
        '#/': 'home',
        '#/product': 'product',
        '#/case-finance': 'case-finance',
        '#/case-health': 'case-health',
        '#/case-vending': 'case-vending',
        '#/case-crm': 'case-crm',
        '#/erp': 'erp',
        '#/contacts': 'contacts'
    };

    // Pages that require dark header color scheme
    const darkHeaderPages = [];

    const header = document.getElementById('main-header');
    const sections = document.querySelectorAll('.page-section');
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const transitionCurtain = document.getElementById('transition-curtain');

    let isNavigating = false;

    function handleRouting() {
        const hash = window.location.hash || '#/';
        const pageKey = routes[hash] || 'home';
        const targetSection = document.getElementById(`page-${pageKey}`);

        if (!targetSection) return;

        // Prevent navigation overlap
        if (isNavigating) return;
        isNavigating = true;

        closeMobileMenu();

        // Perform GSAP Transition Curtain Sweep
        const tl = gsap.timeline({
            onComplete: () => {
                isNavigating = false;
                // Force header state update based on current scroll position
                if (lenis) {
                    handleScroll(lenis.scroll);
                } else {
                    handleScroll(window.scrollY);
                }
            }
        });

        // Step 1: Curtain sweeps to cover screen (left -100% to 0%)
        tl.to(transitionCurtain, {
            left: '0%',
            duration: 0.6,
            ease: 'power4.inOut',
            onStart: () => {
                transitionCurtain.classList.add('animating');
            }
        });

        // Step 2: Swap content inside the curtain cover
        tl.add(() => {
            // Hide all pages
            sections.forEach(sec => sec.classList.remove('active'));
            // Show target page
            targetSection.classList.add('active');

            // Handle Header Themes (Dark vs Light)
            if (darkHeaderPages.includes(pageKey)) {
                header.classList.add('dark-header');
            } else {
                header.classList.remove('dark-header');
            }
            header.classList.remove('scrolled-header');

            // Sync Header Navigation Active Link
            navItems.forEach(item => {
                if (item.getAttribute('data-page') === pageKey) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            const productPages = ['product'];
            const devPages = ['case-finance', 'case-health', 'case-vending', 'case-crm'];
            const futurePages = ['erp'];

            // Desktop Trigger Sync
            const productTrigger = document.getElementById('dropdown-products-trigger');
            if (productTrigger) {
                productTrigger.classList.toggle('active', productPages.includes(pageKey));
            }

            const devTrigger = document.getElementById('dropdown-dev-trigger');
            if (devTrigger) {
                devTrigger.classList.toggle('active', devPages.includes(pageKey));
            }

            const futureTrigger = document.getElementById('dropdown-future-trigger');
            if (futureTrigger) {
                futureTrigger.classList.toggle('active', futurePages.includes(pageKey));
            }

            mobileNavItems.forEach(item => {
                if (item.getAttribute('data-page') === pageKey) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Mobile Dropdown Syncs
            const mobileDropdownTrigger = document.getElementById('mobile-dropdown-trigger');
            const mobileSubmenu = document.getElementById('mobile-submenu');
            if (mobileDropdownTrigger) {
                if (productPages.includes(pageKey)) {
                    mobileDropdownTrigger.classList.add('active');
                    if (mobileSubmenu) {
                        mobileSubmenu.classList.add('active');
                        mobileDropdownTrigger.classList.add('open');
                    }
                } else {
                    mobileDropdownTrigger.classList.remove('active');
                }
            }

            const mobileDevTrigger = document.getElementById('mobile-dev-trigger');
            const mobileDevSubmenu = document.getElementById('mobile-dev-submenu');
            if (mobileDevTrigger) {
                if (devPages.includes(pageKey)) {
                    mobileDevTrigger.classList.add('active');
                    if (mobileDevSubmenu) {
                        mobileDevSubmenu.classList.add('active');
                        mobileDevTrigger.classList.add('open');
                    }
                } else {
                    mobileDevTrigger.classList.remove('active');
                }
            }

            const mobileFutureTrigger = document.getElementById('mobile-future-trigger');
            const mobileFutureSubmenu = document.getElementById('mobile-future-submenu');
            if (mobileFutureTrigger) {
                if (futurePages.includes(pageKey)) {
                    mobileFutureTrigger.classList.add('active');
                    if (mobileFutureSubmenu) {
                        mobileFutureSubmenu.classList.add('active');
                        mobileFutureTrigger.classList.add('open');
                    }
                } else {
                    mobileFutureTrigger.classList.remove('active');
                }
            }

            // Reset scroll to top
            if (lenis) {
                lenis.scrollTo(0, { immediate: true });
            } else {
                window.scrollTo(0, 0);
            }

            // Dispatch global hooks for webgl/interactives to re-initialize or resize
            window.dispatchEvent(new CustomEvent('page-swapped', { detail: { page: pageKey } }));

            // Recalculate ScrollTrigger markers
            ScrollTrigger.refresh();
        });

        // Step 3: Curtain retracts to the right (left 0% to 100%)
        tl.to(transitionCurtain, {
            left: '100%',
            duration: 0.6,
            ease: 'power4.inOut',
            onComplete: () => {
                // Instantly reset position to -100% for next transition
                gsap.set(transitionCurtain, { left: '-100%' });
                transitionCurtain.classList.remove('animating');
                
                // Fade in-up animation for text blocks in the new active page
                gsap.fromTo(targetSection.querySelectorAll('h1, h2, .suptitle, p, .btn-cta-orange, .competency-column'), 
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }
                );
            }
        });
    }

    // Navigation item click bindings
    const handleNavItemClick = (e) => {
        const targetHref = e.currentTarget.getAttribute('href');
        if (targetHref.startsWith('#/')) {
            // Hash route change will trigger hashchange event automatically
            closeMobileMenu();
        }
    };

    navItems.forEach(item => item.addEventListener('click', handleNavItemClick));
    mobileNavItems.forEach(item => item.addEventListener('click', handleNavItemClick));
    const logoLink = document.getElementById('logo-link');
    if (logoLink) logoLink.addEventListener('click', handleNavItemClick);

    // 5. Scroll Handler for Header styling transitions
    const handleScroll = (y) => {
        if (isNavigating) return;
        if (y > 40) {
            header.classList.add('scrolled-header');
        } else {
            header.classList.remove('scrolled-header');
        }
    };

    if (lenis) {
        lenis.on('scroll', (e) => {
            handleScroll(e.scroll);
        });
    } else {
        window.addEventListener('scroll', () => {
            handleScroll(window.scrollY);
        });
    }

    // Watch for hash updates
    window.addEventListener('hashchange', handleRouting);
    
    // Initial page load trigger
    handleRouting();
});
