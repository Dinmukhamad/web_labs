<?php
require __DIR__ . '/config.php';

// Выход выполняется только POST-запросом (GET не должен менять состояние).
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Метод не разрешён. Используйте кнопку «Выйти».');
}

delete_app_cookie(AUTH_COOKIE);
// remember_login и last_visit оставляем — они нужны для автозаполнения при следующем входе.

redirect('login.php?logout=1');
