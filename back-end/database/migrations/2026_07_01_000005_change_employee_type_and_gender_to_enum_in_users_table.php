<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize existing values to avoid enum conversion errors.
        DB::statement("UPDATE users SET employee_type = NULL WHERE employee_type IS NOT NULL AND employee_type NOT IN ('official', 'probation')");
        DB::statement("UPDATE users SET gender = NULL WHERE gender IS NOT NULL AND gender NOT IN ('male', 'female')");

        DB::statement("ALTER TABLE users MODIFY employee_type ENUM('official', 'probation') NULL");
        DB::statement("ALTER TABLE users MODIFY gender ENUM('male', 'female') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY employee_type VARCHAR(50) NULL");
        DB::statement("ALTER TABLE users MODIFY gender VARCHAR(20) NULL");
    }
};
