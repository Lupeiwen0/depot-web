/**
 * @jest-environment node
 */

import { POST as changePassword } from "@/app/api/user/change-password/route";
import { POST as requestPasswordReset } from "@/app/api/user/request-password-reset/route";
import { POST as resetPassword } from "@/app/api/user/reset-password/route";
import { NextRequest } from "next/server";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock db
jest.mock("@/db", () => ({
  db: {
    query: {
      account: {
        findFirst: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      verification: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(),
    })),
  },
}));

// Mock bcrypt -> better-auth/crypto
jest.mock("better-auth/crypto", () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(() => "hashed_password"),
}));

// Mock nanoid
jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mock-nanoid-token"),
}));

// Mock email
jest.mock("@/lib/email", () => ({
  sendPasswordResetEmail: jest.fn(() => ({ success: true })),
}));

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { verifyPassword } from "better-auth/crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const mockGetSession = auth.api.getSession as unknown as jest.Mock;
const mockAccountFindFirst = db.query.account.findFirst as jest.Mock;
const mockUserFindFirst = db.query.user.findFirst as jest.Mock;
const mockVerificationFindFirst = db.query.verification.findFirst as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;

describe("Change Password API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if not logged in", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "old123",
          newPassword: "new123",
        }),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("未登录");
  });

  it("should return 400 if passwords are missing", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("请提供当前密码和新密码");
  });

  it("should return 400 if new password is too short", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "old123",
          newPassword: "12345",
        }),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("新密码至少需要6个字符");
  });

  it("should return 400 if account not found", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });
    mockAccountFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "old123",
          newPassword: "new123456",
        }),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("账户不支持密码修改");
  });

  it("should return 400 if current password is incorrect", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });
    mockAccountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      password: "hashed_old_password",
    });
    mockVerifyPassword.mockResolvedValue(false);

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "wrong123",
          newPassword: "new123456",
        }),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("当前密码不正确");
  });

  it("should successfully change password", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", email: "test@example.com" },
    });
    mockAccountFindFirst.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      password: "hashed_old_password",
    });
    mockVerifyPassword.mockResolvedValue(true);

    const request = new NextRequest(
      "http://localhost:3000/api/user/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "old123",
          newPassword: "new123456",
        }),
      }
    );

    const response = await changePassword(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });
});

describe("Request Password Reset API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if email is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/user/request-password-reset",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await requestPasswordReset(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("请提供邮箱地址");
  });

  it("should return success even if user not found (security)", async () => {
    mockUserFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/request-password-reset",
      {
        method: "POST",
        body: JSON.stringify({ email: "nonexistent@example.com" }),
      }
    );

    const response = await requestPasswordReset(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should send reset email for existing user", async () => {
    mockUserFindFirst.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/request-password-reset",
      {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      }
    );

    const response = await requestPasswordReset(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "test@example.com",
      "mock-nanoid-token"
    );
  });
});

describe("Reset Password API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if token or password is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    const response = await resetPassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("请提供重置令牌和新密码");
  });

  it("should return 400 if new password is too short", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "valid-token",
          newPassword: "12345",
        }),
      }
    );

    const response = await resetPassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("新密码至少需要6个字符");
  });

  it("should return 400 if token is invalid or expired", async () => {
    mockVerificationFindFirst.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "invalid-token",
          newPassword: "new123456",
        }),
      }
    );

    const response = await resetPassword(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("重置链接无效或已过期");
  });

  it("should successfully reset password with valid token", async () => {
    mockVerificationFindFirst.mockResolvedValue({
      id: "verification-1",
      identifier: "password-reset:user-1",
      value: "valid-token",
      expiresAt: new Date(Date.now() + 3600000),
    });

    const request = new NextRequest(
      "http://localhost:3000/api/user/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token: "valid-token",
          newPassword: "new123456",
        }),
      }
    );

    const response = await resetPassword(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });
});
