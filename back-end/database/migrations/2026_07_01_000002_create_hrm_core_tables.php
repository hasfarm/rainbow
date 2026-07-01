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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('user_code', 20);
            $table->date('work_date');
            $table->enum('status', ['on_time', 'late', 'early_leave', 'absent']);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->index(['user_code', 'work_date']);
        });

        Schema::create('attendance_punches', function (Blueprint $table) {
            $table->id();
            $table->string('attendance_id', 32);
            $table->unsignedSmallInteger('sequence');
            $table->time('punch_time');
            $table->text('photo')->nullable();
            $table->timestamps();

            $table->foreign('attendance_id')->references('id')->on('attendance_records')->cascadeOnDelete();
            $table->unique(['attendance_id', 'sequence']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->enum('type', ['announcement', 'private']);
            $table->string('title')->nullable();
            $table->text('content');
            $table->string('sender_name');
            $table->string('sender_position');
            $table->text('sender_avatar')->nullable();
            $table->string('recipient_code', 20)->nullable();
            $table->dateTime('sent_at');
            $table->boolean('is_read')->default(false);
            $table->enum('priority', ['normal', 'important', 'urgent'])->default('normal');
            $table->timestamps();

            $table->foreign('recipient_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->index(['type', 'sent_at']);
        });

        Schema::create('leaves', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('user_code', 20);
            $table->enum('type', [
                'annual_leave',
                'unpaid_leave',
                'late_arrival',
                'early_departure',
                'women_policy',
                'marriage_leave',
                'bereavement_leave',
                'business_trip',
            ]);
            $table->date('start_date');
            $table->date('end_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected']);
            $table->dateTime('requested_at');
            $table->string('approved_by_name')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->string('handover_to_code', 20)->nullable();
            $table->text('handover_note')->nullable();
            $table->string('approver_code', 20)->nullable();
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->foreign('handover_to_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->foreign('approver_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->index(['user_code', 'status']);
        });

        Schema::create('overtimes', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('user_code', 20);
            $table->date('work_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('hours', 5, 2);
            $table->enum('overtime_type', ['regular', 'weekend', 'holiday']);
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected']);
            $table->string('approver_1_code', 20)->nullable();
            $table->string('approver_1_name')->nullable();
            $table->string('approver_2_code', 20)->nullable();
            $table->string('approver_2_name')->nullable();
            $table->dateTime('requested_at');
            $table->text('reject_reason')->nullable();
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->foreign('approver_1_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->foreign('approver_2_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->index(['user_code', 'work_date']);
        });

        Schema::create('payslips', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('user_code', 20);
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->date('period_start');
            $table->date('period_end');
            $table->enum('status', ['pending', 'confirmed', 'disputed']);
            $table->date('confirmed_at')->nullable();
            $table->text('disputed_reason')->nullable();

            $table->unsignedInteger('agreed_salary')->default(0);
            $table->unsignedTinyInteger('standard_days')->default(0);
            $table->decimal('actual_days', 5, 2)->default(0);
            $table->unsignedInteger('monthly_salary')->default(0);
            $table->decimal('ot_weekday_hours', 6, 2)->default(0);
            $table->decimal('ot_weekend_2x_hours', 6, 2)->default(0);
            $table->decimal('ot_weekend_3x_hours', 6, 2)->default(0);
            $table->decimal('ot_holiday_hours', 6, 2)->default(0);
            $table->decimal('unpaid_leave_days', 5, 2)->default(0);
            $table->decimal('annual_leave_days', 5, 2)->default(0);
            $table->unsignedInteger('overtime_pay')->default(0);
            $table->unsignedInteger('commission')->default(0);
            $table->unsignedInteger('kpi')->default(0);
            $table->unsignedInteger('business_trip')->default(0);
            $table->unsignedInteger('event_support')->default(0);
            $table->unsignedInteger('meal_transport_allowance')->default(0);
            $table->unsignedInteger('other_allowance')->default(0);

            $table->unsignedInteger('gross_salary')->default(0);
            $table->unsignedInteger('insurance_total')->default(0);
            $table->unsignedInteger('tax')->default(0);
            $table->unsignedInteger('advance')->default(0);
            $table->unsignedSmallInteger('late_penalty_minutes')->default(0);
            $table->unsignedInteger('attendance_bonus_deduct')->default(0);
            $table->unsignedTinyInteger('forgot_punch_count')->default(0);
            $table->unsignedInteger('forgot_punch_deduct')->default(0);
            $table->unsignedInteger('other_deduction')->default(0);

            $table->unsignedInteger('net_income')->default(0);
            $table->text('note')->nullable();
            $table->date('issued_at');
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->index(['user_code', 'year', 'month']);
        });

        Schema::create('timeoffs', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('user_code', 20);
            $table->enum('type', ['late_arrival', 'early_departure', 'women_policy']);
            $table->enum('sub_type', ['late', 'early'])->nullable();
            $table->date('work_date');
            $table->time('expected_time')->nullable();
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected']);
            $table->dateTime('requested_at');
            $table->string('approved_by_name')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->string('approver_code', 20)->nullable();
            $table->timestamps();

            $table->foreign('user_code')->references('employee_code')->on('users')->cascadeOnDelete();
            $table->foreign('approver_code')->references('employee_code')->on('users')->nullOnDelete();
            $table->index(['user_code', 'work_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timeoffs');
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('overtimes');
        Schema::dropIfExists('leaves');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('attendance_punches');
        Schema::dropIfExists('attendance_records');
    }
};
