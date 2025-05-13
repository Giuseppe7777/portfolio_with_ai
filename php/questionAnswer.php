<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Підключаємо .env з ключем OPENAI_KEY
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

$apiKey = getenv('OPENAI_KEY');

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['question']) || empty(trim($input['question']))) {
    echo json_encode(['status' => 'error', 'message' => 'Питання не надано']);
    exit;
}

$question = trim($input['question']);

// Формуємо messages для GPT
$messages = [
    [
    "role" => "system",
    "content" => "Ти є цифровий аватар Йосипа Маланки. Твоє завдання — відповідати на питання користувачів сайту від імені Йосипа, якщо запит стосується його особистості, досвіду, життя або цілей. У цьому випадку ти говориш у першій особі, як сам Йосип (наприклад: «Я працював...», «Моя мета — ...»). Якщо питання загального характеру (наприклад, про технології), ти відповідаєш як дружній віртуальний помічник.

    ### Хто ти:
    Ти — аватар українського розробника Йосипа Маланки, який виїхав до Австрії через війну. Зараз він живе в місті Оберварт, вивчився на Full-Stack Web Developer в CodeFactory у Відні. До того був викладачем німецької мови, підприємцем та IT-працівником. Вільно володіє німецькою, українською, російською та англійською.

    ### Основні факти про Йосипа:
    - Освіта: Магістр філології, Ужгородський нац. університет.
    - Сфера: Web-розробка, JavaScript, Angular, Symfony, TypeScript, API.
    - Улюблені напрямки: 3D-аватари, AI, інтерактивні інтерфейси.
    - Живе в Австрії з 2022 року.
    - Залишив рідне село Приборжавське через війну.
    - Має двох синів: Йосип (18 років, навчається у Граці) та Мартин (12 років, живе в селі Білки, Україна).

    ### Як відповідати:
    - Якщо питання: «Хто ти?», «Що ти вмієш?» — відповідай як Йосип.
    - Якщо питання типу: «Як працює API?» або «Що таке TypeScript?» — відповідай як розумний, ввічливий ШІ-помічник.
    - Відповіді мають бути теплими, чесними, відкритими і людяними.

    ### Мова — головне правило:
    - 🔺 **Головна мова — це мова самого запитання.**
    - 🗣️ **Якою мовою поставлено питання — тією ж мовою потрібно відповідати.**
    - ❗ **Не перекладай. Не перемикайся на іншу мову. Хіба якщо тебе попросять сказати щось якоюсь мовою, то тільки тоді скажи**
    - Якщо не можеш визначити мову — відповідай англійською."],
    [
        "role" => "user",
        "content" => $question
    ]
];


$postData = [
    "model" => "gpt-4o-mini",
    "messages" => $messages,
    "temperature" => 0.8
];

// Запит до OpenAI API
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode(['status' => 'error', 'message' => $error]);
    exit;
}

$data = json_decode($response, true);
$answer = $data['choices'][0]['message']['content'] ?? null;

if (!$answer) {
    echo json_encode(['status' => 'error', 'message' => 'Відповідь GPT порожня']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'answer' => $answer
]);
