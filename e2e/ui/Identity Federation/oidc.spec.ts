import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
};

const MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const MOCKSAML_METADATA_URL = `${MOCKSAML_ORIGIN}/api/saml/metadata`;

const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page }, use) => {
    const ssoPage = new SSOPage(page);
    await use(ssoPage);
    // Delete SSO Connections mapped to SAML federation
    await ssoPage.deleteSSOConnection('SSO-via-OIDC-Fed');
    await ssoPage.deleteSSOConnection('OF-SAML-1');
    await ssoPage.deleteSSOConnection('OF-OIDC-1');
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
    // Delete Saml Fed connection
    await page.goto('/admin/settings');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('cell', { name: 'Edit' }).getByRole('button').click();
    await page.getByLabel('Card').getByRole('button', { name: 'Delete' }).click();
    await page.getByTestId('confirm-delete').click();
  },
});

test('OIDC Federated app + 1 SAML & 1 OIDC connections', async ({ ssoPage, portal, page }) => {
  // Create OIDC Federated connection
  await page.goto('/admin/settings');
  await page.getByRole('link', { name: 'Apps' }).click();
  await page.waitForURL(/.*admin\/identity-federation$/);
  await page.getByRole('button', { name: 'New App' }).click();
  await page.waitForURL(/.*admin\/identity-federation\/new$/);
  // Toggle connection type to OIDC
  await page.getByLabel('OIDC').check();
  await page.getByPlaceholder('Your app').and(page.getByLabel('Name')).fill('OF-1');
  await page.getByPlaceholder('example.com').and(page.getByLabel('Tenant')).fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.locator('input[name="item"]').fill('http://localhost:5225');
  await page.getByRole('button', { name: 'Create App' }).click();
  await page.waitForURL(/.*admin\/identity-federation\/.*\/edit$/);
  const oidcClientId = await page
    .locator('label')
    .filter({ hasText: 'Client ID' })
    .getByRole('textbox')
    .inputValue();
  const oidcClientSecret = await page
    .locator('label')
    .filter({ hasText: 'Client Secret' })
    .getByRole('textbox')
    .inputValue();
  await page.getByRole('link', { name: 'Back' }).click();
  await page.waitForURL(/.*admin\/identity-federation$/);
  await expect(page.getByRole('cell', { name: 'OF-1' })).toBeVisible();

  // Add OIDC Connection via OIDC Fed for Admin portal
  await page.getByRole('link', { name: 'Single Sign-On' }).click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('OIDC').check();
  await page.getByLabel('Connection name (Optional)').fill('SSO-via-OIDC-Fed');
  await page.getByLabel('Client ID').fill(oidcClientId);
  await page.getByLabel('Client Secret').fill(oidcClientSecret);
  await page
    .getByLabel('Well-known URL of OpenID Provider')
    .fill('http://localhost:5225/.well-known/openid-configuration');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: 'SSO-via-OIDC-Fed' })).toBeVisible();

  // Add SSO connection for tenants
  await page.getByRole('link', { name: 'Connections' }).first().click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('Connection name (Optional)').fill('OF-SAML-1');
  await page.getByLabel('Tenant').fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.locator('input[name="item"]').fill('http://localhost:3366');
  await page.getByLabel('Default redirect URL').fill('http://localhost:3366/login/saml');
  await page.getByPlaceholder('Paste the Metadata URL here').fill(MOCKSAML_METADATA_URL);
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('OIDC').check();
  await page.getByLabel('Connection name (Optional)').fill('OF-OIDC-1');
  await page.getByLabel('Tenant').fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.locator('input[name="item"]').fill('http://localhost:3366');
  await page.getByLabel('Default redirect URL').fill('http://localhost:3366/login/saml');
  await page.getByLabel('Client ID').fill('some_client_id');
  await page.getByLabel('Client Secret').fill('some_client_secret');
  await page
    .getByLabel('Well-known URL of OpenID Provider')
    .fill('https://oauth.wiremockapi.cloud/.well-known/openid-configuration');
  await page.getByRole('button', { name: 'Save' }).click();
  // Login using MockSAML
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockLab
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-OIDC-1');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});
