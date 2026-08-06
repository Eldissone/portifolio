// admin.js — Lógica do Backoffice

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:3000';

const getImageUrl = (url) => (url?.startsWith('http') ? url : `${IMAGE_BASE}${url}`);

const TAB_TITLES = {
  projects: 'Gerir Projectos',
  services: 'Gerir Serviços',
  posts: 'Gerir Blog',
  books: 'Gerir Livros',
  orders: 'Pedidos',
};

let token = localStorage.getItem('admin_token');
let currentTab = 'projects';
let editingBookHasFile = false;

const loginOverlay = document.getElementById('loginOverlay');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tabButtons = document.querySelectorAll('.nav-btn[data-tab]');
const tabTitle = document.getElementById('tabTitle');
const addNewBtn = document.getElementById('addNewBtn');
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
const closeModal = document.querySelector('.close-modal');
const imageUpload = document.getElementById('imageUpload');
const imageUrlInput = document.getElementById('imageUrlInput');
const imagePreview = document.getElementById('imagePreview');
const downloadModal = document.getElementById('downloadModal');

const isUnauthorized = (res) => res.status === 401;

const resetAuth = (message = 'A tua sessão expirou. Faz login novamente.') => {
  token = null;
  localStorage.removeItem('admin_token');
  if (message) {
    loginError.textContent = message;
  }
  loginOverlay.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
};

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);

  if (isUnauthorized(res)) {
    resetAuth();
    throw new Error('unauthorized');
  }

  if (!res.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data;
};

const checkAuth = () => {
  if (token) {
    loginError.textContent = '';
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
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      checkAuth();
    } else {
      loginError.textContent = data.error || 'Erro ao entrar';
    }
  } catch {
    loginError.textContent = 'Erro ao conectar ao servidor';
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('admin_token');
  closeSidebar();
  checkAuth();
});

const adminMenuToggle = document.getElementById('adminMenuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');

const openSidebar = () => {
  adminDashboard?.classList.add('sidebar-open');
  adminMenuToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};

const closeSidebar = () => {
  adminDashboard?.classList.remove('sidebar-open');
  adminMenuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

adminMenuToggle?.addEventListener('click', () => {
  if (adminDashboard?.classList.contains('sidebar-open')) closeSidebar();
  else openSidebar();
});
sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

const setActiveTab = (tab) => {
  currentTab = tab;
  tabTitle.textContent = TAB_TITLES[tab] || tab;
  addNewBtn.classList.toggle('hidden', tab === 'orders');

  ['projects', 'services', 'posts', 'books', 'orders'].forEach((t) => {
    document.getElementById(`${t}Tab`)?.classList.toggle('hidden', t !== tab);
  });

  document.getElementById('projectFields')?.classList.toggle('hidden', tab !== 'projects');
  document.getElementById('serviceFields')?.classList.toggle('hidden', tab !== 'services');
  document.getElementById('postFields')?.classList.toggle('hidden', tab !== 'posts');
  document.getElementById('bookFields')?.classList.toggle('hidden', tab !== 'books');
  document.getElementById('mediaSection')?.classList.toggle('hidden', tab === 'orders');
  document.getElementById('formActions')?.classList.toggle('hidden', tab === 'orders');

  closeSidebar();
  loadData();
};

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setActiveTab(btn.dataset.tab);
  });
});

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const loadData = async () => {
  try {
    if (currentTab === 'projects') {
      renderProjects(await fetchJson(`${API_URL}/projects`));
    } else if (currentTab === 'services') {
      renderServices(await fetchJson(`${API_URL}/services`));
    } else if (currentTab === 'posts') {
      renderPosts(await fetchJson(`${API_URL}/posts/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      }));
    } else if (currentTab === 'books') {
      renderBooks(await fetchJson(`${API_URL}/books/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      }));
    } else if (currentTab === 'orders') {
      renderOrders(await fetchJson(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      }));
    }
  } catch (err) {
    if (err.message !== 'unauthorized') {
      console.error(err);
    }
  }
};

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderProjects = (projects) => {
  document.getElementById('projectsTableBody').innerHTML = projects
    .map(
      (p) => `
    <tr>
      <td>${p.imageUrl ? `<img src="${getImageUrl(p.imageUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${escapeHtml(p.title)}</strong></td>
      <td><span class="tag-category">${escapeHtml(p.category)}</span></td>
      <td>${escapeHtml((p.techStack || []).join(', '))}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" data-edit="${p.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" data-delete="${p.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
    )
    .join('');
};

const renderServices = (services) => {
  document.getElementById('servicesTableBody').innerHTML = services
    .map(
      (s) => `
    <tr>
      <td>${s.imageUrl ? `<img src="${getImageUrl(s.imageUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${escapeHtml(s.title)}</strong></td>
      <td>${escapeHtml(s.priceKz)}</td>
      <td>${escapeHtml(s.priceEur)}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" data-edit="${s.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" data-delete="${s.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
    )
    .join('');
};

const statusBadge = (status) =>
  `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status)}</span>`;

const renderPosts = (posts) => {
  const list = Array.isArray(posts) ? posts : [];
  document.getElementById('postsTableBody').innerHTML = list
    .map(
      (p) => `
    <tr>
      <td>${p.coverUrl ? `<img src="${getImageUrl(p.coverUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${escapeHtml(p.title)}</strong><br><small>${escapeHtml(p.slug)}</small></td>
      <td>${statusBadge(p.status)}</td>
      <td>${escapeHtml((p.tags || []).join(', '))}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" data-edit="${p.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" data-delete="${p.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
    )
    .join('');
};

const renderBooks = (books) => {
  const list = Array.isArray(books) ? books : [];
  document.getElementById('booksTableBody').innerHTML = list
    .map(
      (b) => `
    <tr>
      <td>${b.coverUrl ? `<img src="${getImageUrl(b.coverUrl)}" class="td-thumb">` : '-'}</td>
      <td><strong>${escapeHtml(b.title)}</strong><br><small>${escapeHtml(b.slug)}</small></td>
      <td>${b.isFree ? 'Grátis' : escapeHtml(b.priceKz || b.priceEur || '-')}</td>
      <td>${b.hasFile ? '<i class="fas fa-check" style="color:green"></i>' : '<i class="fas fa-times" style="color:#c00"></i>'}</td>
      <td>${statusBadge(b.status)}</td>
      <td class="actions-cell">
        <button class="btn-icon edit" data-edit="${b.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete" data-delete="${b.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
    )
    .join('');
};

const renderOrders = (orders) => {
  const list = Array.isArray(orders) ? orders : [];
  document.getElementById('ordersTableBody').innerHTML = list
    .map(
      (o) => `
    <tr>
      <td><code>${escapeHtml(o.id.slice(0, 8).toUpperCase())}</code></td>
      <td>${escapeHtml(o.customerName)}<br><small>${escapeHtml(o.customerEmail)}</small></td>
      <td>${escapeHtml(o.book?.title || '-')}</td>
      <td>${escapeHtml(o.method)}</td>
      <td>${statusBadge(o.status)}</td>
      <td class="actions-cell">
        ${o.status === 'pending' ? `<button class="btn-icon" title="Confirmar" data-order-action="paid" data-order-id="${o.id}"><i class="fas fa-check"></i></button>
        <button class="btn-icon delete" title="Rejeitar" data-order-action="rejected" data-order-id="${o.id}"><i class="fas fa-times"></i></button>` : ''}
        ${o.status === 'paid' ? `<button class="btn-icon" title="Reenviar link" data-order-action="resend" data-order-id="${o.id}"><i class="fas fa-link"></i></button>` : ''}
      </td>
    </tr>`
    )
    .join('');
};

document.querySelector('.admin-content')?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-edit]');
  const deleteBtn = e.target.closest('[data-delete]');
  const orderBtn = e.target.closest('[data-order-action]');

  if (editBtn) {
    await editItem(editBtn.dataset.edit);
  } else if (deleteBtn) {
    await deleteItem(deleteBtn.dataset.delete);
  } else if (orderBtn) {
    await handleOrderAction(orderBtn.dataset.orderId, orderBtn.dataset.orderAction);
  }
});

const showDownloadLink = (download) => {
  if (!download?.downloadUrl) return;
  document.getElementById('downloadLinkInput').value = download.downloadUrl;
  document.getElementById('downloadMeta').textContent = download.expiresAt
    ? `Expira: ${new Date(download.expiresAt).toLocaleString('pt-AO')}`
    : '';
  downloadModal.classList.remove('hidden');
};

const handleOrderAction = async (id, action) => {
  try {
    let body;
    if (action === 'resend') body = { action: 'resend' };
    else body = { status: action };

    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Falha na operação');
      return;
    }
    if (data.download) showDownloadLink(data.download);
    loadData();
  } catch {
    alert('Erro ao actualizar pedido');
  }
};

document.querySelector('.close-download-modal')?.addEventListener('click', () => {
  downloadModal.classList.add('hidden');
});

document.getElementById('copyDownloadLink')?.addEventListener('click', async () => {
  const input = document.getElementById('downloadLinkInput');
  await navigator.clipboard.writeText(input.value);
  alert('Link copiado');
});

const parseVideoEmbeds = (text) =>
  String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((url) => ({ url }));

const fillFormFields = (container, item, special = {}) => {
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    if (!input.name || input.name === 'id' || input.name === 'imageUrl') return;
    if (special[input.name] !== undefined) {
      input.value = special[input.name];
      return;
    }
    if (item[input.name] !== undefined && item[input.name] !== null) {
      if (input.name === 'techStack' || input.name === 'features' || input.name === 'tags') {
        input.value = Array.isArray(item[input.name]) ? item[input.name].join(', ') : item[input.name];
      } else if (input.name === 'isFree') {
        input.value = item.isFree ? 'true' : 'false';
      } else {
        input.value = item[input.name];
      }
    }
  });
};

const editItem = async (id) => {
  itemForm.reset();
  document.getElementById('itemIdInput').value = id;
  imagePreview.innerHTML = '';
  imageUrlInput.value = '';
  editingBookHasFile = false;

  let item;
  if (currentTab === 'projects') {
    const items = await fetchJson(`${API_URL}/projects`);
    item = items.find((i) => i.id === id);
  } else if (currentTab === 'services') {
    const items = await fetchJson(`${API_URL}/services`);
    item = items.find((i) => i.id === id);
  } else if (currentTab === 'posts') {
    const items = await fetchJson(`${API_URL}/posts/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    item = items.find((i) => i.id === id);
  } else if (currentTab === 'books') {
    const items = await fetchJson(`${API_URL}/books/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    item = items.find((i) => i.id === id);
  }

  if (!item) return;

  document.getElementById('modalTitle').textContent = `Editar ${TAB_TITLES[currentTab]}`;
  const cover = item.coverUrl || item.imageUrl;
  imageUrlInput.value = cover || '';
  if (cover) {
    imagePreview.innerHTML = `<img src="${getImageUrl(cover)}" style="max-width:100px; border-radius:8px; margin-top:10px;">`;
  }

  if (currentTab === 'projects') fillFormFields(document.getElementById('projectFields'), item);
  if (currentTab === 'services') fillFormFields(document.getElementById('serviceFields'), item);
  if (currentTab === 'posts') {
    const embeds = Array.isArray(item.videoEmbeds)
      ? item.videoEmbeds.map((v) => v.url || v).join('\n')
      : '';
    fillFormFields(document.getElementById('postFields'), item, { videoEmbeds: embeds });
  }
  if (currentTab === 'books') {
    editingBookHasFile = Boolean(item.hasFile);
    document.getElementById('pdfStatus').textContent = item.hasFile
      ? 'PDF carregado'
      : 'Sem ficheiro';
    fillFormFields(document.getElementById('bookFields'), item);
  }

  document.getElementById('projectFields')?.classList.toggle('hidden', currentTab !== 'projects');
  document.getElementById('serviceFields')?.classList.toggle('hidden', currentTab !== 'services');
  document.getElementById('postFields')?.classList.toggle('hidden', currentTab !== 'posts');
  document.getElementById('bookFields')?.classList.toggle('hidden', currentTab !== 'books');
  document.getElementById('mediaSection')?.classList.toggle('hidden', currentTab === 'orders');
  document.getElementById('formActions')?.classList.toggle('hidden', currentTab === 'orders');
  itemModal.classList.remove('hidden');
};

const deleteItem = async (id) => {
  if (!confirm('Tem a certeza?')) return;
  try {
    await fetchJson(`${API_URL}/${currentTab}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadData();
  } catch (err) {
    if (err.message !== 'unauthorized') {
      alert(err.message || 'Erro ao apagar');
    }
  }
};

window.editItem = editItem;
window.deleteItem = deleteItem;

const saveProjectImageUrl = async (projectId, imageUrl) => {
  const res = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: authHeaders(),
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
  if (currentTab === 'posts') formData.append('folder', 'blog');
  if (currentTab === 'books') formData.append('folder', 'books');

  try {
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (isUnauthorized(res)) {
      resetAuth();
      return;
    }
    if (!res.ok) {
      alert(data?.error || 'Erro no upload');
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

document.getElementById('pdfUpload')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const bookId = document.getElementById('itemIdInput').value;
  if (!file) return;
  if (!bookId) {
    alert('Guarda o livro primeiro e depois faz upload do PDF.');
    e.target.value = '';
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    document.getElementById('pdfStatus').textContent = 'A enviar...';
    const res = await fetch(`${API_URL}/books/${bookId}/file`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (isUnauthorized(res)) {
      resetAuth();
      return;
    }
    if (!res.ok) {
      alert(data?.error || 'Erro no upload do PDF');
      document.getElementById('pdfStatus').textContent = 'Falha no upload';
      return;
    }
    editingBookHasFile = true;
    document.getElementById('pdfStatus').textContent = 'PDF carregado';
    loadData();
  } catch {
    alert('Erro no upload do PDF');
  } finally {
    e.target.value = '';
  }
});

addNewBtn.addEventListener('click', () => {
  if (currentTab === 'orders') return;
  itemForm.reset();
  document.getElementById('itemIdInput').value = '';
  imageUrlInput.value = '';
  imagePreview.innerHTML = '';
  editingBookHasFile = false;
  const pdfStatus = document.getElementById('pdfStatus');
  if (pdfStatus) pdfStatus.textContent = 'Sem ficheiro — guarda primeiro, depois faz upload';
  document.getElementById('modalTitle').textContent = `Novo — ${TAB_TITLES[currentTab]}`;
  document.getElementById('projectFields')?.classList.toggle('hidden', currentTab !== 'projects');
  document.getElementById('serviceFields')?.classList.toggle('hidden', currentTab !== 'services');
  document.getElementById('postFields')?.classList.toggle('hidden', currentTab !== 'posts');
  document.getElementById('bookFields')?.classList.toggle('hidden', currentTab !== 'books');
  document.getElementById('mediaSection')?.classList.toggle('hidden', currentTab === 'orders');
  document.getElementById('formActions')?.classList.toggle('hidden', currentTab === 'orders');
  itemModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => itemModal.classList.add('hidden'));

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentTab === 'orders') return;

  const id = document.getElementById('itemIdInput').value;
  const imageUrl = imageUrlInput.value.trim();
  let body = {};
  let endpoint = currentTab;

  if (currentTab === 'projects') {
    const c = document.getElementById('projectFields');
    body = {
      title: c.querySelector('[name="title"]').value,
      category: c.querySelector('[name="category"]').value,
      description: c.querySelector('[name="description"]').value,
      overview: c.querySelector('[name="overview"]').value,
      challenge: c.querySelector('[name="challenge"]').value,
      solution: c.querySelector('[name="solution"]').value,
      role: c.querySelector('[name="role"]').value,
      techStack: c.querySelector('[name="techStack"]').value.split(',').map((s) => s.trim()).filter(Boolean),
      imageUrl,
      link: c.querySelector('[name="link"]').value,
    };
  } else if (currentTab === 'services') {
    const c = document.getElementById('serviceFields');
    body = {
      title: c.querySelector('[name="title"]').value,
      description: c.querySelector('[name="description"]').value,
      priceKz: c.querySelector('[name="priceKz"]').value,
      priceEur: c.querySelector('[name="priceEur"]').value,
      features: c.querySelector('[name="features"]').value,
    };
  } else if (currentTab === 'posts') {
    const c = document.getElementById('postFields');
    body = {
      title: c.querySelector('[name="title"]').value,
      slug: c.querySelector('[name="slug"]').value,
      excerpt: c.querySelector('[name="excerpt"]').value,
      content: c.querySelector('[name="content"]').value,
      status: c.querySelector('[name="status"]').value,
      tags: c.querySelector('[name="tags"]').value,
      videoEmbeds: parseVideoEmbeds(c.querySelector('[name="videoEmbeds"]').value),
      metaTitle: c.querySelector('[name="metaTitle"]').value,
      metaDescription: c.querySelector('[name="metaDescription"]').value,
      coverUrl: imageUrl,
    };
  } else if (currentTab === 'books') {
    const c = document.getElementById('bookFields');
    body = {
      title: c.querySelector('[name="title"]').value,
      slug: c.querySelector('[name="slug"]').value,
      description: c.querySelector('[name="description"]').value,
      priceKz: c.querySelector('[name="priceKz"]').value,
      priceEur: c.querySelector('[name="priceEur"]').value,
      isFree: c.querySelector('[name="isFree"]').value === 'true',
      status: c.querySelector('[name="status"]').value,
      tags: c.querySelector('[name="tags"]').value,
      coverUrl: imageUrl,
    };
  }

  try {
    const url = id ? `${API_URL}/${endpoint}/${id}` : `${API_URL}/${endpoint}`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    if (isUnauthorized(res)) {
      resetAuth();
      return;
    }

    if (res.ok) {
      const saved = await res.json().catch(() => null);
      itemModal.classList.add('hidden');
      if (currentTab === 'books' && saved?.id && !id) {
        document.getElementById('itemIdInput').value = saved.id;
        alert('Livro criado. Edita-o novamente para fazer upload do PDF.');
      }
      loadData();
    } else {
      const err = await res.json();
      alert(`Erro: ${err.error || 'Falha ao guardar'}`);
    }
  } catch {
    alert('Erro ao guardar');
  }
});

const themeToggles = document.querySelectorAll('.theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'light';

const setTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggles.forEach((btn) => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      }
    });
  } else {
    document.documentElement.classList.remove('dark');
    themeToggles.forEach((btn) => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    });
  }
};

setTheme(savedTheme);
themeToggles.forEach((btn) => {
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    setTheme(theme);
  });
});

checkAuth();
