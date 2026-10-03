<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreAddressRequest;
use App\Http\Requests\Customer\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\CustomerAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * IMPORTANT (spec: address security): every action here scopes through
 * `$request->user()->addresses()` rather than `CustomerAddress::find()`, so
 * an address belonging to another customer can never be loaded, updated, or
 * deleted — it simply doesn't exist from this controller's point of view.
 * We never trust a user_id from the request body either; ownership always
 * comes from the authenticated user.
 */
class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->latest('is_default')->latest()->get();

        return $this->success(AddressResource::collection($addresses), 'Addresses retrieved.');
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);

        return $this->success(new AddressResource($address), 'Address retrieved.');
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $makeDefault = (bool) ($data['is_default'] ?? false) || ! $user->addresses()->exists();

        $address = DB::transaction(function () use ($user, $data, $makeDefault) {
            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $data['is_default'] = $makeDefault;

            return $user->addresses()->create($data);
        });

        return $this->success(new AddressResource($address), 'Address added successfully.', 201);
    }

    public function update(UpdateAddressRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->findOrFail($id);
        $data = $request->validated();
        $makeDefault = (bool) ($data['is_default'] ?? false);

        DB::transaction(function () use ($user, $address, $data, $makeDefault) {
            if ($makeDefault && ! $address->is_default) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            // An address can never unset default by itself — only another
            // address becoming default (or explicit setDefault) can change it,
            // which keeps us from ever leaving zero default addresses.
            if (! $makeDefault) {
                unset($data['is_default']);
            } else {
                $data['is_default'] = true;
            }

            $address->update($data);
        });

        return $this->success(new AddressResource($address->fresh()), 'Address updated successfully.');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->findOrFail($id);

        DB::transaction(function () use ($user, $address) {
            $wasDefault = $address->is_default;
            $address->delete();

            if ($wasDefault) {
                // Never leave an invalid default-address state: promote the
                // most recently added remaining address automatically.
                $next = $user->addresses()->latest()->first();
                $next?->update(['is_default' => true]);
            }
        });

        return $this->success(null, 'Address deleted successfully.');
    }

    public function setDefault(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $address = $user->addresses()->findOrFail($id);

        DB::transaction(function () use ($user, $address) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return $this->success(new AddressResource($address->fresh()), 'Default address updated.');
    }
}
