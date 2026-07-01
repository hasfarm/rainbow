<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class HrmMockSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();

        $users = $this->readJson('users.json');
        $attendance = $this->readJson('attendance.json');
        $notifications = $this->readJson('notifications.json');
        $leaves = $this->readJson('leaves.json');
        $overtimes = $this->readJson('overtimes.json');
        $payslips = $this->readJson('payslips.json');
        $timeoffs = $this->readJson('timeoffs.json');

        DB::transaction(function () use ($now, $users, $attendance, $notifications, $leaves, $overtimes, $payslips, $timeoffs) {
            $this->seedUsers($users, $now);
            $this->seedAttendance($attendance, $now);
            $this->seedNotifications($notifications, $now);
            $this->seedLeaves($leaves, $now);
            $this->seedOvertimes($overtimes, $now);
            $this->seedPayslips($payslips, $now);
            $this->seedTimeoffs($timeoffs, $now);
        });
    }

    private function seedUsers(array $users, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'employee_code' => $item['id'],
                'name' => $item['name'],
                'email' => $item['email'],
                'password' => Hash::make($item['password']),
                'role' => $item['role'],
                'department' => $item['department'],
                'position' => $item['position'],
                'avatar' => $item['avatar'],
                'annual_leave' => (int) $item['annualLeave'],
                'phone' => $item['phone'],
                'join_date' => $item['joinDate'],
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $users);

        DB::table('users')->upsert($rows, ['employee_code'], [
            'name',
            'email',
            'password',
            'role',
            'department',
            'position',
            'avatar',
            'annual_leave',
            'phone',
            'join_date',
            'email_verified_at',
            'updated_at',
        ]);
    }

    private function seedAttendance(array $attendance, Carbon $now): void
    {
        $records = [];
        $punches = [];

        foreach ($attendance as $item) {
            $records[] = [
                'id' => $item['id'],
                'user_code' => $item['userId'],
                'work_date' => $item['date'],
                'status' => $item['status'],
                'ip_address' => $item['ipAddress'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            foreach (($item['punches'] ?? []) as $idx => $punch) {
                $punches[] = [
                    'attendance_id' => $item['id'],
                    'sequence' => $idx + 1,
                    'punch_time' => $punch['time'],
                    'photo' => $punch['photo'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('attendance_records')->upsert($records, ['id'], [
            'user_code',
            'work_date',
            'status',
            'ip_address',
            'updated_at',
        ]);

        $attendanceIds = array_column($records, 'id');
        if (!empty($attendanceIds)) {
            DB::table('attendance_punches')->whereIn('attendance_id', $attendanceIds)->delete();
        }

        foreach (array_chunk($punches, 500) as $chunk) {
            DB::table('attendance_punches')->insert($chunk);
        }
    }

    private function seedNotifications(array $notifications, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'id' => $item['id'],
                'type' => $item['type'],
                'title' => $item['title'] === '' ? null : $item['title'],
                'content' => $item['content'],
                'sender_name' => $item['senderName'],
                'sender_position' => $item['senderPosition'],
                'sender_avatar' => $item['senderAvatar'] ?? null,
                'recipient_code' => $item['recipientId'] ?? null,
                'sent_at' => $item['date'],
                'is_read' => (bool) $item['isRead'],
                'priority' => $item['priority'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $notifications);

        DB::table('notifications')->upsert($rows, ['id'], [
            'type',
            'title',
            'content',
            'sender_name',
            'sender_position',
            'sender_avatar',
            'recipient_code',
            'sent_at',
            'is_read',
            'priority',
            'updated_at',
        ]);
    }

    private function seedLeaves(array $leaves, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'id' => $item['id'],
                'user_code' => $item['userId'],
                'type' => $item['type'],
                'start_date' => $item['startDate'],
                'end_date' => $item['endDate'],
                'start_time' => $item['startTime'] ?? null,
                'end_time' => $item['endTime'] ?? null,
                'reason' => $item['reason'],
                'status' => $item['status'],
                'requested_at' => $item['createdAt'],
                'approved_by_name' => $item['approvedBy'] ?? null,
                'rejected_reason' => $item['rejectedReason'] ?? null,
                'handover_to_code' => $item['handoverTo'] ?? null,
                'handover_note' => $item['handoverNote'] ?? null,
                'approver_code' => $item['approver'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $leaves);

        DB::table('leaves')->upsert($rows, ['id'], [
            'user_code',
            'type',
            'start_date',
            'end_date',
            'start_time',
            'end_time',
            'reason',
            'status',
            'requested_at',
            'approved_by_name',
            'rejected_reason',
            'handover_to_code',
            'handover_note',
            'approver_code',
            'updated_at',
        ]);
    }

    private function seedOvertimes(array $overtimes, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'id' => $item['id'],
                'user_code' => $item['userId'],
                'work_date' => $item['date'],
                'start_time' => $item['startTime'],
                'end_time' => $item['endTime'],
                'hours' => $item['hours'],
                'overtime_type' => $item['overtimeType'],
                'reason' => $item['reason'],
                'status' => $item['status'],
                'approver_1_code' => $item['approverId'] ?? null,
                'approver_1_name' => $item['approverName'] ?? null,
                'approver_2_code' => $item['approver2Id'] ?? null,
                'approver_2_name' => $item['approver2Name'] ?? null,
                'requested_at' => $item['createdAt'],
                'reject_reason' => $item['rejectReason'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $overtimes);

        DB::table('overtimes')->upsert($rows, ['id'], [
            'user_code',
            'work_date',
            'start_time',
            'end_time',
            'hours',
            'overtime_type',
            'reason',
            'status',
            'approver_1_code',
            'approver_1_name',
            'approver_2_code',
            'approver_2_name',
            'requested_at',
            'reject_reason',
            'updated_at',
        ]);
    }

    private function seedPayslips(array $payslips, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'id' => $item['id'],
                'user_code' => $item['userId'],
                'month' => (int) $item['month'],
                'year' => (int) $item['year'],
                'period_start' => $item['periodStart'],
                'period_end' => $item['periodEnd'],
                'status' => $item['status'],
                'confirmed_at' => $item['confirmedAt'] ?? null,
                'disputed_reason' => $item['disputedReason'] ?? null,
                'agreed_salary' => (int) $item['agreedSalary'],
                'standard_days' => (int) $item['standardDays'],
                'actual_days' => (float) $item['actualDays'],
                'monthly_salary' => (int) $item['monthlySalary'],
                'ot_weekday_hours' => (float) $item['otWeekdayHours'],
                'ot_weekend_2x_hours' => (float) $item['otWeekend2xHours'],
                'ot_weekend_3x_hours' => (float) $item['otWeekend3xHours'],
                'ot_holiday_hours' => (float) $item['otHolidayHours'],
                'unpaid_leave_days' => (float) $item['unpaidLeaveDays'],
                'annual_leave_days' => (float) $item['annualLeaveDays'],
                'overtime_pay' => (int) $item['overtimePay'],
                'commission' => (int) $item['commission'],
                'kpi' => (int) $item['kpi'],
                'business_trip' => (int) $item['businessTrip'],
                'event_support' => (int) $item['eventSupport'],
                'meal_transport_allowance' => (int) $item['mealTransportAllowance'],
                'other_allowance' => (int) $item['otherAllowance'],
                'gross_salary' => (int) $item['grossSalary'],
                'insurance_total' => (int) $item['insuranceTotal'],
                'tax' => (int) $item['tax'],
                'advance' => (int) $item['advance'],
                'late_penalty_minutes' => (int) $item['latePenaltyMinutes'],
                'attendance_bonus_deduct' => (int) $item['attendanceBonusDeduct'],
                'forgot_punch_count' => (int) $item['forgotPunchCount'],
                'forgot_punch_deduct' => (int) $item['forgotPunchDeduct'],
                'other_deduction' => (int) $item['otherDeduction'],
                'net_income' => (int) $item['netIncome'],
                'note' => $item['note'] ?? null,
                'issued_at' => $item['createdAt'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $payslips);

        DB::table('payslips')->upsert($rows, ['id'], [
            'user_code',
            'month',
            'year',
            'period_start',
            'period_end',
            'status',
            'confirmed_at',
            'disputed_reason',
            'agreed_salary',
            'standard_days',
            'actual_days',
            'monthly_salary',
            'ot_weekday_hours',
            'ot_weekend_2x_hours',
            'ot_weekend_3x_hours',
            'ot_holiday_hours',
            'unpaid_leave_days',
            'annual_leave_days',
            'overtime_pay',
            'commission',
            'kpi',
            'business_trip',
            'event_support',
            'meal_transport_allowance',
            'other_allowance',
            'gross_salary',
            'insurance_total',
            'tax',
            'advance',
            'late_penalty_minutes',
            'attendance_bonus_deduct',
            'forgot_punch_count',
            'forgot_punch_deduct',
            'other_deduction',
            'net_income',
            'note',
            'issued_at',
            'updated_at',
        ]);
    }

    private function seedTimeoffs(array $timeoffs, Carbon $now): void
    {
        $rows = array_map(function (array $item) use ($now): array {
            return [
                'id' => $item['id'],
                'user_code' => $item['userId'],
                'type' => $item['type'],
                'sub_type' => $item['subType'] ?? null,
                'work_date' => $item['date'],
                'expected_time' => $item['expectedTime'] ?? null,
                'reason' => $item['reason'],
                'status' => $item['status'],
                'requested_at' => $item['createdAt'],
                'approved_by_name' => $item['approvedBy'] ?? null,
                'rejected_reason' => $item['rejectedReason'] ?? null,
                'approver_code' => $item['approver'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, $timeoffs);

        DB::table('timeoffs')->upsert($rows, ['id'], [
            'user_code',
            'type',
            'sub_type',
            'work_date',
            'expected_time',
            'reason',
            'status',
            'requested_at',
            'approved_by_name',
            'rejected_reason',
            'approver_code',
            'updated_at',
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readJson(string $file): array
    {
        $path = database_path('seeders/data/' . $file);

        if (!file_exists($path)) {
            throw new \RuntimeException('Missing seed data file: ' . $path);
        }

        $content = file_get_contents($path);
        if ($content === false) {
            throw new \RuntimeException('Cannot read seed data file: ' . $path);
        }

        $data = json_decode($content, true);
        if (!is_array($data)) {
            throw new \RuntimeException('Invalid JSON in seed data file: ' . $path);
        }

        return $data;
    }
}
