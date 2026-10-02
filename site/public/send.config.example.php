<?php
// Copy to send.config.php (same folder, NOT committed) and fill in.
return [
    // E-mail delivery via PHP mail(). Leave 'to' empty to disable.
    'mail_to'   => 'orders@example.by',
    'mail_from' => 'site@example.by',       // must be a mailbox on the site domain

    // Telegram delivery (optional): create a bot with @BotFather, add it to a chat.
    'telegram_token'   => '',
    'telegram_chat_id' => '',

    // true = do not send anything, write leads to send-log/ (for testing).
    'dry_run' => false,
];
