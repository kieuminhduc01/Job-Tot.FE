import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime } from '../src/shared/lib/date-format.js';
test('dates use two digit days/months and Vietnam timezone', () => {
  assert.equal(formatDate('2027-01-02'), '02/01/2027');
  assert.equal(formatDate('2026-12-31T18:00:00Z'), '01/01/2027');
  assert.equal(formatDateTime('2026-12-31T18:05:00Z'), '01/01/2027 01:05');
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate('invalid'), '—');
});
