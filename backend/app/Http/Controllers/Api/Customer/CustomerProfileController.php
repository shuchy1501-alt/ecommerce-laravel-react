<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Requests\Customer\UploadAvatarRequest;
use App\Http\Resources\CustomerProfileResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CustomerProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->success(new CustomerProfileResource($request->user()), 'Profile retrieved.');
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return $this->success(new CustomerProfileResource($user->fresh()), 'Profile updated successfully.');
    }

    public function uploadPhoto(UploadAvatarRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('photo')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $this->success(new CustomerProfileResource($user->fresh()), 'Profile photo updated successfully.');
    }

    public function removePhoto(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return $this->success(new CustomerProfileResource($user->fresh()), 'Profile photo removed.');
    }
}
