import { NextRequest, NextResponse } from "next/server";
import OSS from "ali-oss";
import { getServerTranslations } from "@/lib/server-i18n";

// 初始化 OSS 客户端
function getOSSClient() {
  const region = process.env.ALIYUN_OSS_REGION;
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET;
  const bucket = process.env.ALIYUN_OSS_BUCKET;

  if (!region || !accessKeyId || !accessKeySecret || !bucket) {
    throw new Error("阿里云 OSS 配置不完整，请检查环境变量");
  }

  return new OSS({
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
  });
}

// POST - 上传文件到阿里云 OSS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    const { t } = await getServerTranslations();

    if (!file) {
      return NextResponse.json(
        { error: t("api.upload.noFile") },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: t("api.upload.invalidFormat") },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: t("api.upload.fileTooLarge") },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `depot-qc/products/${timestamp}-${randomStr}.${ext}`;

    // 转换 File 为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 OSS
    const client = getOSSClient();
    const result = await client.put(fileName, buffer, {
      mime: file.type,
    });

    // 返回文件 URL
    const url = result.url.replace(/^http:/, "https:");

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const { t } = await getServerTranslations();
    const message =
      error instanceof Error ? error.message : t("api.upload.uploadFailed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
