<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

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

    if (!file_exists($audioFile['tmp_name'])) {
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

    if ($error) {
        echo json_encode(['status' => 'error', 'message' => $error]);
    } else {
        echo $response ? $response : json_encode(['status' => 'error', 'message' => 'Пуста відповідь від OpenAI']);
    }

    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Файл не отримано']);
