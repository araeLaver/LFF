import { test, expect } from '@playwright/test';

test.describe('Quests Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quests');
  });

  test('should display quests page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quests', level: 1 })).toBeVisible();
    await expect(page.getByText('Complete quests to earn rewards')).toBeVisible();
  });

  test('should display quest type filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All Types' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Social Share' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Content View' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quiz' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Survey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Custom' })).toBeVisible();
  });

  test('should filter quests by type', async ({ page }) => {
    // Click on Quiz filter
    await page.getByRole('button', { name: 'Quiz' }).click();

    // The Quiz button should now be selected (primary variant)
    const quizButton = page.getByRole('button', { name: 'Quiz' });
    await expect(quizButton).toHaveClass(/bg-blue/);
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate with slow network
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/quests');
    await expect(page.getByText('Loading quests...')).toBeVisible();
  });

  test('should display no quests message when empty', async ({ page }) => {
    // Mock empty quests response
    await page.route('**/quests/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/quests');
    await expect(page.getByText('No quests found')).toBeVisible();
  });

  test('should display quest cards when data exists', async ({ page }) => {
    // Mock quests response
    await page.route('**/quests/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Test Quest',
            description: 'This is a test quest description',
            type: 'QUIZ',
            rewardAmount: 100,
            rewardType: 'POINTS',
            status: 'ACTIVE',
            creator: { displayName: 'TestCreator' },
          },
        ]),
      });
    });

    await page.goto('/quests');
    await expect(page.getByText('Test Quest')).toBeVisible();
    await expect(page.getByText('This is a test quest description')).toBeVisible();
    await expect(page.getByText('+100')).toBeVisible();
  });

  test('should navigate to quest detail page on card click', async ({ page }) => {
    // Mock quests response
    await page.route('**/quests/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'quest-123',
            title: 'Clickable Quest',
            description: 'Click me',
            type: 'QUIZ',
            rewardAmount: 50,
            rewardType: 'POINTS',
            status: 'ACTIVE',
          },
        ]),
      });
    });

    await page.goto('/quests');
    await page.getByText('Clickable Quest').click();
    await expect(page).toHaveURL('/quests/quest-123');
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.getByRole('heading', { name: 'Quests', level: 1 })).toBeVisible();
    // Grid should adjust to 2 columns on tablet
  });
});
