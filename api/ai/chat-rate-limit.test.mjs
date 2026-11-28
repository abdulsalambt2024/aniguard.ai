import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from './chat-rate-limit.mjs';

test('allows the configured request count and blocks the next request', () => {
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => 1_000 });

  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-a'), false);
});

test('keeps request budgets separate for different authenticated users', () => {
  const limiter = createRateLimiter({ limit: 1, now: () => 1_000 });

  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-a'), false);
  assert.equal(limiter.allow('farmer-b'), true);
});

test('resets a user budget after the fixed window expires', () => {
  let clock = 1_000;
  const limiter = createRateLimiter({ limit: 1, windowMs: 100, now: () => clock });

  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-a'), false);
  clock += 100;
  assert.equal(limiter.allow('farmer-a'), true);
});

test('fails closed at capacity instead of evicting active user budgets', () => {
  let clock = 1_000;
  const limiter = createRateLimiter({ limit: 10, windowMs: 100, maxTrackedUsers: 2, now: () => clock });

  assert.equal(limiter.allow('farmer-a'), true);
  assert.equal(limiter.allow('farmer-b'), true);
  assert.equal(limiter.allow('farmer-c'), false);
  assert.equal(limiter.size, 2);

  clock += 100;
  assert.equal(limiter.allow('farmer-c'), true);
  assert.equal(limiter.size, 1);
});

test('rejects empty user identifiers', () => {
  const limiter = createRateLimiter();
  assert.equal(limiter.allow(''), false);
  assert.equal(limiter.allow('   '), false);
  assert.equal(limiter.size, 0);
});
