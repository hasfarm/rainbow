<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DecideTimeoffRequest;
use App\Http\Requests\StoreTimeoffRequest;
use App\Models\TimeoffRecord;
use App\Models\User;
use App\Support\ApprovalNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TimeoffController extends Controller
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

        $records = TimeoffRecord::query()
            ->where('user_code', $user->employee_code)
            ->orderByDesc('requested_at')
            ->get();

        return response()->json([
            'data' => $records->map(fn (TimeoffRecord $item) => $this->transformTimeoff($item))->values(),
        ]);
    }

    public function store(StoreTimeoffRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $validated = $request->validated();

        $record = TimeoffRecord::query()->create([
            'id' => $this->newTimeoffId(),
            'user_code' => $user->employee_code,
            'type' => $validated['type'],
            'sub_type' => $validated['sub_type'] ?? null,
            'work_date' => $validated['work_date'],
            'expected_time' => $validated['expected_time'] ?? null,
            'reason' => $validated['reason'] ?? '',
            'status' => 'pending',
            'requested_at' => now(),
            'approved_by_name' => null,
            'rejected_reason' => null,
            'approver_code' => $validated['approver_code'],
        ]);

        ApprovalNotificationService::notifyApprover(
            $validated['approver_code'],
            $user->name,
            $user->position ?? 'Nhân viên',
            $user->avatar,
            'Yêu cầu duyệt đơn đi trễ/về sớm',
            $user->name . ' vừa gửi đơn ' . $this->timeoffTypeLabel($record->type, $record->sub_type) . '. Vui lòng vào mục đơn đi trễ/về sớm để duyệt.',
            '/timeoff',
            'important'
        );

        return response()->json([
            'message' => 'Timeoff request created successfully.',
            'data' => $this->transformTimeoff($record),
        ], 201);
    }

    public function decide(DecideTimeoffRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $record = TimeoffRecord::query()->where('id', $id)->first();
        if ($record === null) {
            return response()->json([
                'message' => 'Timeoff request not found.',
            ], 404);
        }

        if ($record->approver_code !== $user->employee_code) {
            return response()->json([
                'message' => 'You are not allowed to approve or reject this timeoff request.',
            ], 403);
        }

        if ($record->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending timeoff requests can be approved or rejected.',
            ], 422);
        }

        $validated = $request->validated();
        $decision = $validated['decision'];
        $comment = trim((string) ($validated['comment'] ?? ''));

        if ($decision === 'rejected' && $comment === '') {
            return response()->json([
                'message' => 'Comment is required when rejecting a timeoff request.',
            ], 422);
        }

        $record->status = $decision;
        $record->approved_by_name = $user->name;
        $record->rejected_reason = $decision === 'rejected' ? $comment : ($comment !== '' ? $comment : null);
        $record->save();

        ApprovalNotificationService::notifyApprover(
            $record->user_code,
            $user->name,
            $user->position ?? 'Quan ly',
            $user->avatar,
            $decision === 'approved' ? 'Don di tre/ve som da duoc duyet' : 'Don di tre/ve som bi tu choi',
            $decision === 'approved'
                ? ($user->name . ' da duyet don di tre/ve som cua ban.')
                : ($user->name . ' da tu choi don di tre/ve som cua ban.' . ($comment !== '' ? (' Ly do: ' . $comment) : '')),
            '/timeoff',
            'important'
        );

        return response()->json([
            'message' => $decision === 'approved' ? 'Timeoff request approved successfully.' : 'Timeoff request rejected successfully.',
            'data' => $this->transformTimeoff($record),
        ]);
    }

    private function transformTimeoff(TimeoffRecord $record): array
    {
        return [
            'id' => $record->id,
            'userId' => $record->user_code,
            'type' => $record->type,
            'subType' => $record->sub_type,
            'date' => $record->work_date?->format('Y-m-d'),
            'expectedTime' => $record->expected_time ? substr((string) $record->expected_time, 0, 5) : null,
            'reason' => $record->reason,
            'status' => $record->status,
            'createdAt' => $record->requested_at?->toIso8601String(),
            'approvedBy' => $record->approved_by_name,
            'rejectedReason' => $record->rejected_reason,
            'approver' => $record->approver_code,
        ];
    }

    private function timeoffTypeLabel(string $type, ?string $subType): string
    {
        if ($type === 'late_arrival') {
            return 'đi trễ';
        }

        if ($type === 'early_departure') {
            return 'về sớm';
        }

        if ($type === 'women_policy') {
            return $subType === 'early' ? 'chế độ phụ nữ (về sớm)' : 'chế độ phụ nữ (đi trễ)';
        }

        return 'đi trễ/về sớm';
    }

    private function newTimeoffId(): string
    {
        return 'TO' . now()->format('ymd') . Str::upper(Str::random(7));
    }
}
