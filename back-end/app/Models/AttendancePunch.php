<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendancePunch extends Model
{
    use HasFactory;

    protected $table = 'attendance_punches';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'attendance_id',
        'sequence',
        'punch_time',
        'photo',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'punch_time' => 'datetime:H:i:s',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class, 'attendance_id', 'id');
    }
}
