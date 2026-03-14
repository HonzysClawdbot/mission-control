import { test, expect } from '@playwright/test'
import { API_KEY_HEADER } from './helpers'

/**
 * Integration tests for GET /api/gateways/health/history
 * Covers the health history logging and retrieval API added in commit fa72421.
 */
test.describe('Gateway Health History API', () => {
  test('GET /api/gateways/health/history returns 200 with history array', async ({ request }) => {
    const res = await request.get('/api/gateways/health/history', {
      headers: API_KEY_HEADER,
    })

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('history')
    expect(Array.isArray(body.history)).toBe(true)
  })

  test('GET /api/gateways/health/history entries have expected shape', async ({ request }) => {
    const res = await request.get('/api/gateways/health/history', {
      headers: API_KEY_HEADER,
    })

    const body = await res.json()
    // If entries exist, validate their structure
    for (const gatewayHistory of body.history) {
      expect(gatewayHistory).toHaveProperty('gatewayId')
      expect(typeof gatewayHistory.gatewayId).toBe('number')
      expect(gatewayHistory).toHaveProperty('entries')
      expect(Array.isArray(gatewayHistory.entries)).toBe(true)

      for (const entry of gatewayHistory.entries) {
        expect(entry).toHaveProperty('status')
        expect(typeof entry.status).toBe('string')
        expect(entry).toHaveProperty('probed_at')
        expect(typeof entry.probed_at).toBe('number')
        // latency and error may be null
        expect('latency' in entry).toBe(true)
        expect('error' in entry).toBe(true)
      }
    }
  })

  test('GET /api/gateways/health/history rejects unauthenticated request', async ({ request }) => {
    const res = await request.get('/api/gateways/health/history')
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/gateways/health/history rejects invalid API key', async ({ request }) => {
    const res = await request.get('/api/gateways/health/history', {
      headers: { 'x-api-key': 'invalid-key-xyz' },
    })
    expect([401, 403]).toContain(res.status())
  })

  test('GET /api/gateways/health/history viewer role is sufficient', async ({ request }) => {
    // The route requires "viewer" role — the test API key has this by default
    const res = await request.get('/api/gateways/health/history', {
      headers: API_KEY_HEADER,
    })
    expect(res.status()).toBe(200)
  })

  test('GET /api/gateways/health returns 200', async ({ request }) => {
    // Smoke-test the companion endpoint so we know probing is wired up
    const res = await request.get('/api/gateways/health', {
      headers: API_KEY_HEADER,
    })
    // May return 200 even when no gateways exist
    expect([200, 204]).toContain(res.status())
  })
})
