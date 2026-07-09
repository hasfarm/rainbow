<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendancePunchRequest;
use App\Models\AttendanceRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendanceController extends Controller
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

        $query = AttendanceRecord::query()
            ->with('punches')
            ->where('user_code', $user->employee_code)
            ->orderByDesc('work_date');

        $month = trim((string) $request->query('month', ''));
        if ($month !== '' && preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            [$year, $monthNum] = explode('-', $month);
            $query->whereYear('work_date', (int) $year)->whereMonth('work_date', (int) $monthNum);
        }

        $records = $query->get();

        return response()->json([
            'data' => $records->map(fn (AttendanceRecord $record) => $this->transformRecord($record))->values(),
        ]);
    }

    public function today(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $record = AttendanceRecord::query()
            ->with('punches')
            ->where('user_code', $user->employee_code)
            ->whereDate('work_date', now()->toDateString())
            ->first();

        return response()->json([
            'data' => $record ? $this->transformRecord($record) : null,
        ]);
    }

    public function punch(StoreAttendancePunchRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (empty($user->employee_code)) {
            return response()->json([
                'message' => 'Current user has no employee_code configured.',
            ], 422);
        }

        $validated = $request->validated();
        $today = now()->toDateString();

        $record = DB::transaction(function () use ($user, $today, $request, $validated) {
            $record = AttendanceRecord::query()
                ->where('user_code', $user->employee_code)
                ->whereDate('work_date', $today)
                ->lockForUpdate()
                ->first();

            if ($record === null) {
                $record = AttendanceRecord::query()->create([
                    'id' => $this->newRecordId(),
                    'user_code' => $user->employee_code,
                    'work_date' => $today,
                    'status' => 'on_time',
                    'ip_address' => $request->ip(),
                ]);
            }

            $nextSequence = (int) $record->punches()->max('sequence') + 1;
            $punchTime = now()->format('H:i:s');

            $record->punches()->create([
                'sequence' => $nextSequence,
                'punch_time' => $punchTime,
                'photo' => $validated['photo'] ?? null,
            ]);

            $record->status = $this->resolveStatus($nextSequence, $punchTime, (string) $record->status);
            $record->ip_address = $request->ip();
            $record->save();

            return $record->fresh('punches');
        });

        return response()->json([
            'message' => 'Attendance punch stored successfully.',
            'data' => $this->transformRecord($record),
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRecord(AttendanceRecord $record): array
    {
        return [
            'id' => $record->id,
            'userId' => $record->user_code,
            'date' => $record->work_date?->format('Y-m-d'),
            'status' => $record->status,
            'statusLabel' => $this->statusLabel((string) $record->status),
            'ipAddress' => $record->ip_address,
            'punches' => $record->punches->map(fn ($punch) => [
                'sequence' => $punch->sequence,
                'time' => Carbon::parse((string) $punch->punch_time)->format('H:i:s'),
                'photo' => $punch->photo,
            ])->values(),
        ];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'on_time' => 'Đúng giờ',
            'late' => 'Đi muộn',
            'early_leave' => 'Về sớm',
            'absent' => 'Vắng mặt',
            default => $status,
        };
    }

    private function newRecordId(): string
    {
        return 'ATT' . now()->format('ymd') . Str::upper(Str::random(7));
    }

    private function resolveStatus(int $sequence, string $time, string $currentStatus): string
    {
        $onTimeCutoff = '08:00:00';
        $checkoutCutoff = '17:00:00';

        if ($sequence === 1) {
            return $time <= $onTimeCutoff ? 'on_time' : 'late';
        }

        // Even sequence means a check-out action in strict alternating flow.
        if ($sequence % 2 === 0 && $time < $checkoutCutoff) {
            return 'early_leave';
        }

        return $currentStatus;
    }
}
