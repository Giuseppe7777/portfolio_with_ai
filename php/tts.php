<?php
// ── php/tts.php (streaming) ──────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: audio/mpeg');         
header('Cache-Control: no-cache');

set_time_limit(0);               // потік може тривати довше 30 с
while (ob_get_level()) ob_end_flush();
ob_implicit_flush(true);

ini_set('display_errors', 1);
error_reporting(E_ALL);

// 🔁 0. .env
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    foreach (parse_ini_file($envPath) as $k => $v) putenv("$k=$v");
}

// 1. Вхідні дані
$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';
$voiceId = getenv('ELEVENLABS_VOICE_ID');
$apiKey  = getenv('ELEVENLABS_KEY');

if ($text === '' || !$voiceId || !$apiKey) {
    http_response_code(400);
    echo 'Missing text / voiceId / apiKey';
    error_log('[TTS-STREAM] ❌ Missing data');
    exit;
}

// 2. Запит до ElevenLabs
$url  = "https://api.elevenlabs.io/v1/text-to-speech/$voiceId/stream";
$post = json_encode([
    'text'          => $text,
    'model_id'      => 'eleven_flash_v2_5',            
    'output_format' => 'mp3_44100_128',
    'voice_settings'=> ['stability'=>0.4,'similarity_boost'=>0.8]
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER    => [
        "xi-api-key: $apiKey",
        'Content-Type: application/json',
        'Accept: audio/mpeg'
    ],
    CURLOPT_POST          => true,
    CURLOPT_POSTFIELDS    => $post,
    CURLOPT_RETURNTRANSFER=> false,             // критично: НЕ збираємо
    CURLOPT_WRITEFUNCTION => function($curl, $data){
        echo $data;            // штовхаємо chunk
    /* ↓ гарантуємо негайний вихід з PHP-буфера */
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();        // для PHP-FPM / FastCGI
        } else {
            @ob_flush();
            flush();
        }              // негайно
        return strlen($data);  // кажемо curl скільки байт віддали
    },
]);

error_log('[TTS-STREAM] ▶️ Start');
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1); // важливо: HTTP/1.1
curl_setopt($ch, CURLOPT_FORBID_REUSE, false);                 // keep-alive
curl_setopt($ch, CURLOPT_TCP_KEEPALIVE, 1);                    // тримати сокет
curl_exec($ch);

if (curl_errno($ch)) {
    error_log('[TTS-STREAM] ❌ CURL: '.curl_error($ch));
}
curl_close($ch);
error_log('[TTS-STREAM] ✅ Done');
