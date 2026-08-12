// services.js — Página de Serviços

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const WHATSAPP = '244933170799'

const FALLBACK_SERVICES = [
  {
    title: 'Domínio + Email Profissional',
    description: 'Compra, configuração de domínio e criação de emails com o teu nome.',
    priceKz: '55 000 Kz',
    priceEur: '50 €',
    delivery: '2 a 6 dias',
    features: ['Registo do domínio (.com, .ao, .net)', 'Até 5 emails profissionais', 'Configuração DNS incluída'],
    isFeatured: false,
    icon: 'fa-globe'
  },
  {
    title: 'Site Institucional',
    description: 'Sites profissionais para apresentar a tua empresa ou marca pessoal.',
    priceKz: '420 000 Kz',
    priceEur: '400 €',
    delivery: '2 a 4 semanas',
    features: ['Design responsivo (mobile/desktop)', 'Até 6 páginas', 'SEO básico optimizado', 'Formulário de contacto', '1 mês de suporte incluído'],
    isFeatured: true,
    icon: 'fa-laptop-code'
  },
  {
    title: 'Plataforma de Gestão',
    description: 'Sistemas web para gerir o teu negócio (clientes, stock, facturas).',
    priceKz: '2 100 000 Kz',
    priceEur: '2 000 €',
    delivery: '6 a 12 semanas',
    features: ['Painel administrativo completo', 'Autenticação e perfis de utilizador', 'Relatórios e exportação PDF', 'API REST integrada'],
    isFeatured: false,
    icon: 'fa-server'
  },
  {
    title: 'Landing Page',
    description: 'Página de alta conversão para captar leads, vender produtos ou promover eventos.',
    priceKz: '200 000 Kz',
    priceEur: '180 €',
    delivery: '1 a 2 semanas',
    features: ['Design premium focado em conversão', 'Integração com WhatsApp', 'Optimização para Google'],
    isFeatured: false,
    icon: 'fa-mobile-alt'
  },
  {
    title: 'App com Integração de IA',
    description: 'Aplicações web com funcionalidades de inteligência artificial — chatbots, análise e automação.',
    priceKz: '3 300 000 Kz',
    priceEur: '3 000 €',
    delivery: '8 a 16 semanas',
    features: ['Integração com GPT / Gemini', 'Análise automática de dados', 'Relatórios inteligentes'],
    isFeatured: false,
    icon: 'fa-brain'
  },
  {
    title: 'Consultoria & Mentoria',
    description: 'Sessões de consultoria técnica para startups, developers e empreendedores digitais.',
    priceKz: '55 000 Kz/h',
    priceEur: '50 €/h',
    delivery: 'Flexível — presencial ou remoto',
    features: ['Auditoria de código e arquitectura', 'Estratégia de produto digital', 'Mentoria para developers'],
    isFeatured: false,
    icon: 'fa-chart-line'
  }
]

const ICON_RULES = [
  { pattern: /domínio|email|domain/i, icon: 'fa-globe' },
  { pattern: /site|institucional|web/i, icon: 'fa-laptop-code' },
  { pattern: /plataforma|gestão|gestao|sistema/i, icon: 'fa-server' },
  { pattern: /landing/i, icon: 'fa-mobile-alt' },
  { pattern: /ia|inteligência|inteligencia|ai/i, icon: 'fa-brain' },
  { pattern: /consultoria|mentoria/i, icon: 'fa-chart-line' }
]

function getServiceIcon(title) {
  const rule = ICON_RULES.find(({ pattern }) => pattern.test(title))
  return rule?.icon || 'fa-cog'
}

function buildContactUrl(title) {
  return `../../index.html?servico=${encodeURIComponent(title)}#contact`
}

function buildWhatsAppUrl(title) {
  const text = encodeURIComponent(`Olá! Gostaria de saber mais sobre o serviço "${title}".`)
  return `https://wa.me/${WHATSAPP}?text=${text}`
}

function renderServiceCard(service, index) {
  const featured = service.isFeatured
  const icon = service.icon || getServiceIcon(service.title)
  const delay = (index % 3) + 1
  const btnClass = featured ? 'btn-primary' : 'btn-outline'
  const features = Array.isArray(service.features) ? service.features : []

  return `
    <div class="service-page-card${featured ? ' featured' : ''} reveal reveal-delay-${delay}">
      ${featured ? '<div class="spc-badge">Mais procurado</div>' : ''}
      <div class="spc-icon"><i class="fas ${icon}"></i></div>
      <h3>${service.title}</h3>
      <p class="spc-desc">${service.description}</p>
      <div class="spc-price-block">
        <span class="spc-from">A partir de</span>
        <span class="spc-price" data-kz="${service.priceKz}" data-eur="${service.priceEur}">${service.priceKz}</span>
      </div>
      ${service.delivery ? `<p class="spc-delivery"><i class="fas fa-clock"></i> Entrega: ${service.delivery}</p>` : ''}
      <ul class="spc-features">
        ${features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
      </ul>
      <div class="spc-actions">
        <a href="${buildContactUrl(service.title)}" class="btn ${btnClass} spc-btn">Solicitar</a>
        <a href="${buildWhatsAppUrl(service.title)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline spc-btn-wa">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
      </div>
    </div>
  `
}

function renderServices(services) {
  const grid = document.getElementById('servicesGrid')
  if (!grid) return

  grid.innerHTML = services.map(renderServiceCard).join('')

  setTimeout(() => {
    document.querySelectorAll('#servicesGrid .reveal').forEach(el => revealObserver.observe(el))
    const savedCurrency = localStorage.getItem('currency') || 'kz'
    setCurrency(savedCurrency)
  }, 50)
}

async function loadServices() {
  try {
    const res = await fetch(`${API_URL}/services`)
    const services = await res.json()
    renderServices(Array.isArray(services) && services.length ? services : FALLBACK_SERVICES)
  } catch {
    renderServices(FALLBACK_SERVICES)
  }
}

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
const btnKz  = document.getElementById('btnKz')
const btnEur = document.getElementById('btnEur')

function setCurrency(currency) {
  document.querySelectorAll('.spc-price').forEach(el => {
    el.textContent = el.dataset[currency]
  })
  btnKz.classList.toggle('active',  currency === 'kz')
  btnEur.classList.toggle('active', currency === 'eur')
  localStorage.setItem('currency', currency)
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
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false')
      b.nextElementSibling.classList.remove('open')
    })
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true')
      answer.classList.add('open')
    }
  })
})

loadServices()
