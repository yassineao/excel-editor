import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('should add a sheet and get to the new sheet', async ({ page }) => {


  const firstCell = page.locator('#spreadsheet td input').first();
  await firstCell.fill('Original sheet');
  await firstCell.press('Tab');

  await page.getByRole('button', { name: 'Neu', exact: true }).click();
  await expect(firstCell).toHaveValue('');

  await page.getByRole('button', { name: 'Öffnen', exact: true }).click();
  const sheets = page.getByRole('dialog').getByRole('listitem');
  await expect(sheets).toHaveCount(2);

  await sheets.first().getByRole('button').click();
  await expect(firstCell).toHaveValue('Original sheet');
});

test('should delete a sheet', async ({ page }) => {
  await page.getByRole('button', { name: 'Neu', exact: true }).click();
  await page.getByRole('button', { name: 'Öffnen', exact: true }).click();
  const sheetButtons = page.getByRole('dialog').getByRole('listitem');
  await expect(sheetButtons).toHaveCount(2);
  await sheetButtons.nth(1).getByRole('button').click();

  const firstCell = page.locator('#spreadsheet td input').first();
  await firstCell.fill('Original sheet');
  await firstCell.press('Tab');

  page.once('dialog', (dialog) => dialog.accept());

  await page
    .getByRole('button', {
      name: 'löschen',
      exact: true,
    })
    .click();

  await expect(firstCell).toHaveValue('');
  await page.getByRole('button', { name: 'Öffnen', exact: true }).click();
  await expect(sheetButtons).toHaveCount(1);
});
