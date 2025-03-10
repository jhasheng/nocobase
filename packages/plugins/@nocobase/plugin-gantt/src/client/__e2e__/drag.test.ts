import { expect, test } from '@nocobase/test/client';
import { oneEmptyGantt } from './utils';

test('drag and adjust start time, end time, and progress', async ({ page, mockPage, mockRecord }) => {
  const mockData = {
    singleLineText: 'within apropos leaker whoever how',
    startDatetime: '2023-04-26T11:02:51.129Z',
    endDatetime: '2023-06-13T22:11:11.999Z',
    percent: 50,
  };
  await mockPage(oneEmptyGantt).goto();
  await mockRecord('general', mockData);
  await page.getByLabel('block-item-gantt').hover();
  await page.getByLabel('designer-schema-settings-CardItem-Gantt.Designer-general').hover();
  await page.getByRole('menuitem', { name: 'Time scale' }).click();
  await page.getByRole('option', { name: 'Week' }).click();
  await page.getByRole('menuitem', { name: 'Time scale' }).hover();
  await page.mouse.move(300, 0);
  await page.getByRole('button', { name: 'Actions' }).click();
  await expect(await page.locator('.calendarBottomText').first().textContent()).toContain('W');
  await page.locator('.bar ').hover();
  const draggableElement = await page.getByLabel('task-bar').getByRole('button').first();
  await draggableElement.hover();
  const { x: initialX, y: initialY } = await draggableElement.boundingBox();
  // 计算目标位置的坐标
  const targetX = initialX + 100;
  const targetY = initialY;
  await page.mouse.move(initialX, initialY);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY);
  const [request] = await Promise.all([
    page.waitForRequest((request) => request.url().includes('api/general:update')),
    page.mouse.up(),
  ]);
  const postData = request.postDataJSON();
  expect(postData.startDatetime).not.toEqual(mockData.startDatetime);
});
