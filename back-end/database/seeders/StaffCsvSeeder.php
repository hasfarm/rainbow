<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StaffCsvSeeder extends Seeder
{
    /**
     * Seed users from staff CSV export.
     */
    public function run(): void
    {
        $file = $this->resolveCsvPath();
        if ($file === null) {
            $this->command?->warn('Staff CSV not found, skipping StaffCsvSeeder.');

            return;
        }

        $rows = $this->readRows($file);
        if (empty($rows)) {
            $this->command?->warn('Staff CSV has no data rows, skipping StaffCsvSeeder.');

            return;
        }

        $now = now();
        $defaultPassword = Hash::make('123456');
        $payload = [];

        foreach ($rows as $index => $cols) {
            $email = $this->normalizeString($cols[13] ?? null);
            $name = $this->normalizeString($cols[1] ?? null);

            if ($email === null || $name === null) {
                continue;
            }

            $stt = $this->normalizeString($cols[0] ?? null) ?? (string) ($index + 1);
            $employeeCode = 'CSV' . str_pad((string) preg_replace('/\D+/', '', $stt), 4, '0', STR_PAD_LEFT);

            $payload[] = [
                'employee_code' => $employeeCode,
                'name' => $name,
                'email' => strtolower($email),
                'password' => $defaultPassword,
                'role' => 'staff',
                'department' => $this->normalizeString($cols[10] ?? null),
                'position' => $this->normalizeString($cols[7] ?? null) ?? $this->normalizeString($cols[11] ?? null),
                'phone' => $this->normalizeString($cols[12] ?? null),
                'working_status' => $this->normalizeString($cols[5] ?? null),
                'employee_type' => $this->mapEmployeeType($cols[6] ?? null),
                'gender' => $this->mapGender($cols[2] ?? null),
                'birth_date' => $this->parseDate($cols[3] ?? null),
                'join_date' => $this->parseDate($cols[8] ?? null),
                'official_working_date' => $this->parseDate($cols[9] ?? null),
                'probation_salary' => $this->parseMoney($cols[14] ?? null),
                'current_salary' => $this->parseMoney($cols[15] ?? null),
                'allowance' => $this->parseMoney($cols[16] ?? null),
                'petrol_allowance' => $this->parseMoney($cols[17] ?? null),
                'annual_leave' => 0,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (empty($payload)) {
            $this->command?->warn('Staff CSV rows are invalid, nothing to import.');

            return;
        }

        DB::table('users')->upsert(
            $payload,
            ['email'],
            [
                'employee_code',
                'name',
                'password',
                'role',
                'department',
                'position',
                'phone',
                'working_status',
                'employee_type',
                'gender',
                'birth_date',
                'join_date',
                'official_working_date',
                'probation_salary',
                'current_salary',
                'allowance',
                'petrol_allowance',
                'annual_leave',
                'email_verified_at',
                'updated_at',
            ]
        );

        $this->command?->info('StaffCsvSeeder imported ' . count($payload) . ' user rows from CSV.');
    }

    private function resolveCsvPath(): ?string
    {
        $candidates = [
            storage_path('app/public/rainbow-staff.csv'),
            storage_path('app/public/rainbow - staff.csv'),
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * @return array<int, array<int, string|null>>
     */
    private function readRows(string $file): array
    {
        $rows = [];
        $handle = fopen($file, 'rb');

        if ($handle === false) {
            return $rows;
        }

        // Skip header row.
        fgetcsv($handle);

        while (($cols = fgetcsv($handle)) !== false) {
            if (!is_array($cols) || count($cols) < 2) {
                continue;
            }
            $rows[] = $cols;
        }

        fclose($handle);

        return $rows;
    }

    private function normalizeString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' || strtoupper($trimmed) === '#VALUE!' ? null : $trimmed;
    }

    private function mapGender(mixed $value): ?string
    {
        $text = $this->normalizeString($value);
        if ($text === null) {
            return null;
        }

        $lower = mb_strtolower($text);

        if (str_contains($lower, 'nam')) {
            return 'male';
        }

        if (str_contains($lower, 'nữ') || str_contains($lower, 'nu')) {
            return 'female';
        }

        return null;
    }

    private function mapEmployeeType(mixed $value): ?string
    {
        $text = $this->normalizeString($value);
        if ($text === null) {
            return null;
        }

        $lower = mb_strtolower($text);

        if (str_contains($lower, 'thử') || str_contains($lower, 'thu')) {
            return 'probation';
        }

        if (str_contains($lower, 'chính') || str_contains($lower, 'chinh') || str_contains($lower, 'official')) {
            return 'official';
        }

        return null;
    }

    private function parseDate(mixed $value): ?string
    {
        $text = $this->normalizeString($value);
        if ($text === null) {
            return null;
        }

        $formats = ['d/m/Y', 'j/n/Y', 'Y-m-d'];

        foreach ($formats as $format) {
            try {
                $parsed = Carbon::createFromFormat($format, $text);
                if ($parsed !== false) {
                    return $parsed->format('Y-m-d');
                }
            } catch (\Throwable) {
            }
        }

        return null;
    }

    private function parseMoney(mixed $value): ?float
    {
        $text = $this->normalizeString($value);
        if ($text === null) {
            return null;
        }

        $normalized = preg_replace('/[^\d\.\,\-]/', '', $text);
        if ($normalized === null || $normalized === '') {
            return null;
        }

        // Handle formats like 1.234.567,89 and 1,234,567.89.
        if (str_contains($normalized, ',') && str_contains($normalized, '.')) {
            if (strrpos($normalized, ',') > strrpos($normalized, '.')) {
                $normalized = str_replace('.', '', $normalized);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $normalized);
            }
        } elseif (str_contains($normalized, ',')) {
            $normalized = str_replace('.', '', $normalized);
            $normalized = str_replace(',', '.', $normalized);
        }

        return is_numeric($normalized) ? (float) $normalized : null;
    }
}
