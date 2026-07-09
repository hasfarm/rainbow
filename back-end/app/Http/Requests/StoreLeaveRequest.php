<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequest extends FormRequest
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
            'type' => ['required', Rule::in([
                'annual_leave',
                'unpaid_leave',
                'late_arrival',
                'early_departure',
                'women_policy',
                'marriage_leave',
                'bereavement_leave',
                'business_trip',
            ])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'reason' => ['required', 'string', 'min:10'],
            'handover_to_code' => ['nullable', 'string', Rule::exists('users', 'employee_code')],
            'handover_note' => ['nullable', 'string', 'max:1000'],
            'approver_code' => ['nullable', 'string', Rule::exists('users', 'employee_code')],
        ];
    }
}
