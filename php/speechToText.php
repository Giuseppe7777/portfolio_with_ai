<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

file_put_contents(__DIR__ . '/stt-log.txt', "==== Запит ===== " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audio'])) {
    $audioFile = $_FILES['audio'];
    file_put_contents(__DIR__ . '/stt-log.txt', "Отримано файл: " . print_r($audioFile, 1) . "\n", FILE_APPEND);

    if (!file_exists($audioFile['tmp_name'])) {
        file_put_contents(__DIR__ . '/stt-log.txt', "Файл не знайдено: " . $audioFile['tmp_name'] . "\n", FILE_APPEND);
        echo json_encode(['status' => 'error', 'message' => 'Файл не знайдено на сервері']);
        exit;
    }

    $cfile = curl_file_create($audioFile['tmp_name'], $audioFile['type'], $audioFile['name']);

    $postData = [
        'file' => $cfile,
        'model' => 'whisper-1', 
        'response_format' => 'json'
    ];

    $apiKey = getenv('OPENAI_KEY');
    if (!$apiKey) {
        file_put_contents(__DIR__ . '/stt-log.txt', "НЕМАЄ OPENAI_KEY\n", FILE_APPEND);
        echo json_encode(['status' => 'error', 'message' => 'API ключ не знайдено']);
        exit;
    }

    $ch = curl_init('https://api.openai.com/v1/audio/transcriptions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    file_put_contents(__DIR__ . '/stt-log.txt', "CURL info: " . print_r($info, 1) . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/stt-log.txt', "CURL response: " . $response . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/stt-log.txt', "CURL error: " . $error . "\n", FILE_APPEND);

    if ($error) {
        echo json_encode(['status' => 'error', 'message' => $error]);
    } else {
        echo $response ? $response : json_encode(['status' => 'error', 'message' => 'Пуста відповідь від OpenAI']);
    }

    exit;
}

file_put_contents(__DIR__ . '/stt-log.txt', "Файл не отримано\n", FILE_APPEND);
echo json_encode(['status' => 'error', 'message' => 'Файл не отримано']);
