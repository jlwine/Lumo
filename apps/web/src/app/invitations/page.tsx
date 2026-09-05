'use client';

import {
  getIntlLocale,
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Send,
  Trash2,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  ReceivedRelationshipInvitation,
  RelationshipInvitationsResponse,
  SentRelationshipInvitation,
} from '@/types/relationship-invitation';

export default function InvitationsPage() {
  useLanguageVersion();

  const router = useRouter();

  const [invitations, setInvitations] =
    useState<RelationshipInvitationsResponse>({
      received: [],
      sent: [],
    });

  const [isLoading, setIsLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [
    selectedInvitation,
    setSelectedInvitation,
  ] =
    useState<ReceivedRelationshipInvitation | null>(
      null,
    );

  const [startedAt, setStartedAt] =
    useState('');

  const fetchInvitations = useCallback(
    async () => {
      const token = getAccessToken();

      if (!token) {
        router.replace('/login');
        return null;
      }

      return apiRequest<RelationshipInvitationsResponse>(
        '/relationships/invitations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInvitations() {
      try {
        const result =
          await fetchInvitations();

        if (!cancelled && result) {
          setInvitations(result);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            tr('Не удалось загрузить приглашения'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvitations();

    return () => {
      cancelled = true;
    };
  }, [fetchInvitations]);

  async function refreshInvitations() {
    const result =
      await fetchInvitations();

    if (result) {
      setInvitations(result);
    }
  }

  function openAcceptDialog(
    invitation: ReceivedRelationshipInvitation,
  ) {
    setSelectedInvitation(invitation);

    setStartedAt(
      new Date()
        .toISOString()
        .slice(0, 10),
    );
  }

  function closeAcceptDialog() {
    setSelectedInvitation(null);
    setStartedAt('');
  }

  async function acceptInvitation() {
    if (!selectedInvitation) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace('/login');
      return;
    }

    try {
      setProcessingId(
        selectedInvitation.id,
      );

      setError(null);

      await apiRequest(
        `/relationships/invitations/${selectedInvitation.id}/accept`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            startedAt:
              `${startedAt}T00:00:00.000Z`,
          }),
        },
      );

      closeAcceptDialog();

      router.push('/home');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          tr('Не удалось принять приглашение'),
        );
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function declineInvitation(
    invitationId: string,
  ) {
    const token = getAccessToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      setProcessingId(invitationId);
      setError(null);

      await apiRequest(
        `/relationships/invitations/${invitationId}/decline`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      await refreshInvitations();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function cancelInvitation(
    invitationId: string,
  ) {
    const token = getAccessToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      setProcessingId(invitationId);
      setError(null);

      await apiRequest(
        `/relationships/invitations/${invitationId}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      await refreshInvitations();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <Heart
          size={36}
          className="animate-pulse text-[#d98a92]"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-5 py-8">
      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.push('/home')
          }
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#876f6a] transition hover:bg-[#fff0ed]"
        >
          <ArrowLeft size={18} />{tr('На главную')}</button>

        <header className="mb-8">
          <p className="text-sm font-medium text-[#ca747c]">{tr('♡ Отношения')}</p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">{tr('Приглашения')}</h1>

          <p className="mt-3 text-[#98837e]">{tr('Здесь можно принять, отклонить или отменить приглашение в отношения.')}</p>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm text-[#a95057]">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-[28px] border border-[#eedfdb] bg-white p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#c36f77]">{tr('Входящие')}</p>

                <h2 className="mt-1 text-xl font-semibold text-[#554442]">{tr('Вас приглашают')}</h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fae3e5] text-[#c36f77]">
                <Heart size={21} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {invitations.received.length ===
                0 && (
                <EmptyState text={tr('Новых приглашений пока нет')} />
              )}

              {invitations.received.map(
                (invitation) => (
                  <ReceivedInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    processing={
                      processingId ===
                      invitation.id
                    }
                    onAccept={() =>
                      openAcceptDialog(
                        invitation,
                      )
                    }
                    onDecline={() =>
                      void declineInvitation(
                        invitation.id,
                      )
                    }
                  />
                ),
              )}
            </div>

          </div>

          <div className="rounded-[28px] border border-[#eedfdb] bg-white p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#84739a]">{tr('Исходящие')}</p>

                <h2 className="mt-1 text-xl font-semibold text-[#554442]">{tr('Вы пригласили')}</h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eee8f5] text-[#84739a]">
                <Send size={20} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {invitations.sent.length ===
                0 && (
                <EmptyState text={tr('Отправленных приглашений нет')} />
              )}

              {invitations.sent.map(
                (invitation) => (
                  <SentInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    processing={
                      processingId ===
                      invitation.id
                    }
                    onCancel={() =>
                      void cancelInvitation(
                        invitation.id,
                      )
                    }
                  />
                ),
              )}
            </div>

          </div>

        </section>
      </div>

      {selectedInvitation && (
        <AcceptDialog
          invitation={
            selectedInvitation
          }
          startedAt={startedAt}
          setStartedAt={
            setStartedAt
          }
          processing={
            processingId ===
            selectedInvitation.id
          }
          onClose={
            closeAcceptDialog
          }
          onAccept={() =>
            void acceptInvitation()
          }
        />
      )}
    </main>
  );
}

function ReceivedInvitationCard({
  invitation,
  processing,
  onAccept,
  onDecline,
}: {
  invitation: ReceivedRelationshipInvitation;
  processing: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name =
    invitation.sender.displayName ??
    invitation.sender.nickname;

  return (
    <article className="rounded-[22px] border border-[#f0e2de] bg-[#fffaf9] p-5">

      <Avatar
        name={name}
        avatarUrl={
          invitation.sender.avatarUrl
        }
      />

      <p className="mt-4 font-semibold text-[#554442]">
        {name}
      </p>

      <p className="text-sm text-[#9e8984]">
        @{invitation.sender.nickname}
      </p>

      <p className="mt-4 text-sm leading-6 text-[#806b67]">{tr('Хочет создать с вами общее пространство ♡')}</p>

      <div className="mt-5 flex gap-3">

        <button
          type="button"
          disabled={processing}
          onClick={onAccept}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#df8e94] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#d57a82] disabled:opacity-50"
        >
          <Check size={17} />{tr('Принять')}</button>

        <button
          type="button"
          disabled={processing}
          onClick={onDecline}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#eadbd7] px-4 py-2.5 text-sm text-[#866f6a] transition hover:bg-[#fff1ef] disabled:opacity-50"
        >
          <X size={17} />{tr('Отклонить')}</button>

      </div>
    </article>
  );
}

function SentInvitationCard({
  invitation,
  processing,
  onCancel,
}: {
  invitation: SentRelationshipInvitation;
  processing: boolean;
  onCancel: () => void;
}) {
  const name =
    invitation.receiver.displayName ??
    invitation.receiver.nickname;

  return (
    <article className="rounded-[22px] border border-[#f0e2de] bg-[#fffaf9] p-5">

      <div className="flex items-center gap-3">

        <Avatar
          name={name}
          avatarUrl={
            invitation.receiver.avatarUrl
          }
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#554442]">
            {name}
          </p>

          <p className="truncate text-sm text-[#9e8984]">
            @{invitation.receiver.nickname}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#ae9994]">
          <Clock size={14} />{tr('Ожидает')}</div>

      </div>

      <button
        type="button"
        disabled={processing}
        onClick={onCancel}
        className="mt-5 flex items-center gap-2 text-sm text-[#aa7776] transition hover:text-[#cf676c] disabled:opacity-50"
      >
        <Trash2 size={16} />{tr('Отменить приглашение')}</button>

    </article>
  );
}

function AcceptDialog({
  invitation,
  startedAt,
  setStartedAt,
  processing,
  onClose,
  onAccept,
}: {
  invitation: ReceivedRelationshipInvitation;
  startedAt: string;
  setStartedAt: (
    value: string,
  ) => void;
  processing: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const name =
    invitation.sender.displayName ??
    invitation.sender.nickname;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4f403e]/25 p-5 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-[28px] border border-[#eadbd7] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.20)]">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-medium text-[#ca747c]">{tr('♡ Начало истории')}</p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {tr('Вы и {name}', { name })}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9a8580] hover:bg-[#fff1ef]"
          >
            <X size={19} />
          </button>

        </div>

        <p className="mt-4 text-sm leading-6 text-[#8f7974]">{tr('Укажите день начала ваших отношений.')}</p>

        <div className="mt-6">

          <label
            htmlFor="startedAt"
            className="mb-2 block text-sm font-medium text-[#665451]"
          >{tr('Дата начала отношений')}</label>

          <div className="relative">

            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c09292]"
            />

            <input
              id="startedAt"
              type="date"
              value={startedAt}
              max={
                new Date()
                  .toISOString()
                  .slice(0, 10)
              }
              onChange={(event) =>
                setStartedAt(
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] py-3.5 pl-11 pr-4 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>
        </div>

        <button
          type="button"
          disabled={
            processing ||
            !startedAt
          }
          onClick={onAccept}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3.5 font-medium text-white transition hover:bg-[#d57a82] disabled:opacity-50"
        >
          <Heart size={18} />

          {processing
            ? tr('Создаём пространство...')
            : tr('Начать отношения')}
        </button>

      </div>
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initial =
    name.charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={tr('Аватар {name}', { name })}
        className="h-11 w-11 shrink-0 rounded-full bg-cover bg-center"
        style={{
          backgroundImage:
            `url("${avatarUrl}")`,
        }}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7dfe1] font-semibold text-[#b76870]">
      {initial}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-5 py-10 text-center text-sm text-[#a48f89]">
      {text}
    </div>
  );
}