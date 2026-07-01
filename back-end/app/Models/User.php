<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_code',
        'name',
        'email',
        'password',
        'phone',
        'department',
        'position',
        'role',
        'working_status',
        'employee_type',
        'gender',
        'annual_leave',
        'join_date',
        'official_working_date',
        'probation_salary',
        'current_salary',
        'allowance',
        'petrol_allowance',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'annual_leave' => 'integer',
        'join_date' => 'date:Y-m-d',
        'official_working_date' => 'date:Y-m-d',
        'probation_salary' => 'decimal:2',
        'current_salary' => 'decimal:2',
        'allowance' => 'decimal:2',
        'petrol_allowance' => 'decimal:2',
    ];
}
