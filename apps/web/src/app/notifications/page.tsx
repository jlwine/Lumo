'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import type { AppNotification, NotificationPreferences, NotificationsResponse } from '@/types/notification';

const categoryOptions: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'relationship', label: 'Приглашения и отношения' },
  { key: 'calendar', label: 'Совместный календарь' },
  { key: 'dayBoard', label: 'Доска дня' },
];

export default function NotificationsPage() {
  useLanguageVersion();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const headers = authHeaders();
      if (!headers) return;
      try {
        const [notifications, settings] = await Promise.all([
          apiRequest<NotificationsResponse>('/notifications', { headers }),
          apiRequest<NotificationPreferences>('/notifications/preferences', { headers }),
        ]);
        if (!cancelled) {
          setItems(notifications.items);
          setUnreadCount(notifications.unreadCount);
          setPreferences(settings);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : tr('Не удалось загрузить данные'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [authHeaders]);

  async function openNotification(item: AppNotification) {
    if (busy) return;
    if (!item.readAt) {
      const headers = authHeaders();
      if (!headers) return;
      setBusy(true);
      try {
        await apiRequest(`/notifications/${item.id}/read`, { method: 'POST', headers });
        setItems((current) => current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, readAt: new Date().toISOString() } : candidate,
        ));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : tr('Не удалось сохранить изменения'));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    if (item.href?.startsWith('/') && !item.href.startsWith('//')) router.push(item.href);
  }

  async function markAllRead() {
    const headers = authHeaders();
    if (!headers || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/notifications/read-all', { method: 'POST', headers });
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
      setUnreadCount(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tr('Не удалось сохранить изменения'));
    } finally {
      setBusy(false);
    }
  }

  async function togglePreference(key: keyof NotificationPreferences) {
    const headers = authHeaders();
    if (!headers || !preferences || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await apiRequest<NotificationPreferences>('/notifications/preferences', {
        method: 'PATCH', headers,
        body: JSON.stringify({ [key]: !preferences[key] }),
      });
      setPreferences(updated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : tr('Не удалось сохранить изменения'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[color:var(--text-primary)] md:px-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => router.push('/home')} className="mb-7 inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">
          <ArrowLeft size={18} />{tr('На главную')}
        </button>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#c8757c]"><Bell size={17} />{tr('Ваши события')}</div>
            <h1 className="text-3xl font-semibold">{tr('Уведомления')}</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{tr('Новые моменты и изменения в вашем общем пространстве.')}</p>
          </div>
          {unreadCount > 0 && <button type="button" disabled={busy} onClick={() => void markAllRead()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--surface-soft)] disabled:opacity-50"><CheckCheck size={16} />{tr('Прочитать все')}</button>}
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[#c8757c]">{error}</p>}
        <section aria-label={tr('Список уведомлений')} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
          {loading ? <p className="p-6 text-sm text-[color:var(--text-secondary)]">{tr('Загрузка...')}</p> : items.length === 0 ? <p className="p-6 text-sm text-[color:var(--text-secondary)]">{tr('Уведомлений пока нет')}</p> : items.map((item) => (
            <button key={item.id} type="button" onClick={() => void openNotification(item)} disabled={busy} className="flex w-full items-start gap-3 border-b border-[var(--border-soft)] px-5 py-4 text-left last:border-0 hover:bg-[var(--surface-soft)] disabled:opacity-60">
              <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? 'bg-transparent' : 'bg-[#d9777f]'}`} />
              <span className="min-w-0 flex-1"><span className="block font-semibold">{tr(item.title)}</span><span className="mt-1 block text-sm text-[color:var(--text-secondary)]">{tr(item.body)}</span><span className="mt-2 block text-xs text-[color:var(--text-secondary)]">{new Date(item.createdAt).toLocaleString()}</span></span>
              {item.href && <ChevronRight size={18} className="mt-1 shrink-0 text-[color:var(--text-secondary)]" />}
            </button>
          ))}
        </section>
        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-semibold">{tr('Какие уведомления получать')}</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{tr('Выберите темы, о которых хотите узнавать.')}</p>
          <div className="mt-4 divide-y divide-[var(--border-soft)]">
            {categoryOptions.map(({ key, label }) => <label key={key} className="flex cursor-pointer items-center justify-between gap-3 py-3 text-sm"><span>{tr(label)}</span><input type="checkbox" checked={preferences?.[key] ?? false} disabled={!preferences || busy} onChange={() => void togglePreference(key)} className="h-5 w-5 accent-[#d9777f]" /></label>)}
          </div>
        </section>
      </div>
    </main>
  );
}
