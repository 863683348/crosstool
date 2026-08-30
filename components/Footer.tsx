'use client';

import { useT } from '@/lib/i18n';
import Link from 'next/link';

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-border bg-panel px-4 py-8 text-center text-xs text-muted">
      <p className="mb-2">{t('footerPrivacy')}</p>
      <p className="mb-2">
        <Link href="/about" className="text-primary underline">
          {t('navAbout')}
        </Link>
      </p>
      <p>{t('footerRights')}</p>
    </footer>
  );
}
