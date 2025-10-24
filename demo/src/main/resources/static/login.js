const togglePassword = document.getElementById('togglePassword');
const passwordField = document.getElementById('password');
const messageEl = document.getElementById('loginMessage');

if (togglePassword && passwordField) {
    togglePassword.addEventListener('change', () => {
        passwordField.type = togglePassword.checked ? 'text' : 'password';
    });
}

const params = new URLSearchParams(window.location.search);
if (params.has('error')) {
    setMessage('Invalid email or password. Please try again.', false);
} else if (params.has('logout')) {
    setMessage('You have been signed out successfully.', true);
} else if (params.has('registered')) {
    setMessage('Account created! Please sign in.', true);
}

function setMessage(message, isSuccess) {
    if (!messageEl) {
        return;
    }
    messageEl.textContent = message;
    messageEl.classList.toggle('is-success', !!isSuccess);
}
