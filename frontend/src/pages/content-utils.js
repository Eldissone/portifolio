const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.eldissone.com';

export function buildShareUrl(path) {
  const clean = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  return clean;
}

export function renderShareBar(container, { url, title }) {
  if (!container) return;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || '');

  container.innerHTML = `
    <span>Partilhar</span>
    <a class="share-btn" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
    <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
    <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
    <a class="share-btn" href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer" aria-label="X"><i class="fab fa-x-twitter"></i></a>
    <button type="button" class="share-btn" id="copyShareLink" aria-label="Copiar link"><i class="fas fa-link"></i></button>
  `;

  container.querySelector('#copyShareLink')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(url);
    alert('Link copiado');
  });
}

export function youtubeEmbed(url) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    else id = u.searchParams.get('v');
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

export function vimeoEmbed(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const id = parts.pop();
    if (!id || !/^\d+$/.test(id)) return null;
    return `https://player.vimeo.com/video/${id}`;
  } catch {
    return null;
  }
}

export function renderEmbeds(embeds) {
  if (!Array.isArray(embeds) || !embeds.length) return '';
  return embeds
    .map((item) => {
      const url = item.url || item;
      const provider = item.provider || (String(url).includes('vimeo') ? 'vimeo' : 'youtube');
      const src = provider === 'vimeo' ? vimeoEmbed(url) : youtubeEmbed(url);
      if (!src) return '';
      return `<div class="embed-frame"><iframe src="${src}" allowfullscreen loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    })
    .join('');
}

/** Very light sanitization: strip script tags */
export function sanitizeHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

export function initThemeAndNav() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  menuToggle?.addEventListener('click', () => {
    const open = navMenu.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  const themeToggles = document.querySelectorAll('.theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  const apply = (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    themeToggles.forEach((btn) => {
      const icon = btn.querySelector('i');
      if (!icon) return;
      icon.classList.toggle('fa-moon', theme !== 'dark');
      icon.classList.toggle('fa-sun', theme === 'dark');
    });
  };
  apply(savedTheme);
  themeToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      apply(next);
    });
  });

  window.addEventListener('load', () => {
    document.querySelector('.loading-screen')?.classList.add('hidden');
  });
  setTimeout(() => document.querySelector('.loading-screen')?.classList.add('hidden'), 800);
}

export function setMeta({ title, description, image, url }) {
  if (title) {
    document.title = title;
    setMetaTag('property', 'og:title', title);
    setMetaTag('name', 'twitter:title', title);
  }
  if (description) {
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:description', description);
    setMetaTag('name', 'twitter:description', description);
  }
  if (image) {
    setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'twitter:image', image);
  }
  if (url) {
    setMetaTag('property', 'og:url', url);
  }
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('property', 'og:type', 'article');
}

function setMetaTag(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}
