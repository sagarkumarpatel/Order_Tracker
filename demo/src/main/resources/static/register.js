const toggle = document.getElementById('registerToggle');
const passwordInput = document.getElementById('registerPassword');
const confirmInput = document.getElementById('registerConfirm');
const messageEl = document.getElementById('registerMessage');
const form = document.querySelector('form');

if (toggle && passwordInput && confirmInput) {
    toggle.addEventListener('change', () => {
        const type = toggle.checked ? 'text' : 'password';
        passwordInput.type = type;
        confirmInput.type = type;
    });
}

if (form) {
    form.addEventListener('submit', (event) => {
        clearMessage();
        if (passwordInput.value !== confirmInput.value) {
            event.preventDefault();
            setMessage('Passwords do not match.', false);
        }
    });
}

const params = new URLSearchParams(window.location.search);
if (params.has('error')) {
    const provided = params.get('message');
    setMessage(provided ? decodeURIComponent(provided) : 'Unable to create the account. Please try again.', false);
}

function clearMessage() {
    if (messageEl) {
        messageEl.textContent = '';
        messageEl.classList.remove('is-success');
    }
}

function setMessage(message, isSuccess) {
    if (!messageEl) {
        return;
    }
    messageEl.textContent = message;
    messageEl.classList.toggle('is-success', !!isSuccess);
}
