import { expect, test } from '@nocobase/test/client';
import { oneEmptyTableBlockWithCustomizeUpdate } from './utils';

test.describe('data will be updated && Assign field values && after successful submission', () => {
  test('data will be updated && Assign field values && after successful submission', async ({
    page,
    mockPage,
    mockRecords,
  }) => {
    await mockPage(oneEmptyTableBlockWithCustomizeUpdate).goto();
    await mockRecords('general', 2);
    await page.getByLabel('action-Action-Bulk update-customize:bulkUpdate-general-table').hover();
    await page.getByLabel('designer-schema-settings-Action-Action.Designer-general').hover();
    //默认是选中的数据
    await expect(await page.getByTitle('Data will be updated').getByText('Selected')).toBeVisible();
    await page.getByRole('menuitem', { name: 'Data will be updated' }).click();
    //切换为全部数据
    await page.getByRole('option', { name: 'All' }).click();
    //字段赋值
    await page.getByRole('menuitem', { name: 'Assign field values' }).click();
    await page.getByLabel('schema-initializer-Grid-CustomFormItemInitializers-general').click();
    await page.getByRole('menuitem', { name: 'Single select' }).click();
    await page.getByTestId('select-single').click();
    await page.getByText('option3').click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByLabel('action-Action-Bulk update-customize:bulkUpdate-general-table').hover();
    await page.getByLabel('designer-schema-settings-Action-Action.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'After successful submission' }).click();
    await page.getByLabel('Manually close').check();
    await page.getByLabel('Redirect to').check();
    await page.locator('input[type="text"]').click();
    await page.locator('input[type="text"]').fill('/admin/pm/list/local/');
    await page.getByRole('button', { name: 'OK' }).click();
    await page.getByLabel('action-Action-Bulk update-customize:bulkUpdate-general-table').click();
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:update')),
      page.getByRole('button', { name: 'OK' }).click(),
    ]);
    const postData = request.postDataJSON();
    //更新的数据符合预期
    expect(postData.singleSelect).toEqual('option3');
    await page.getByRole('button', { name: 'OK' }).click();
    //成功后跳转路由
    expect(page.url()).toContain('/admin/pm/list/local/');
  });
});
