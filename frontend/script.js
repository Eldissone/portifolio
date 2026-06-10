// script.js — Portfolio Eldissone Vilonga
// script.js — Portfolio Eldissone Vilonga
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ===== DOM =====
const loadingScreen = document.querySelector('.loading-screen')
const menuToggle   = document.getElementById('menuToggle')
const navMenu      = document.getElementById('navMenu')
const backToTop    = document.getElementById('backToTop')

// ===== THEME TOGGLE =====
const themeToggles = document.querySelectorAll('.theme-toggle')
const savedTheme  = localStorage.getItem('theme') || 'light'

const setTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
    themeToggles.forEach(btn => {
      const icon = btn.querySelector('i')
      if (icon) {
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun')
      }
    })
  } else {
    document.documentElement.classList.remove('dark')
    themeToggles.forEach(btn => {
      const icon = btn.querySelector('i')
      if (icon) {
        icon.classList.remove('fa-sun')
        icon.classList.add('fa-moon')
      }
    })
  }
}

setTheme(savedTheme)

themeToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark')
    const theme = isDark ? 'dark' : 'light'
    localStorage.setItem('theme', theme)
    setTheme(theme)
  })
})

// ===== LOADING & ENTRANCE =====
window.addEventListener('load', () => {
  setTimeout(() => {
    gsap.to(loadingScreen, {
      opacity: 0, duration: 0.8,
      onComplete: () => {
        loadingScreen.classList.add('hidden')
        // Entrance Animations
        gsap.from('.hero-title span, .hero-title em', {
          y: 60, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out'
        })
        gsap.from('.hero-description, .hero-tagline, .hero-actions', {
          y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.5
        })
        gsap.from('.hero-stat-card', {
          scale: 0.8, opacity: 0, duration: 1, stagger: 0.2, ease: 'back.out(1.7)', delay: 0.8
        })
        gsap.from('.hero-img-container', {
          y: 100, opacity: 0, duration: 1.5, ease: 'power4.out', delay: 1
        })
      }
    })
  }, 800)
})


// ===== MOUSE FOLLOW (Hero Image) =====
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 40
  const y = (e.clientY / window.innerHeight - 0.5) * 40
  
  // Rotate the circle frame
  gsap.to('.hero-circle', {
    rotateY: x,
    rotateX: -y,
    duration: 1.2,
    ease: 'power2.out'
  })
  
  // Shifting the image inside for parallax depth
  gsap.to('.hero-img', {
    x: x * 0.8,
    y: y * 0.8,
    scale: 1.1, // Keep it slightly zoomed to hide edges during shift
    duration: 1.5,
    ease: 'power2.out'
  })

  // Add subtle movement to stat cards
  gsap.to('.hero-stat-card', {
    x: (e.clientX / window.innerWidth - 0.5) * 20,
    y: (e.clientY / window.innerHeight - 0.5) * 20,
    duration: 2,
    ease: 'power3.out'
  })
})



// ===== MOBILE MENU =====
menuToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('active')
  menuToggle.setAttribute('aria-expanded', isOpen)
  const spans = menuToggle.querySelectorAll('span')
  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(6px,6px)'
    spans[1].style.opacity   = '0'
    spans[2].style.transform = 'rotate(-45deg) translate(8px,-6px)'
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  }
})

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  })
})

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navMenu.classList.contains('active')) {
    navMenu.classList.remove('active')
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  }
})

// ===== BACK TO TOP =====
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.pageYOffset > 300)
})
backToTop.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }))

// ===== ACTIVE NAV LINK ON SCROLL =====
function updateActiveNav() {
  const sections  = document.querySelectorAll('section[id]')
  const navLinks  = document.querySelectorAll('.nav-link')
  const scrollPos = window.scrollY + 120
  let current = ''
  sections.forEach(s => {
    if (scrollPos >= s.offsetTop && scrollPos < s.offsetTop + s.clientHeight) current = s.id
  })
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`)
  })
}
window.addEventListener('scroll', updateActiveNav)
updateActiveNav()

// ===== SCROLL REVEAL (IntersectionObserver) =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

// ===== PROJECTS LOADING & FILTERING =====
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:3000';
const projectsGrid = document.getElementById('projectsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');

async function loadProjects() {
  try {
    const res = await fetch(`${API_URL}/projects`);
    const projects = await res.json();
    renderProjects(projects);
  } catch (err) {
    console.error('Erro ao carregar projectos:', err);
  }
}

function renderProjects(projects) {
  if (!projectsGrid) return;
  
  projectsGrid.innerHTML = projects.map((p, i) => `
    <div class="project-card reveal" data-category="${p.category}">
      <div class="project-image">
        <span class="project-tag-overlay">${p.category}</span>
        ${p.imageUrl ? `<img src="${IMAGE_BASE}${p.imageUrl}" alt="${p.title}">` : '<div class="no-image">Sem Imagem</div>'}
        <div class="project-overlay">
          <a href="src/pages/projeto.html?id=${p.id}" class="project-link-icon" aria-label="Ver Detalhes">
            <i class="fas fa-eye"></i>
          </a>
        </div>
      </div>
      <div class="project-info">
        <h3>${p.title}</h3>
        <p>${p.description || ''}</p>
        <div class="tech-tags">
          ${p.techStack && Array.isArray(p.techStack) ? p.techStack.map(t => `<span>${t}</span>`).join('') : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    document.querySelectorAll('.project-card.reveal').forEach(el => {
      revealObserver.observe(el);
      // Fallback: if not visible after 1s, force it (to avoid stuck transparency)
      setTimeout(() => el.classList.add('visible'), 1000);
    });
    ScrollTrigger.refresh();
  }, 100);
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
      if (filter === 'all' || card.getAttribute('data-category') === filter) {
        card.style.display = 'flex';
        setTimeout(() => card.classList.add('visible'), 50);
      } else {
        card.style.display = 'none';
      }
    });
  });
});

loadProjects();


// ===== GSAP CARD ANIMATIONS =====
document.querySelectorAll('.skill-card').forEach(card => {
  card.addEventListener('mouseenter', () => gsap.to(card, { scale:1.04, duration:0.3, ease:'power2.out' }))
  card.addEventListener('mouseleave', () => gsap.to(card, { scale:1,    duration:0.3, ease:'power2.out' }))
})


// ===== MOUSE INTERACTION (UI) =====
const heroGlow = document.getElementById('heroGlow')
document.addEventListener('mousemove', e => {
  // 1. Hero Glow Follow
  if (heroGlow) {
    gsap.to(heroGlow, { 
      x: e.clientX - 300, 
      y: e.clientY - 300, 
      opacity: 0.6, 
      duration: 1.2, 
      ease: 'power2.out' 
    })
  }

  // 2. Hero Stat Cards Tilt
  document.querySelectorAll('.hero-stat-card').forEach(card => {
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const tiltX = (e.clientY - centerY) * 0.05
    const tiltY = (e.clientX - centerX) * -0.05
    gsap.to(card, {
      rotateX: tiltX, rotateY: tiltY,
      x: (e.clientX - centerX) * 0.02,
      y: (e.clientY - centerY) * 0.02,
      duration: 0.8, ease: 'power2.out'
    })
  })
})

// ===== MAGNETIC BUTTONS =====
document.querySelectorAll('.btn, .hero-social-handle, .theme-toggle, .nav-link').forEach(el => {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    gsap.to(el, { x: x * 0.35, y: y * 0.35, duration: 0.4, ease: 'power2.out' })
  })
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  })
})

// Lazy load images
document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'lazy' })
