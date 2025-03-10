import { Page, expect, oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields, test } from '@nocobase/test/client';
import { commonTesting } from '../commonTesting';

test.describe('collection', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'collection', mode: 'options' });
});
test.describe('JSON', () => {
  commonTesting({ openDialogAndShowMenu, fieldName: 'JSON', mode: 'options' });
});
test.describe('formula', () => {
  test('should display correct options', async ({ page, mockPage, mockRecord, mockRecords }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'formula' });
    await expect(page.getByRole('menuitem', { name: 'Edit field title' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Display title' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Pattern' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit tooltip' })).toBeVisible();
  });
});
test.describe('sequence', () => {
  test('should display correct options', async ({ page, mockPage, mockRecord, mockRecords }) => {
    await openDialogAndShowMenu({ page, mockPage, mockRecord, fieldName: 'sequence' });
    await expect(page.getByRole('menuitem', { name: 'Edit field title' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Display title' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Pattern' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit description' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'required' })).toBeVisible();
  });
});

const gotoPage = async (mockPage) => {
  const nocoPage = await mockPage(oneTableBlockWithAddNewAndViewAndEditAndAdvancedFields).waitForInit();
  await nocoPage.goto();
};

const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Add new' }).click();
};

const showMenu = async (page: Page, fieldName: string) => {
  await page.getByLabel(`block-item-CollectionField-general-form-general.${fieldName}-${fieldName}`).hover();
  await page
    .getByLabel(`designer-schema-settings-CollectionField-FormItem.Designer-general-general.${fieldName}`)
    .hover();
};

async function openDialogAndShowMenu({
  page,
  mockPage,
  mockRecord,
  fieldName,
}: {
  page: Page;
  mockPage;
  mockRecord;
  fieldName: string;
}) {
  await gotoPage(mockPage);
  await openDialog(page);
  await showMenu(page, fieldName);
}
