'use strict';

// Navbar scroll behavior
var navbar = document.getElementById('mainNav');
if (navbar) {
    var handleScroll = function () {
        if (window.scrollY > 80) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

// Smooth scroll for anchor links
document.querySelectorAll('a.page-scroll').forEach(function (link) {
    link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        e.preventDefault();
        var target = document.querySelector(href);
        if (target) {
            var top = target.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
        // Close mobile nav if open
        var collapse = document.getElementById('navbarMain');
        if (collapse && collapse.classList.contains('show')) {
            var bsCollapse = window.bootstrap && bootstrap.Collapse.getInstance(collapse);
            if (bsCollapse) bsCollapse.hide();
        }
    });
});

// Scroll-reveal via IntersectionObserver
var revealEls = document.querySelectorAll('.reveal');
if (revealEls.length > 0 && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
} else {
    // Fallback: show all immediately
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
}

// Explicit modal triggers — ensures Bootstrap modals open on portfolio card clicks
document.querySelectorAll('[data-bs-toggle="modal"]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
        var targetSel = trigger.getAttribute('data-bs-target');
        if (!targetSel || !window.bootstrap) return;
        var modalEl = document.querySelector(targetSel);
        if (!modalEl) return;
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });
});

// Portfolio view toggle (flow/image)
var portfolioViewGroup = document.querySelector('#portfolio .portfolio-view-group');
var portfolioToggleButtons = document.querySelectorAll('[data-portfolio-view]');
if (portfolioViewGroup && portfolioToggleButtons.length) {
    portfolioToggleButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var view = btn.getAttribute('data-portfolio-view');
            if (!view) return;
            portfolioViewGroup.classList.remove('view-flow', 'view-image');
            portfolioViewGroup.classList.add(view === 'image' ? 'view-image' : 'view-flow');
            portfolioToggleButtons.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });
    });
}

// Modal view toggle (flow/image)
document.querySelectorAll('[data-modal-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var targetSel = btn.getAttribute('data-modal-target');
        var view = btn.getAttribute('data-modal-view');
        if (!targetSel || !view) return;
        var modalEl = document.querySelector(targetSel);
        if (!modalEl) return;
        modalEl.classList.remove('view-flow', 'view-image');
        modalEl.classList.add(view === 'image' ? 'view-image' : 'view-flow');
        modalEl.querySelectorAll('[data-modal-view]').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
    });
});
