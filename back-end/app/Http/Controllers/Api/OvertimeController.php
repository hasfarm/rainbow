<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DecideOvertimeRequest;
use App\Http\Requests\StoreOvertimeRequest;
use App\Models\OvertimeRecord;
use App\Models\User;
use App\Support\ApprovalNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OvertimeController extends Controller
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

        $records = OvertimeRecord::query()
            ->where('user_code', $user->employee_code)
            ->orderByDesc('requested_at')
            ->get();

        return response()->json([
            'data' => $records->map(fn (OvertimeRecord $item) => $this->transformOvertime($item))->values(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $record = $this->findAccessibleOvertime($request, $id);
        if ($record instanceof JsonResponse) {
            return $record;
        }

        return response()->json([
            'data' => $this->transformOvertime($record),
        ]);
    }

    public function store(StoreOvertimeRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $validated = $request->validated();

        $record = OvertimeRecord::query()->create([
            'id' => $this->newOvertimeId(),
            'user_code' => $user->employee_code,
            'work_date' => $validated['work_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'hours' => $validated['hours'],
            'overtime_type' => $validated['overtime_type'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'approver_1_code' => $validated['approver_1_code'],
            'approver_1_name' => null,
            'approver_2_code' => $validated['approver_2_code'],
            'approver_2_name' => null,
            'requested_at' => now(),
            'reject_reason' => null,
        ]);

        $content = $user->name . ' vừa gửi phiếu tăng ca ngày ' . $record->work_date?->format('d/m/Y') . '. Vui lòng vào mục tăng ca để duyệt.';

        ApprovalNotificationService::notifyApprover(
            $validated['approver_1_code'],
            $user->name,
            $user->position ?? 'Nhân viên',
            $user->avatar,
            'Yêu cầu duyệt phiếu tăng ca cấp 1',
            $content,
            '/overtime/' . $record->id . '?mode=approval',
            'important'
        );

        return response()->json([
            'message' => 'Overtime request created successfully.',
            'data' => $this->transformOvertime($record),
        ], 201);
    }

    public function decide(DecideOvertimeRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $record = OvertimeRecord::query()->where('id', $id)->first();
        if ($record === null) {
            return response()->json([
                'message' => 'Overtime request not found.',
            ], 404);
        }

        $approvalStage = $record->approver_1_name === null ? 1 : 2;
        $isApprover1 = $record->approver_1_code === $user->employee_code;
        $isApprover2 = $record->approver_2_code === $user->employee_code;

        if ($approvalStage === 1 && !$isApprover1) {
            return response()->json([
                'message' => 'Only the first approver can process this overtime request at this stage.',
            ], 403);
        }

        if ($approvalStage === 2 && !$isApprover2) {
            return response()->json([
                'message' => 'Only the second approver can process this overtime request at this stage.',
            ], 403);
        }

        if ($record->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending overtime requests can be approved or rejected.',
            ], 422);
        }

        $validated = $request->validated();
        $decision = $validated['decision'];
        $comment = trim((string) ($validated['comment'] ?? ''));

        if ($decision === 'rejected' && $comment === '') {
            return response()->json([
                'message' => 'Comment is required when rejecting an overtime request.',
            ], 422);
        }

        if ($approvalStage === 1) {
            $record->approver_1_name = $user->name;

            if ($decision === 'approved') {
                $record->reject_reason = $comment !== '' ? $comment : null;
                $record->save();

                if (!empty($record->approver_2_code) && $record->approver_2_code !== $record->approver_1_code) {
                    ApprovalNotificationService::notifyApprover(
                        $record->approver_2_code,
                        $user->name,
                        $user->position ?? 'Nhân viên',
                        $user->avatar,
                        'Yêu cầu duyệt phiếu tăng ca cấp 2',
                        $user->name . ' đã duyệt cấp 1 phiếu tăng ca. Vui lòng duyệt cấp 2.',
                        '/overtime/' . $record->id . '?mode=approval',
                        'important'
                    );
                }

                ApprovalNotificationService::notifyApprover(
                    $record->user_code,
                    $user->name,
                    $user->position ?? 'Quản lý',
                    $user->avatar,
                    'Phiếu tăng ca đã duyệt cấp 1',
                    $user->name . ' đã duyệt cấp 1 phiếu tăng ca của bạn. Phiếu đang chờ cấp 2 duyệt.',
                    '/overtime/' . $record->id,
                    'important'
                );

                return response()->json([
                    'message' => 'Overtime request approved at level 1 and sent to level 2.',
                    'data' => $this->transformOvertime($record),
                ]);
            }

            $record->status = 'rejected';
            $record->reject_reason = $comment;
            $record->save();

            ApprovalNotificationService::notifyApprover(
                $record->user_code,
                $user->name,
                $user->position ?? 'Quan ly',
                $user->avatar,
                'Phieu tang ca bi tu choi',
                $user->name . ' da tu choi phieu tang ca cua ban.' . ($comment !== '' ? (' Ly do: ' . $comment) : ''),
                '/overtime/' . $record->id,
                'important'
            );

            return response()->json([
                'message' => 'Overtime request rejected successfully.',
                'data' => $this->transformOvertime($record),
            ]);
        }

        $record->approver_2_name = $user->name;

        if ($decision === 'approved') {
            $record->status = 'approved';
            $record->reject_reason = $comment !== '' ? $comment : null;
            $record->save();

            ApprovalNotificationService::notifyApprover(
                $record->user_code,
                $user->name,
                $user->position ?? 'Quản lý',
                $user->avatar,
                'Phieu tang ca da duoc duyet',
                $user->name . ' da duyet phieu tang ca cua ban.',
                '/overtime/' . $record->id,
                'important'
            );

            return response()->json([
                'message' => 'Overtime request approved successfully.',
                'data' => $this->transformOvertime($record),
            ]);
        }

        $record->status = 'rejected';
        $record->reject_reason = $comment;
        $record->save();

        ApprovalNotificationService::notifyApprover(
            $record->user_code,
            $user->name,
            $user->position ?? 'Quan ly',
            $user->avatar,
            'Phieu tang ca bi tu choi',
            $user->name . ' da tu choi phieu tang ca cua ban.' . ($comment !== '' ? (' Ly do: ' . $comment) : ''),
            '/overtime/' . $record->id,
            'important'
        );

        return response()->json([
            'message' => 'Overtime request rejected successfully.',
            'data' => $this->transformOvertime($record),
        ]);
    }

    private function transformOvertime(OvertimeRecord $record): array
    {
        $approvalStage = $record->status === 'pending'
            ? ($record->approver_1_name === null ? 1 : 2)
            : null;

        $currentApproverId = null;
        if ($record->status === 'pending') {
            $currentApproverId = $approvalStage === 1 ? $record->approver_1_code : $record->approver_2_code;
        }

        return [
            'id' => $record->id,
            'userId' => $record->user_code,
            'date' => $record->work_date?->format('Y-m-d'),
            'startTime' => $record->start_time ? substr((string) $record->start_time, 0, 5) : null,
            'endTime' => $record->end_time ? substr((string) $record->end_time, 0, 5) : null,
            'hours' => (float) $record->hours,
            'overtimeType' => $record->overtime_type,
            'reason' => $record->reason,
            'status' => $record->status,
            'approverId' => $record->approver_1_code,
            'approverName' => $record->approver_1_name,
            'approver2Id' => $record->approver_2_code,
            'approver2Name' => $record->approver_2_name,
            'currentApproverId' => $currentApproverId,
            'approvalStage' => $approvalStage,
            'createdAt' => $record->requested_at?->toIso8601String(),
            'rejectReason' => $record->reject_reason,
        ];
    }

    /**
     * @return OvertimeRecord|JsonResponse
     */
    private function findAccessibleOvertime(Request $request, string $id): OvertimeRecord|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $record = OvertimeRecord::query()
            ->where('id', $id)
            ->where(function ($query) use ($user) {
                $query->where('user_code', $user->employee_code)
                    ->orWhere('approver_1_code', $user->employee_code)
                    ->orWhere('approver_2_code', $user->employee_code);
            })
            ->first();

        if ($record === null) {
            return response()->json([
                'message' => 'Overtime request not found.',
            ], 404);
        }

        return $record;
    }

    private function newOvertimeId(): string
    {
        return 'OT' . now()->format('ymd') . Str::upper(Str::random(8));
    }
}
