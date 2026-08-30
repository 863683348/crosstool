'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const KEY = 'ct_recent';
const MAX = 8;

// 在 tools 详情页挂载：访问即把 slug 记入 localStorage（首页「最近使用」读取）
export default function RecentTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const m = pathname?.match(/^\/tools\/([a-z0-9-]+)$/);
    if (!m) return;
    const slug = m[1];
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
