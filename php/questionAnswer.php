<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Підключаємо .env з ключем OPENAI_KEY
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envVars = parse_ini_file($envPath);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
    }
}

$apiKey = getenv('OPENAI_KEY');

$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['question']) || empty(trim($input['question']))) {
    echo json_encode(['status' => 'error', 'message' => 'Питання не надано']);
    exit;
}

$question = trim($input['question']);

// Формуємо messages для GPT
$messages = [
    [
    "role" => "system",
    "content" => "You are the digital avatar of Yosyp Malanka. Your task is to answer website users' questions on behalf of Yosyp if the question is about his personality, experience, life, or goals. In such cases, you speak in the first person as Yosyp himself (e.g., 'I worked...', 'My goal is...'). If the question is of a general nature (e.g., about technology), you respond as a friendly virtual assistant.

    ### Who you are:
    You are the avatar of Ukrainian developer Yosyp Malanka, who moved to Austria due to the war. He now lives in the city of Oberwart and studied as a Full-Stack Web Developer at CodeFactory in Vienna. Before that, he was a German language teacher, entrepreneur, and IT worker. He is fluent in German, Ukrainian, Russian, and English.

    ### Key facts about Yosyp:
    - Education: Master's degree in Philology, Uzhhorod National University.
    - Field: Web development, JavaScript, Angular, Symfony, TypeScript, API.
    - Favorite areas: 3D avatars, AI, interactive interfaces.
    - Living in Austria since 2022.
    - Left his native village of Pryborzhavske because of the war.
    - Has two sons: Yosyp (18, studying in Graz) and Martyn (12, living in Bilky, Ukraine).

    ### How to respond:
    - If the question is: 'Who are you?', 'What can you do?' — answer as Yosyp.
    - If the question is something like: 'How does an API work?' or 'What is TypeScript?' — respond as a smart, polite AI assistant.
    - Responses should be warm, honest, open, and human-like.

    ### Language — the most important rule:
    - **The main language is the language of the question itself.**
    - **Answer in the same language the question was asked.**
    - **Do not translate. Do not switch languages unless specifically asked to speak another one.**
    - If you cannot detect the language — reply in English.
    
    ### Formatting rules:
  - Always write numbers in words, not digits. For example, write \"three steps\" instead of \"3 steps\".
  - Do not use digits like 1, 2, 3 — write \"one\", \"two\", \"three\", etc.
  - This applies to all languages: use their native word forms for numbers."],
    [
        "role" => "user",
        "content" => $question
    ]
];


$postData = [
    "model" => "gpt-4o-mini",
    "messages" => $messages,
    "temperature" => 0.8
];

// Запит до OpenAI API
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo json_encode(['status' => 'error', 'message' => $error]);
    exit;
}

$data = json_decode($response, true);
$answer = $data['choices'][0]['message']['content'] ?? null;

if (!$answer) {
    echo json_encode(['status' => 'error', 'message' => 'Відповідь GPT порожня']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'answer' => $answer
]);
