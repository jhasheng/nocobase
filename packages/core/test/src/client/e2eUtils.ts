import { faker } from '@faker-js/faker';
import { uid } from '@formily/shared';
import { Page, test as base, expect, request } from '@playwright/test';
import _ from 'lodash';

export * from '@playwright/test';

export interface CollectionSetting {
  name: string;
  title?: string;
  /**
   * @default 'general'
   */
  template?: string;
  /**
   * @default true
   */
  logging?: boolean;
  /**
   * Generate ID field automatically
   * @default true
   */
  autoGenId?: boolean;
  /**
   * Store the creation user of each record
   * @default true
   */
  createdBy?: boolean;
  /**
   * Store the last update user of each record
   * @default true
   */
  updatedBy?: boolean;
  /**
   * Store the creation time of each record
   * @default true
   */
  createdAt?: boolean;
  /**
   * Store the last update time of each record
   * @default true
   */
  updatedAt?: boolean;
  /**
   * Records can be sorted
   * @default true
   */
  sortable?: boolean | string;
  /**
   * @default false
   */
  inherit?: boolean;
  category?: any[];
  hidden?: boolean;
  description?: string;
  view?: boolean;
  key?: string;
  fields?: Array<{
    interface: string;
    type?: string;
    name?: string;
    unique?: boolean;
    uiSchema?: {
      type?: string;
      title?: string;
      required?: boolean;
      'x-component'?: string;
      'x-read-pretty'?: boolean;
      'x-validator'?: any;
      'x-component-props'?: Record<string, any>;
      [key: string]: any;
    };
    field?: string;
    target?: string;
    targetKey?: string;
    foreignKey?: string;
    allowNull?: boolean;
    autoIncrement?: boolean;
    primaryKey?: boolean;
    key?: string;
    description?: string;
    collectionName?: string;
    parentKey?: any;
    reverseKey?: any;
    [key: string]: any;
  }>;
}

export interface PageConfig {
  /**
   * 页面类型
   * @default 'page'
   */
  type?: 'group' | 'page' | 'link';
  /**
   * type 为 link 时，表示跳转的链接
   */
  url?: string;
  /**
   * 用户可见的页面名称
   * @default uid()
   */
  name?: string;
  /**
   * 页面的基础路径
   * @default '/admin/'
   */
  basePath?: string;
  /**
   * 页面数据表的配置
   * @default undefined
   */
  collections?: CollectionSetting[];
  /**
   * 页面整体的 Schema
   * @default undefined
   */
  pageSchema?: any;
}

interface CreatePageOptions {
  type?: PageConfig['type'];
  url?: PageConfig['url'];
  name?: string;
  pageSchema?: any;
}

interface ExtendUtils {
  /**
   * 根据配置，生成一个 NocoBase 的页面
   * @param pageConfig 页面配置
   * @returns
   */
  mockPage: (pageConfig?: PageConfig) => NocoPage;
  /**
   * 根据配置，生成一个需要手动销毁的 NocoPage 页面
   * @param pageConfig
   * @returns
   */
  mockManualDestroyPage: (pageConfig?: PageConfig) => NocoPage;
  /**
   * 根据配置，生成多个 collections
   * @param collectionSettings
   * @returns 返回一个 destroy 方法，用于销毁创建的 collections
   */
  mockCollections: (collectionSettings: CollectionSetting[]) => Promise<any>;
  /**
   * 根据配置，生成一个 collection
   * @param collectionSetting
   * @returns 返回一个 destroy 方法，用于销毁创建的 collection
   */
  mockCollection: (collectionSetting: CollectionSetting) => Promise<any>;
  /**
   * 自动生成一条对应 collection 的数据
   * @param collectionName 数据表名称
   * @param data 自定义的数据，缺失时会生成随机数据
   * @returns 返回一条生成的数据
   */
  mockRecord: <T = any>(collectionName: string, data?: any) => Promise<T>;
  /**
   * 自动生成多条对应 collection 的数据
   */
  mockRecords: {
    /**
     * @param collectionName - 数据表名称
     * @param count - 生成的数据条数
     */
    <T = any>(collectionName: string, count?: number): Promise<T[]>;
    /**
     * @param collectionName - 数据表名称
     * @param data - 指定生成的数据
     */
    <T = any>(collectionName: string, data?: any[]): Promise<T[]>;
  };
  /**
   * 该方法已弃用，请使用 mockCollections
   * @deprecated
   * @param collectionSettings
   * @returns
   */
  createCollections: (collectionSettings: CollectionSetting | CollectionSetting[]) => Promise<void>;
  /**
   * 根据页面 title 删除对应的页面
   * @param pageName 显示在页面菜单中的名称
   * @returns
   */
  deletePage: (pageName: string) => Promise<void>;
}

const PORT = process.env.APP_PORT || 20000;
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;

export class NocoPage {
  private url: string;
  private uid: string;
  private collectionsName: string[];
  private _waitForInit: Promise<void>;

  constructor(
    private options?: PageConfig,
    private page?: Page,
  ) {
    this._waitForInit = this.init();
  }

  async init() {
    if (this.options?.collections?.length) {
      const collections: any = omitSomeFields(this.options.collections);
      this.collectionsName = collections.map((item) => item.name);

      await createCollections(collections);
    }

    this.uid = await createPage({
      type: this.options?.type,
      name: this.options?.name,
      pageSchema: this.options?.pageSchema,
      url: this.options?.url,
    });
    this.url = `${this.options?.basePath || '/admin/'}${this.uid}`;
  }

  async goto() {
    await this._waitForInit;
    await this.page?.goto(this.url);
  }

  async getUrl() {
    await this._waitForInit;
    return this.url;
  }

  async waitForInit(this: NocoPage) {
    await this._waitForInit;
    return this;
  }

  async destroy() {
    if (this.uid) {
      await deletePage(this.uid);
      this.uid = undefined;
    }
    if (this.collectionsName?.length) {
      await deleteCollections(this.collectionsName);
      this.collectionsName = undefined;
    }
  }
}

const _test = base.extend<ExtendUtils>({
  mockPage: async ({ page }, use) => {
    // 保证每个测试运行时 faker 的随机值都是一样的
    faker.seed(1);

    const nocoPages: NocoPage[] = [];
    const mockPage = (config?: PageConfig) => {
      const nocoPage = new NocoPage(config, page);
      nocoPages.push(nocoPage);
      return nocoPage;
    };

    await use(mockPage);

    // 测试运行完自动销毁页面
    for (const nocoPage of nocoPages) {
      await nocoPage.destroy();
    }
  },
  mockManualDestroyPage: async ({ browser }, use) => {
    const mockManualDestroyPage = (config?: PageConfig) => {
      const nocoPage = new NocoPage(config);
      return nocoPage;
    };

    await use(mockManualDestroyPage);
  },
  createCollections: async ({ page }, use) => {
    let collectionsName = [];

    const _createCollections = async (collectionSettings: CollectionSetting | CollectionSetting[]) => {
      collectionSettings = omitSomeFields(
        Array.isArray(collectionSettings) ? collectionSettings : [collectionSettings],
      );
      collectionsName = collectionSettings.map((item) => item.name);
      await createCollections(collectionSettings);
    };

    await use(_createCollections);

    if (collectionsName.length) {
      await deleteCollections(collectionsName);
    }
  },
  mockCollections: async ({ page }, use) => {
    let collectionsName = [];
    const destroy = async () => {
      if (collectionsName.length) {
        await deleteCollections(collectionsName);
      }
    };

    const mockCollections = async (collectionSettings: CollectionSetting[]) => {
      collectionSettings = omitSomeFields(collectionSettings);
      collectionsName = collectionSettings.map((item) => item.name);
      return createCollections(collectionSettings);
    };

    await use(mockCollections);
    await destroy();
  },
  mockCollection: async ({ page }, use) => {
    let collectionsName = [];
    const destroy = async () => {
      if (collectionsName.length) {
        await deleteCollections(collectionsName);
      }
    };

    const mockCollection = async (collectionSetting: CollectionSetting, options?: { manualDestroy: boolean }) => {
      const collectionSettings = omitSomeFields([collectionSetting]);
      collectionsName = collectionSettings.map((item) => item.name);
      return createCollections(collectionSettings);
    };

    await use(mockCollection);
    await destroy();
  },
  mockRecords: async ({ page }, use) => {
    const mockRecords = async (collectionName: string, count: any = 3, data?: any) => {
      if (_.isArray(count)) {
        data = count;
        count = data.length;
      }
      return createRandomData(collectionName, count, data);
    };

    await use(mockRecords);

    // 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
    const deletePromises = [
      deleteRecords('users', { id: { $ne: 1 } }),
      deleteRecords('roles', { name: { $ne: ['root', 'admin', 'member'] } }),
    ];
    await Promise.all(deletePromises);
  },
  mockRecord: async ({ page }, use) => {
    const mockRecord = async (collectionName: string, data?: any) => {
      const result = await createRandomData(collectionName, 1, data);
      return result[0];
    };

    await use(mockRecord);

    // 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
    const deletePromises = [
      deleteRecords('users', { id: { $ne: 1 } }),
      deleteRecords('roles', { name: { $ne: ['root', 'admin', 'member'] } }),
    ];
    await Promise.all(deletePromises);
  },
  deletePage: async ({ page }, use) => {
    const deletePage = async (pageName: string) => {
      await page.getByText(pageName, { exact: true }).hover();
      await page.getByRole('button', { name: 'designer-schema-settings-' }).hover();
      await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
      await page.getByRole('button', { name: 'OK', exact: true }).click();
    };

    await use(deletePage);

    // 删除掉 id 不是 1 的 users 和 name 不是 root admin member 的 roles
    const deletePromises = [
      deleteRecords('users', { id: { $ne: 1 } }),
      deleteRecords('roles', { name: { $ne: ['root', 'admin', 'member'] } }),
    ];
    await Promise.all(deletePromises);
  },
});

export const test = Object.assign(_test, {
  /** 只运行在 postgres 数据库中 */
  pgOnly: process.env.DB_DIALECT == 'postgres' ? _test : _test.skip,
});

const getStorageItem = (key: string, storageState: any) => {
  return storageState.origins
    .find((item) => item.origin === APP_BASE_URL)
    ?.localStorage.find((item) => item.name === key)?.value;
};

/**
 * 更新直接从浏览器中复制过来的 Schema 中的 uid
 */
const updateUidOfPageSchema = (uiSchema: any) => {
  if (!uiSchema) {
    return;
  }

  if (uiSchema['x-uid']) {
    uiSchema['x-uid'] = uid();
  }

  if (uiSchema.properties) {
    Object.keys(uiSchema.properties).forEach((key) => {
      updateUidOfPageSchema(uiSchema.properties[key]);
    });
  }

  return uiSchema;
};

/**
 * 在 NocoBase 中创建一个页面
 */
const createPage = async (options?: CreatePageOptions) => {
  const { type = 'page', url, name, pageSchema } = options || {};
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });
  const typeToSchema = {
    group: {
      'x-component': 'Menu.SubMenu',
      'x-component-props': {},
    },
    page: {
      'x-component': 'Menu.Item',
      'x-component-props': {},
    },
    link: {
      'x-component': 'Menu.URL',
      'x-component-props': {
        href: url,
      },
    },
  };
  const state = await api.storageState();
  const headers = getHeaders(state);
  const pageUid = uid();
  const gridName = uid();

  const result = await api.post(`/api/uiSchemas:insertAdjacent/nocobase-admin-menu?position=beforeEnd`, {
    headers,
    data: {
      schema: {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        title: name || pageUid,
        ...typeToSchema[type],
        'x-decorator': 'ACLMenuItemProvider',
        'x-server-hooks': [
          { type: 'onSelfCreate', method: 'bindMenuToRole' },
          { type: 'onSelfSave', method: 'extractTextToLocale' },
        ],
        properties: {
          page: updateUidOfPageSchema(pageSchema) || {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Page',
            'x-async': true,
            properties: {
              [gridName]: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'BlockInitializers',
                'x-uid': uid(),
                name: gridName,
              },
            },
            'x-uid': uid(),
            name: 'page',
          },
        },
        name: uid(),
        'x-uid': pageUid,
      },
      wrap: null,
    },
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  return pageUid;
};

/**
 * 根据页面 uid 删除一个 NocoBase 的页面
 */
const deletePage = async (pageUid: string) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/uiSchemas:remove/${pageUid}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

const deleteCollections = async (collectionNames: string[]) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  const params = collectionNames.map((name) => `filterByTk[]=${name}`).join('&');

  const result = await api.post(`/api/collections:destroy?${params}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 将数据表中 mock 出来的 records 删除掉
 * @param collectionName
 * @param records
 */
const deleteRecords = async (collectionName: string, filter: any) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/${collectionName}:destroy?filter=${JSON.stringify(filter)}`, {
    headers,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }
};

/**
 * 删除一些不需要的字段，如 key
 * @param collectionSettings
 * @returns
 */
export const omitSomeFields = (collectionSettings: CollectionSetting[]): any[] => {
  return collectionSettings.map((collection) => {
    return {
      ..._.omit(collection, ['key']),
      fields: collection.fields?.map((field) => _.omit(field, ['key', 'collectionName'])),
    };
  });
};

/**
 * 根据配置创建一个或多个 collection
 * @param page 运行测试的 page 实例
 * @param collectionSettings
 * @returns
 */
const createCollections = async (collectionSettings: CollectionSetting | CollectionSetting[]) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);
  collectionSettings = Array.isArray(collectionSettings) ? collectionSettings : [collectionSettings];

  const result = await api.post(`/api/collections:mock`, {
    headers,
    data: collectionSettings,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  return (await result.json()).data;
};

/**
 * 根据 collection 的配置生成 Faker 数据
 * @param collectionSetting
 * @param all
 * @returns
 */
const generateFakerData = (collectionSetting: CollectionSetting) => {
  const excludeField = ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
  const basicInterfaceToData = {
    input: () => faker.lorem.words(),
    textarea: () => faker.lorem.paragraph(),
    richText: () => faker.lorem.paragraph(),
    phone: () => faker.phone.number(),
    email: () => faker.internet.email(),
    url: () => faker.internet.url(),
    integer: () => faker.number.int(),
    number: () => faker.number.int(),
    percent: () => faker.number.float(),
    password: () => faker.internet.password(),
    color: () => faker.internet.color(),
    icon: () => 'checkcircleoutlined',
    datetime: () => faker.date.anytime({ refDate: '2023-09-21T00:00:00.000Z' }),
    time: () => '00:00:00',
  };
  const result = {};

  collectionSetting.fields.forEach((field) => {
    if (excludeField.includes(field.name)) {
      return;
    }

    if (basicInterfaceToData[field.interface]) {
      result[field.name] = basicInterfaceToData[field.interface]();
    }
  });

  return result;
};

/**
 * 使用 Faker 为 collection 创建数据
 */
const createFakerData = async (collectionSettings: CollectionSetting[]) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  for (const item of collectionSettings) {
    const data = generateFakerData(item);
    const result = await api.post(`/api/${item.name}:create`, {
      headers,
      form: data,
    });

    if (!result.ok()) {
      throw new Error(await result.text());
    }
  }
};

const createRandomData = async (collectionName: string, count = 10, data?: any) => {
  const api = await request.newContext({
    storageState: require.resolve('../../../../../playwright/.auth/admin.json'),
  });

  const state = await api.storageState();
  const headers = getHeaders(state);

  const result = await api.post(`/api/${collectionName}:mock?count=${count}`, {
    headers,
    data,
  });

  if (!result.ok()) {
    throw new Error(await result.text());
  }

  return (await result.json()).data;
};

function getHeaders(storageState: any) {
  const headers: any = {};
  const token = getStorageItem('NOCOBASE_TOKEN', storageState);
  const auth = getStorageItem('NOCOBASE_AUTH', storageState);
  const subAppName = new URL(APP_BASE_URL).pathname.match(/^\/apps\/([^/]*)\/*/)?.[1];
  const hostName = new URL(APP_BASE_URL).host;
  const locale = getStorageItem('NOCOBASE_LOCALE', storageState);
  const timezone = '+08:00';
  const withAclMeta = 'true';
  const role = getStorageItem('NOCOBASE_ROLE', storageState);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (auth) {
    headers['X-Authenticator'] = auth;
  }
  if (subAppName) {
    headers['X-App'] = subAppName;
  }
  if (hostName) {
    headers['X-Hostname'] = hostName;
  }
  if (locale) {
    headers['X-Locale'] = locale;
  }
  if (timezone) {
    headers['X-Timezone'] = timezone;
  }
  if (withAclMeta) {
    headers['X-With-Acl-Meta'] = withAclMeta;
  }
  if (role) {
    headers['X-Role'] = role;
  }

  return headers;
}

/**
 * 辅助断言 SchemaSettings 的菜单项是否存在
 * @param param0
 */
export async function expectSettingsMenu({ showMenu, supportedOptions, page }) {
  await showMenu();
  for (const option of supportedOptions) {
    await expect(page.getByRole('menuitem', { name: option })).toBeVisible();
  }
}

/**
 * 辅助断言 Initializer 的菜单项是否存在
 * @param param0
 */
export async function expectInitializerMenu({ showMenu, supportedOptions, page }) {
  await showMenu();
  for (const option of supportedOptions) {
    await expect(page.getByRole('menuitem', { name: option })).toBeVisible();
  }
}

/**
 * 用于辅助在 page 中创建区块
 * @param page
 * @param name
 */
export const createBlockInPage = async (page: Page, name: string) => {
  await page.getByLabel('schema-initializer-Grid-BlockInitializers').hover();

  if (name === 'Form') {
    await page.getByText('Form', { exact: true }).first().hover();
  } else if (name === 'Filter form') {
    await page.getByText('Form', { exact: true }).nth(1).hover();
  } else {
    await page.getByText(name, { exact: true }).hover();
  }

  if (name === 'Markdown') {
    await page.getByRole('menuitem', { name: 'Markdown' }).click();
  } else {
    await page.getByRole('menuitem', { name: 'Users' }).click();
  }

  await page.mouse.move(300, 0);
};
