// Lab 4: регистрация, вход и сессии поверх базы данных (db.js).
// Пароль хранится как PBKDF2-хеш с уникальной солью, сессия — случайный токен
// в таблице sessions и в cookie.

const Auth = (() => {
    const SESSION_COOKIE = 'lab4_session';
    const REMEMBER_DAYS = 7;
    const PBKDF2_ITERATIONS = 100000;

    // Cookie действует на весь сайт: папка выше lab4/ (например /web_labs/ на GitHub Pages).
    const PATH = new URL('..', document.currentScript.src).pathname;

    // ---------- cookie ----------
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

    // ---------- криптография ----------
    function randomHex(bytes) {
        return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
    }

    async function hashPassword(password, saltHex) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
            key,
            256,
        );
        return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
    }

    // ---------- регистрация ----------
    /** data: {fullName, username, email, password, confirm}. Возвращает {ok, errors}. */
    async function register(data) {
        const clean = { ...data, fullName: data.fullName.trim(), username: data.username.trim(), email: data.email.trim() };
        const errors = Validation.register(clean);
        if (Object.keys(errors).length) return { ok: false, errors };

        await Db.open();
        const taken = Db.query('SELECT username, email FROM users WHERE username = ? OR email = ?', [clean.username, clean.email]);
        for (const row of taken) {
            if (row.username.toLowerCase() === clean.username.toLowerCase()) errors.username = 'Это имя пользователя уже занято.';
            if (row.email.toLowerCase() === clean.email.toLowerCase()) errors.email = 'Этот email уже зарегистрирован.';
        }
        if (Object.keys(errors).length) return { ok: false, errors };

        const salt = randomHex(16);
        try {
            Db.run(
                `INSERT INTO users (full_name, username, email, password_hash, salt)
                 VALUES (?, ?, ?, ?, ?)`,
                [clean.fullName, clean.username, clean.email, await hashPassword(clean.password, salt), salt],
            );
        } catch (error) {
            // Ограничения базы (UNIQUE / CHECK) — последний уровень проверки.
            return { ok: false, errors: { form: 'База данных отклонила запись: ' + error.message } };
        }
        await Db.save();
        return { ok: true, errors: {} };
    }

    // ---------- вход и выход ----------
    /** Вход по имени пользователя или email. Возвращает {ok, errors}. */
    async function login(loginValue, password, remember) {
        const errors = Validation.login({ login: loginValue.trim(), loginPassword: password });
        if (Object.keys(errors).length) return { ok: false, errors };

        await Db.open();
        const [user] = Db.query('SELECT id, password_hash, salt FROM users WHERE username = ? OR email = ?', [loginValue.trim(), loginValue.trim()]);
        if (!user || (await hashPassword(password, user.salt)) !== user.password_hash) {
            return { ok: false, errors: { form: 'Неверное имя пользователя, email или пароль.' } };
        }

        const token = randomHex(32);
        const lifetime = remember ? `+${REMEMBER_DAYS} days` : '+1 day';
        Db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', ?))", [token, user.id, lifetime]);
        Db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);
        await Db.save();

        // Без «Запомнить меня» — сессионная cookie (удаляется при закрытии браузера).
        setCookie(SESSION_COOKIE, token, remember ? REMEMBER_DAYS * 24 * 60 * 60 : undefined);
        return { ok: true, errors: {} };
    }

    async function logout() {
        const token = getCookie(SESSION_COOKIE);
        if (token) {
            await Db.open();
            Db.run('DELETE FROM sessions WHERE token = ?', [token]);
            await Db.save();
        }
        setCookie(SESSION_COOKIE, '', 0);
    }

    /** Есть ли cookie сессии (быстрая проверка без базы). */
    function hasSession() {
        return getCookie(SESSION_COOKIE) !== null;
    }

    /** Пользователь текущей сессии из базы или null. */
    async function currentUser() {
        const token = getCookie(SESSION_COOKIE);
        if (!token) return null;

        await Db.open();
        const [user] = Db.query(
            `SELECT u.id, u.full_name, u.username, u.email, u.created_at, u.last_login
             FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token = ? AND s.expires_at > datetime('now')`,
            [token],
        );
        if (!user) setCookie(SESSION_COOKIE, '', 0);
        return user ?? null;
    }

    /** SQLite хранит время в UTC ("2026-10-10 05:40:13") — переводим в местное. */
    function formatDate(value) {
        return value ? new Date(value.replace(' ', 'T') + 'Z').toLocaleString('ru-RU') : '—';
    }

    return { register, login, logout, hasSession, currentUser, hashPassword, randomHex, formatDate };
})();
