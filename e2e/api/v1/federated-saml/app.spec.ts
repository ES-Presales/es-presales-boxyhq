import { test, expect } from '@playwright/test';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const expectedApp = {
  name: 'Test App',
  tenant: 'api-boxyhq',
  product: 'api-saml-jackson',
  id: expect.any(String),
  entityId: 'https://boxyhq.com/entity-id',
  acsUrl: 'https://boxyhq.com/acs',
};

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/v1/federated-saml', {
    data: {
      ...expectedApp,
    },
  });

  const { data: app } = await response.json();

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(201);
  expect(app).toMatchObject(expectedApp);
});

test.describe('GET /api/v1/federated-saml', () => {
  test('Fetch app', async ({ request }) => {
    const response = await request.get(
      `/api/v1/federated-saml?tenant=${expectedApp.tenant}&product=${expectedApp.product}`
    );

    const { data: app1 } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(app1).toMatchObject(expectedApp);

    // Fetch app by id
    const response2 = await request.get(`/api/v1/federated-saml?id=${app1.id}`);

    const { data: app2 } = await response2.json();

    expect(response2.ok()).toBe(true);
    expect(response2.status()).toBe(200);
    expect(app2).toMatchObject(app1);
    expect(app1.id).toBe(app2.id);
  });
});

test.describe('GET /api/v1/federated-saml/product', () => {
  test('Fetch app by product', async ({ request }) => {
    const response = await request.get(`/api/v1/federated-saml/product?product=${expectedApp?.product}`);

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject([expectedApp]);
  });
});

test.describe('PATCH /api/v1/federated-saml', () => {
  test('Update app', async ({ request }) => {
    const response = await request.patch(`/api/v1/federated-saml`, {
      data: {
        tenant: expectedApp?.tenant,
        product: expectedApp?.product,
        name: 'Updated App 2',
      },
    });

    const { data: updatedApp } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(updatedApp).toMatchObject({
      ...expectedApp,
      name: 'Updated App 2',
    });

    // Confirm app is updated
    const response2 = await request.get(`/api/v1/federated-saml?id=${updatedApp.id}`);

    const { data: app } = await response2.json();

    expect(response2.ok()).toBe(true);
    expect(response2.status()).toBe(200);
    expect(app).toMatchObject(updatedApp);
  });
});

test.describe('DELETE /api/v1/federated-saml', () => {
  test('Delete app', async ({ request }) => {
    const response = await request.delete(
      `/api/v1/federated-saml?tenant=${expectedApp?.tenant}&product=${expectedApp?.product}`
    );

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject({});

    // Confirm app is deleted
    const response2 = await request.get(
      `/api/v1/federated-saml?tenant=${expectedApp?.tenant}&product=${expectedApp?.product}`
    );

    expect(response2.ok()).toBe(false);
    expect(response2.status()).toBe(404);
  });
});
