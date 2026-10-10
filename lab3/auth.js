// Lab 3: авторизация на стороне браузера через cookie (для GitHub Pages, где нет сервера).
// Подключается на странице входа (index.html) и на странице профиля (profile.html).

const Auth = (() => {
    // Демо-пользователь. Пароль хранится не открытым текстом, а как SHA-256 хеш.
    // Логин: dinmukhamad   Пароль: Lab3pass
    const USERS = {
        dinmukhamad: '2f3f95bb385932c3f534e07b157f98b0557b74b3440b6f00a00ec95cf715d000',
    };

    const AUTH_COOKIE = 'ig_user';           // кто вошёл
    const REMEMBER_COOKIE = 'ig_remember';   // запомненный логин для автозаполнения
    const VISIT_COOKIE = 'ig_last_visit';    // время последнего входа
    const REMEMBER_TTL = 7 * 24 * 60 * 60;   // 7 дней (в секундах)

    // Cookie действуют для папки сайта (например /web_labs/ на GitHub Pages).
    const PATH = location.pathname.replace(/[^/]*$/, '');

    function setCookie(name, value, maxAge) {
        let cookie = `${name}=${encodeURIComponent(value)}; path=${PATH}; SameSite=Lax`;
        if (maxAge !== undefined) cookie += `; max-age=${maxAge}`;
        if (location.protocol === 'https:') cookie += '; Secure';
        document.cookie = cookie;
    }

    function getCookie(name) {
        const pair = document.cookie.split('; ').find((item) => item.startsWith(name + '='));
        return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
    }

    function deleteCookie(name) {
        setCookie(name, '', 0);
    }

    async function sha256(text) {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
    }

    /** Проверяет логин и пароль; при успехе ставит cookie. Возвращает true/false. */
    async function login(username, password, remember) {
        const hash = Object.prototype.hasOwnProperty.call(USERS, username) ? USERS[username] : null;
        if (hash === null || (await sha256(password)) !== hash) {
            return false;
        }

        // Без «Запомнить меня» — сессионная cookie (удаляется при закрытии браузера).
        setCookie(AUTH_COOKIE, username, remember ? REMEMBER_TTL : undefined);
        setCookie(VISIT_COOKIE, new Date().toLocaleString('ru-RU'), REMEMBER_TTL);

        if (remember) {
            setCookie(REMEMBER_COOKIE, username, REMEMBER_TTL);
        } else {
            deleteCookie(REMEMBER_COOKIE);
        }
        return true;
    }

    function logout() {
        deleteCookie(AUTH_COOKIE);
    }

    /** Логин из cookie или null, если пользователь не вошёл. */
    function currentUser() {
        const username = getCookie(AUTH_COOKIE);
        return username && Object.prototype.hasOwnProperty.call(USERS, username) ? username : null;
    }

    return {
        login,
        logout,
        currentUser,
        rememberedUser: () => getCookie(REMEMBER_COOKIE),
        lastVisit: () => getCookie(VISIT_COOKIE),
    };
})();
