<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeaveRemainRequest;
use App\Http\Requests\UpdateLeaveRemainRequest;
use App\Models\LeaveRemain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveRemainController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LeaveRemain::query()->with('user:id,employee_code,name,department,position');

        $keyword = trim((string) $request->query('q', ''));
        if ($keyword !== '') {
            $query->where(function ($builder) use ($keyword) {
                $builder->where('user_code', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function ($userQuery) use ($keyword) {
                        $userQuery->where('name', 'like', "%{$keyword}%")
                            ->orWhere('department', 'like', "%{$keyword}%")
                            ->orWhere('position', 'like', "%{$keyword}%");
                    });
            });
        }

        $year = (int) $request->integer('year', 0);
        if ($year > 0) {
            $query->where('year', $year);
        }

        $records = $query
            ->orderByDesc('year')
            ->orderBy('user_code')
            ->get();

        return response()->json([
            'data' => $records->map(fn (LeaveRemain $record) => $this->transform($record))->values(),
        ]);
    }

    public function store(StoreLeaveRemainRequest $request): JsonResponse
    {
        $record = LeaveRemain::query()->create($request->validated());
        $record->load('user:id,employee_code,name,department,position');

        return response()->json([
            'message' => 'Leave remain created successfully.',
            'data' => $this->transform($record),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $record = LeaveRemain::query()->with('user:id,employee_code,name,department,position')->find($id);
        if ($record === null) {
            return response()->json([
                'message' => 'Leave remain not found.',
            ], 404);
        }

        return response()->json([
            'data' => $this->transform($record),
        ]);
    }

    public function update(UpdateLeaveRemainRequest $request, string $id): JsonResponse
    {
        $record = LeaveRemain::query()->find($id);
        if ($record === null) {
            return response()->json([
                'message' => 'Leave remain not found.',
            ], 404);
        }

        $record->update($request->validated());
        $record->load('user:id,employee_code,name,department,position');

        return response()->json([
            'message' => 'Leave remain updated successfully.',
            'data' => $this->transform($record),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $record = LeaveRemain::query()->find($id);
        if ($record === null) {
            return response()->json([
                'message' => 'Leave remain not found.',
            ], 404);
        }

        $record->delete();

        return response()->json([
            'message' => 'Leave remain deleted successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(LeaveRemain $record): array
    {
        return [
            'id' => (int) $record->id,
            'userCode' => $record->user_code,
            'year' => (int) $record->year,
            'remainingDays' => (float) $record->remaining_days,
            'employeeName' => $record->user?->name,
            'department' => $record->user?->department,
            'position' => $record->user?->position,
            'createdAt' => $record->created_at?->toIso8601String(),
            'updatedAt' => $record->updated_at?->toIso8601String(),
        ];
    }
}
