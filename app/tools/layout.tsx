import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RecentTracker from '@/components/RecentTracker';

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RecentTracker />
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ArrowLeft size={14} /> 首页 / Home
      </Link>
      {children}
    </div>
  );
}
