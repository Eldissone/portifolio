import { initThemeAndNav } from './content-utils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
let page = 1;

initThemeAndNav();

const grid = document.getElementById('postsGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const tagInput = document.getElementById('tagInput');

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function loadPosts() {
  const q = searchInput.value.trim();
  const tag = tagInput.value.trim();
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (q) params.set('q', q);
  if (tag) params.set('tag', tag);

  grid.innerHTML = '<p class="content-loading">A carregar publicações...</p>';

  try {
    const res = await fetch(`${API_URL}/posts?${params}`);
    const data = await res.json();
    const items = data.items || [];

    if (!items.length) {
      grid.innerHTML = '<p class="empty-state">Ainda não há publicações.</p>';
      pagination.innerHTML = '';
      return;
    }

    grid.innerHTML = items
      .map(
        (p) => `
      <a class="content-card" href="blog-post.html?slug=${encodeURIComponent(p.slug)}">
        <div class="content-card-img">
          ${p.coverUrl ? `<img src="${escapeHtml(p.coverUrl)}" alt="">` : ''}
        </div>
        <div class="content-card-body">
          <div class="content-meta">
            ${(p.tags || []).slice(0, 3).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
            ${p.publishedAt ? `<span>${new Date(p.publishedAt).toLocaleDateString('pt-AO')}</span>` : ''}
          </div>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.excerpt || '')}</p>
        </div>
      </a>`
      )
      .join('');

    const totalPages = data.totalPages || 1;
    pagination.innerHTML = `
      <button class="btn btn-outline btn-sm" id="prevPage" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
      <span class="content-meta">Página ${page} / ${totalPages}</span>
      <button class="btn btn-outline btn-sm" id="nextPage" ${page >= totalPages ? 'disabled' : ''}>Seguinte</button>
    `;
    document.getElementById('prevPage')?.addEventListener('click', () => {
      page -= 1;
      loadPosts();
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
      page += 1;
      loadPosts();
    });
  } catch {
    grid.innerHTML = '<p class="empty-state">Erro ao carregar o blog.</p>';
  }
}

let debounce;
const schedule = () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    page = 1;
    loadPosts();
  }, 300);
};

searchInput.addEventListener('input', schedule);
tagInput.addEventListener('input', schedule);
loadPosts();
