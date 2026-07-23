// admin.js — Lógica do Backoffice

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:3000';

// Se a URL já é absoluta (Supabase), usa directamente; caso contrário prefija com IMAGE_BASE
const getImageUrl = (url) => url?.startsWith('http') ? url : `${IMAGE_BASE}${url}`;

// State
let token = localStorage.getItem('admin_token');
let currentTab = 'projects';

// Elements
const loginOverlay = document.getElementById('loginOverlay');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tabButtons = document.querySelectorAll('.nav-btn[data-tab]');
const projectsTab = document.getElementById('projectsTab');
const servicesTab = document.getElementById('servicesTab');
const tabTitle = document.getElementById('tabTitle');
const projectsTableBody = document.getElementById('projectsTableBody');
const addNewBtn = document.getElementById('addNewBtn');
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const closeModal = document.querySelector('.close-modal');

// ===== AUTH =====
const checkAuth = () => {
  if (token) {
    loginOverlay.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    loadData();
  } else {
    loginOverlay.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
  }
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPass').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      checkAuth();
    } else {
      loginError.textContent = data.error || 'Erro ao entrar';
    }
  } catch (err) {
    loginError.textContent = 'Erro ao conectar ao servidor';
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('admin_token');
  checkAuth();
});

// ===== TAB SWITCHING =====
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentTab = btn.dataset.tab;
    tabTitle.textContent = currentTab === 'projects' ? 'Gerir Projectos' : 'Gerir Serviços';
    
    projectsTab.classList.toggle('hidden', currentTab !== 'projects');
    servicesTab.classList.toggle('hidden', currentTab !== 'services');
    
    loadData();
  });
});

// ===== DATA LOADING =====
const loadData = async () => {
  if (currentTab === 'projects') {
    const res = await fetch(`${API_URL}/projects`);
    const projects = await res.json();
    renderProjects(projects);
  } else {
    const res = await fetch(`${API_URL}/services`);
    const services = await res.json();
    renderServices(services);
  }
};

const renderProjects = (projects) => {
  projectsTableBody.innerHTML = projects.map(p => `
    <tr>
      <td>${p.imageUrl ? `<img src="${getImageUrl(p.imageUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${p.title}</strong></td>
      <td><span class="tag-category">${p.category}</span></td>
      <td>${p.techStack.join(', ')}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" onclick="editItem('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="deleteItem('${p.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
};

const renderServices = (services) => {
  const servicesTableBody = document.getElementById('servicesTableBody');
  servicesTableBody.innerHTML = services.map(s => `
    <tr>
      <td>${s.imageUrl ? `<img src="${getImageUrl(s.imageUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${s.title}</strong></td>
      <td>${s.priceKz}</td>
      <td>${s.priceEur}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" onclick="editItem('${s.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" onclick="deleteItem('${s.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
};

const editItem = async (id) => {
  const res = await fetch(`${API_URL}/${currentTab}`);
  const items = await res.json();
  const item = items.find(i => i.id === id);
  if (!item) return;

  itemForm.reset();
  document.getElementById('itemIdInput').value = item.id;
  document.getElementById('modalTitle').textContent = `Editar ${currentTab === 'projects' ? 'Projecto' : 'Serviço'}`;
  
  // Fill common fields
  imageUrlInput.value = item.imageUrl || '';
  if (item.imageUrl) {
    imagePreview.innerHTML = `<img src="${getImageUrl(item.imageUrl)}" style="max-width:100px; border-radius:8px; margin-top:10px;">`;
  } else {
    imagePreview.innerHTML = '';
  }

  // Fill specific fields (imageUrl e id são tratados acima)
  const inputs = itemForm.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (!input.name || input.name === 'id' || input.name === 'imageUrl') return;
    if (item[input.name] !== undefined && item[input.name] !== null) {
      if (input.name === 'techStack' || input.name === 'features') {
        input.value = Array.isArray(item[input.name]) ? item[input.name].join(', ') : item[input.name];
      } else {
        input.value = item[input.name];
      }
    }
  });

  document.getElementById('projectFields').classList.toggle('hidden', currentTab !== 'projects');
  document.getElementById('serviceFields').classList.toggle('hidden', currentTab !== 'services');
  itemModal.classList.remove('hidden');
};

const deleteItem = async (id) => {
  if (!confirm('Tem a certeza?')) return;
  await fetch(`${API_URL}/${currentTab}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  loadData();
};

window.editItem = editItem;
window.deleteItem = deleteItem;

// ===== IMAGE UPLOAD =====
const imageUpload = document.getElementById('imageUpload');
const imageUrlInput = document.getElementById('imageUrlInput');
const imagePreview = document.getElementById('imagePreview');

const saveProjectImageUrl = async (projectId, imageUrl) => {
  const res = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao guardar imagem no projecto');
  }
};

imageUpload.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Erro no upload');
      return;
    }
    if (data.imageUrl) {
      imageUrlInput.value = data.imageUrl;
      imagePreview.innerHTML = `<img src="${getImageUrl(data.imageUrl)}" style="max-width:100px; border-radius:8px; margin-top:10px;">`;

      const projectId = document.getElementById('itemIdInput').value;
      if (currentTab === 'projects' && projectId) {
        await saveProjectImageUrl(projectId, data.imageUrl);
        loadData();
      }
    }
  } catch (err) {
    alert(err.message || 'Erro no upload');
  } finally {
    e.target.value = '';
  }
});

// ===== MODAL LOGIC =====
addNewBtn.addEventListener('click', () => {
  itemForm.reset();
  // Limpar campos ocultos explicitamente para garantir que é um INSERT e não UPDATE
  document.getElementById('itemIdInput').value = '';
  document.getElementById('imageUrlInput').value = '';
  
  imagePreview.innerHTML = '';
  document.getElementById('modalTitle').textContent = `Novo ${currentTab === 'projects' ? 'Projecto' : 'Serviço'}`;
  
  document.getElementById('projectFields').classList.toggle('hidden', currentTab !== 'projects');
  document.getElementById('serviceFields').classList.toggle('hidden', currentTab !== 'services');
  
  itemModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => itemModal.classList.add('hidden'));

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('itemIdInput').value;
  const imageUrl = imageUrlInput.value.trim();

  const projectContainer = document.getElementById('projectFields');
  const serviceContainer = document.getElementById('serviceFields');

  let body = {};
  if (currentTab === 'projects') {
    body = {
      title: projectContainer.querySelector('[name="title"]').value,
      category: projectContainer.querySelector('[name="category"]').value,
      description: projectContainer.querySelector('[name="description"]').value,
      overview: projectContainer.querySelector('[name="overview"]').value,
      challenge: projectContainer.querySelector('[name="challenge"]').value,
      solution: projectContainer.querySelector('[name="solution"]').value,
      role: projectContainer.querySelector('[name="role"]').value,
      techStack: projectContainer.querySelector('[name="techStack"]').value.split(',').map(s => s.trim()),
      imageUrl,
      link: projectContainer.querySelector('[name="link"]').value
    };
  } else {
    body = {
      title: serviceContainer.querySelector('[name="title"]').value,
      description: serviceContainer.querySelector('[name="description"]').value,
      priceKz: serviceContainer.querySelector('[name="priceKz"]').value,
      priceEur: serviceContainer.querySelector('[name="priceEur"]').value,
      features: serviceContainer.querySelector('[name="features"]').value,
    };
  }

  try {
    const url = id ? `${API_URL}/${currentTab}/${id}` : `${API_URL}/${currentTab}`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      itemModal.classList.add('hidden');
      loadData();
    } else {
      const err = await res.json();
      alert(`Erro: ${err.error || 'Falha ao guardar'}`);
    }
  } catch (err) {
    alert('Erro ao guardar');
  }
});

// ===== THEME =====
const themeToggles = document.querySelectorAll('.theme-toggle');
const savedTheme  = localStorage.getItem('theme') || 'light';

const setTheme = (theme) => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        themeToggles.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        });
    } else {
        document.documentElement.classList.remove('dark');
        themeToggles.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }
};

setTheme(savedTheme);

themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        setTheme(theme);
    });
});

window.deleteItem = deleteItem;

// Initial Check
checkAuth();


