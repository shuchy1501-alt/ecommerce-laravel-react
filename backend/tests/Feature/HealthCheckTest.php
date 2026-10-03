<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.timezone', 'Asia/Dhaka')
            ->assertJsonPath('data.currency', 'BDT');
    }

    public function test_unknown_api_route_returns_json_404(): void
    {
        $response = $this->getJson('/api/does-not-exist');

        $response->assertStatus(404)
            ->assertJson(['success' => false, 'code' => 'NOT_FOUND']);
    }
}
