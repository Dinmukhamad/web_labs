<?php
require __DIR__ . '/config.php';

// Защищённая страница: без валидной auth-cookie — обратно на вход (GET-параметр error).
$user = current_user();
if ($user === null) {
    redirect('login.php?error=auth');
}

// GET-параметр tab с валидацией по белому списку.
$tabs = ['profile' => 'Профиль', 'cookies' => 'Cookies', 'request' => 'Запрос'];
$tab  = (string)($_GET['tab'] ?? 'profile');
if (!array_key_exists($tab, $tabs)) {
    $tab = 'profile';
}

$lastVisit = $_COOKIE[VISIT_COOKIE] ?? '—';
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($user) ?> • Lab 3</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <main class="auth-page">
        <div class="auth-card welcome-card">
            <img src="../profile.jpeg" alt="<?= e($user) ?>" class="welcome-avatar">
            <h2>Добро пожаловать, <?= e($user) ?>!</h2>
            <p class="auth-subtitle">Вы успешно вошли. Время входа (cookie last_visit): <?= e($lastVisit) ?></p>

            <nav class="tabs">
                <?php foreach ($tabs as $key => $label): ?>
                    <a href="welcome.php?tab=<?= e($key) ?>" class="<?= $key === $tab ? 'active' : '' ?>"><?= e($label) ?></a>
                <?php endforeach; ?>
            </nav>

            <?php if ($tab === 'profile'): ?>
                <ul class="info-list">
                    <li><span>Пользователь</span><b><?= e($user) ?></b></li>
                    <li><span>Запомнен логин</span><b><?= isset($_COOKIE[REMEMBER_COOKIE]) ? 'да' : 'нет' ?></b></li>
                    <li><span>Метод этого запроса</span><b><?= e($_SERVER['REQUEST_METHOD']) ?></b></li>
                </ul>
                <a class="auth-btn link-btn" href="../index.html">Открыть профиль</a>
            <?php elseif ($tab === 'cookies'): ?>
                <table class="cookie-table">
                    <tr><th>Cookie</th><th>Значение</th></tr>
                    <?php foreach ($_COOKIE as $name => $value): ?>
                        <tr><td><?= e((string)$name) ?></td><td><?= e(is_string($value) ? $value : '[array]') ?></td></tr>
                    <?php endforeach; ?>
                </table>
            <?php else: ?>
                <ul class="info-list">
                    <li><span>REQUEST_METHOD</span><b><?= e($_SERVER['REQUEST_METHOD']) ?></b></li>
                    <li><span>QUERY_STRING</span><b><?= e($_SERVER['QUERY_STRING'] ?? '') ?></b></li>
                    <li><span>$_GET['tab']</span><b><?= e($tab) ?></b></li>
                </ul>
            <?php endif; ?>

            <form action="logout.php" method="post">
                <button type="submit" class="auth-btn btn-secondary">Выйти</button>
            </form>
        </div>
    </main>
</body>
</html>
