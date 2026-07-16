<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeoffRecord extends Model
{
    use HasFactory;

    protected $table = 'timeoffs';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'user_code',
        'type',
        'sub_type',
        'work_date',
        'expected_time',
        'reason',
        'status',
        'requested_at',
        'approved_by_name',
        'rejected_reason',
        'approver_code',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'work_date' => 'date:Y-m-d',
        'requested_at' => 'datetime',
    ];
}
