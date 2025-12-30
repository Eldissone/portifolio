// main.js
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// DOM Elements
const canvas = document.querySelector('#webgl')
const loadingScreen = document.querySelector('.loading-screen')
const menuToggle = document.getElementById('menuToggle')
const navMenu = document.getElementById('navMenu')
const backToTop = document.getElementById('backToTop')
const navLinks = document.querySelectorAll('.nav-link')

// Three.js Scene Setup
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.z = 5
scene.add(camera)

// Create a more interesting geometry
const geometry = new THREE.IcosahedronGeometry(1.4, 2)
const material = new THREE.MeshPhysicalMaterial({
  color: '#6c63ff',
  metalness: 0.7,
  roughness: 0.2,
  clearcoat: 0.8,
  clearcoatRoughness: 0.2,
  emissive: '#000000',
  emissiveIntensity: 0.1
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Add wireframe for more visual interest
const wireframeGeometry = new THREE.IcosahedronGeometry(1.45, 2)
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: '#ff6584',
  wireframe: true,
  transparent: true,
  opacity: 0.3
})
const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
scene.add(wireframe)

// Add smaller orbiting geometries
const smallGeometries = []
const geometryTypes = [
  new THREE.TetrahedronGeometry(0.4, 0),
  new THREE.OctahedronGeometry(0.3, 0),
  new THREE.DodecahedronGeometry(0.35, 0)
]

for (let i = 0; i < 6; i++) {
  const geomType = geometryTypes[i % geometryTypes.length]
  const smallMaterial = new THREE.MeshPhysicalMaterial({
    color: i % 2 === 0 ? '#6c63ff' : '#ff6584',
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 0.7
  })
  const smallMesh = new THREE.Mesh(geomType, smallMaterial)
  
  // Position in a circle around the main mesh
  const angle = (i / 6) * Math.PI * 2
  const radius = 2.5
  smallMesh.position.x = Math.cos(angle) * radius
  smallMesh.position.z = Math.sin(angle) * radius
  
  scene.add(smallMesh)
  smallGeometries.push({
    mesh: smallMesh,
    angle: angle,
    radius: radius,
    speed: 0.5 + Math.random() * 0.5
  })
}

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6))

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
keyLight.position.set(5, 5, 5)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0xff6584, 0.5)
fillLight.position.set(-5, 3, 2)
scene.add(fillLight)

// Add point lights for more drama
const pointLight1 = new THREE.PointLight(0x6c63ff, 0.8, 10)
pointLight1.position.set(3, 2, 1)
scene.add(pointLight1)

const pointLight2 = new THREE.PointLight(0xff6584, 0.6, 10)
pointLight2.position.set(-3, -1, 2)
scene.add(pointLight2)

// Renderer
const renderer = new THREE.WebGLRenderer({ 
  canvas, 
  alpha: true, 
  antialias: true,
  powerPreference: "high-performance"
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Hide loading screen after everything loads
window.addEventListener('load', () => {
  setTimeout(() => {
    gsap.to(loadingScreen, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        loadingScreen.classList.add('hidden')
      }
    })
  }, 1000)
})

// Scroll Animations with GSAP and ScrollTrigger
gsap.to(mesh.rotation, {
  y: Math.PI * 2,
  scrollTrigger: { 
    trigger: '.section-one', 
    start: 'top top', 
    end: 'bottom top', 
    scrub: 1.5,
    ease: "power2.out"
  }
})

gsap.to(mesh.position, {
  x: 2,
  y: -1,
  scrollTrigger: { 
    trigger: '.section-two', 
    start: 'top center', 
    end: 'bottom center', 
    scrub: 1.5 
  }
})

gsap.to(mesh.rotation, {
  x: Math.PI * 1.5,
  y: Math.PI * 2.5,
  scrollTrigger: { 
    trigger: '.section-three', 
    start: 'top center', 
    end: 'bottom center', 
    scrub: 1.5 
  }
})

gsap.to(mesh.position, {
  x: 0,
  y: -2,
  z: 3,
  scrollTrigger: { 
    trigger: '.section-four', 
    start: 'top center', 
    end: 'bottom bottom', 
    scrub: 1.5 
  }
})

// Animate small geometries with scroll
gsap.to(smallGeometries.map(g => g.mesh.position), {
  y: 1.5,
  scrollTrigger: { 
    trigger: '.section-two', 
    start: 'top center', 
    end: 'bottom center', 
    scrub: 1 
  }
})

// Mobile Menu Toggle
menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('active')
  navMenu.classList.toggle('active')
  
  // Animate menu icon
  const spans = menuToggle.querySelectorAll('span')
  if (navMenu.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)'
    spans[1].style.opacity = '0'
    spans[2].style.transform = 'rotate(-45deg) translate(8px, -6px)'
  } else {
    spans[0].style.transform = 'none'
    spans[1].style.opacity = '1'
    spans[2].style.transform = 'none'
  }
})

// Close menu when clicking a link
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active')
    menuToggle.classList.remove('active')
    
    const spans = menuToggle.querySelectorAll('span')
    spans[0].style.transform = 'none'
    spans[1].style.opacity = '1'
    spans[2].style.transform = 'none'
  })
})

// Back to Top Button
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    backToTop.classList.add('visible')
  } else {
    backToTop.classList.remove('visible')
  }
})

backToTop.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
})

// Mouse move interaction
document.addEventListener('mousemove', (e) => {
  const mouseX = (e.clientX / window.innerWidth) * 2 - 1
  const mouseY = -(e.clientY / window.innerHeight) * 2 + 1
  
  // Subtle parallax effect on mesh
  gsap.to(mesh.rotation, {
    x: mouseY * 0.1,
    y: mouseX * 0.1,
    duration: 1
  })
  
  // Move lights based on mouse position
  pointLight1.position.x = mouseX * 3
  pointLight1.position.y = mouseY * 2
  
  pointLight2.position.x = -mouseX * 3
  pointLight2.position.y = -mouseY * 2
})

// Add hover effect to skill cards
const skillCards = document.querySelectorAll('.skill-card')
skillCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    gsap.to(card, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    })
  })
  
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    })
  })
})

// Add animation to project cards on scroll
const projectCards = document.querySelectorAll('.project-card')
projectCards.forEach((card, index) => {
  gsap.from(card, {
    opacity: 0,
    y: 50,
    duration: 0.8,
    delay: index * 0.2,
    scrollTrigger: {
      trigger: card,
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    }
  })
})

// Resize handler
window.addEventListener('resize', () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  
  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animation loop
let time = 0
const animate = () => {
  time += 0.005
  
  // Rotate main mesh
  mesh.rotation.x = time * 0.1
  mesh.rotation.y = time * 0.15
  
  // Rotate wireframe in opposite direction
  wireframe.rotation.x = -time * 0.08
  wireframe.rotation.y = -time * 0.12
  
  // Animate small orbiting geometries
  smallGeometries.forEach((geo, index) => {
    geo.angle += time * 0.05 * geo.speed
    geo.mesh.position.x = Math.cos(geo.angle + time) * geo.radius
    geo.mesh.position.z = Math.sin(geo.angle + time) * geo.radius
    geo.mesh.position.y = Math.sin(time * geo.speed + index) * 0.5
    geo.mesh.rotation.x = time * geo.speed
    geo.mesh.rotation.y = time * geo.speed * 0.7
  })
  
  // Pulsate lights slightly
  pointLight1.intensity = 0.8 + Math.sin(time * 2) * 0.2
  pointLight2.intensity = 0.6 + Math.sin(time * 2.5) * 0.2
  
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

// Start animation
animate()

// Initialize scroll triggers
ScrollTrigger.refresh()