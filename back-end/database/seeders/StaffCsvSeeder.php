<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

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

        $csv = $this->readCsv($file);
        $rows = $csv['rows'];
        $headers = $csv['headers'];

        if (empty($rows)) {
            $this->command?->warn('Staff CSV has no data rows, skipping StaffCsvSeeder.');

            return;
        }

        $now = now();
        $defaultPassword = Hash::make('123456');
        $availableColumns = array_flip(Schema::getColumnListing('users'));
        $payload = [];

        foreach ($rows as $index => $cols) {
            $row = $this->mapRow($headers, $cols, $index);

            $email = $row['email'];
            $name = $row['name'];

            if ($email === null || $name === null) {
                continue;
            }

            $employeeCode = $this->buildEmployeeCode($index, $email, $row['legacy_stt']);

            $rowPayload = [
                'employee_code' => $employeeCode,
                'name' => $name,
                'email' => strtolower($email),
                'password' => $defaultPassword,
                'role' => 'staff',
                'department' => $row['department'],
                'position' => $row['position'],
                'phone' => $row['phone'],
                'working_status' => $row['working_status'],
                'employee_type' => $row['employee_type'],
                'gender' => $row['gender'],
                'birth_date' => $row['birth_date'],
                'join_date' => $row['join_date'],
                'official_working_date' => $row['official_working_date'],
                'probation_salary' => $row['probation_salary'],
                'current_salary' => $row['current_salary'],
                'allowance' => $row['allowance'],
                'petrol_allowance' => $row['petrol_allowance'],
                'annual_leave' => 0,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            $payload[] = array_intersect_key($rowPayload, $availableColumns);
        }

        if (empty($payload)) {
            $this->command?->warn('Staff CSV rows are invalid, nothing to import.');

            return;
        }

        $updateColumns = [
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
        ];

        $filteredUpdateColumns = array_values(array_filter(
            $updateColumns,
            static fn (string $column): bool => isset($availableColumns[$column])
        ));

        DB::table('users')->upsert($payload, ['email'], $filteredUpdateColumns);

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
     * @return array{headers: array<int, string>, rows: array<int, array<int, string|null>>}
     */
    private function readCsv(string $file): array
    {
        $result = [
            'headers' => [],
            'rows' => [],
        ];

        $rows = [];
        $handle = fopen($file, 'rb');

        if ($handle === false) {
            return $result;
        }

        $header = fgetcsv($handle);
        if (is_array($header)) {
            $result['headers'] = array_map(
                static fn ($value): string => trim((string) $value),
                $header
            );
        }

        while (($cols = fgetcsv($handle)) !== false) {
            if (!is_array($cols) || count($cols) < 2) {
                continue;
            }
            $rows[] = $cols;
        }

        fclose($handle);

        $result['rows'] = $rows;

        return $result;
    }

    /**
     * @param array<int, string> $headers
     * @param array<int, string|null> $cols
     * @return array<string, mixed>
     */
    private function mapRow(array $headers, array $cols, int $index): array
    {
        $normalizedHeaders = array_map(
            static fn (string $value): string => mb_strtolower(trim($value)),
            $headers
        );

        $headerIndex = array_flip($normalizedHeaders);

        // New CSV format: full_name,gender,birthdate,working_status,job_type,position,start_working_date,official_working_date,Department,mobile,Email
        if (isset($headerIndex['full_name']) && isset($headerIndex['email'])) {
            $name = $this->normalizeString($this->colByHeader($cols, $headerIndex, 'full_name'));
            $email = $this->normalizeString($this->colByHeader($cols, $headerIndex, 'email'));

            return [
                'legacy_stt' => null,
                'name' => $name,
                'email' => $email,
                'department' => $this->normalizeString($this->colByHeader($cols, $headerIndex, 'department')),
                'position' => $this->normalizeString($this->colByHeader($cols, $headerIndex, 'position')),
                'phone' => $this->normalizePhone($this->colByHeader($cols, $headerIndex, 'mobile')),
                'working_status' => $this->normalizeString($this->colByHeader($cols, $headerIndex, 'working_status')),
                'employee_type' => $this->mapEmployeeType($this->colByHeader($cols, $headerIndex, 'job_type')),
                'gender' => $this->mapGender($this->colByHeader($cols, $headerIndex, 'gender')),
                'birth_date' => $this->parseDate($this->colByHeader($cols, $headerIndex, 'birthdate')),
                'join_date' => $this->parseDate($this->colByHeader($cols, $headerIndex, 'start_working_date')),
                'official_working_date' => $this->parseDate($this->colByHeader($cols, $headerIndex, 'official_working_date')),
                'probation_salary' => null,
                'current_salary' => null,
                'allowance' => null,
                'petrol_allowance' => null,
            ];
        }

        // Backward-compatible format used by previous exports.
        return [
            'legacy_stt' => $this->normalizeString($cols[0] ?? null),
            'name' => $this->normalizeString($cols[1] ?? null),
            'email' => $this->normalizeString($cols[13] ?? null),
            'department' => $this->normalizeString($cols[10] ?? null),
            'position' => $this->normalizeString($cols[7] ?? null) ?? $this->normalizeString($cols[11] ?? null),
            'phone' => $this->normalizePhone($cols[12] ?? null),
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
        ];
    }

    /**
     * @param array<int, string|null> $cols
     * @param array<string, int> $headerIndex
     */
    private function colByHeader(array $cols, array $headerIndex, string $header): ?string
    {
        $idx = $headerIndex[$header] ?? null;

        return $idx === null ? null : ($cols[$idx] ?? null);
    }

    private function buildEmployeeCode(int $index, string $email, ?string $legacyStt): string
    {
        if ($legacyStt !== null) {
            $digits = (string) preg_replace('/\D+/', '', $legacyStt);
            if ($digits !== '') {
                return 'CSV' . str_pad($digits, 4, '0', STR_PAD_LEFT);
            }
        }

        $localPart = strtolower((string) preg_replace('/[^a-z0-9]/i', '', strstr($email, '@', true) ?: $email));
        $prefix = strtoupper(substr($localPart, 0, 6));

        return 'CSV' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT) . ($prefix !== '' ? '-' . $prefix : '');
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

    private function normalizePhone(mixed $value): ?string
    {
        $text = $this->normalizeString($value);
        if ($text === null) {
            return null;
        }

        $normalized = preg_replace('/[^\d\+]/', '', $text);

        return $normalized === null || $normalized === '' ? null : $normalized;
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
