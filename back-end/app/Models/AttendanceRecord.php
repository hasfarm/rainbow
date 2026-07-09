<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $table = 'attendance_records';

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
        'status',
        'ip_address',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'work_date' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_code', 'employee_code');
    }

    public function punches(): HasMany
    {
        return $this->hasMany(AttendancePunch::class, 'attendance_id', 'id')->orderBy('sequence');
    }
}
