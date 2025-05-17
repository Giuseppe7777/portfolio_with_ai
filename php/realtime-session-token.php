<?php
// php/realtime-session-token.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Підключаємо .env вручну
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

$apiKey = getenv("OPENAI_KEY");
$model = "gpt-4o-realtime-preview-2024-12-17";

$url = "https://api.openai.com/v1/realtime/transcription_sessions?model=" . urlencode($model);

$headers = [
    "Authorization: Bearer $apiKey",
    "Content-Type: application/json",
    "OpenAI-Beta: realtime=v1"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
