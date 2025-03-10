import { expect, test, oneEmptyTableBlockWithActions } from '@nocobase/test/client';
import { oneEmptyGantt } from './utils';

test.describe('TableActionInitializers & GanttActionInitializers & MapActionInitializers should add bulk edit action', () => {
  test('bulk edit in TableActionInitializers', async ({ page, mockPage }) => {
    await mockPage(oneEmptyTableBlockWithActions).goto();
    await page.getByLabel('schema-initializer-ActionBar-TableActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Customize right' }).click();
    await page.getByRole('menuitem', { name: 'Bulk edit' }).click();
    await page.mouse.move(300, 0);
    await expect(await page.getByLabel('Bulk edit')).toBeVisible();
  });
  test('bulk edit in GanttActionInitializers', async ({ page, mockPage, mockRecords }) => {
    const nocoPage = await mockPage(oneEmptyGantt).waitForInit();
    await mockRecords('general', 3);
    await nocoPage.goto();
    await page.getByLabel('schema-initializer-ActionBar-GanttActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Customize right' }).click();
    await page.getByRole('menuitem', { name: 'Bulk edit' }).click();
    await expect(await page.getByLabel('Bulk edit')).toBeVisible();
  });
});
