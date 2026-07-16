<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRemainRequest extends FormRequest
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
            'user_code' => [
                'required',
                'string',
                Rule::exists('users', 'employee_code'),
                Rule::unique('leaves_remain')->where(fn ($query) => $query->where('year', (int) $this->input('year'))),
            ],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'remaining_days' => ['required', 'numeric', 'min:0', 'max:365'],
        ];
    }
}
