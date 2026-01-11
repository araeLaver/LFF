import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByRole('button', { name: 'Sign In' }).click();

      // HTML5 validation should prevent submission
      const emailInput = page.getByLabel('Email');
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByLabel('Email').fill('invalid@test.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for error message
      await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/auth/login');

      await page.getByRole('link', { name: 'Sign up' }).click();
      await expect(page).toHaveURL('/auth/signup');
    });

    test('should display social login buttons', async ({ page }) => {
      await page.goto('/auth/login');

      await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Continue with Kakao/i })).toBeVisible();
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/auth/signup');

      await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
      await expect(page.getByLabel('Nickname')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Confirm Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Nickname').fill('TestUser');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password', { exact: true }).fill('password123');
      await page.getByLabel('Confirm Password').fill('differentpassword');
      await page.getByRole('button', { name: 'Create Account' }).click();

      await expect(page.locator('.bg-red-50')).toContainText('Passwords do not match');
    });

    test('should show error for short password', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Nickname').fill('TestUser');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await page.getByLabel('Confirm Password').fill('short');
      await page.getByRole('button', { name: 'Create Account' }).click();

      await expect(page.locator('.bg-red-50')).toContainText('Password must be at least 8 characters');
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByRole('link', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/auth/login');
    });
  });
});
