"use client";

import { useEffect } from "react";

// Crisp 全局类型声明
declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

interface CrispProps {
  websiteId?: string;
}

export default function Crisp({ websiteId }: CrispProps) {
  useEffect(() => {
    // 使用传入的 websiteId 或环境变量
    const id = websiteId || process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    if (!id) {
      console.warn("Crisp: 未配置 WEBSITE_ID，聊天组件将不会加载");
      return;
    }

    // 初始化 Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = id;

    // 动态加载 Crisp 脚本
    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // 清理函数
    return () => {
      // 移除脚本
      const existingScript = document.querySelector(
        'script[src="https://client.crisp.chat/l.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
      // 清理全局变量
      delete (window as Partial<Window>).$crisp;
      delete (window as Partial<Window>).CRISP_WEBSITE_ID;
    };
  }, [websiteId]);

  return null;
}
