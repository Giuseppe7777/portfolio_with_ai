<?php

header('Content-Type: application/json');

define('LIMIT_FILE', __DIR__ . '/limits.json');
define('MAX_QUESTIONS', 4);           
define('PERIOD_SECONDS', 24 * 60 * 60); 

// 1. Отримати IP користувача
$ip = $_SERVER['REMOTE_ADDR'];

// 2. Прочитати limits.json
$limits = [];
if (file_exists(LIMIT_FILE)) {
    $json = file_get_contents(LIMIT_FILE);
    $limits = json_decode($json, true) ?: [];
}

$now = time();

// 4. Ініціалізувати для нового IP
if (!isset($limits[$ip])) {
    $limits[$ip] = [
        'count' => 0,
        'first_time' => $now
    ];
}

// 5. Якщо пройшло більше доби — скинути лічильник
if ($now - $limits[$ip]['first_time'] > PERIOD_SECONDS) {
    $limits[$ip]['count'] = 0;
    $limits[$ip]['first_time'] = $now;
}

// 6. Вираховуємо залишок
$left = max(0, MAX_QUESTIONS - $limits[$ip]['count']);

// 7. Готуємо відповідь
if ($limits[$ip]['count'] >= MAX_QUESTIONS) {
    $resp = [
        'status' => 'limit',
        'left' => 0,
        'total' => MAX_QUESTIONS
    ];
} else {
    $resp = [
        'status' => 'ok',
        'left' => $left,
        'total' => MAX_QUESTIONS
    ];
}

// 8. Повертаємо відповідь
echo json_encode($resp);
exit;
