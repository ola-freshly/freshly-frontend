import { createHmac } from 'node:crypto';
import { test, expect } from '@playwright/test';

const API_URL = process.env.FRESHLY_API_URL ?? 'http://localhost:3001';

function createAccessToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  const header = encode({
    alg: 'HS256',
    typ: 'JWT',
  });

  const payload = encode({
    sub: 'e2e-user',
    email: 'e2e@example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60,
  });

  const signature = createHmac('sha256', 'e2e-test-secret')
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

const authHeaders = () => ({ Authorization: `Bearer ${createAccessToken()}` });

test.describe('Recipes API', () => {
  test('rejects requests without an access token', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes`);

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
    });
  });

  test('returns a paginated envelope with a valid access token', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes`, { headers: authHeaders() });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body).toHaveProperty('hasMore');
    expect(body).toHaveProperty('nextCursor');
  });

  test('honours the limit and reports whether more pages exist', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes?limit=1`, { headers: authHeaders() });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.items.length).toBeLessThanOrEqual(1);

    // nextCursor is only issued while further pages remain.
    if (body.hasMore) {
      expect(typeof body.nextCursor).toBe('string');
    } else {
      expect(body.nextCursor).toBeNull();
    }
  });

  test('pages by cursor without repeating a row', async ({ request }) => {
    const first = await request.get(`${API_URL}/recipes?limit=1`, { headers: authHeaders() });
    const firstBody = await first.json();

    test.skip(!firstBody.hasMore, 'needs at least two library recipes seeded');

    const second = await request.get(
      `${API_URL}/recipes?limit=1&cursor=${encodeURIComponent(firstBody.nextCursor)}`,
      { headers: authHeaders() },
    );

    expect(second.status()).toBe(200);

    const secondBody = await second.json();
    expect(secondBody.items).toHaveLength(1);
    expect(secondBody.items[0].id).not.toBe(firstBody.items[0].id);
  });

  test('keeps the mealType filter across a cursor page', async ({ request }) => {
    const first = await request.get(`${API_URL}/recipes?mealType=dinner&limit=1`, {
      headers: authHeaders(),
    });
    const firstBody = await first.json();

    test.skip(!firstBody.hasMore, 'needs at least two dinner recipes seeded');

    const second = await request.get(
      `${API_URL}/recipes?mealType=dinner&limit=1&cursor=${encodeURIComponent(firstBody.nextCursor)}`,
      { headers: authHeaders() },
    );

    const secondBody = await second.json();
    for (const recipe of secondBody.items) {
      expect(recipe.mealType).toBe('dinner');
    }
  });

  test('walking every page yields exactly the unpaged result set', async ({ request }) => {
    const unpaged = await (
      await request.get(`${API_URL}/recipes?limit=50`, { headers: authHeaders() })
    ).json();

    test.skip(unpaged.hasMore, 'library exceeds one max-size page; widen the walk');

    const walked: string[] = [];
    let cursor: string | null = null;
    let guard = 0;

    do {
      const url = `${API_URL}/recipes?limit=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const body = await (await request.get(url, { headers: authHeaders() })).json();
      walked.push(...body.items.map((r: { id: string }) => r.id));
      cursor = body.nextCursor;
    } while (cursor && ++guard < 60);

    // Catches silent row-skipping — the failure mode where a cursor's precision
    // is coarser than the stored column and rows in the same tick are excluded.
    // Asserting only that pages don't repeat would miss it entirely.
    expect(walked).toEqual(unpaged.items.map((r: { id: string }) => r.id));
  });

  test('search results page without dropping a match', async ({ request }) => {
    const unpaged = await (
      await request.get(`${API_URL}/recipes?q=e&limit=50`, { headers: authHeaders() })
    ).json();

    test.skip(unpaged.items.length < 2, 'needs at least two recipes matching "e"');

    const walked: string[] = [];
    let cursor: string | null = null;
    let guard = 0;

    do {
      const url = `${API_URL}/recipes?q=e&limit=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const body = await (await request.get(url, { headers: authHeaders() })).json();
      walked.push(...body.items.map((r: { id: string }) => r.id));
      cursor = body.nextCursor;
    } while (cursor && ++guard < 60);

    expect(walked).toEqual(unpaged.items.map((r: { id: string }) => r.id));
  });

  test('filters by title, case-insensitively', async ({ request }) => {
    const lower = await (
      await request.get(`${API_URL}/recipes?q=rice`, { headers: authHeaders() })
    ).json();
    const upper = await (
      await request.get(`${API_URL}/recipes?q=RICE`, { headers: authHeaders() })
    ).json();

    expect(upper.items.map((r: { id: string }) => r.id)).toEqual(
      lower.items.map((r: { id: string }) => r.id),
    );

    for (const recipe of lower.items) {
      expect(recipe.title.toLowerCase()).toContain('rice');
    }
  });

  test('treats LIKE metacharacters in the search as literal text', async ({ request }) => {
    const all = await (
      await request.get(`${API_URL}/recipes?limit=50`, { headers: authHeaders() })
    ).json();

    test.skip(all.items.length === 0, 'needs at least one library recipe');

    // Unescaped, "%" and "_" are wildcards and would match every row.
    for (const wildcard of ['%', '_']) {
      const response = await request.get(
        `${API_URL}/recipes?q=${encodeURIComponent(wildcard)}`,
        { headers: authHeaders() },
      );
      const body = await response.json();

      expect(body.items.length).toBeLessThan(all.items.length);
      for (const recipe of body.items) {
        expect(recipe.title).toContain(wildcard);
      }
    }
  });

  test('rejects a search query beyond the length cap', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes?q=${'a'.repeat(101)}`, {
      headers: authHeaders(),
    });

    expect(response.status()).toBe(400);
  });

  test('rejects a malformed cursor', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes?cursor=not-a-real-cursor`, {
      headers: authHeaders(),
    });

    expect(response.status()).toBe(400);
  });

  test('rejects a limit above the maximum', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes?limit=500`, { headers: authHeaders() });

    expect(response.status()).toBe(400);
  });

  test('rejects a non-numeric limit', async ({ request }) => {
    const response = await request.get(`${API_URL}/recipes?limit=abc`, { headers: authHeaders() });

    expect(response.status()).toBe(400);
  });
});
