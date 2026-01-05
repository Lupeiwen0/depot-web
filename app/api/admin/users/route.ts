import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { user, userMemberships } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// 验证管理员权限
async function verifyAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  return { user: session.user };
}

// GET - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // 构建查询条件
    const conditions = [];

    // 搜索（用户名或邮箱）
    if (search) {
      conditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      );
    }

    // 状态筛选
    if (status && ["active", "disabled", "deleted"].includes(status)) {
      conditions.push(eq(user.status, status as "active" | "disabled" | "deleted"));
    }

    // 排序
    const sortField = sortBy === "email" ? user.email : user.createdAt;
    const orderFn = sortOrder === "asc" ? asc : desc;

    // 查询总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(totalResult[0].count);

    // 查询用户列表
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        image: user.image,
        createdAt: user.createdAt,
        disabledAt: user.disabledAt,
        disabledReason: user.disabledReason,
      })
      .from(user)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortField))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 获取用户的会员状态
    const userIds = users.map((u) => u.id);
    const memberships = userIds.length > 0
      ? await db.query.userMemberships.findMany({
          where: sql`${userMemberships.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
        })
      : [];

    const membershipMap = new Map(
      memberships.map((m) => [m.userId, m.status])
    );

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        image: u.image,
        createdAt: u.createdAt.toISOString(),
        disabledAt: u.disabledAt?.toISOString() || null,
        disabledReason: u.disabledReason,
        membershipStatus: membershipMap.get(u.id) || null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to get users" },
      { status: 500 }
    );
  }
}

// POST - 创建用户
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 检查邮箱唯一性
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 创建用户 (使用 better-auth 的方式)
    const userId = nanoid();
    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(user)
      .values({
        id: userId,
        name,
        email,
        emailVerified: false,
        role: "buyer",
        status: "active",
      })
      .returning();

    // 创建账户记录（用于密码登录）
    await db.execute(sql`
      INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (${nanoid()}, ${userId}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())
    `);

    return NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
