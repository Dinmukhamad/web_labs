// Lab 4: правила валидации. Используются и в формах (подсказки под полями),
// и в Auth перед записью в базу. Третий уровень защиты — ограничения в схеме БД
// (NOT NULL, UNIQUE, CHECK).

const Validation = (() => {
    const USERNAME_RE = /^[a-zA-Z0-9_.]+$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const NAME_RE = /^\p{L}[\p{L}\s'-]*$/u;

    const fields = {
        fullName(value) {
            if (value === '') return 'Введите имя.';
            if (value.length < 2 || value.length > 50) return 'Имя должно быть от 2 до 50 символов.';
            if (!NAME_RE.test(value)) return 'Имя может содержать только буквы, пробел, «-» и «\'».';
            return '';
        },
        username(value) {
            if (value === '') return 'Введите имя пользователя.';
            if (value.length < 3 || value.length > 20) return 'Имя пользователя должно быть от 3 до 20 символов.';
            if (!USERNAME_RE.test(value)) return 'Допустимы только латинские буквы, цифры, «_» и «.».';
            return '';
        },
        email(value) {
            if (value === '') return 'Введите email.';
            if (value.length > 100 || !EMAIL_RE.test(value)) return 'Введите корректный email, например name@mail.com.';
            return '';
        },
        password(value) {
            if (value === '') return 'Введите пароль.';
            if (passwordChecks(value).some((check) => !check.ok)) return 'Пароль не соответствует требованиям ниже.';
            return '';
        },
        confirm(value, data) {
            if (value === '') return 'Повторите пароль.';
            if (value !== data.password) return 'Пароли не совпадают.';
            return '';
        },
        login(value) {
            return value === '' ? 'Введите имя пользователя или email.' : '';
        },
        loginPassword(value) {
            return value === '' ? 'Введите пароль.' : '';
        },
    };

    /** Требования к паролю — показываются списком на странице регистрации. */
    function passwordChecks(value) {
        return [
            { id: 'length', text: 'от 8 до 64 символов', ok: value.length >= 8 && value.length <= 64 },
            { id: 'lower', text: 'строчная латинская буква', ok: /[a-z]/.test(value) },
            { id: 'upper', text: 'заглавная латинская буква', ok: /[A-Z]/.test(value) },
            { id: 'digit', text: 'цифра', ok: /\d/.test(value) },
        ];
    }

    function field(name, value, data = {}) {
        return fields[name](value, data);
    }

    function collect(names, data) {
        const errors = {};
        for (const name of names) {
            const message = field(name, data[name] ?? '', data);
            if (message) errors[name] = message;
        }
        return errors;
    }

    return {
        field,
        passwordChecks,
        register: (data) => collect(['fullName', 'username', 'email', 'password', 'confirm'], data),
        login: (data) => collect(['login', 'loginPassword'], data),
    };
})();
