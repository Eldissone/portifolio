// script.js — Portfolio Eldissone Vilonga
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ===== DOM =====
const canvas       = document.querySelector('#webgl')
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

// ===== THREE.JS SCENE =====
if (canvas) {
  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 6
  scene.add(camera)

  const textureLoader = new THREE.TextureLoader()
  const textures = {
    processor: textureLoader.load('/assets/img/3d/processor.png'),
    glass: textureLoader.load('/assets/img/3d/glass_shape.png'),
    main: textureLoader.load('/assets/img/3d/assets_main.png')
  }

  // Group to hold everything for scroll animations
  const mainGroup = new THREE.Group()
  scene.add(mainGroup)

  const floatingElements = []

  function createFloatingElement(texture, scale, position, parallaxIntensity) {
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      alphaTest: 0.5, // Remove greyish background
      depthWrite: false, // Prevent clipping between sprites
      opacity: 0, 
    })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(scale, scale, 1)
    sprite.position.copy(position)
    
    const element = {
      mesh: sprite,
      originalPos: position.clone(),
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.5 + Math.random() * 0.5,
      floatAmplitude: 0.1 + Math.random() * 0.2,
      parallaxIntensity: parallaxIntensity,
      repulsion: new THREE.Vector3(0, 0, 0)
    }
    
    mainGroup.add(sprite)
    floatingElements.push(element)
    
    gsap.to(material, { opacity: 1, duration: 1.5, delay: Math.random() * 1 })
    return element
  }

  // Initialize elements
  createFloatingElement(textures.processor, 2.2, new THREE.Vector3(0, 0, 0), 0.1) // Center
  createFloatingElement(textures.glass, 1.2, new THREE.Vector3(-4, 2.5, -2), 0.25)
  createFloatingElement(textures.glass, 0.8, new THREE.Vector3(4, -3, -3), 0.4)
  createFloatingElement(textures.main, 1.8, new THREE.Vector3(5, 3.5, -2.5), 0.2)
  createFloatingElement(textures.main, 1.2, new THREE.Vector3(-5, -3.2, -2), 0.35)

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const pointLight = new THREE.PointLight(0xffffff, 1.5, 20); pointLight.position.set(5, 5, 5); scene.add(pointLight)
  const pLight1 = new THREE.PointLight(0xFF7A00, 1.2, 15); pLight1.position.set(-3, -2, 2); scene.add(pLight1)

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Scroll Triggers
  gsap.to(mainGroup.rotation, { y: Math.PI * 0.5, scrollTrigger: { trigger:'.section-one', start:'top top', end:'bottom top', scrub:1.5 } })
  gsap.to(mainGroup.position, { x:1.5, y:-1, scrollTrigger: { trigger:'.section-about', start:'top center', end:'bottom center', scrub:1.5 } })
  
  // Animation Loop
  let time = 0
  let mouse = new THREE.Vector2(0, 0)
  document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    gsap.to(pLight1.position, { x: mouse.x * 5, y: mouse.y * 3, duration: 1.5 })
  })

  function animate() {
    time += 0.008
    floatingElements.forEach((el, i) => {
      const floatY = Math.sin(time * el.floatSpeed + el.floatOffset) * el.floatAmplitude
      const floatX = Math.cos(time * el.floatSpeed * 0.8 + el.floatOffset) * el.floatAmplitude * 0.5
      const parallaxX = mouse.x * el.parallaxIntensity * 5
      const parallaxY = mouse.y * el.parallaxIntensity * 5
      const dist = el.mesh.position.distanceTo(new THREE.Vector3(mouse.x * 5, mouse.y * 5, 0))
      if (dist < 3) {
        const dir = el.mesh.position.clone().sub(new THREE.Vector3(mouse.x * 5, mouse.y * 5, 0)).normalize()
        const force = (3 - dist) * 0.05
        el.repulsion.add(dir.multiplyScalar(force))
      }
      el.repulsion.multiplyScalar(0.9)
      el.mesh.position.x = el.originalPos.x + floatX + parallaxX + el.repulsion.x
      el.mesh.position.y = el.originalPos.y + floatY + parallaxY + el.repulsion.y
      el.mesh.material.rotation = Math.sin(time * 0.5 + i) * 0.05
    })
    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }
  animate()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  // ===== SCROLL TRIGGERS (THREE.JS) =====
  gsap.to(mainGroup.rotation, { y: Math.PI * 0.5, scrollTrigger: { trigger:'.section-one', start:'top top', end:'bottom top', scrub:1.5 } })
  gsap.to(mainGroup.position, { x:1.5, y:-1, scrollTrigger: { trigger:'.section-about', start:'top center', end:'bottom center', scrub:1.5 } })
  gsap.to(mainGroup.rotation, { x:0.2, y:Math.PI, scrollTrigger: { trigger:'.section-services', start:'top center', end:'bottom center', scrub:1.5 } })
  gsap.to(mainGroup.position, { x:0, y:-1.5, z:2, scrollTrigger: { trigger:'.section-four', start:'top center', end:'bottom bottom', scrub:1.5 } })
}

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
      }
    })
  }, 800)
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
const API_URL = 'http://localhost:3000/api';
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
        ${p.imageUrl ? `<img src="http://localhost:3000${p.imageUrl}" alt="${p.title}">` : '<div class="no-image">Sem Imagem</div>'}
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
