// project.js — Página de Detalhes de Projecto

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
        });
    } else {
        document.documentElement.classList.remove('dark')
        themeToggles.forEach(btn => {
            const icon = btn.querySelector('i')
            if (icon) {
                icon.classList.remove('fa-sun')
                icon.classList.add('fa-moon')
            }
        });
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

// ===== DYNAMIC LOADING =====
const API_URL = 'http://localhost:3000/api';

async function loadProjectDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        window.location.href = '../../index.html';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/projects`);
        const projects = await res.json();
        const project = projects.find(p => p.id === projectId);

        if (!project) {
            console.error('Projecto não encontrado');
            return;
        }

        renderDetails(project);
    } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
    }
}

function renderDetails(project) {
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('projectCategory').textContent = project.category;
    document.getElementById('projectSummary').textContent = project.description;
    
    // Use overview or fallback to description
    document.getElementById('projectDescription').textContent = project.overview || project.description;
    
    // Update role if element exists
    const roleEl = document.querySelector('.sidebar-block p');
    if (roleEl) roleEl.textContent = project.role || 'Lead Developer';

    const mainImg = document.querySelector('#projectMainImage img');
    if (project.imageUrl) {
        mainImg.src = `http://localhost:3000${project.imageUrl}`;
        mainImg.alt = project.title;
    }

    const techList = document.getElementById('projectTechList');
    techList.innerHTML = project.techStack.map(t => `<li>${t}</li>`).join('');

    const visitBtn = document.getElementById('projectVisitBtn');
    if (project.link) {
        visitBtn.href = project.link;
    } else {
        visitBtn.style.display = 'none';
    }

    // Dynamic Challenge/Solution sections if needed
    if (project.challenge || project.solution) {
        const detailsText = document.querySelector('.details-text');
        detailsText.innerHTML = `
            <h2 class="section-title">Visão <span class="highlight">Geral</span></h2>
            <p>${project.overview || project.description}</p>
            
            ${project.challenge ? `
                <h2 class="section-title mt-4">O <span class="highlight">Desafio</span></h2>
                <p>${project.challenge}</p>
            ` : ''}
            
            ${project.solution ? `
                <h2 class="section-title mt-4">A <span class="highlight">Solução</span></h2>
                <p>${project.solution}</p>
            ` : ''}
        `;
    }

    document.title = `${project.title} | Eldissone Vilonga`;
}

loadProjectDetails();

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
