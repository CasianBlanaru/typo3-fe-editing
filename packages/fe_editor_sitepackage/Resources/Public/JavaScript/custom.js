// Custom JavaScript for FE Editor Sitepackage

document.addEventListener('DOMContentLoaded', function() {
    console.log('pixelcoda FE Editor Sitepackage loaded');

    // Initialize custom functionality
    initPixelcodaFeatures();
});

function initPixelcodaFeatures() {
    // Add custom animations
    const elements = document.querySelectorAll('.animate-on-scroll');

    if (elements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        });

        elements.forEach(el => observer.observe(el));
    }

    // Enhanced button interactions
    const pixelcodaButtons = document.querySelectorAll('.btn-pixelcoda');
    pixelcodaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}