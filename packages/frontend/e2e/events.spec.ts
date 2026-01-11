import { test, expect } from '@playwright/test';

test.describe('Events Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('should display events page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Events', level: 1 })).toBeVisible();
    await expect(page.getByText('Attend events and collect proof-of-attendance NFTs')).toBeVisible();
  });

  test('should display event status filter buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'All Events' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upcoming' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ongoing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ended' })).toBeVisible();
  });

  test('should filter events by status', async ({ page }) => {
    // Click on Upcoming filter
    await page.getByRole('button', { name: 'Upcoming' }).click();

    // The Upcoming button should now be selected
    const upcomingButton = page.getByRole('button', { name: 'Upcoming' });
    await expect(upcomingButton).toHaveClass(/bg-blue/);
  });

  test('should show loading state initially', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/events');
    await expect(page.getByText('Loading events...')).toBeVisible();
  });

  test('should display no events message when empty', async ({ page }) => {
    await page.route('**/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/events');
    await expect(page.getByText('No events found')).toBeVisible();
  });

  test('should display event cards when data exists', async ({ page }) => {
    await page.route('**/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Test Event',
            description: 'This is a test event description',
            status: 'UPCOMING',
            startDate: '2026-02-01T10:00:00Z',
            endDate: '2026-02-01T18:00:00Z',
            location: 'Seoul, Korea',
            maxAttendees: 100,
            creator: { displayName: 'EventCreator' },
            _count: { attendances: 25 },
          },
        ]),
      });
    });

    await page.goto('/events');
    await expect(page.getByText('Test Event')).toBeVisible();
    await expect(page.getByText('Seoul, Korea')).toBeVisible();
    await expect(page.getByText('UPCOMING')).toBeVisible();
  });

  test('should navigate to event detail page on card click', async ({ page }) => {
    await page.route('**/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'event-456',
            title: 'Clickable Event',
            description: 'Click to view details',
            status: 'UPCOMING',
            startDate: '2026-03-15T14:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/events');
    await page.getByText('Clickable Event').click();
    await expect(page).toHaveURL('/events/event-456');
  });

  test('should show event date and time', async ({ page }) => {
    await page.route('**/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Dated Event',
            description: 'Event with date',
            status: 'UPCOMING',
            startDate: '2026-01-15T10:00:00Z',
          },
        ]),
      });
    });

    await page.goto('/events');
    // Date should be formatted
    await expect(page.getByText(/Jan 15/)).toBeVisible();
  });

  test('should show attendee count for limited events', async ({ page }) => {
    await page.route('**/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            title: 'Limited Event',
            description: 'Only 50 spots',
            status: 'UPCOMING',
            startDate: '2026-02-20T10:00:00Z',
            maxAttendees: 50,
            _count: { attendances: 30 },
          },
        ]),
      });
    });

    await page.goto('/events');
    await expect(page.getByText('30/50')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.getByRole('heading', { name: 'Events', level: 1 })).toBeVisible();
    // Grid should be single column on mobile
  });
});
