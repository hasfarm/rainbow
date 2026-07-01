<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'employee_code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'employee_code')->ignore($userId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:50'],
            'working_status' => ['nullable', 'string', 'max:50'],
            'employee_type' => ['nullable', 'in:official,probation'],
            'gender' => ['nullable', 'in:male,female'],
            'annual_leave' => ['nullable', 'integer', 'min:0'],
            'join_date' => ['nullable', 'date'],
            'official_working_date' => ['nullable', 'date'],
            'probation_salary' => ['nullable', 'numeric', 'min:0'],
            'current_salary' => ['nullable', 'numeric', 'min:0'],
            'allowance' => ['nullable', 'numeric', 'min:0'],
            'petrol_allowance' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
