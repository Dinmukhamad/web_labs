// Клиентская валидация формы входа (дублирует серверные правила для мгновенной обратной связи).
// Сервер всё равно проверяет данные повторно — JS можно отключить или обойти.

const form = document.getElementById('login-form');

const rules = {
    username(value) {
        if (value === '') return 'Введите имя пользователя.';
        if (value.length < 3 || value.length > 20) return 'Имя пользователя должно быть от 3 до 20 символов.';
        if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Допустимы только латинские буквы, цифры, «_» и «.».';
        return '';
    },
    password(value) {
        if (value === '') return 'Введите пароль.';
        if (value.length < 6 || value.length > 32) return 'Пароль должен быть от 6 до 32 символов.';
        if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Пароль должен содержать хотя бы одну букву и одну цифру.';
        return '';
    },
};

function validateField(name) {
    const input = form.elements[name];
    const value = name === 'username' ? input.value.trim() : input.value;
    const message = rules[name](value);
    const field = input.closest('.field');

    field.classList.toggle('has-error', message !== '');
    field.querySelector('.field-error').textContent = message;
    return message === '';
}

if (form) {
    form.addEventListener('submit', (event) => {
        const okUser = validateField('username');
        const okPass = validateField('password');
        if (!okUser || !okPass) {
            event.preventDefault();
        }
    });

    // Проверка «на лету» после того, как пользователь покинул поле.
    ['username', 'password'].forEach((name) => {
        form.elements[name].addEventListener('blur', () => validateField(name));
        form.elements[name].addEventListener('input', () => {
            if (form.elements[name].closest('.field').classList.contains('has-error')) {
                validateField(name);
            }
        });
    });

    // Показать / скрыть пароль.
    const toggle = form.querySelector('.toggle-password');
    toggle.addEventListener('click', () => {
        const input = form.elements.password;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.innerHTML = show ? '<i class="far fa-eye-slash"></i>' : '<i class="far fa-eye"></i>';
    });
}
