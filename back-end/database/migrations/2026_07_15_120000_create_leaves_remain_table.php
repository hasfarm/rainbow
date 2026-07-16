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
        Schema::create('leaves_remain', function (Blueprint $table) {
            $table->id();
            $table->string('user_code', 20);
            $table->unsignedSmallInteger('year');
            $table->decimal('remaining_days', 5, 2)->default(0);
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->unique(['user_code', 'year']);
            $table->index('year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves_remain');
    }
};
