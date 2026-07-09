<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRecord extends Model
{
    use HasFactory;

    protected $table = 'leaves';

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
        'start_date',
        'end_date',
        'start_time',
        'end_time',
        'reason',
        'status',
        'requested_at',
        'approved_by_name',
        'rejected_reason',
        'handover_to_code',
        'handover_note',
        'approver_code',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'requested_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_code', 'employee_code');
    }

    public function handoverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handover_to_code', 'employee_code');
    }

    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_code', 'employee_code');
    }
}
