<?php
// Общие настройки и функции для Lab 3 (Login: GET + POST + Cookie + Validation)

// Демо-пользователь. Пароль хранится только в виде хеша (password_hash).
// Логин: dinmukhamad   Пароль: Lab3pass
const USERS = [
    'dinmukhamad' => '$2y$10$L8OrYX6YLnbmYT3QK8win.uR5wezgTCzXRIyH1FNcX/SVAlzzOLvC',
];

// Секрет для подписи cookie (HMAC), чтобы пользователь не мог подделать auth-cookie.
const COOKIE_SECRET = 'web-labs-lab3-secret-change-me';

const AUTH_COOKIE     = 'auth_user';       // кто вошёл (подписанное значение)
const REMEMBER_COOKIE = 'remember_login';  // запомненный логин для автозаполнения
const VISIT_COOKIE    = 'last_visit';      // время последнего входа

const REMEMBER_TTL = 7 * 24 * 60 * 60;     // 7 дней

/** Экранирование вывода (защита от XSS). */
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

/** Установка cookie с безопасными параметрами. */
function set_app_cookie(string $name, string $value, int $expires = 0): void
{
    setcookie($name, $value, [
        'expires'  => $expires,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
}

function delete_app_cookie(string $name): void
{
    set_app_cookie($name, '', time() - 3600);
}

/** Значение auth-cookie: "логин|подпись". */
function sign_user(string $username): string
{
    return $username . '|' . hash_hmac('sha256', $username, COOKIE_SECRET);
}

/** Возвращает логин из auth-cookie или null, если cookie нет или она подделана. */
function current_user(): ?string
{
    $raw = $_COOKIE[AUTH_COOKIE] ?? '';
    if (!is_string($raw) || !str_contains($raw, '|')) {
        return null;
    }
    [$username, $signature] = explode('|', $raw, 2);
    $expected = hash_hmac('sha256', $username, COOKIE_SECRET);
    if (!hash_equals($expected, $signature) || !isset(USERS[$username])) {
        return null;
    }
    return $username;
}

/**
 * Серверная валидация формы входа.
 * Возвращает массив ошибок вида ['поле' => 'сообщение'].
 */
function validate_login(string $username, string $password): array
{
    $errors = [];

    if ($username === '') {
        $errors['username'] = 'Введите имя пользователя.';
    } elseif (mb_strlen($username) < 3 || mb_strlen($username) > 20) {
        $errors['username'] = 'Имя пользователя должно быть от 3 до 20 символов.';
    } elseif (!preg_match('/^[a-zA-Z0-9_.]+$/', $username)) {
        $errors['username'] = 'Допустимы только латинские буквы, цифры, «_» и «.».';
    }

    if ($password === '') {
        $errors['password'] = 'Введите пароль.';
    } elseif (mb_strlen($password) < 6 || mb_strlen($password) > 32) {
        $errors['password'] = 'Пароль должен быть от 6 до 32 символов.';
    } elseif (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
        $errors['password'] = 'Пароль должен содержать хотя бы одну букву и одну цифру.';
    }

    return $errors;
}

function redirect(string $location): never
{
    header('Location: ' . $location);
    exit;
}
