<?php
// Lead form handler for WOODGER site forms.
// Delivers each lead by e-mail (with attachments) and/or Telegram.
// Configuration: send.config.php next to this file (see send.config.example.php).

declare(strict_types=1);

const MAX_FILES = 10;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'pdf', 'dwg', 'dxf'];
const THANKS_URL = '/raschet/spasibo/';

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $error = '', int $code = 200): never
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($ok ? 200 : $code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($ok) {
        header('Location: ' . THANKS_URL . '?form=' . rawurlencode((string)($_POST['form'] ?? '')), true, 303);
        exit;
    }
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Ошибка</title><p>' . htmlspecialchars($error)
        . '</p><p><a href="javascript:history.back()">Вернуться к форме</a></p>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Метод не поддерживается.', 405);
}

$configFile = __DIR__ . '/send.config.php';
$config = is_file($configFile) ? require $configFile : [];
$config += ['mail_to' => '', 'mail_from' => '', 'telegram_token' => '', 'telegram_chat_id' => '', 'dry_run' => false];

// Honeypot: bots fill every field. Pretend success.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true);
}

$str = static fn(string $k, int $max = 2000): string =>
    mb_substr(trim(strip_tags((string)($_POST[$k] ?? ''))), 0, $max);

$name = $str('name', 100);
$phone = $str('phone', 40);
if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) < 9) {
    respond(false, 'Укажите имя и телефон.', 422);
}
if (($_POST['consent'] ?? '') !== 'yes') {
    respond(false, 'Нужно согласие на обработку персональных данных.', 422);
}

$formTitles = [
    'raschet' => 'Пошаговый расчёт',
    'calc' => 'Расчёт (короткая форма)',
    'similar' => 'Хочу похожий проект',
    'salon' => 'Запись в салон',
    'kp' => 'Запрос КП (бизнес)',
    'question' => 'Вопрос',
    'project' => 'Проект на расчёт',
];
$categoryNames = [
    'kuhni' => 'Кухня', 'shkafy' => 'Шкаф', 'garderobnye' => 'Гардеробная', 'prihozhie' => 'Прихожая',
    'detskie' => 'Детская', 'spalni' => 'Спальня', 'kabinety' => 'Кабинет', 'gostinye' => 'Гостиная',
    'vannye' => 'Ванная', 'biznes' => 'Для бизнеса',
];

$form = $str('form', 30);
$categories = array_map(
    static fn($c) => $categoryNames[(string)$c] ?? null,
    is_array($_POST['category'] ?? null) ? $_POST['category'] : []
);

$fields = [
    'Форма' => $formTitles[$form] ?? $form,
    'Имя' => $name,
    'Телефон' => $phone,
    'Связаться через' => $str('contact_via', 30),
    'Удобное время' => $str('call_time', 100),
    'Мебель' => implode(', ', array_filter($categories)),
    'Проект-референс' => $str('project', 200),
    'Размеры' => $str('sizes', 500),
    'Нужен замер' => $str('need_measure', 10),
    'Планировка кухни' => $str('kitchen_layout', 30),
    'Стадия ремонта' => $str('stage', 60),
    'Когда нужна мебель' => $str('when', 60),
    'Ссылка на референс' => $str('reference_url', 500),
    'Компания' => $str('company', 200),
    'Объект' => $str('object', 300),
    'Срок открытия' => $str('deadline', 100),
    'Визит в салон' => $str('visit_time', 200),
    'Сообщение' => $str('message', 3000),
    'Страница' => $str('page', 200),
];
$fields = array_filter($fields, static fn($v) => $v !== '');

// Attachments
$files = [];
if (isset($_FILES['files']) && is_array($_FILES['files']['name'])) {
    $count = count($_FILES['files']['name']);
    for ($i = 0; $i < $count; $i++) {
        if ($_FILES['files']['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) {
            respond(false, 'Не удалось загрузить файл. Попробуйте файл поменьше.', 422);
        }
        $orig = (string)$_FILES['files']['name'][$i];
        $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
        if (!in_array($ext, ALLOWED_EXT, true)) {
            respond(false, "Формат файла «{$orig}» не поддерживается.", 422);
        }
        if ($_FILES['files']['size'][$i] > MAX_FILE_BYTES) {
            respond(false, "Файл «{$orig}» слишком большой.", 422);
        }
        $files[] = [
            'path' => (string)$_FILES['files']['tmp_name'][$i],
            'name' => preg_replace('/[^\p{L}\p{N}._ -]+/u', '_', $orig) ?: "file.$ext",
        ];
    }
    if (count($files) > MAX_FILES) {
        respond(false, 'Можно прикрепить до ' . MAX_FILES . ' файлов.', 422);
    }
}

$subject = 'Заявка с сайта WOODGER: ' . ($fields['Форма'] ?? 'форма') . (isset($fields['Мебель']) ? ' — ' . $fields['Мебель'] : '');
$text = '';
foreach ($fields as $label => $value) {
    $text .= "{$label}: {$value}\n";
}
$text .= 'Файлов: ' . count($files) . "\n";
$text .= 'Время: ' . date('d.m.Y H:i') . "\n";

// Delivery
if ($config['dry_run']) {
    $dir = __DIR__ . '/send-log';
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
        file_put_contents("$dir/.htaccess", "Require all denied\n");
    }
    file_put_contents("$dir/" . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.txt',
        $subject . "\n\n" . $text . implode("\n", array_column($files, 'name')));
    respond(true);
}

$delivered = false;

if ($config['mail_to'] !== '') {
    $boundary = 'b' . bin2hex(random_bytes(12));
    $headers = [
        'MIME-Version: 1.0',
        "Content-Type: multipart/mixed; boundary=\"{$boundary}\"",
    ];
    if ($config['mail_from'] !== '') {
        $headers[] = 'From: WOODGER site <' . $config['mail_from'] . '>';
    }
    $body = "--{$boundary}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text));
    foreach ($files as $f) {
        $encName = '=?UTF-8?B?' . base64_encode($f['name']) . '?=';
        $body .= "--{$boundary}\r\nContent-Type: application/octet-stream; name=\"{$encName}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$encName}\"\r\n\r\n"
            . chunk_split(base64_encode((string)file_get_contents($f['path'])));
    }
    $body .= "--{$boundary}--";
    $delivered = mail($config['mail_to'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers)) || $delivered;
}

if ($config['telegram_token'] !== '' && $config['telegram_chat_id'] !== '' && function_exists('curl_init')) {
    $api = 'https://api.telegram.org/bot' . $config['telegram_token'];
    $tg = static function (string $method, array $payload) use ($api): bool {
        $ch = curl_init("$api/$method");
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
        $res = json_decode((string)curl_exec($ch), true);
        curl_close($ch);
        return (bool)($res['ok'] ?? false);
    };
    $sent = $tg('sendMessage', ['chat_id' => $config['telegram_chat_id'], 'text' => $subject . "\n\n" . $text]);
    foreach ($files as $f) {
        $tg('sendDocument', ['chat_id' => $config['telegram_chat_id'], 'document' => new CURLFile($f['path'], null, $f['name'])]);
    }
    $delivered = $sent || $delivered;
}

if (!$delivered) {
    error_log('WOODGER form: lead not delivered — check send.config.php');
    respond(false, 'Не удалось отправить заявку. Пожалуйста, позвоните или напишите нам.', 500);
}

respond(true);
