import { useCallback } from "react";

interface AnimationConfig {
  duration?: number;
  onComplete?: () => void;
}

/**
 * 购物车飞入动画 Hook
 * 使用贝塞尔曲线实现商品图标飞入购物车效果
 */
export function useCartAnimation() {
  const animateToCart = useCallback(
    (
      sourceElement: HTMLElement,
      config: AnimationConfig = {}
    ) => {
      const { duration = 800, onComplete } = config;

      // 获取购物车图标位置（导航栏中的购物车）
      const cartIcon = document.querySelector('[data-cart-icon]');
      if (!cartIcon) {
        console.warn("未找到购物车图标");
        onComplete?.();
        return;
      }

      // 获取起始和结束位置
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = cartIcon.getBoundingClientRect();

      // 创建飞行元素
      const flyingElement = document.createElement("div");
      flyingElement.className = "cart-flying-item";
      flyingElement.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      `;

      // 设置初始样式
      Object.assign(flyingElement.style, {
        position: "fixed",
        left: `${sourceRect.left + sourceRect.width / 2}px`,
        top: `${sourceRect.top + sourceRect.height / 2}px`,
        width: "32px",
        height: "32px",
        color: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--background))",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        transform: "translate(-50%, -50%) scale(1)",
      });

      document.body.appendChild(flyingElement);

      // 计算贝塞尔曲线控制点
      const startX = sourceRect.left + sourceRect.width / 2;
      const startY = sourceRect.top + sourceRect.height / 2;
      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      // 控制点位置（创建抛物线效果）
      const controlX = startX + (endX - startX) * 0.5;
      const controlY = Math.min(startY, endY) - 100; // 向上弧形

      // 使用 Web Animations API 创建动画
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用贝塞尔曲线缓动函数
        const easeProgress = easeOutQuad(progress);

        // 计算二次贝塞尔曲线上的点
        const t = easeProgress;
        const x =
          Math.pow(1 - t, 2) * startX +
          2 * (1 - t) * t * controlX +
          Math.pow(t, 2) * endX;
        const y =
          Math.pow(1 - t, 2) * startY +
          2 * (1 - t) * t * controlY +
          Math.pow(t, 2) * endY;

        // 缩放效果：开始时稍微放大，结束时缩小
        const scale = 1 + Math.sin(progress * Math.PI) * 0.3 - progress * 0.5;

        flyingElement.style.left = `${x}px`;
        flyingElement.style.top = `${y}px`;
        flyingElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        flyingElement.style.opacity = `${1 - progress * 0.3}`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 动画结束，添加购物车抖动效果
          cartIcon.classList.add("cart-bounce");
          setTimeout(() => {
            cartIcon.classList.remove("cart-bounce");
          }, 500);

          // 移除飞行元素
          flyingElement.remove();
          onComplete?.();
        }
      };

      requestAnimationFrame(animate);
    },
    []
  );

  return { animateToCart };
}

// 缓动函数
function easeOutQuad(t: number): number {
  return t * (2 - t);
}
