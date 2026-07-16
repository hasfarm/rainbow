<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRemain extends Model
{
    use HasFactory;

    protected $table = 'leaves_remain';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_code',
        'year',
        'remaining_days',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'year' => 'integer',
        'remaining_days' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_code', 'employee_code');
    }
}
