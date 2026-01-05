/**
 * Mock 数据库模块
 */

// Mock 数据库查询结果
export const createMockDbQuery = () => ({
  carts: {
    findFirst: jest.fn(),
  },
  lineItems: {
    findFirst: jest.fn(),
  },
  products: {
    findFirst: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
});

// Mock 数据库操作
export const createMockDb = () => ({
  query: createMockDbQuery(),
  insert: jest.fn(() => ({
    values: jest.fn(() => ({
      returning: jest.fn(),
    })),
  })),
  update: jest.fn(() => ({
    set: jest.fn(() => ({
      where: jest.fn(),
    })),
  })),
  delete: jest.fn(() => ({
    where: jest.fn(),
  })),
});
