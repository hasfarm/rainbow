<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DecideLeaveRequest;
use App\Http\Requests\StoreLeaveRequest;
use App\Http\Requests\UpdateLeaveRequest;
use App\Models\LeaveRecord;
use App\Models\User;
use App\Support\ApprovalNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class LeaveController extends Controller
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

        $scope = trim((string) $request->query('scope', 'owner'));

        $query = LeaveRecord::query()->orderByDesc('requested_at');

        if ($scope === 'approver') {
            $query->where('approver_code', $user->employee_code);
        } else {
            $query->where('user_code', $user->employee_code);
        }

        $status = trim((string) $request->query('status', ''));
        if ($status !== '' && in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $status);
        }

        return response()->json([
            'data' => $query->get()->map(fn (LeaveRecord $leave) => $this->transformLeave($leave))->values(),
        ]);
    }

    public function store(StoreLeaveRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $validated = $request->validated();

        $leave = LeaveRecord::query()->create([
            'id' => $this->newLeaveId(),
            'user_code' => $user->employee_code,
            'type' => $validated['type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'reason' => $validated['reason'],
            'status' => 'pending',
            'requested_at' => now(),
            'approved_by_name' => null,
            'rejected_reason' => null,
            'handover_to_code' => $validated['handover_to_code'] ?? null,
            'handover_note' => $validated['handover_note'] ?? null,
            'approver_code' => $validated['approver_code'] ?? null,
        ]);

        if (!empty($validated['approver_code'])) {
            ApprovalNotificationService::notifyApprover(
                $validated['approver_code'],
                $user->name,
                $user->position ?? 'Nhân viên',
                $user->avatar,
                'Yêu cầu duyệt đơn nghỉ phép',
                $user->name . ' vừa gửi đơn nghỉ phép. Vui lòng vào mục nghỉ phép để duyệt.',
                '/leave/' . $leave->id . '?mode=approval',
                'important'
            );
        }

        return response()->json([
            'message' => 'Leave request created successfully.',
            'data' => $this->transformLeave($leave),
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $leave = $this->findAccessibleLeave($request, $id);
        if ($leave instanceof JsonResponse) {
            return $leave;
        }

        return response()->json([
            'data' => $this->transformLeave($leave),
        ]);
    }

    public function update(UpdateLeaveRequest $request, string $id): JsonResponse
    {
        $leave = $this->findOwnedLeave($request, $id);
        if ($leave instanceof JsonResponse) {
            return $leave;
        }

        if ($leave->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave requests can be updated.',
            ], 422);
        }

        $validated = $request->validated();

        $leave->fill([
            'type' => $validated['type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'reason' => $validated['reason'],
            'handover_to_code' => $validated['handover_to_code'] ?? null,
            'handover_note' => $validated['handover_note'] ?? null,
            'approver_code' => $validated['approver_code'] ?? null,
        ]);
        $leave->save();

        return response()->json([
            'message' => 'Leave request updated successfully.',
            'data' => $this->transformLeave($leave),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $leave = $this->findOwnedLeave($request, $id);
        if ($leave instanceof JsonResponse) {
            return $leave;
        }

        if ($leave->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave requests can be deleted.',
            ], 422);
        }

        $leave->delete();

        return response()->json([
            'message' => 'Leave request deleted successfully.',
        ]);
    }

    public function decide(DecideLeaveRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $leave = LeaveRecord::query()->where('id', $id)->first();
        if ($leave === null) {
            return response()->json([
                'message' => 'Leave request not found.',
            ], 404);
        }

        if ($leave->approver_code !== $user->employee_code) {
            return response()->json([
                'message' => 'You are not allowed to approve or reject this leave request.',
            ], 403);
        }

        if ($leave->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending leave requests can be approved or rejected.',
            ], 422);
        }

        $validated = $request->validated();
        $decision = $validated['decision'];
        $comment = trim((string) ($validated['comment'] ?? ''));

        if ($decision === 'rejected' && $comment === '') {
            return response()->json([
                'message' => 'Comment is required when rejecting a leave request.',
            ], 422);
        }

        $leave->status = $decision;
        $leave->approved_by_name = $user->name;
        $leave->rejected_reason = $decision === 'rejected' ? $comment : ($comment !== '' ? $comment : null);
        $leave->save();

        ApprovalNotificationService::notifyApprover(
            $leave->user_code,
            $user->name,
            $user->position ?? 'Quan ly',
            $user->avatar,
            $decision === 'approved' ? 'Don nghi phep da duoc duyet' : 'Don nghi phep bi tu choi',
            $decision === 'approved'
                ? ($user->name . ' da duyet don nghi phep cua ban.')
                : ($user->name . ' da tu choi don nghi phep cua ban.' . ($comment !== '' ? (' Ly do: ' . $comment) : '')),
            '/leave/' . $leave->id,
            'important'
        );

        return response()->json([
            'message' => $decision === 'approved' ? 'Leave request approved successfully.' : 'Leave request rejected successfully.',
            'data' => $this->transformLeave($leave),
        ]);
    }

    /**
     * @return LeaveRecord|JsonResponse
     */
    private function findAccessibleLeave(Request $request, string $id): LeaveRecord|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $leave = LeaveRecord::query()
            ->where('id', $id)
            ->where(function ($query) use ($user) {
                $query->where('user_code', $user->employee_code)
                    ->orWhere('approver_code', $user->employee_code);
            })
            ->first();

        if ($leave === null) {
            return response()->json([
                'message' => 'Leave request not found.',
            ], 404);
        }

        return $leave;
    }

    /**
     * @return LeaveRecord|JsonResponse
     */
    private function findOwnedLeave(Request $request, string $id): LeaveRecord|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $leave = LeaveRecord::query()
            ->where('id', $id)
            ->where('user_code', $user->employee_code)
            ->first();

        if ($leave === null) {
            return response()->json([
                'message' => 'Leave request not found.',
            ], 404);
        }

        return $leave;
    }

    /**
     * @return array<string, mixed>
     */
    private function transformLeave(LeaveRecord $leave): array
    {
        return [
            'id' => $leave->id,
            'userId' => $leave->user_code,
            'type' => $leave->type,
            'startDate' => $leave->start_date?->format('Y-m-d'),
            'endDate' => $leave->end_date?->format('Y-m-d'),
            'startTime' => $leave->start_time ? Carbon::parse((string) $leave->start_time)->format('H:i') : null,
            'endTime' => $leave->end_time ? Carbon::parse((string) $leave->end_time)->format('H:i') : null,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'createdAt' => $leave->requested_at?->toIso8601String(),
            'approvedBy' => $leave->approved_by_name,
            'rejectedReason' => $leave->rejected_reason,
            'handoverTo' => $leave->handover_to_code,
            'handoverNote' => $leave->handover_note,
            'approver' => $leave->approver_code,
        ];
    }

    private function newLeaveId(): string
    {
        return 'LEAVE' . now()->format('ymd') . Str::upper(Str::random(6));
    }
}
