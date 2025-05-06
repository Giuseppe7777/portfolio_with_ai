<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Підключаємо автозавантажувач Composer
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Налаштування відповіді (JSON)
header('Content-Type: application/json');

// Перевірка, чи прийшли дані через POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Отримуємо дані з форми
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $message = $_POST['message'] ?? '';

    // Валідація даних
    if (empty($name) || empty($email) || empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'Fill in all fields.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Incorrect email.']);
        exit;
    }

    // Налаштування PHPMailer
    $mail = new PHPMailer(true);

    try {
        // SMTP-налаштування
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // SMTP-сервер Gmail
        $mail->SMTPAuth = true;
        $mail->Username = 'malankajosyp@gmail.com'; // Твій Gmail
        $mail->Password = 'awkl ghit caeh fczo';   // Пароль додатку Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Шифрування
        $mail->Port = 587;

        // Від кого
        $mail->setFrom('malankajosyp@gmail.com', 'Yosyp Malanka'); 
        // Кому
        $mail->addAddress('malankajosyp@gmail.com', 'Yosyp Malanka');

        // Зміст листа
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = '=?UTF-8?B?' . base64_encode('Нове повідомлення з контактної форми') . '?=';
        $mail->Body    = "
            <h2>Нове повідомлення</h2>
            <p><strong>Ім'я:</strong> $name</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Повідомлення:</strong><br>$message</p>
        ";
        // ⛔ Вимикаємо перевірку SSL тільки локально
        $mail->SMTPOptions = [
          'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
          ],
        ];
        // ⛔ Вимикаємо перевірку SSL тільки локально

        // Відправка листа
        $mail->send();
        echo json_encode(['status' => 'success', 'message' => 'Message sent!']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Sending error: ' . $mail->ErrorInfo]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Incorrect request.']);
}

?>
