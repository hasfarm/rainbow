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
            $table->string('working_status', 50)->nullable()->after('join_date');
            $table->date('official_working_date')->nullable()->after('working_status');
            $table->decimal('current_salary', 15, 2)->nullable()->after('official_working_date');
            $table->string('contract_type', 100)->nullable()->after('current_salary');
            $table->string('id_number', 50)->nullable()->after('contract_type');
            $table->string('issurance_book_number', 100)->nullable()->after('id_number');
            $table->string('personal_tax_code', 100)->nullable()->after('issurance_book_number');

            $table->unsignedTinyInteger('dependant_qty')->default(0)->after('personal_tax_code');

            $table->string('dependant_01_name')->nullable()->after('dependant_qty');
            $table->date('dependant_01_dob')->nullable()->after('dependant_01_name');
            $table->string('dependant_01_tax_code', 100)->nullable()->after('dependant_01_dob');
            $table->string('dependant_01_id_number', 50)->nullable()->after('dependant_01_tax_code');
            $table->string('dependant_01_relationship', 100)->nullable()->after('dependant_01_id_number');

            $table->string('dependant_02_name')->nullable()->after('dependant_01_relationship');
            $table->date('dependant_02_dob')->nullable()->after('dependant_02_name');
            $table->string('dependant_02_tax_code', 100)->nullable()->after('dependant_02_dob');
            $table->string('dependant_02_id_number', 50)->nullable()->after('dependant_02_tax_code');
            $table->string('dependant_02_relationship', 100)->nullable()->after('dependant_02_id_number');

            $table->string('dependant_03_name')->nullable()->after('dependant_02_relationship');
            $table->date('dependant_03_dob')->nullable()->after('dependant_03_name');
            $table->string('dependant_03_tax_code', 100)->nullable()->after('dependant_03_dob');
            $table->string('dependant_03_id_number', 50)->nullable()->after('dependant_03_tax_code');
            $table->string('dependant_03_relationship', 100)->nullable()->after('dependant_03_id_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'working_status',
                'official_working_date',
                'current_salary',
                'contract_type',
                'id_number',
                'issurance_book_number',
                'personal_tax_code',
                'dependant_qty',
                'dependant_01_name',
                'dependant_01_dob',
                'dependant_01_tax_code',
                'dependant_01_id_number',
                'dependant_01_relationship',
                'dependant_02_name',
                'dependant_02_dob',
                'dependant_02_tax_code',
                'dependant_02_id_number',
                'dependant_02_relationship',
                'dependant_03_name',
                'dependant_03_dob',
                'dependant_03_tax_code',
                'dependant_03_id_number',
                'dependant_03_relationship',
            ]);
        });
    }
};
