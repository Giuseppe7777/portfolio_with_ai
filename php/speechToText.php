<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audio'])) {
    $audioFile = $_FILES['audio'];

    // Готуємо файл до CURL
    $cfile = curl_file_create($audioFile['tmp_name'], $audioFile['type'], $audioFile['name']);

    $postData = [
        'file' => $cfile,
        'model' => 'whisper-1', // або інший, якщо треба
        'response_format' => 'json'
    ];

    $apiKey = 'ТВОЙ_API_КЛЮЧ_OPENAI';

    $ch = curl_init('https://api.openai.com/v1/audio/transcriptions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo json_encode(['status' => 'error', 'message' => $error]);
    } else {
        echo $response; // тут вже буде JSON з полем "text"
    }

    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Файл не отримано']);
