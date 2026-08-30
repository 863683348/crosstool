'use client';

import { useT } from '@/lib/i18n';
import Link from 'next/link';

export default function AboutClient() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t('aboutH1')}</h1>

      <section className="mb-8">
        <p className="text-sm leading-relaxed text-muted sm:text-base">{t('aboutDesc')}</p>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-panel p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t('aboutTechTitle')}
        </h2>
        <p className="text-sm text-muted">{t('aboutTechBody')}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t('aboutContactTitle')}
        </h2>
        <p className="text-sm text-muted">
          {t('aboutContactBody')}{' '}
          <a href="mailto:contact@crosstool.online" className="text-primary underline">
            contact@crosstool.online
          </a>
        </p>
      </section>

      <section className="rounded-xl border border-border bg-panel p-6 text-center">
        <h2 className="mb-2 text-lg font-bold">{t('coffeeTitle')}</h2>
        <p className="mx-auto mb-4 max-w-md text-sm text-muted">{t('coffeeDesc')}</p>
        <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col items-center">
            <img
              src="/wechat-qr.jpg"
              alt={t('coffeeWechat')}
              width={180}
              height={180}
              className="h-44 w-44 rounded-lg border border-border object-contain"
            />
            <p className="mt-2 text-xs text-muted">{t('coffeeWechat')}</p>
          </div>
          <div className="flex flex-col items-center">
            <img
              src="/alipay-qr.jpg"
              alt={t('coffeeAlipay')}
              width={180}
              height={180}
              className="h-44 w-44 rounded-lg border border-border object-contain"
            />
            <p className="mt-2 text-xs text-muted">{t('coffeeAlipay')}</p>
          </div>
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-primary underline">
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
