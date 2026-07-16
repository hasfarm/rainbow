<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOvertimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'work_date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'hours' => ['required', 'numeric', 'gt:0'],
            'overtime_type' => ['required', Rule::in(['regular', 'weekend', 'holiday'])],
            'reason' => ['required', 'string', 'max:1000'],
            'approver_1_code' => ['required', 'string', Rule::exists('users', 'employee_code')],
            'approver_2_code' => ['required', 'string', Rule::exists('users', 'employee_code'), 'different:approver_1_code'],
        ];
    }
}
