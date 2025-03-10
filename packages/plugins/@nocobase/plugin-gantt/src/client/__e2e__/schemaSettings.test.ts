import { expect, test } from '@nocobase/test/client';
import { getYmd } from '../helpers/other-helper';
import { oneEmptyGantt } from './utils';
const mockData = {
  singleLineText: 'within apropos leaker whoever how',
  singleLineText2: 'the inasmuch unwelcome gah hm cleverly muscle worriedly lazily',
  startDatetime: '2023-04-26T11:02:51.129Z',
  startDatetime2: '2023-04-29T03:35:05.576Z',
  endDatetime: '2023-05-13T22:11:11.999Z',
  endDatetime2: '2023-07-26T00:47:52.859Z',
  percent: 66,
  percent2: 55,
};

//甘特图的区块参数配置
test.describe('configure params in gantt block', () => {
  test('set data scope in gantt block', async ({ page, mockPage, mockRecords }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecords('general', 2);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Set the data scope' }).click();
    await page.getByText('Add condition', { exact: true }).click();
    await page.getByTestId('select-filter-field').click();
    await page.getByTitle('ID').getByText('ID').click();
    await page.getByRole('spinbutton').fill('1');
    const [request] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('api/general:list')),
      page.getByRole('button', { name: 'OK' }).click(),
    ]);
    const requestUrl = request.url();
    const queryParams = new URLSearchParams(new URL(requestUrl).search);
    const filter = queryParams.get('filter');
    //请求参数符合预期
    expect(JSON.parse(filter)).toEqual({ $and: [{ id: { $eq: 1 } }] });
    await expect(page.getByLabel('table-index-2')).not.toBeVisible();
  });

  test('set title field', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Title field' }).click();
    await page.getByRole('option', { name: 'Single line text2' }).locator('div').click();
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.mouse.move(300, 0);
    const barLabel = await page.getByLabel('block-item-gantt').locator('.barLabel');
    await barLabel.hover();
    expect(await barLabel.textContent()).toBe(mockData['singleLineText2']);
  });
  test('set start date field ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    await page.getByRole('menuitem', { name: 'Start date field' }).click();
    await page.getByRole('option', { name: 'Start date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    const tooltip2 = await page.getByLabel('nb-gantt-tooltip');
    await expect(await tooltip2.innerText()).toContain(getYmd(new Date(mockData['startDatetime2'])));
  });
  test('set end date field ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改结束时间字段
    await page.getByRole('menuitem', { name: 'End date field' }).click();
    await page.getByRole('option', { name: 'End date time2' }).locator('div').click();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    const tooltip2 = await page.getByLabel('nb-gantt-tooltip');
    await expect(await tooltip2.innerText()).toContain(getYmd(new Date(mockData['endDatetime2'])));
  });
  test('set time scale ', async ({ page, mockPage, mockRecord }) => {
    await mockPage(oneEmptyGantt).goto();
    await mockRecord('general', mockData);
    await page.getByLabel('block-item-gantt').hover();
    await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
    //修改时间缩放等级
    await page.getByRole('menuitem', { name: 'Time scale' }).click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.getByRole('menuitem', { name: 'Time scale' }).hover();
    await page.mouse.move(300, 0);
    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.bar').hover();
    await expect(await page.locator('.calendarBottomText').first().textContent()).toContain('W');
  });
});
