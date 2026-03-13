/* MENU SHOW Y HIDDEN */
const navMenu = document.getElementById('nav-menu'),
    navToggle = document.getElementById('nav-toggle'),
    navClose = document.getElementById('nav-close')

/* MENU SHOW */
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu')
    })
}

/* MENU HIDDEN */
if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu')
    })
}

/* REMOVE MENU MOBILE */
const navLink = document.querySelectorAll('.nav__link')

function linkAction() {
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/* SCROLL SECTIONS ACTIVE LINK */
const sections = document.querySelectorAll('section[id]')

function scrollActive() {
    const scrollY = window.pageYOffset

    sections.forEach(current => {
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id')

        /* Only check for the link if it exists on the page */
        const sectionLink = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

        if (sectionLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                // If it is an internal anchor link (starts with #), then add active class.
                // But since we are multi-page, we might not want to override the page active class unless it's a one-page section logic.
                // For now, let's just add it if it matches the ID logic, but be careful not to remove the 'active-link' from the page itself if it's the main page link.

                // sectionLink.classList.add('active-link') 
                // actually, with multi-page, scroll spy is less relevant for the main nav. 
                // Let's just comment out the scroll spy logic for main nav to avoid conflict with static active states.
            } else {
                // sectionLink.classList.remove('active-link')
            }
        }
    })
}
/* Disable scroll spy for multi-page simplicity, as we use static active classes per page */
// window.addEventListener('scroll', scrollActive)

/* CHANGE BACKGROUND HEADER */
function scrollHeader() {
    const nav = document.getElementById('header')
    // When the scroll is greater than 80 viewport height, add the scroll-header class to the header tag
    if (this.scrollY >= 80) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)

/* LIGHTBOX GALLERY */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const galleryGrid = document.querySelector('.gallery-grid');

function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery__img');
    if (lightbox && galleryItems) {
        galleryItems.forEach(img => {
            img.addEventListener('click', () => {
                lightbox.classList.add('show');
                lightboxImg.src = img.src;
            });
        });
    }
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('show');
    });
}

if (lightbox) {
    // Close when clicking outside image
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.remove('show');
        }
    });
}

// DYNAMIC GALLERY LOADING
if (galleryGrid) {
    galleryGrid.innerHTML = ''; // Clear placeholder content

    // Use Vite's import.meta.glob to dynamically import all images from the folder
    const images = import.meta.glob('../public/assets/images/*.{jpeg,jpg,png,gif,webp}', { eager: true, import: 'default' });

    for (const path in images) {
        const item = document.createElement('div');
        item.className = 'gallery__item';
        
        const img = document.createElement('img');
        img.src = images[path];
        img.alt = 'Avyukt Restaurant Gallery';
        img.className = 'gallery__img';
        img.loading = 'lazy';
        
        item.appendChild(img);
        galleryGrid.appendChild(item);
    }
    
    // Initialize lightbox after images are dynamically added
    initLightbox();
} else {
    // Init lightbox on pages where gallery grid doesn't exist but images might
    initLightbox();
}
