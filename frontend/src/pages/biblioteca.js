import { initThemeAndNav } from './content-utils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
let page = 1;

initThemeAndNav();

const grid = document.getElementById('booksGrid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const filterFree = document.getElementById('filterFree');

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function loadBooks() {
  const q = searchInput.value.trim();
  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (q) params.set('q', q);
  if (filterFree.value === '1') params.set('free', '1');

  grid.innerHTML = '<p class="content-loading">A carregar livros...</p>';

  try {
    const res = await fetch(`${API_URL}/books?${params}`);
    const data = await res.json();
    const items = data.items || [];

    if (!items.length) {
      grid.innerHTML = '<p class="empty-state">Ainda não há livros publicados.</p>';
      pagination.innerHTML = '';
      return;
    }

    grid.innerHTML = items
      .map(
        (b) => `
      <a class="content-card" href="livro.html?slug=${encodeURIComponent(b.slug)}">
        <div class="content-card-img">
          ${b.coverUrl ? `<img src="${escapeHtml(b.coverUrl)}" alt="">` : ''}
        </div>
        <div class="content-card-body">
          <div class="content-meta">
            ${(b.tags || []).slice(0, 3).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
          </div>
          <h3>${escapeHtml(b.title)}</h3>
          <p>${escapeHtml((b.description || '').slice(0, 140))}${(b.description || '').length > 140 ? '…' : ''}</p>
          <span class="price-tag">${b.isFree ? 'Grátis' : escapeHtml(b.priceKz || b.priceEur || 'Pago')}</span>
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
      loadBooks();
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
      page += 1;
      loadBooks();
    });
  } catch {
    grid.innerHTML = '<p class="empty-state">Erro ao carregar a biblioteca.</p>';
  }
}

let debounce;
searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    page = 1;
    loadBooks();
  }, 300);
});
filterFree.addEventListener('change', () => {
  page = 1;
  loadBooks();
});

loadBooks();
