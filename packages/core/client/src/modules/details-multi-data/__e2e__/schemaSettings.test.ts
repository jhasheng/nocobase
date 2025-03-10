import {
  expectSettingsMenu,
  oneDetailBlockWithM2oFieldToGeneral,
  oneEmptyDetailsBlock,
  test,
} from '@nocobase/test/client';

test.describe('multi data details block schema settings', () => {
  test('supported options', async ({ page, mockPage, mockRecord }) => {
    const nocoPage = await mockPage(oneDetailBlockWithM2oFieldToGeneral).waitForInit();
    await mockRecord('general');
    await nocoPage.goto();

    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByLabel('block-item-CardItem-targetToGeneral-details').hover();
        await page.getByLabel('designer-schema-settings-CardItem-DetailsDesigner-targetToGeneral').hover();
      },
      supportedOptions: [
        'Edit block title',
        'Set the data scope',
        'Set default sorting rules',
        'Save as block template',
        'Delete',
      ],
    });
  });
});

test.describe('actions schema settings', () => {
  test('edit & delete & duplicate', async ({ page, mockPage }) => {
    await mockPage(oneEmptyDetailsBlock).goto();

    // 创建 Edit & Delete & Duplicate 三个按钮
    await page.getByLabel('schema-initializer-ActionBar-DetailsActionInitializers-general').hover();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await page.mouse.move(0, 300);

    // Edit button settings ---------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Edit' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Open mode', 'Popup size', 'Delete'],
    });

    // Delete settings -------------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Delete' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Linkage rules', 'Delete'],
    });

    // Duplicate settings ----------------------------------------------------------------
    await expectSettingsMenu({
      page,
      showMenu: async () => {
        await page.getByRole('button', { name: 'Duplicate' }).hover();
        await page.getByRole('button', { name: 'designer-schema-settings-Action' }).hover();
      },
      supportedOptions: ['Edit button', 'Duplicate mode', 'Open mode', 'Popup size', 'Delete'],
    });
  });
});
