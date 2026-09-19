'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';
import type { DayBoardEntry } from '@/types/day-board';

export function DayBoardPhotoDialog({
  entry,
  onClose,
}: {
  entry: DayBoardEntry;
  onClose: () => void;
}) {
  useLanguageVersion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const authorName = entry.author.displayName ?? entry.author.nickname;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={tr('Фото дня: {name}', { name: authorName })}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        const { left, right, top, bottom } =
          event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < left || event.clientX > right ||
          event.clientY < top || event.clientY > bottom
        ) {
          onClose();
        }
      }}
      className="m-auto max-h-[92dvh] w-[calc(100vw-24px)] max-w-[960px] overflow-y-auto rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--text-primary)] shadow-2xl backdrop:bg-[#181314]/85"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="min-w-0 truncate font-semibold">{authorName}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={tr('Закрыть фотографию')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-[var(--surface-soft)]"
        >
          <X size={20} />
        </button>
      </div>
      <div
        role="img"
        aria-label={tr('Фото дня: {name}', { name: authorName })}
        className="h-[min(65dvh,720px)] min-h-[240px] w-full bg-[#181314] bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${entry.imageUrl}")` }}
      />
      {entry.caption && (
        <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-[var(--text-secondary)]">
          {entry.caption}
        </p>
      )}
    </dialog>
  );
}
