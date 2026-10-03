<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \Illuminate\Notifications\DatabaseNotification */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->notifiable_id,
            'type' => $this->data['type'] ?? $this->type,
            'title' => $this->data['title'] ?? null,
            'message' => $this->data['message'] ?? null,
            'meta' => $this->data['meta'] ?? [],
            'read' => ! is_null($this->read_at),
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
