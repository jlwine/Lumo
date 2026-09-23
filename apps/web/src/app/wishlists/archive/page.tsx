'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, ArrowLeft, ExternalLink, Gift, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getIntlLocale, tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';
import { apiRequest } from '@/lib/api';
import { getAccessToken, removeAccessToken } from '@/lib/auth';

type ArchivedItem = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;
  price: number | null;
  archivedAt?: string | null;
  archiveReason?: 'RECEIVED' | 'NO_LONGER_NEEDED' | null;
};
type CurrentArchive = {
  id: string;
  title: string;
  description: string | null;
  owner: { id: string; displayName: string | null; nickname: string };
  items: ArchivedItem[];
  canRestore: boolean;
};
type ArchivedWishlist = {
  id: string;
  title: string;
  description: string | null;
  items: ArchivedItem[];
};
type ArchivedRelationship = {
  id: string;
  endedAt: string;
  partner: { id: string; displayName: string | null; nickname: string };
  wishlists: ArchivedWishlist[];
};
type ArchiveResponse = {
  current: CurrentArchive[];
  relationships: ArchivedRelationship[];
};

export default function WishlistArchivePage() {
  useLanguageVersion();
  const router = useRouter();
  const [archive, setArchive] = useState<ArchiveResponse>({ current: [], relationships: [] });
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadArchive = useCallback(async (signal?: AbortSignal) => {
    const token = getAccessToken();
    if (!token) {
      removeAccessToken();
      router.replace('/login');
      return;
    }
    const result = await apiRequest<ArchiveResponse>('/wishlists/archives', {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    setArchive(result);
  }, [router]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      removeAccessToken();
      router.replace('/login');
      return;
    }
    const controller = new AbortController();
    void apiRequest<ArchiveResponse>('/wishlists/archives', {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((result) => {
        if (!controller.signal.aborted) setArchive(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : tr('Не удалось загрузить архив'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [router]);

  async function restoreItem(wishlistId: string, itemId: string) {
    const token = getAccessToken();
    if (!token) return;
    try {
      setRestoringId(itemId);
      setError(null);
      await apiRequest(`/wishlists/${wishlistId}/items/${itemId}/restore`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadArchive();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tr('Не удалось вернуть желание'));
    } finally {
      setRestoringId(null);
    }
  }

  const isEmpty = archive.current.length === 0 && archive.relationships.length === 0;

  return <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--text-primary)]">
    <div className="mx-auto max-w-6xl">
      <button type="button" onClick={() => router.push('/wishlists')}
        className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]">
        <ArrowLeft size={18} />{tr('К вишлистам')}
      </button>
      <header className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-7 md:p-9">
        <p className="flex items-center gap-2 text-sm font-medium text-[#927ba3]"><Gift size={18} />{tr('Вишлисты')}</p>
        <h1 className="mt-2 text-3xl font-semibold">{tr('Архив')}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{tr('Здесь хранятся полученные и больше не актуальные желания. Их можно вернуть в активный список.')}</p>
      </header>
      {error && <p role="alert" className="mt-6 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] p-4 text-sm text-[#a95057]">{error}</p>}
      {loading ? <p className="mt-8 text-sm text-[var(--text-secondary)]">{tr('Загрузка...')}</p>
        : !error && isEmpty ? <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--text-secondary)]">{tr('Архив пока пуст')}</div>
        : <>
          {archive.current.length > 0 && <section className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Gift size={20} className="text-[#cf7d86]" />{tr('Полученные желания')}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {archive.current.map((wishlist) => <article key={wishlist.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <p className="text-xs text-[var(--text-secondary)]">{wishlist.owner.displayName ?? wishlist.owner.nickname}</p>
                <h3 className="mt-1 font-semibold">{wishlist.title}</h3>
                <div className="mt-4 space-y-4">{wishlist.items.map((item) => <ArchivedItemCard key={item.id} item={item}
                  action={wishlist.canRestore ? <button type="button" disabled={restoringId === item.id} onClick={() => void restoreItem(wishlist.id, item.id)}
                    className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[#c99aa0] hover:text-[#b7656e] disabled:opacity-50">
                    <ArchiveRestore size={14} />{tr('Вернуть в список')}
                  </button> : undefined} />)}</div>
              </article>)}
            </div>
          </section>}
          {archive.relationships.length > 0 && <section className="mt-10 border-t border-[var(--border)] pt-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><History size={20} className="text-[#927ba3]" />{tr('Прошлые отношения')}</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr('Сохранённые желания партнёра доступны только для просмотра.')}</p>
            {archive.relationships.map((relationship) => <div key={relationship.id} className="mt-7">
              <h3 className="text-lg font-semibold">{relationship.partner.displayName ?? relationship.partner.nickname}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{new Date(relationship.endedAt).toLocaleDateString(getIntlLocale())}</p>
              {relationship.wishlists.length === 0 ? <p className="mt-4 text-sm text-[var(--text-secondary)]">{tr('Вишлистов не было')}</p> : <div className="mt-5 grid gap-5 md:grid-cols-2">
                {relationship.wishlists.map((wishlist) => <article key={wishlist.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5">
                  <h4 className="font-semibold">{wishlist.title}</h4>
                  <div className="mt-4 space-y-4">{wishlist.items.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">{tr('Желаний не было')}</p> : wishlist.items.map((item) => <ArchivedItemCard key={item.id} item={item} />)}</div>
                </article>)}
              </div>}
            </div>)}
          </section>}
        </>}
    </div>
  </main>;
}

function ArchivedItemCard({ item, action }: { item: ArchivedItem; action?: React.ReactNode }) {
  return <div className="flex gap-4 border-t border-[var(--border)] pt-4">
    {item.imageUrl ? <div role="img" aria-label={item.title} className="h-20 w-20 shrink-0 rounded-xl bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${item.imageUrl}")` }} />
      : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)]"><Gift size={24} className="text-[#aa94b7]" /></div>}
    <div className="min-w-0 flex-1">
      <p className="font-medium">{item.title}</p>
      {item.archiveReason && <p className="mt-1 text-xs text-[#b16b73]">{item.archiveReason === 'RECEIVED' ? tr('Получено') : tr('Больше не актуально')}</p>}
      {item.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>}
      {item.price !== null && <p className="mt-1 text-sm text-[var(--text-secondary)]">{new Intl.NumberFormat(getIntlLocale(), { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(item.price)}</p>}
      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-[#c8757c] underline"><ExternalLink size={13} />{tr('Ссылка на желание')}</a>}
      {action}
    </div>
  </div>;
}
