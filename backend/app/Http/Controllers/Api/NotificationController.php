<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/**
 * Phase 13C — Notification System.
 *
 * Every route here is scoped to the authenticated user's own notifications
 * only (admin or customer) — a notification belonging to another user can
 * never be read, marked read, or deleted, regardless of the caller's
 * permissions. This is enforced by always querying through
 * `$request->user()->notifications()` rather than the DatabaseNotification
 * model directly, and by re-checking ownership on the route-model-bound
 * record before mutating it.
 */
class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Optional `?status=unread|read` filter, paginated.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->notifications();

        if ($request->input('status') === 'unread') {
            $query->whereNull('read_at');
        } elseif ($request->input('status') === 'read') {
            $query->whereNotNull('read_at');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Notifications fetched successfully',
            'data' => NotificationResource::collection($notifications->items()),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * POST /api/notification/{id}/read
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $this->findOwned($request, $id);

        if (! $notification) {
            return $this->error('Notification not found.', 404, null, 'NOT_FOUND');
        }

        if (is_null($notification->read_at)) {
            $notification->markAsRead();
        }

        return $this->success(new NotificationResource($notification->fresh()), 'Notification marked as read');
    }

    /**
     * POST /api/notifications/read-all
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'All notifications marked as read');
    }

    /**
     * DELETE /api/notification/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $this->findOwned($request, $id);

        if (! $notification) {
            return $this->error('Notification not found.', 404, null, 'NOT_FOUND');
        }

        $notification->delete();

        return $this->success(null, 'Notification deleted');
    }

    /**
     * Look up a notification strictly within the authenticated user's own
     * notifications collection — the server-side ownership check for every
     * mutating route in this controller.
     */
    private function findOwned(Request $request, string $id): ?DatabaseNotification
    {
        return $request->user()->notifications()->where('id', $id)->first();
    }
}
