import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getMockIPAnalysis,
  getMockEmailAnalysis,
  getMockPhoneAnalysis,
  getMockDomainAnalysis,
  json,
} from './_mocks.js';

describe('getMockIPAnalysis', () => {
  it('marks Google DNS as low risk datacenter', () => {
    const r = getMockIPAnalysis('8.8.8.8');
    assert.equal(r.success, true);
    assert.equal(r.ip, '8.8.8.8');
    assert.equal(r.risk_score, 0);
    assert.equal(r.verdict, 'allow');
    assert.equal(r.signals.is_datacenter, true);
    assert.equal(r.is_sandbox, true);
  });

  it('flags known Tor-like prefixes as block', () => {
    const r = getMockIPAnalysis('185.220.101.5');
    assert.ok(r.risk_score >= 75);
    assert.equal(r.verdict, 'block');
    assert.equal(r.signals.is_tor, true);
  });

  it('returns JSON Response helper with application/json', async () => {
    const res = json({ ok: true }, 201);
    assert.equal(res.status, 201);
    assert.match(res.headers.get('Content-Type') || '', /application\/json/);
    const body = await res.json();
    assert.deepEqual(body, { ok: true });
  });
});

describe('getMockEmailAnalysis', () => {
  it('scores disposable domains as high risk', () => {
    const r = getMockEmailAnalysis('a@mailinator.com');
    assert.equal(r.signals.is_disposable, true);
    assert.equal(r.verdict, 'block');
  });

  it('allows typical free providers with low score', () => {
    const r = getMockEmailAnalysis('user@gmail.com');
    assert.equal(r.signals.is_free_provider, true);
    assert.equal(r.verdict, 'allow');
  });
});

describe('getMockPhoneAnalysis', () => {
  it('detects VoIP heuristics', () => {
    const r = getMockPhoneAnalysis('+15551234567');
    assert.equal(r.signals.is_voip, true);
  });
});

describe('getMockDomainAnalysis', () => {
  it('trusts well-known domains', () => {
    const r = getMockDomainAnalysis('https://www.google.com/search');
    assert.equal(r.domain, 'google.com');
    assert.equal(r.risk_score, 0);
    assert.equal(r.verdict, 'allow');
  });
});
