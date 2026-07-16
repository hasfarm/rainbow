<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OvertimeRecord extends Model
{
    use HasFactory;

    protected $table = 'overtimes';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
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
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'hours' => 'decimal:2',
        'requested_at' => 'datetime',
    ];
}
