<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $key = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too many login attempts. Please try again in ' . $seconds . ' seconds.',
            ], 429);
        }

        $email = Str::lower($request->string('email')->toString());
        $password = $request->string('password')->toString();

        $user = User::query()->where('email', $email)->first();

        if ($user === null || !Hash::check($password, $user->password)) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'Email or password is incorrect.',
            ], 422);
        }

        RateLimiter::clear($key);

        // Token rotation: remove old tokens before creating a new one.
        $user->tokens()->delete();
        $token = $user->createToken('web-login')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token_type' => 'Bearer',
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token !== null) {
            $token->delete();
        }

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->employee_code ?? (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'staff',
            'department' => $user->department ?? '',
            'position' => $user->position ?? '',
            'avatar' => $user->avatar,
            'annualLeave' => $user->annual_leave ?? 0,
            'phone' => $user->phone ?? '',
            'joinDate' => $user->join_date?->format('Y-m-d'),
        ];
    }

    private function throttleKey(Request $request): string
    {
        return Str::lower((string) $request->input('email')) . '|' . $request->ip();
    }
}
