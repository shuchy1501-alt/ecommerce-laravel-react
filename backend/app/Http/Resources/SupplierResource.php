<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'company_name' => $this->company_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'city' => $this->city,
            'country' => $this->country,
            'tax_id' => $this->tax_id,
            'contact_person' => $this->contact_person,
            'notes' => $this->notes,
            'opening_balance' => (float) $this->opening_balance,
            'status' => (bool) $this->status,
            'purchases_count' => $this->whenCounted('purchases'),
            'purchase_summary' => $this->when(isset($this->purchase_summary), fn () => $this->purchase_summary),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
