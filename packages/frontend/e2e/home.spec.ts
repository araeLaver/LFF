import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Connect with Your Favorite Creators/i })).toBeVisible();
    await expect(page.getByText(/Complete quests, attend events/i)).toBeVisible();
  });

  test('should display navigation buttons in hero', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Explore Quests' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upcoming Events' })).toBeVisible();
  });

  test('should navigate to quests page from hero', async ({ page }) => {
    await page.getByRole('link', { name: 'Explore Quests' }).click();
    await expect(page).toHaveURL('/quests');
  });

  test('should navigate to events page from hero', async ({ page }) => {
    await page.getByRole('link', { name: 'Upcoming Events' }).click();
    await expect(page).toHaveURL('/events');
  });

  test('should display Active Quests section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Active Quests' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View all' }).first()).toBeVisible();
  });

  test('should display Upcoming Events section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Upcoming Events' })).toBeVisible();
  });

  test('should display Why Join LFF section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Why Join LFF?' })).toBeVisible();
    await expect(page.getByText('Complete Quests')).toBeVisible();
    await expect(page.getByText('Attend Events')).toBeVisible();
    await expect(page.getByText('Exclusive Content')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByRole('heading', { name: /Connect with Your Favorite Creators/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Quests' })).toBeVisible();
  });
});
