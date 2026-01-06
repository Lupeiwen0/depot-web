// Jest 全局设置文件

// Mock Next.js headers with cookies support
jest.mock("next/headers", () => {
  const mockCookiesStore = {
    get: jest.fn((name) => {
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

  return {
    headers: jest.fn(() => new Headers()),
    cookies: jest.fn(() => Promise.resolve(mockCookiesStore)),
  };
});

// Mock Next.js cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));
