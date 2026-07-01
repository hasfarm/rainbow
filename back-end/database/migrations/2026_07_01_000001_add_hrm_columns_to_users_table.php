<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_code', 20)->nullable()->unique()->after('id');
            $table->string('role', 50)->nullable()->after('password');
            $table->string('department')->nullable()->after('role');
            $table->string('position')->nullable()->after('department');
            $table->text('avatar')->nullable()->after('position');
            $table->unsignedSmallInteger('annual_leave')->default(0)->after('avatar');
            $table->string('phone', 30)->nullable()->after('annual_leave');
            $table->date('join_date')->nullable()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['employee_code']);
            $table->dropColumn([
                'employee_code',
                'role',
                'department',
                'position',
                'avatar',
                'annual_leave',
                'phone',
                'join_date',
            ]);
        });
    }
};
