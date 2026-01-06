/**
 * Mock for next/headers
 * 可在测试文件中直接导入使用
 */

export const mockCookiesStore = {
  get: jest.fn((name: string) => {
    if (name === "locale") {
      return { name: "locale", value: "zh" };
    }
    return undefined;
  }),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(),
  getAll: jest.fn(() => []),
};

export const mockNextHeaders = {
  headers: jest.fn(() => new Headers()),
  cookies: jest.fn(() => Promise.resolve(mockCookiesStore)),
};

/**
 * 重置所有 mock
 */
export function resetNextHeadersMocks() {
  Object.values(mockCookiesStore).forEach((fn) => {
    if (typeof fn === "function" && "mockClear" in fn) {
      (fn as jest.Mock).mockClear();
    }
  });
  (mockNextHeaders.headers as jest.Mock).mockClear();
  (mockNextHeaders.cookies as jest.Mock).mockClear();
}
