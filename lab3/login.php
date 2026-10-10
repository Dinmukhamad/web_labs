<?php
require __DIR__ . '/config.php';

// Уже вошёл — сразу на страницу профиля.
if (current_user() !== null) {
    redirect('welcome.php');
}

$errors   = [];
$username = '';
$notice   = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // ---------- POST: обработка отправленной формы ----------
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $remember = isset($_POST['remember']);

    $errors = validate_login($username, $password);

    if (!$errors) {
        $hash = USERS[$username] ?? null;
        if ($hash === null || !password_verify($password, $hash)) {
            $errors['form'] = 'Неверное имя пользователя или пароль.';
        }
    }

    if (!$errors) {
        // Сессионная cookie авторизации (удаляется при закрытии браузера).
        set_app_cookie(AUTH_COOKIE, sign_user($username));
        set_app_cookie(VISIT_COOKIE, date('d.m.Y H:i:s'), time() + REMEMBER_TTL);

        if ($remember) {
            set_app_cookie(REMEMBER_COOKIE, $username, time() + REMEMBER_TTL);
        } else {
            delete_app_cookie(REMEMBER_COOKIE);
        }

        // Post/Redirect/Get: после успешного POST перенаправляем на GET-страницу.
        redirect('welcome.php?tab=profile');
    }
} else {
    // ---------- GET: показ формы и сообщений из query-параметров ----------
    $username = trim((string)($_GET['username'] ?? ($_COOKIE[REMEMBER_COOKIE] ?? '')));

    if (isset($_GET['logout'])) {
        $notice = 'Вы вышли из аккаунта.';
    } elseif (($_GET['error'] ?? '') === 'auth') {
        $notice = 'Сначала войдите в аккаунт.';
    }
}

$remembered = isset($_COOKIE[REMEMBER_COOKIE]);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход • Instagram</title>
    <link rel="stylesheet" href="login.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <main class="auth-page">
        <div class="auth-card">
            <h1 class="auth-logo">Instagram</h1>
            <p class="auth-subtitle">Lab 3 · Вход (GET + POST + Cookie + Validation)</p>

            <?php if ($notice): ?>
                <div class="alert alert-info"><?= e($notice) ?></div>
            <?php endif; ?>

            <?php if (isset($errors['form'])): ?>
                <div class="alert alert-error"><?= e($errors['form']) ?></div>
            <?php endif; ?>

            <form id="login-form" class="auth-form" action="login.php" method="post" novalidate>
                <div class="field <?= isset($errors['username']) ? 'has-error' : '' ?>">
                    <input type="text" id="username" name="username" placeholder="Имя пользователя"
                           value="<?= e($username) ?>" autocomplete="username" maxlength="20">
                    <small class="field-error" data-for="username"><?= e($errors['username'] ?? '') ?></small>
                </div>

                <div class="field <?= isset($errors['password']) ? 'has-error' : '' ?>">
                    <div class="password-wrap">
                        <input type="password" id="password" name="password" placeholder="Пароль"
                               autocomplete="current-password" maxlength="32">
                        <button type="button" class="toggle-password" aria-label="Показать пароль">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>
                    <small class="field-error" data-for="password"><?= e($errors['password'] ?? '') ?></small>
                </div>

                <label class="remember">
                    <input type="checkbox" name="remember" <?= $remembered ? 'checked' : '' ?>>
                    Запомнить меня (cookie на 7 дней)
                </label>

                <button type="submit" class="auth-btn">Войти</button>
            </form>

            <div class="divider"><span>ИЛИ</span></div>

            <p class="hint">
                Демо-аккаунт: <b>dinmukhamad</b> / <b>Lab3pass</b>
            </p>
        </div>

        <div class="auth-card auth-card-small">
            <a href="../index.html">← На главную</a> · <a href="report.html">Отчёт по Lab 3</a>
        </div>
    </main>

    <script src="login.js"></script>
</body>
</html>
