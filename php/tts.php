<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: audio/mpeg'); // MP3-формат

ini_set('display_errors', 1);
error_reporting(E_ALL);

// 🔁 0. Завантаження .env
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

// 1. Отримуємо текст з POST-запиту
$text = $_POST['text'] ?? '';

if (empty($text)) {
    http_response_code(400);
    echo '❌ Помилка: Текст не надано.';
    exit;
}

// 2. Отримуємо API-ключ і voice ID з .env
$apiKey = getenv('ELEVENLABS_KEY');
$voiceId = getenv('ELEVENLABS_VOICE_ID');

// 🛑 Перевіримо, чи ключі точно є
if (!$apiKey || !$voiceId) {
    http_response_code(500);
    echo '❌ Помилка: Ключ або voice ID не знайдено в .env';
    exit;
}

// 3. Формуємо дані для запиту
$postData = [
    'text' => $text,
    'model_id' => 'eleven_multilingual_v2',
    'voice_settings' => [
        'stability' => 0.5,
        'similarity_boost' => 0.75
    ]
];

// 4. Запит до stream-endpoint
$url = "https://api.elevenlabs.io/v1/text-to-speech/$voiceId/stream";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'xi-api-key: ' . $apiKey
]);

$response = curl_exec($ch);
$error = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 5. Обробка помилок
if ($error || $httpCode !== 200) {
    http_response_code(500);
    echo '❌ Помилка від ElevenLabs: ' . ($error ?: "HTTP $httpCode");
    exit;
}

// 6. Віддаємо mp3 у браузер
echo $response;