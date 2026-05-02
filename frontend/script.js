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
const scene  = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 5
scene.add(camera)

const primaryColor   = new THREE.Color('#b86e2e')
const secondaryColor = new THREE.Color('#c29670')

const geometry = new THREE.IcosahedronGeometry(1.4, 2)
const material = new THREE.MeshPhysicalMaterial({
  color: primaryColor,
  metalness: 0.6,
  roughness: 0.3,
  clearcoat: 0.8,
  clearcoatRoughness: 0.2,
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const wireframeGeom = new THREE.IcosahedronGeometry(1.46, 2)
const wireframeMat  = new THREE.MeshBasicMaterial({
  color: secondaryColor,
  wireframe: true,
  transparent: true,
  opacity: 0.25
})
const wireframe = new THREE.Mesh(wireframeGeom, wireframeMat)
scene.add(wireframe)

// Orbiting small geometries
const smallGeometries = []
const gTypes = [
  new THREE.TetrahedronGeometry(0.35, 0),
  new THREE.OctahedronGeometry(0.28, 0),
  new THREE.DodecahedronGeometry(0.3, 0)
]
for (let i = 0; i < 5; i++) {
  const sm = new THREE.MeshPhysicalMaterial({ color: i % 2 === 0 ? primaryColor : secondaryColor, metalness:0.5, roughness:0.4 })
  const smMesh = new THREE.Mesh(gTypes[i % gTypes.length], sm)
  const angle  = (i / 5) * Math.PI * 2
  const radius = 2.4
  smMesh.position.x = Math.cos(angle) * radius
  smMesh.position.z = Math.sin(angle) * radius
  scene.add(smMesh)
  smallGeometries.push({ mesh: smMesh, angle, radius, speed: 0.4 + Math.random() * 0.4 })
}

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7))
const keyLight  = new THREE.DirectionalLight(0xffffff, 1.0); keyLight.position.set(5,5,5); scene.add(keyLight)
const fillLight = new THREE.DirectionalLight(0xc29670, 0.4); fillLight.position.set(-5,3,2); scene.add(fillLight)
const pLight1   = new THREE.PointLight(0xb86e2e, 0.8, 10); pLight1.position.set(3,2,1); scene.add(pLight1)
const pLight2   = new THREE.PointLight(0xc29670, 0.5, 10); pLight2.position.set(-3,-1,2); scene.add(pLight2)

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// ===== LOADING =====
window.addEventListener('load', () => {
  setTimeout(() => {
    gsap.to(loadingScreen, {
      opacity: 0, duration: 0.5,
      onComplete: () => loadingScreen.classList.add('hidden')
    })
  }, 800)
})

// ===== SCROLL TRIGGERS (THREE.JS) =====
gsap.to(mesh.rotation, { y: Math.PI * 2, scrollTrigger: { trigger:'.section-one', start:'top top', end:'bottom top', scrub:1.5 } })
gsap.to(mesh.position, { x:2, y:-1, scrollTrigger: { trigger:'.section-about', start:'top center', end:'bottom center', scrub:1.5 } })
gsap.to(mesh.rotation, { x:Math.PI*1.5, y:Math.PI*2.5, scrollTrigger: { trigger:'.section-services', start:'top center', end:'bottom center', scrub:1.5 } })
gsap.to(mesh.position, { x:0, y:-2, z:3, scrollTrigger: { trigger:'.section-four', start:'top center', end:'bottom bottom', scrub:1.5 } })

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

// ===== MOUSE PARALLAX =====
document.addEventListener('mousemove', e => {
  const mx = (e.clientX / window.innerWidth)  * 2 - 1
  const my = -(e.clientY / window.innerHeight) * 2 + 1
  gsap.to(mesh.rotation, { x: my * 0.08, y: mx * 0.08, duration:1 })
  pLight1.position.x = mx * 3
  pLight1.position.y = my * 2
  pLight2.position.x = -mx * 3
  pLight2.position.y = -my * 2
})

// ===== RESIZE =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// ===== ANIMATION LOOP =====
let time = 0
function animate() {
  time += 0.005
  mesh.rotation.x = time * 0.08
  mesh.rotation.y = time * 0.12
  wireframe.rotation.x = -time * 0.06
  wireframe.rotation.y = -time * 0.10
  smallGeometries.forEach((g, i) => {
    g.angle += time * 0.04 * g.speed
    g.mesh.position.x = Math.cos(g.angle + time) * g.radius
    g.mesh.position.z = Math.sin(g.angle + time) * g.radius
    g.mesh.position.y = Math.sin(time * g.speed + i) * 0.5
    g.mesh.rotation.x = time * g.speed
    g.mesh.rotation.y = time * g.speed * 0.7
  })
  pLight1.intensity = 0.8 + Math.sin(time * 2) * 0.15
  pLight2.intensity = 0.5 + Math.sin(time * 2.5) * 0.1
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()
ScrollTrigger.refresh()

// Lazy load images
document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'lazy' })
