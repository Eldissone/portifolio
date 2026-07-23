import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')


// ============================================
// CONFIGURAÇÕES DO FORMULÁRIO DE CONTATO
// ============================================

const CONFIG = {
    whatsapp: '244933170799', // Seu número
    emailPrimary: 'eldissonev@gmail.com', // Email principal
    emailSecondary: 'evilonga.mentoria33@gmail.com', // Email secundário
    autoCloseInstructions: 15000, // Tempo para fechar instruções
    showConfetti: true, // Mostrar efeitos
    enableAutoWhatsApp: true, // Abrir WhatsApp automaticamente
    enableAutoEmail: true, // Abrir Email automaticamente
    whatsappDelay: 500, // Delay para WhatsApp
    emailDelay: 1500, // Delay para Email
    successMessageDelay: 2000 // Delay para mensagem de sucesso
};

// ============================================
// INICIALIZAÇÃO DO FORMULÁRIO
// ============================================

// Aguardar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    if (!contactForm) {
        console.error('Formulário de contato não encontrado!');
        return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Adicionar evento de submit
    contactForm.addEventListener('submit', handleFormSubmit);

    // Adicionar validação em tempo real
    addRealTimeValidation(contactForm);

    prefillServiceFromUrl(contactForm);
});

function prefillServiceFromUrl(contactForm) {
    const params = new URLSearchParams(window.location.search);
    const servico = params.get('servico');
    if (!servico) return;

    const messageField = contactForm.querySelector('textarea[name="message"]');
    if (messageField && !messageField.value.trim()) {
        messageField.value = `Olá! Gostaria de solicitar o serviço "${servico}".\n\n`;
        messageField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (window.location.hash === '#contact') {
        requestAnimationFrame(() => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

// ============================================
// FUNÇÃO PRINCIPAL DE ENVIO
// ============================================

async function handleFormSubmit(e) {
    e.preventDefault();

    const contactForm = e.target;
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    // Coletar valores do formulário
    const name = contactForm.querySelector('input[name="name"]').value.trim();
    const email = contactForm.querySelector('input[name="email"]').value.trim();
    const message = contactForm.querySelector('textarea[name="message"]').value.trim();

    // Validar campos
    if (!validateForm(name, email, message)) {
        return;
    }

    // Desabilitar botão e mostrar loading
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando envio...';
    submitBtn.disabled = true;

    try {
        // 1. Preparar mensagem para WhatsApp
        const whatsappMessage = prepareWhatsAppMessage(name, email, message);

        // 2. Preparar email
        const emailData = prepareEmailData(name, email, message);

        // 3. Mostrar instruções para o usuário
        showInstructions(contactForm);

        // 4. Processar envios baseado na configuração
        await processSubmissions(whatsappMessage, emailData, contactForm);

    } catch (error) {
        console.error('Erro no envio:', error);
        showMessage(contactForm, '❌ Ocorreu um erro. Tente novamente ou entre em contato diretamente.', 'error');
    } finally {
        // Restaurar botão após 3 segundos
        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 3000);
    }
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

function validateForm(name, email, message) {
    const contactForm = document.getElementById('contactForm');

    // Validar campos obrigatórios
    if (!name || !email || !message) {
        showMessage(contactForm, 'Por favor, preencha todos os campos.', 'error');
        return false;
    }

    // Validar email
    if (!isValidEmail(email)) {
        showMessage(contactForm, 'Por favor, insira um email válido.', 'error');
        return false;
    }

    // Validar tamanho da mensagem
    if (message.length < 10) {
        showMessage(contactForm, 'A mensagem deve ter pelo menos 10 caracteres.', 'error');
        return false;
    }

    if (message.length > 1000) {
        showMessage(contactForm, 'A mensagem não pode exceder 1000 caracteres.', 'error');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function addRealTimeValidation(form) {
    const emailInput = form.querySelector('input[name="email"]');
    const messageTextarea = form.querySelector('textarea[name="message"]');

    // Validar email enquanto digita
    emailInput.addEventListener('blur', () => {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
            showMessage(form, 'Email inválido. Exemplo: nome@exemplo.com', 'error');
        }
    });

    // Contador de caracteres para a mensagem
    messageTextarea.addEventListener('input', () => {
        const charCount = messageTextarea.value.length;
        const counter = form.querySelector('.char-counter') || createCharCounter(form);

        counter.textContent = `${charCount}/1000 caracteres`;

        if (charCount > 1000) {
            counter.style.color = '#ff4444';
        } else if (charCount > 800) {
            counter.style.color = '#ff9800';
        } else {
            counter.style.color = '#4CAF50';
        }
    });
}

function createCharCounter(form) {
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.style.cssText = `
        font-size: 0.8rem;
        text-align: right;
        margin-top: 0.5rem;
        color: #4CAF50;
    `;

    const textareaGroup = form.querySelector('.form-group:has(textarea)');
    textareaGroup.appendChild(counter);

    return counter;
}

// ============================================
// FUNÇÕES DE PREPARAÇÃO DE MENSAGENS
// ============================================

function prepareWhatsAppMessage(name, email, message) {
    const timestamp = new Date().toLocaleString('pt-AO', {
        timeZone: 'Africa/Luanda',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `📱 *CONTATO DO PORTFÓLIO - ELDISSONE VILONGA* 📱

        👤 *Nome:* ${name}
        📧 *Email:* ${email}

        💬 *Mensagem:*
        ${message}

        📅 *Data/Hora:* ${timestamp}
        🌍 *Enviado de:* ${window.location.hostname}

        _Esta mensagem foi enviada automaticamente do seu portfólio online._`;
}

async function prepareEmailData(name, email, message) {
    const timestamp = new Date().toLocaleString('pt-AO', {
        timeZone: 'Africa/Luanda',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    return {
        to: CONFIG.emailPrimary,
        cc: CONFIG.emailSecondary,
        subject: `📬 Contato Portfólio: ${name}`,
        body: `CONTATO DO PORTFÓLIO - ELDISSONE VILONGA

                Nome: ${name}
                Email: ${email}
                Data: ${timestamp}
                IP: ${await getClientIP()}
                Navegador: ${navigator.userAgent}

                Mensagem:
                ${message}

                ---
                Este email foi enviado automaticamente do seu portfólio online.
                URL: ${window.location.href}
                Responda diretamente para: ${email}
                `
    };
}

// Função para obter IP do cliente (apenas para registro)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'Não disponível';
    }
}

// ============================================
// FUNÇÕES DE PROCESSAMENTO DE ENVIO
// ============================================

async function processSubmissions(whatsappMessage, emailData, contactForm) {
    const promises = [];

    // WhatsApp
    if (CONFIG.enableAutoWhatsApp) {
        promises.push(new Promise(resolve => {
            setTimeout(() => {
                try {
                    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    resolve(true);
                } catch (error) {
                    console.error('Erro ao abrir WhatsApp:', error);
                    resolve(false);
                }
            }, CONFIG.whatsappDelay);
        }));
    }

    // Email
    if (CONFIG.enableAutoEmail) {
        promises.push(new Promise(resolve => {
            setTimeout(() => {
                try {
                    const mailtoLink = `mailto:${emailData.to}?cc=${encodeURIComponent(emailData.cc)}&subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
                    window.open(mailtoLink, '_blank');
                    resolve(true);
                } catch (error) {
                    console.error('Erro ao abrir Email:', error);
                    resolve(false);
                }
            }, CONFIG.emailDelay);
        }));
    }

    // Aguardar todos os envios
    await Promise.all(promises);

    // Mostrar sucesso
    setTimeout(() => {
        showMessage(contactForm, '✅ WhatsApp e Email abertos! Por favor, envie as mensagens.', 'success');

        // Disparar confetti se configurado
        if (CONFIG.showConfetti) {
            triggerConfetti();
        }

        // Limpar formulário
        contactForm.reset();

        // Remover contador de caracteres
        const counter = contactForm.querySelector('.char-counter');
        if (counter) counter.remove();

    }, CONFIG.successMessageDelay);
}

// ============================================
// FUNÇÕES DE INTERFACE DO USUÁRIO
// ============================================

function showMessage(formElement, text, type = 'info') {
    // Remover mensagens anteriores
    const oldMessages = formElement.querySelectorAll('.form-message');
    oldMessages.forEach(msg => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    });

    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    messageDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${text}</span>
        ${type !== 'success' ? '<button class="close-message">&times;</button>' : ''}
    `;

    formElement.appendChild(messageDiv);

    // Adicionar botão de fechar para mensagens de erro/aviso
    if (type !== 'success') {
        const closeBtn = messageDiv.querySelector('.close-message');
        closeBtn.addEventListener('click', () => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        });

        // Auto-remover após tempo
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, type === 'error' ? 8000 : 5000);
    }
}

function showInstructions(formElement) {
    // Remover instruções anteriores
    const oldInstructions = formElement.querySelectorAll('.form-instructions');
    oldInstructions.forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 100);
    });

    const instructions = document.createElement('div');
    instructions.className = 'form-instructions';

    const stepsContent = [];

    if (CONFIG.enableAutoWhatsApp) {
        stepsContent.push(`
            <div class="step">
                <span class="step-number">1</span>
                <p><strong>WhatsApp</strong> abrirá automaticamente</p>
                <small>A mensagem já está pré-preenchida - apenas clique "Enviar"</small>
            </div>
        `);
    }

    if (CONFIG.enableAutoEmail) {
        stepsContent.push(`
            <div class="step">
                <span class="step-number">${CONFIG.enableAutoWhatsApp ? '2' : '1'}</span>
                <p><strong>Email</strong> abrirá automaticamente</p>
                <small>Revise e clique em "Enviar" no seu cliente de email</small>
            </div>
        `);
    }

    instructions.innerHTML = `
        <div class="instructions-header">
            <i class="fas fa-info-circle"></i>
            <h4>📋 Instruções de Envio</h4>
            <button class="close-instructions">&times;</button>
        </div>
        <div class="steps">
            ${stepsContent.join('')}
            <div class="step">
                <span class="step-number">${(CONFIG.enableAutoWhatsApp ? 1 : 0) + (CONFIG.enableAutoEmail ? 1 : 0) + 1}</span>
                <p>Volte para esta página</p>
                <small>O formulário será limpo automaticamente</small>
            </div>
        </div>
        <div class="note">
            <i class="fas fa-lightbulb"></i>
            <p>As abas abrirão automaticamente. Se bloquear pop-ups, permita para este site.</p>
        </div>
    `;

    formElement.appendChild(instructions);

    // Adicionar evento para fechar instruções
    const closeBtn = instructions.querySelector('.close-instructions');
    closeBtn.addEventListener('click', () => {
        instructions.style.opacity = '0';
        setTimeout(() => instructions.remove(), 300);
    });

    // Auto-remover instruções após tempo configurado
    if (CONFIG.autoCloseInstructions) {
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.style.opacity = '0';
                setTimeout(() => instructions.remove(), 300);
            }
        }, CONFIG.autoCloseInstructions);
    }
}

// ============================================
// FUNÇÃO CONFETTI (EFEITO VISUAL)
// ============================================

function triggerConfetti() {
    // Verificar se a biblioteca já está carregada
    if (typeof confetti === 'function') {
        fireConfetti();
    } else {
        // Carregar a biblioteca dinamicamente
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
        script.onload = fireConfetti;
        script.onerror = () => console.log('Confetti não carregado');
        document.head.appendChild(script);
    }
}

function fireConfetti() {
    if (typeof confetti !== 'function') return;

    // Configurações do confetti
    const defaults = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    };

    // Primeira explosão (centro)
    confetti({
        ...defaults,
        colors: ['#ffffffff', '#ff6584', '#ffffff']
    });

    // Explosões laterais
    setTimeout(() => {
        confetti({
            ...defaults,
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#ffffffff']
        });

        confetti({
            ...defaults,
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#ff6584']
        });
    }, 250);

    // Explosão final
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#ffffffff', '#ff6584', '#4CAF50', '#ffffffff']
        });
    }, 500);
}

// ============================================
// ESTILOS CSS ADICIONAIS (Adicione ao seu CSS)
// ============================================

const additionalStyles = `
/* Estilos para o formulário de contato */
.form-message {
    padding: 1rem;
    border-radius: 10px;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: slideIn 0.3s ease;
    font-size: 0.95rem;
    position: relative;
    transition: opacity 0.3s ease;
}

.form-success {
    background: rgba(76, 175, 80, 0.15);
    border-left: 4px solid #4CAF50;
    color: #e8f5e9;
}

.form-error {
    background: rgba(244, 67, 54, 0.15);
    border-left: 4px solid #f44336;
    color: #ffebee;
}

.form-info {
    background: rgba(33, 150, 243, 0.15);
    border-left: 4px solid #2196f3;
    color: #e3f2fd;
}

.form-warning {
    background: rgba(255, 193, 7, 0.15);
    border-left: 4px solid #ffc107;
    color: #fff8e1;
}

.close-message {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.5rem;
    cursor: pointer;
    margin-left: auto;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-message:hover {
    opacity: 1;
}

.form-instructions {
    background: rgba(108, 99, 255, 0.1);
    border: 1px solid rgba(108, 99, 255, 0.3);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1.5rem;
    animation: slideIn 0.5s ease;
    transition: opacity 0.3s ease;
}

.instructions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
}

.instructions-header h4 {
    font-size: 1.1rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.close-instructions {
    background: none;
    border: none;
    color: var(--gray-color);
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.close-instructions:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}

.steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.step {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    position: relative;
    padding-left: 3rem;
}

.step-number {
    position: absolute;
    top: 50%;
    left: 1rem;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
}

.step p {
    margin: 0.25rem 0;
    font-weight: 500;
}

.step small {
    color: var(--gray-color);
    font-size: 0.85rem;
    display: block;
}

.note {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 101, 132, 0.1);
    border-radius: 8px;
    border-left: 3px solid var(--secondary-color);
}

.note i {
    color: var(--secondary-color);
    margin-top: 0.2rem;
}

.note p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--gray-color);
}

.char-counter {
    font-size: 0.8rem;
    text-align: right;
    margin-top: 0.5rem;
    color: #4CAF50;
    transition: color 0.3s ease;
}

/* Animações */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Botão de submit com loading */
.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.fa-spinner {
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsividade */
@media (max-width: 768px) {
    .form-instructions {
        padding: 1rem;
    }
    
    .steps {
        gap: 0.75rem;
    }
    
    .step {
        padding: 0.75rem;
        padding-left: 2.5rem;
    }
    
    .step-number {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }
}
`;

// Injetar estilos automaticamente
(function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
})();


// Adicionar fallback para navegadores antigos
if (!window.Promise) {
    console.warn('Seu navegador não suporta Promises. Algumas funcionalidades podem não funcionar.');
}

// Exportar funções para uso global (opcional)
window.contactFormUtils = {
    validateForm,
    showMessage,
    triggerConfetti,
    CONFIG
};

console.log('✅ Formulário de contato inicializado com sucesso!');