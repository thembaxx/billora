import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fakePlace = {
  lat: '-26.7773',
  lon: '30.8017',
  display_name: 'Piet Retief, Mkhondo Local Municipality, Mpumalanga, South Africa',
};

test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
});

test('a map search occurs only on submit and property pins persist locally', async ({ page }) => {
  const queries: string[] = [];
  await page.route('https://nominatim.openstreetmap.org/search?**', async (route) => {
    const url = new URL(route.request().url());
    queries.push(url.searchParams.get('q') || '');
    expect(url.searchParams.get('countrycodes')).toBe('za');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([fakePlace]),
    });
  });
  await page.goto('/?view=properties');
  await expect(page.getByRole('button', { name: 'Explore map' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore map' }).click();
  await expect(page.getByRole('heading', { name: 'Find your little corner of SA.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /OpenStreetMap contributors/ })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Find a place in South Africa' }).fill('Piet Retief');
  expect(queries).toHaveLength(0);
  await page.getByRole('button', { name: 'Find', exact: true }).click();
  await expect(page.getByRole('button', { name: fakePlace.display_name })).toBeVisible();
  expect(queries).toEqual(['Piet Retief']);
  await page.getByRole('button', { name: 'Cards view' }).click();

  await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
  await page.getByLabel('Property name').fill('Our place');
  await page.getByRole('button', { name: 'Find this property on a map' }).click();
  await expect(page.getByRole('button', { name: 'Use my current device location' })).toBeVisible();
  // Explicit map selection also works without any geolocation permission.
  await page.getByRole('button', { name: 'Pin map centre' }).click();
  await page.getByRole('button', { name: 'Use this place' }).click();
  await page.getByLabel('Street address').fill('12 Test Lane, Piet Retief');
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('billora-workspace') || '{}'));
  const property = saved.properties.find((item: { name: string }) => item.name === 'Our place');
  // An edited address clears the pin: the app must never silently associate stale coordinates.
  expect(property.location).toBeUndefined();

  await page.getByRole('button', { name: 'Add property', exact: true }).first().click();
  await page.getByLabel('Property name').fill('Pinned property');
  await page.getByRole('button', { name: 'Find this property on a map' }).click();
  await page.getByRole('searchbox', { name: 'Find a place in South Africa' }).fill('Piet Retief');
  await page.getByRole('button', { name: 'Find', exact: true }).click();
  await page.getByRole('button', { name: 'Use this place' }).click();
  await page.getByRole('button', { name: 'Add property', exact: true }).last().click();
  const pinned = await page.evaluate(() => JSON.parse(localStorage.getItem('billora-workspace') || '{}'));
  const savedPin = pinned.properties.find((item: { name: string }) => item.name === 'Pinned property');
  expect(savedPin.location).toEqual({ lat: -26.7773, lng: 30.8017 });

  await page.getByRole('button', { name: 'Explore map' }).click();
  await expect(page.getByRole('button', { name: 'Open property on map: Pinned property' })).toBeVisible();
  await page.getByRole('button', { name: 'Open property on map: Pinned property' }).click();
  await expect(page.getByRole('dialog')).toContainText('Pinned property');
});

test('current location only activates after permission action and is not stored automatically', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (resolve: (data: unknown) => void) => {
          calls += 1;
          resolve({ coords: { latitude: -26.7773, longitude: 30.8017, accuracy: 40 } });
        },
      },
    });
    Object.defineProperty(window, '__geoCalls', { get: () => calls });
  });
  await page.goto('/?view=properties');
  await page.getByRole('button', { name: 'Explore map' }).click();
  expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
  await page.getByRole('button', { name: 'Use my current device location' }).click();
  await expect(page.locator('.live-map-device')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(1);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('billora-workspace') || '{}'));
  expect(stored.properties.every((p: { location?: unknown }) => !p.location)).toBeTruthy();
});

test('map stays accessible at mobile sizes and offers a truthful offline fallback', async ({
  page, context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=properties');
  await page.getByRole('button', { name: 'Explore map' }).click();
  await expect(page.locator('.live-map-viewport')).toBeVisible();
  await page.locator('.live-map-viewport').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Your selected place')).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations.map((v) => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.setOffline(true);
  await expect(page.getByText('Map tiles require an internet connection.', { exact: false })).toBeVisible();
  await context.setOffline(false);
});