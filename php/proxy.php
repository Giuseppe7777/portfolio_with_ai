<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

// ✅ Обробка GET-запиту до codefactory API
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $apiUrl = "http://api.serri.codefactory.live/random/";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response === false) {
        echo json_encode(["error" => "Failed to fetch data"]);
    } else {
        echo $response;
    }
    exit;
}

// Якщо не GET і не POST з аудіо — повертаємо помилку
echo json_encode(['status' => 'error', 'message' => 'Неправильний або неповний запит.']);
?>
