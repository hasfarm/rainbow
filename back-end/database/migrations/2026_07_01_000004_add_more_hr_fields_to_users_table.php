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
            $table->string('employee_type', 50)->nullable()->after('working_status');
            $table->string('gender', 20)->nullable()->after('employee_type');
            $table->unsignedSmallInteger('working_age')->nullable()->after('gender');
            $table->decimal('basic_salary', 15, 2)->nullable()->after('working_age');
            $table->decimal('allowance', 15, 2)->nullable()->after('basic_salary');
            $table->decimal('probation_salary', 15, 2)->nullable()->after('allowance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'employee_type',
                'gender',
                'working_age',
                'basic_salary',
                'allowance',
                'probation_salary',
            ]);
        });
    }
};
