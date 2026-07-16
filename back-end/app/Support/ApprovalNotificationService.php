<?php

namespace App\Support;

use App\Models\NotificationRecord;
use Illuminate\Support\Str;

class ApprovalNotificationService
{
    public static function notifyApprover(
        string $recipientCode,
        string $senderName,
        string $senderPosition,
        ?string $senderAvatar,
        string $title,
        string $content,
        string $actionUrl,
        string $priority = 'important'
    ): void {
        if (trim($recipientCode) === '') {
            return;
        }

        NotificationRecord::query()->create([
            'id' => 'NOTI' . now()->format('ymd') . Str::upper(Str::random(8)),
            'type' => 'private',
            'title' => $title,
            'content' => $content,
            'sender_name' => $senderName,
            'sender_position' => $senderPosition,
            'sender_avatar' => $senderAvatar,
            'recipient_code' => $recipientCode,
            'sent_at' => now(),
            'is_read' => false,
            'priority' => $priority,
            'action_url' => $actionUrl,
        ]);
    }
}
