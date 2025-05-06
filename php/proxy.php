<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

require __DIR__ . '/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

// ✅ Обробка POST-запиту з голосовим файлом
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audio']) && isset($_POST['timestamp'])) {
    $audioFile = $_FILES['audio'];
    $timestamp = $_POST['timestamp'];

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'malankajosyp@gmail.com';
        $mail->Password = 'awkl ghit caeh fczo';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('malankajosyp@gmail.com', 'Voice Capture Bot');
        $mail->addAddress('malankajosyp@gmail.com', 'Yosyp Malanka');

        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = '=?UTF-8?B?' . base64_encode('🎤 Новий голосовий запис від користувача') . '?=';
        $mail->Body    = '<p><strong>Час запису:</strong> ' . htmlspecialchars($timestamp) . '</p>';
        $mail->addAttachment($audioFile['tmp_name'], 'voice-' . $timestamp . '.webm');
        // ⛔ Вимикаємо перевірку SSL тільки для локальної розробки
        $mail->SMTPOptions = [
          'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
          ],
        ];
        // ⛔ Вимикаємо перевірку SSL тільки для локальної розробки
        $mail->send();

        echo json_encode(['status' => 'success', 'message' => 'Файл успішно відправлено на пошту.']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при надсиланні листа: ' . $mail->ErrorInfo]);
    }
    exit;
}

// Якщо не GET і не POST з аудіо — повертаємо помилку
echo json_encode(['status' => 'error', 'message' => 'Неправильний або неповний запит.']);
?>
