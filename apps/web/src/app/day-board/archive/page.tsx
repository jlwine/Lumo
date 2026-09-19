'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Images } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DayBoardPhotoDialog } from '@/components/day-board-photo-dialog';
import { getIntlLocale, tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';
import { apiRequest } from '@/lib/api';
import { getAccessToken, removeAccessToken } from '@/lib/auth';
import type { DayBoardArchivesResponse, DayBoardEntry, DayBoardHistoryResponse, DayBoardPastRelationship } from '@/types/day-board';

export default function DayBoardArchivePage() {
  useLanguageVersion();
  const router = useRouter();
  const [relationships, setRelationships] = useState<DayBoardPastRelationship[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archive, setArchive] = useState<DayBoardHistoryResponse | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<DayBoardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      removeAccessToken();
      router.replace('/login');
      return;
    }
    const controller = new AbortController();
    void apiRequest<DayBoardArchivesResponse>('/day-board/archives', {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ relationships: items }) => {
      if (controller.signal.aborted) return;
      setRelationships(items);
      setSelectedId(items[0]?.id ?? null);
      if (items.length === 0) setLoading(false);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : tr('Не удалось загрузить архив'));
      setLoading(false);
    });
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!selectedId) return;
    const token = getAccessToken();
    if (!token) return;
    const controller = new AbortController();
    void apiRequest<DayBoardHistoryResponse>(`/day-board/archives/${encodeURIComponent(selectedId)}`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    }).then((result) => {
      if (controller.signal.aborted) return;
      setArchive(result);
      setError(null);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : tr('Не удалось загрузить архив'));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [selectedId]);

  const selected = relationships.find((item) => item.id === selectedId);

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => router.push('/home')}
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]">
          <ArrowLeft size={18} />{tr('На главную')}
        </button>
        <header className="rounded-[30px] border border-[var(--border)] bg-[var(--surface)] p-7 md:p-9">
          <div className="flex items-center gap-2 text-sm font-medium text-[#c8757c]"><Images size={18} />{tr('Доска дня')}</div>
          <h1 className="mt-2 text-3xl font-semibold">{tr('Архив прошлых отношений')}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{tr('Фотографии завершённых отношений доступны здесь только для просмотра.')}</p>
        </header>
        {error && <p role="alert" className="mt-6 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] p-4 text-sm text-[#a95057]">{error}</p>}
        {loading ? <p className="mt-8 text-sm text-[var(--text-secondary)]">{tr('Загрузка...')}</p> : error && relationships.length === 0 ? null : relationships.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
            <Images className="mx-auto text-[#b8a4b5]" size={34} />
            <p className="mt-4 font-medium">{tr('Архив пока пуст')}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr('Здесь появятся фотографии завершённых отношений.')}</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              {relationships.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setArchive(null); setLoading(true); }}
                  aria-pressed={item.id === selectedId}
                  className={`rounded-2xl border px-5 py-3 text-left transition ${item.id === selectedId ? 'border-[#d9949b] bg-[#fff0ef] text-[#794d52]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[#d9949b]'}`}>
                  <span className="block font-medium">{item.partner.displayName ?? item.partner.nickname}</span>
                  <span className="mt-1 block text-xs opacity-75">{tr('Фото: {count}', { count: item.photoCount })}</span>
                </button>
              ))}
            </div>
            {selected && archive && <section className="mt-8">
              <h2 className="text-xl font-semibold">{tr('История с {name}', { name: selected.partner.displayName ?? selected.partner.nickname })}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr('С {start} по {end}', { start: formatDate(selected.startedAt), end: formatDate(selected.endedAt) })}</p>
              <div className="mt-6 space-y-8">{archive.days.map((day) => <div key={day.date}>
                <h3 className="mb-3 flex items-center gap-2 font-medium"><CalendarDays size={17} />{formatDate(day.date)}</h3>
                <div className="grid gap-4 md:grid-cols-2">{[day.mine, day.partner].map((entry, index) => entry ? (
                  <button key={entry.id} type="button" onClick={() => setSelectedPhoto(entry)}
                    className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] text-left transition hover:border-[#d9949b]">
                    <div role="img" aria-label={tr('Фото дня: {name}', { name: entry.author.displayName ?? entry.author.nickname })}
                      className="aspect-[4/3] bg-cover bg-center" style={{ backgroundImage: `url("${entry.thumbnailUrl}")` }} />
                    <div className="p-4">
                      <p className="font-medium">{entry.author.displayName ?? entry.author.nickname}</p>
                      {entry.caption && <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{entry.caption}</p>}
                      <p className="mt-2 text-xs text-[var(--text-secondary)]">♥ {entry.heartCount}</p>
                    </div>
                  </button>
                ) : <div key={index} className="flex min-h-48 items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] text-sm text-[var(--text-secondary)]">{tr('Нет фотографии')}</div>)}</div>
              </div>)}</div>
            </section>}
          </>
        )}
      </div>
      {selectedPhoto && <DayBoardPhotoDialog entry={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
    </main>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(getIntlLocale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}
