<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'department' => $this->department,
            'position' => $this->position,
            'role' => $this->role,
            'working_status' => $this->working_status,
            'employee_type' => $this->employee_type,
            'gender' => $this->gender,
            'annual_leave' => $this->annual_leave,
            'join_date' => $this->join_date,
            'official_working_date' => $this->official_working_date,
            'probation_salary' => $this->probation_salary,
            'current_salary' => $this->current_salary,
            'allowance' => $this->allowance,
            'petrol_allowance' => $this->petrol_allowance,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
