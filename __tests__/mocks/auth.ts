/**
 * Mock 认证模块
 */

import {
  createMockSession,
  createMockAdminSession,
} from "../utils/test-helpers";

// Mock auth 对象
export const mockAuth = {
  api: {
    getSession: jest.fn(),
  },
};

/**
 * 设置 Mock 为已登录用户
 */
export function mockAuthenticatedUser() {
  mockAuth.api.getSession.mockResolvedValue(createMockSession());
}

/**
 * 设置 Mock 为管理员用户
 */
export function mockAuthenticatedAdmin() {
  mockAuth.api.getSession.mockResolvedValue(createMockAdminSession());
}

/**
 * 设置 Mock 为未登录
 */
export function mockUnauthenticated() {
  mockAuth.api.getSession.mockResolvedValue(null);
}

/**
 * 重置认证 Mock
 */
export function resetAuthMock() {
  mockAuth.api.getSession.mockReset();
}
