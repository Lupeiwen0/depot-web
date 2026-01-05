// Jest 全局设置文件

// Mock Next.js headers
jest.mock("next/headers", () => ({
  headers: jest.fn(() => Promise.resolve(new Headers())),
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
      set: jest.fn(),
    })
  ),
}));

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
