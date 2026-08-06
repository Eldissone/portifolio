import {
  initThemeAndNav,
  renderShareBar,
  setMeta,
  buildShareUrl,
} from './content-utils.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const params = new URLSearchParams(window.location.search);
const slug = params.get('slug');
const root = document.getElementById('bookRoot');

initThemeAndNav();

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

async function loadBook() {
  if (!slug) {
    root.innerHTML = '<p class="empty-state">Livro não especificado.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/books/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      root.innerHTML = '<p class="empty-state">Livro não encontrado.</p>';
      return;
    }
    const book = await res.json();
    const shareUrl = buildShareUrl(`/src/pages/livro.html?slug=${encodeURIComponent(book.slug)}`);

    setMeta({
      title: `${book.title} | Biblioteca`,
      description: book.description?.slice(0, 160) || '',
      image: book.coverUrl,
      url: shareUrl,
    });

    root.innerHTML = `
      <p><a href="biblioteca.html" class="nav-link">&larr; Voltar à biblioteca</a></p>
      ${book.coverUrl ? `<div class="book-cover"><img src="${escapeHtml(book.coverUrl)}" alt=""></div>` : ''}
      <div class="content-meta">
        ${(book.tags || []).map((t) => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('')}
      </div>
      <h1 class="book-title">${escapeHtml(book.title)}</h1>
      <div class="book-price-row">
        <span class="price-tag">${book.isFree ? 'Grátis' : escapeHtml(book.priceKz || '')}</span>
        ${!book.isFree && book.priceEur ? `<span class="content-meta">${escapeHtml(book.priceEur)}</span>` : ''}
      </div>
      <p class="article-excerpt">${escapeHtml(book.description || '')}</p>
      <div class="share-bar" id="shareBar"></div>
      ${
        book.isFree
          ? `<div class="download-box">
              <h3>Download gratuito</h3>
              <p>O link é temporário e tem usos limitados.</p>
              <button type="button" class="btn btn-primary" id="freeDownloadBtn">
                <i class="fas fa-download"></i> Descarregar PDF
              </button>
              <div id="freeResult"></div>
            </div>`
          : `<div class="order-box">
              <h3>Pedir acesso (pagamento manual)</h3>
              <p style="color:var(--muted);margin-bottom:1rem;font-size:0.95rem;">
                Preenche os dados. Depois de confirmares o pagamento, receberás o link de download.
              </p>
              <form id="orderForm">
                <div class="form-group">
                  <label>Nome</label>
                  <input type="text" name="customerName" required>
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" name="customerEmail" required>
                </div>
                <div class="form-group">
                  <label>Método de pagamento</label>
                  <select name="method" required>
                    <option value="multicaixa">Multicaixa</option>
                    <option value="transfer">Transferência bancária</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Criar pedido</button>
              </form>
              <div id="orderResult"></div>
            </div>`
      }
    `;

    renderShareBar(document.getElementById('shareBar'), {
      url: shareUrl,
      title: book.title,
    });

    if (book.isFree) {
      document.getElementById('freeDownloadBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('freeDownloadBtn');
        btn.disabled = true;
        try {
          const r = await fetch(`${API_URL}/books/${book.id}/free-download`, { method: 'POST' });
          const data = await r.json();
          if (!r.ok) {
            alert(data.error || 'Erro ao gerar download');
            btn.disabled = false;
            return;
          }
          document.getElementById('freeResult').innerHTML = `
            <div class="order-result">
              <p>Link gerado. <a href="download.html?token=${encodeURIComponent(data.token)}">Abrir download</a></p>
            </div>`;
          window.location.href = `download.html?token=${encodeURIComponent(data.token)}`;
        } catch {
          alert('Erro ao gerar download');
          btn.disabled = false;
        }
      });
    } else {
      document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const body = {
          bookId: book.id,
          customerName: form.customerName.value.trim(),
          customerEmail: form.customerEmail.value.trim(),
          method: form.method.value,
        };
        try {
          const r = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await r.json();
          if (!r.ok) {
            alert(data.error || 'Erro ao criar pedido');
            return;
          }
          const pay = data.payment || {};
          document.getElementById('orderResult').innerHTML = `
            <div class="order-result">
              <p><strong>Pedido criado:</strong> ${escapeHtml(pay.orderRef || data.order.id.slice(0, 8))}</p>
              <p>${escapeHtml(pay.message || '')}</p>
              <p>${escapeHtml(pay.details || '')}</p>
              ${pay.whatsappUrl ? `<p><a class="btn btn-outline btn-sm" href="${escapeHtml(pay.whatsappUrl)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Abrir WhatsApp</a></p>` : ''}
              <p style="margin-top:0.75rem;font-size:0.9rem;">Após o pagamento, o link será enviado manualmente.</p>
            </div>`;
          form.reset();
        } catch {
          alert('Erro ao criar pedido');
        }
      });
    }
  } catch {
    root.innerHTML = '<p class="empty-state">Erro ao carregar o livro.</p>';
  }
}

loadBook();
