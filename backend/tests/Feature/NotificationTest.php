<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\GenericNotification;
use App\Notifications\NotificationType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function actingUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_user_can_list_own_notifications(): void
    {
        $user = $this->actingUser();
        $user->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'Order Confirmed', 'Your order is confirmed.'));
        $user->notify(new GenericNotification(NotificationType::ORDER_SHIPPED, 'Order Shipped', 'Your order shipped.'));

        $response = $this->getJson('/api/notifications');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.unread_count', 2);
    }

    public function test_notification_list_is_scoped_to_the_authenticated_user(): void
    {
        $owner = User::factory()->create();
        $owner->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'Order Confirmed', 'Hello'));

        $other = $this->actingUser();
        $other->notify(new GenericNotification(NotificationType::ORDER_SHIPPED, 'Order Shipped', 'Hi'));

        $response = $this->getJson('/api/notifications');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('Order Shipped', $response->json('data.0.title'));
    }

    public function test_user_can_mark_own_notification_as_read(): void
    {
        $user = $this->actingUser();
        $user->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'Order Confirmed', 'Hello'));
        $id = $user->notifications()->first()->id;

        $response = $this->postJson("/api/notification/{$id}/read");

        $response->assertOk()->assertJsonPath('data.read', true);
        $this->assertNotNull($user->notifications()->find($id)->read_at);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $owner = User::factory()->create();
        $owner->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'Order Confirmed', 'Hello'));
        $id = $owner->notifications()->first()->id;

        $this->actingUser();

        $response = $this->postJson("/api/notification/{$id}/read");

        $response->assertStatus(404);
        $this->assertNull($owner->notifications()->find($id)->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = $this->actingUser();
        $user->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'A', 'a'));
        $user->notify(new GenericNotification(NotificationType::ORDER_SHIPPED, 'B', 'b'));

        $response = $this->postJson('/api/notifications/read-all');

        $response->assertOk();
        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_user_can_delete_own_notification(): void
    {
        $user = $this->actingUser();
        $user->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'A', 'a'));
        $id = $user->notifications()->first()->id;

        $response = $this->deleteJson("/api/notification/{$id}");

        $response->assertOk();
        $this->assertNull($user->notifications()->find($id));
    }

    public function test_user_cannot_delete_another_users_notification(): void
    {
        $owner = User::factory()->create();
        $owner->notify(new GenericNotification(NotificationType::ORDER_CONFIRMED, 'A', 'a'));
        $id = $owner->notifications()->first()->id;

        $this->actingUser();

        $response = $this->deleteJson("/api/notification/{$id}");

        $response->assertStatus(404);
        $this->assertNotNull($owner->notifications()->find($id));
    }

    public function test_guest_cannot_access_notifications(): void
    {
        $this->getJson('/api/notifications')->assertStatus(401);
    }
}
