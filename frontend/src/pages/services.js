// services.js — Página de Serviços

// ===== THEME =====
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

// ===== LOADING =====
window.addEventListener('load', () => {
  const ls = document.querySelector('.loading-screen')
  setTimeout(() => {
    ls.style.opacity = '0'
    setTimeout(() => ls.classList.add('hidden'), 500)
  }, 600)
})

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle')
const navMenu    = document.getElementById('navMenu')
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

// ===== BACK TO TOP =====
const backToTop = document.getElementById('backToTop')
window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.pageYOffset > 300))
backToTop.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }))

// ===== CURRENCY TOGGLE =====
const RATE = 1100 // 1 EUR = 1100 Kz
const btnKz  = document.getElementById('btnKz')
const btnEur = document.getElementById('btnEur')

function setCurrency(currency) {
  document.querySelectorAll('.spc-price').forEach(el => {
    el.textContent = el.dataset[currency]
  })
  btnKz.classList.toggle('active',  currency === 'kz')
  btnEur.classList.toggle('active', currency === 'eur')
}

btnKz.addEventListener('click',  () => setCurrency('kz'))
btnEur.addEventListener('click', () => setCurrency('eur'))

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer  = btn.nextElementSibling
    const isOpen  = btn.getAttribute('aria-expanded') === 'true'
    // Close all
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false')
      b.nextElementSibling.classList.remove('open')
    })
    // Toggle current
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true')
      answer.classList.add('open')
    }
  })
})
