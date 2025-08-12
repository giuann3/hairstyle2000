// Funzionalità del menu mobile congestione cross-page
function setupMobileMenu() {
    // Elementi del menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav');
    const navOverlay = document.querySelector('.nav-overlay');
    
    if (!mobileMenuBtn || !nav || !navOverlay) return;
    
    const menuIcon = mobileMenuBtn.querySelector('i');

    // Apri/chiudi menu
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        navOverlay.classList.toggle('active');
        
        // Cambia icona
        if (nav.classList.contains('active')) {
            menuIcon.classList.replace('fa-bars', 'fa-times');
        } else {
            menuIcon.classList.replace('fa-times', 'fa-bars');
        }
    });

    // Chiudi menu cliccando sull'overlay
    navOverlay.addEventListener('click', function() {
        nav.classList.remove('active');
        navOverlay.classList.remove('active');
        menuIcon.classList.replace('fa-times', 'fa-bars');
    });

    // Chiudi menu quando si clicca su un link
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                nav.classList.remove('active');
                navOverlay.classList.remove('active');
                menuIcon.classList.replace('fa-times', 'fa-bars');
            }
        });
    });
}

// Funzionalità dello scroll della navbar
function setupNavbarScroll() {
    const header = document.querySelector('.glass-nav');
    if (!header) return;

    window.addEventListener('scroll', function() {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Inizializza lo stato
    header.classList.toggle('scrolled', window.scrollY > 50);
}

// Gestione del resize della finestra
function setupWindowResize() {
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            const nav = document.querySelector('nav');
            const navOverlay = document.querySelector('.nav-overlay');
            const menuIcon = document.querySelector('.mobile-menu i');
            
            if (nav) nav.classList.remove('active');
            if (navOverlay) navOverlay.classList.remove('active');
            if (menuIcon) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        }
    });
}

// Inizializza tutto quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    setupNavbarScroll();
    setupWindowResize();
});