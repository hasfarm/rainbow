<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE attendance_punches MODIFY photo LONGTEXT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE attendance_punches MODIFY photo TEXT NULL');
    }
};
