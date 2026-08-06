const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const root = document.getElementById('downloadRoot');

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
      root.innerHTML = `<h3>Download indisponível</h3><p>${escapeHtml(data.error || 'Erro')}</p>
        <p><a href="biblioteca.html">Voltar à biblioteca</a></p>`;
      return;
    }

    root.innerHTML = `
      <h3>${escapeHtml(data.book?.title || 'Download pronto')}</h3>
      <p>O ficheiro abre num link temporário. Usos restantes: ${data.remainingUses ?? '—'}</p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <a class="btn btn-primary" href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-download"></i> Abrir PDF
        </a>
        <a class="btn btn-outline" href="reader.html?token=${encodeURIComponent(token)}">
          <i class="fas fa-book-open"></i> Ler no site
        </a>
      </div>
      <p class="form-hint" style="margin-top:1rem;">Se o download não iniciar, usa o botão acima.</p>
    `;

    // Attempt auto-open
    window.location.href = data.url;
  } catch {
    root.innerHTML = '<h3>Erro</h3><p>Não foi possível processar o download.</p>';
  }
}

run();
