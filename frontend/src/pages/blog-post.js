import {
  initThemeAndNav,
  renderShareBar,
  renderEmbeds,
  sanitizeHtml,
  setMeta,
  buildShareUrl,
} from './content-utils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const root = document.getElementById('articleRoot');

initThemeAndNav();

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function loadPost() {
  if (!slug) {
    root.innerHTML = '<p class="empty-state">Artigo não especificado.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      root.innerHTML = '<p class="empty-state">Artigo não encontrado.</p>';
      return;
    }
    const post = await res.json();
    const shareUrl = buildShareUrl(`/src/pages/blog-post.html?slug=${encodeURIComponent(post.slug)}`);

    setMeta({
      title: `${post.metaTitle || post.title} | Eldissone Vilonga`,
      description: post.metaDescription || post.excerpt || '',
      image: post.coverUrl,
      url: shareUrl,
    });

    root.innerHTML = `
      <p><a href="blog.html" class="nav-link">&larr; Voltar ao blog</a></p>
      ${post.coverUrl ? `<div class="article-cover"><img src="${escapeHtml(post.coverUrl)}" alt=""></div>` : ''}
      <div class="content-meta">
        ${(post.tags || []).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
        ${post.publishedAt ? `<span>${new Date(post.publishedAt).toLocaleDateString('pt-AO')}</span>` : ''}
      </div>
      <h1 class="article-title">${escapeHtml(post.title)}</h1>
      ${post.excerpt ? `<p class="article-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
      <div class="share-bar" id="shareBar"></div>
      <div class="article-body">${sanitizeHtml(post.content)}</div>
      ${renderEmbeds(post.videoEmbeds)}
    `;

    renderShareBar(document.getElementById('shareBar'), {
      url: shareUrl,
      title: post.title,
    });
  } catch {
    root.innerHTML = '<p class="empty-state">Erro ao carregar o artigo.</p>';
  }
}

loadPost();
