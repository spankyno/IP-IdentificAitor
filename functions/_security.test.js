import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireParam, MAX_LEN, corsHeaders } from './_security.js';

describe('requireParam', () => {
  it('requires non-empty', () => {
    const r = requireParam('', MAX_LEN.ip, 'IP');
    assert.equal(r.ok, false);
  });
  it('enforces max length', () => {
    const r = requireParam('x'.repeat(MAX_LEN.ip + 1), MAX_LEN.ip, 'IP');
    assert.equal(r.ok, false);
    assert.match(r.message, /largo/);
  });
  it('accepts valid', () => {
    const r = requireParam(' 8.8.8.8 ', MAX_LEN.ip, 'IP');
    assert.equal(r.ok, true);
    assert.equal(r.value, '8.8.8.8');
  });
});

describe('corsHeaders', () => {
  it('allows production origin', () => {
    const req = new Request('https://ip-identificaitor.pages.dev/api/x', {
      headers: { Origin: 'https://ip-identificaitor.pages.dev' },
    });
    const h = corsHeaders(req);
    assert.equal(h['Access-Control-Allow-Origin'], 'https://ip-identificaitor.pages.dev');
  });
  it('falls back for unknown origin', () => {
    const req = new Request('https://evil.example/api/x', {
      headers: { Origin: 'https://evil.example' },
    });
    const h = corsHeaders(req);
    assert.equal(h['Access-Control-Allow-Origin'], 'https://ip-identificaitor.pages.dev');
  });
});
