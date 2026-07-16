<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRecord;
use App\Models\NotificationRecord;
use App\Models\OvertimeRecord;
use App\Models\TimeoffRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $records = NotificationRecord::query()
            ->where(function ($query) use ($user) {
                $query->where('type', 'announcement')
                    ->orWhere(function ($inner) use ($user) {
                        $inner->where('type', 'private')
                            ->where('recipient_code', $user->employee_code);
                    });
            })
            ->orderByDesc('sent_at')
            ->get();

        return response()->json([
            'data' => $records->map(fn (NotificationRecord $item) => $this->transformNotification($item))->values(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $notification = NotificationRecord::query()
            ->where('id', $id)
            ->where(function ($query) use ($user) {
                $query->where('type', 'announcement')
                    ->orWhere(function ($inner) use ($user) {
                        $inner->where('type', 'private')
                            ->where('recipient_code', $user->employee_code);
                    });
            })
            ->first();

        if ($notification === null) {
            return response()->json([
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $this->transformNotification($notification),
        ]);
    }

    private function resolveRelatedStatus(?string $actionUrl): ?string
    {
        if (empty($actionUrl)) {
            return null;
        }

        if (preg_match('#/leave/(\d+)#', $actionUrl, $m)) {
            $record = LeaveRecord::find($m[1]);
            return $record?->status ?? null;
        }

        if (preg_match('#/timeoff/(\d+)#', $actionUrl, $m)) {
            $record = TimeoffRecord::find($m[1]);
            return $record?->status ?? null;
        }

        if (preg_match('#/overtime/(\d+)#', $actionUrl, $m)) {
            $record = OvertimeRecord::find($m[1]);
            return $record?->status ?? null;
        }

        return null;
    }

    private function transformNotification(NotificationRecord $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title ?? '',
            'content' => $notification->content,
            'senderName' => $notification->sender_name,
            'senderPosition' => $notification->sender_position,
            'senderAvatar' => $notification->sender_avatar,
            'recipientId' => $notification->recipient_code,
            'date' => $notification->sent_at?->toIso8601String(),
            'isRead' => (bool) $notification->is_read,
            'priority' => $notification->priority,
            'actionUrl' => $notification->action_url,
            'relatedStatus' => $this->resolveRelatedStatus($notification->action_url),
        ];
    }
}
