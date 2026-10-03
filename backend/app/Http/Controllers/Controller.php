<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Base controller for all API controllers.
 *
 * Every JSON response in the app follows one envelope so the frontend can
 * rely on a single shape:
 *   success -> { success: true, message, data, meta? }
 *   error   -> { success: false, message, code, errors? }   (see bootstrap/app.php)
 */
abstract class Controller
{
    use AuthorizesRequests, ValidatesRequests;

    protected function success(
        mixed $data = null,
        string $message = 'OK',
        int $status = 200,
        array $meta = []
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message' => $message,
        ];

        if ($data instanceof ResourceCollection) {
            // Resource collections (typically paginated) already carry their own
            // "data" and "meta"/"links" keys when toResponse() is used, so merge manually.
            $response = $data->response()->getData(true);
            $payload['data'] = $response['data'] ?? null;
            $payload['meta'] = array_merge($response['meta'] ?? [], $meta);
            if (isset($response['links'])) {
                $payload['links'] = $response['links'];
            }
        } elseif ($data instanceof JsonResource) {
            $payload['data'] = $data;
            if ($meta) {
                $payload['meta'] = $meta;
            }
        } else {
            $payload['data'] = $data;
            if ($meta) {
                $payload['meta'] = $meta;
            }
        }

        return response()->json($payload, $status);
    }

    protected function error(
        string $message = 'Something went wrong.',
        int $status = 400,
        ?array $errors = null,
        string $code = 'ERROR'
    ): JsonResponse {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'code' => $code,
            'errors' => $errors,
        ], fn ($v) => ! is_null($v)), $status);
    }
}
