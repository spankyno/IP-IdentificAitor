import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidIP,
  isValidEmail,
  isValidPhone,
  isValidDomain,
} from './ipqs.ts';

describe('isValidIP', () => {
  it('accepts valid IPv4', () => {
    assert.equal(isValidIP('8.8.8.8'), true);
    assert.equal(isValidIP('192.168.1.1'), true);
    assert.equal(isValidIP('255.255.255.255'), true);
  });

  it('rejects invalid IPv4', () => {
    assert.equal(isValidIP('999.1.1.1'), false);
    assert.equal(isValidIP('1.2.3'), false);
    assert.equal(isValidIP('not-an-ip'), false);
    assert.equal(isValidIP(''), false);
  });

  it('accepts common IPv6 forms', () => {
    assert.equal(isValidIP('::1'), true);
    assert.equal(isValidIP('2001:db8::1'), true);
  });
});

describe('isValidEmail', () => {
  it('accepts normal emails', () => {
    assert.equal(isValidEmail('user@example.com'), true);
    assert.equal(isValidEmail('a.b+tag@mail.co'), true);
  });

  it('rejects malformed emails', () => {
    assert.equal(isValidEmail('no-at-sign'), false);
    assert.equal(isValidEmail('@nodomain.com'), false);
    assert.equal(isValidEmail('user@'), false);
    assert.equal(isValidEmail(''), false);
  });
});

describe('isValidPhone', () => {
  it('accepts international-style numbers', () => {
    assert.equal(isValidPhone('+34600111222'), true);
    assert.equal(isValidPhone('600111222'), true);
    assert.equal(isValidPhone('+1 (555) 123-4567'), true);
  });

  it('rejects too short or non-numeric', () => {
    assert.equal(isValidPhone('123'), false);
    assert.equal(isValidPhone('abc'), false);
    assert.equal(isValidPhone(''), false);
  });
});

describe('isValidDomain', () => {
  it('accepts bare domains and URLs', () => {
    assert.equal(isValidDomain('example.com'), true);
    assert.equal(isValidDomain('https://www.google.com/path'), true);
    assert.equal(isValidDomain('sub.domain.co.uk'), true);
  });

  it('rejects invalid hosts', () => {
    assert.equal(isValidDomain(''), false);
    assert.equal(isValidDomain('-bad.com'), false);
    assert.equal(isValidDomain('no spaces.com'), false);
  });
});

describe('length limits', () => {
  it('rejects overlong inputs', () => {
    assert.equal(isValidIP('1'.repeat(50)), false);
    assert.equal(isValidEmail('a'.repeat(250) + '@x.com'), false);
    assert.equal(isValidDomain('a'.repeat(260) + '.com'), false);
  });
});
