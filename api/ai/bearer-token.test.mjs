import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBearerToken } from './bearer-token.mjs';

test('accepts the standard Bearer authorization scheme', () => {
  assert.equal(extractBearerToken('Bearer access-token'), 'access-token');
});

test('treats the authorization scheme as case-insensitive', () => {
  assert.equal(extractBearerToken('bearer access-token'), 'access-token');
  assert.equal(extractBearerToken('bEaReR access-token'), 'access-token');
});

test('rejects missing, empty, malformed and non-Bearer values', () => {
  for (const value of [undefined, '', '   ', 'Basic credentials', 'Bearer', 'Bearer   ', 'Bearer token extra']) {
    assert.equal(extractBearerToken(value), '');
  }
});

test('accepts a single-element header array', () => {
  assert.equal(extractBearerToken(['Bearer only-token']), 'only-token');
});

test('rejects duplicate authorization header values as ambiguous', () => {
  assert.equal(extractBearerToken(['Bearer first-token', 'Bearer second-token']), '');
  assert.equal(extractBearerToken(['Basic credentials', 'Bearer second-token']), '');
});
