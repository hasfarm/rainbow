<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTimeoffRequest extends FormRequest
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
            'type' => ['required', Rule::in(['late_arrival', 'early_departure', 'women_policy'])],
            'sub_type' => ['nullable', Rule::in(['late', 'early'])],
            'work_date' => ['required', 'date'],
            'expected_time' => ['nullable', 'date_format:H:i'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'approver_code' => ['required', 'string', Rule::exists('users', 'employee_code')],
        ];
    }
}
