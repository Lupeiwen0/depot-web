import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "重置您的密码",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>重置密码</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 32px;
              }
              .header {
                text-align: center;
                margin-bottom: 24px;
              }
              .header h1 {
                color: #1f2937;
                font-size: 24px;
                margin: 0;
              }
              .content {
                background-color: #ffffff;
                border-radius: 6px;
                padding: 24px;
                margin-bottom: 24px;
              }
              .button {
                display: inline-block;
                background-color: #3b82f6;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin: 16px 0;
              }
              .button:hover {
                background-color: #2563eb;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
              .link {
                color: #3b82f6;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>重置密码</h1>
              </div>
              <div class="content">
                <p>您好，</p>
                <p>我们收到了重置您账户密码的请求。请点击下面的按钮来设置新密码：</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">重置密码</a>
                </div>
                <p>或者复制以下链接到浏览器中打开：</p>
                <p class="link">${resetUrl}</p>
                <p><strong>此链接将在30分钟后失效，且只能使用一次。</strong></p>
                <p>如果您没有请求重置密码，请忽略此邮件。</p>
              </div>
              <div class="footer">
                <p>此邮件由系统自动发送，请勿回复。</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("发送邮件失败:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("发送邮件异常:", error);
    return { success: false, error };
  }
}
