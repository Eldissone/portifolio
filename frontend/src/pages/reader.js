const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const root = document.getElementById('readerRoot');

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function run() {
  if (!token) {
    root.innerHTML = '<h3>Link inválido</h3><p>Token em falta.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/downloads/${encodeURIComponent(token)}`);
    const data = await res.json();

    if (!res.ok) {
      root.innerHTML = `<h3>Leitura indisponível</h3><p>${escapeHtml(data.error || 'Erro')}</p>
        <p><a href="biblioteca.html">Voltar à biblioteca</a></p>`;
      return;
    }

    document.title = `${escapeHtml(data.book?.title || 'Leitor PDF')} | Leitor PDF`;

    root.innerHTML = `
      <div class="reader-shell">
        <div class="reader-toolbar">
          <div>
            <h3 style="margin-bottom:0.25rem;">${escapeHtml(data.book?.title || 'Leitor PDF')}</h3>
            <p class="content-meta">Usos restantes: ${data.remainingUses ?? '—'}</p>
          </div>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <a class="btn btn-outline btn-sm" href="download.html?token=${encodeURIComponent(token)}">
              <i class="fas fa-download"></i> Download
            </a>
            <a class="btn btn-primary btn-sm" href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">
              <i class="fas fa-up-right-from-square"></i> Abrir externo
            </a>
          </div>
        </div>
        <iframe
          class="reader-frame"
          src="${escapeHtml(data.url)}#toolbar=1&navpanes=0&scrollbar=1"
          title="${escapeHtml(data.book?.title || 'PDF')}"
        ></iframe>
      </div>
    `;
  } catch {
    root.innerHTML = '<h3>Erro</h3><p>Não foi possível abrir o leitor.</p>';
  }
}

run();
