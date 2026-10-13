import test from 'node:test';
import assert from 'node:assert/strict';
import { readResponseJson } from '../src/shared/api/read-response-json.js';

test('reads JSON and tolerates an empty error body', async () => {
  assert.deepEqual(await readResponseJson(Response.json({ value: 1 })), { value: 1 });
  assert.equal(await readResponseJson(new Response('', { status: 503 })), null);
});

test('preserves cancellation and transport failures during body reading', async () => {
  for (const error of [new DOMException('Cancelled', 'AbortError'), new TypeError('Connection closed')]) {
    await assert.rejects(readResponseJson({ json: async () => { throw error; } }), failure => failure === error);
  }
});
