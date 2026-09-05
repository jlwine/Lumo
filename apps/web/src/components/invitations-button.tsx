'use client';

import {
  useEffect,
  useState,
} from 'react';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';

import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

import type {
  RelationshipInvitationsResponse,
} from '@/types/relationship-invitation';

export function InvitationsButton() {
  useLanguageVersion();

  const router = useRouter();

  const [count, setCount] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadInvitations() {
      const token =
        getAccessToken();

      if (!token) {
        return;
      }

      try {
        const result =
          await apiRequest<RelationshipInvitationsResponse>(
            '/relationships/invitations',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!cancelled) {
          setCount(
            result.received.length,
          );
        }
      } catch {
        // Счётчик не критичен для работы страницы.
      }
    }

    void loadInvitations();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      title={tr('Приглашения')}
      onClick={() =>
        router.push('/invitations')
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#927c77] transition hover:bg-[#fff0ef] hover:text-[#c66f77]"
    >
      <Bell size={20} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#d9777f] px-1 text-[11px] font-semibold text-white">
          {count > 9
            ? '9+'
            : count}
        </span>
      )}
    </button>
  );
}