<?php
/* php/realtime-session-token.php */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

/* ── 1. ENV ───────────────────────────────────────── */
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $k => $v) putenv("$k=$v");
}
$apiKey = getenv('OPENAI_KEY');

/* ── 2. Параметри сесії ───────────────────────────── */
$model = 'gpt-4o-realtime-preview-2024-12-17'; // 👈 залишається
$voice = 'echo';                               // 👈 будь-який із: alloy / ash / ballad / coral / echo / sage / shimmer / verse

/* ── 3. POST /v1/realtime/sessions ──────────────── */
$url = 'https://api.openai.com/v1/realtime/sessions';

$headers = [
  "Authorization: Bearer $apiKey",
  "Content-Type: application/json",
  "OpenAI-Beta: realtime=v1"
];

$postData = [
  'model' => $model,
  'voice' => $voice
];

$ch = curl_init($url);
curl_setopt_array($ch,[
  CURLOPT_POST           => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER     => $headers,
  CURLOPT_POSTFIELDS     => json_encode($postData),
]);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
