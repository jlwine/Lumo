'use client';

import {
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

type LumoMarkProps = {
  size?: number;
  className?: string;
};

type LumoBrandProps = {
  markSize?: number;
  showTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export function LumoMark({
  size = 44,
  className = '',
}: LumoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient
          id="lumo-moon-gradient"
          x1="12"
          y1="14"
          x2="82"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#FFF1D9"
          />

          <stop
            offset="0.42"
            stopColor="#F7C8BE"
          />

          <stop
            offset="0.72"
            stopColor="#E7AAC2"
          />

          <stop
            offset="1"
            stopColor="#B89ACD"
          />
        </linearGradient>

        <linearGradient
          id="lumo-heart-gradient"
          x1="56"
          y1="51"
          x2="82"
          y2="76"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#F8AEB4"
          />

          <stop
            offset="1"
            stopColor="#D97991"
          />
        </linearGradient>

        <linearGradient
          id="lumo-star-gradient"
          x1="68"
          y1="22"
          x2="91"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#FFF1CF"
          />

          <stop
            offset="1"
            stopColor="#E5B8D4"
          />
        </linearGradient>

        <filter
          id="lumo-soft-glow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feGaussianBlur
            stdDeviation="2.2"
            result="blur"
          />

          <feMerge>
            <feMergeNode
              in="blur"
            />

            <feMergeNode
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
      </defs>

      {/*
       * Полумесяц.
       *
       * Вторая окружность вырезается
       * из основной через evenodd.
       */}
      <path
        d="
          M 50 4
          A 46 46 0 1 0 50 96
          A 46 46 0 1 0 50 4
          Z

          M 63 17
          A 33 33 0 1 1 63 83
          A 33 33 0 1 1 63 17
          Z
        "
        fill="url(#lumo-moon-gradient)"
        fillRule="evenodd"
        clipRule="evenodd"
        filter="url(#lumo-soft-glow)"
      />

      {/*
       * Сердце внутри полумесяца.
       */}
      <path
        d="
          M 72 75
          C 69 72 56 64 56 56
          C 56 51 60 47 65 47
          C 69 47 72 49 74 53
          C 76 49 79 47 83 47
          C 88 47 92 51 92 56
          C 92 64 79 72 76 75
          L 74 77
          Z
        "
        fill="url(#lumo-heart-gradient)"
        filter="url(#lumo-soft-glow)"
      />

      {/*
       * Большая искра.
       */}
      <path
        d="
          M 75 20
          C 76.5 27 79 29.5 86 31
          C 79 32.5 76.5 35 75 42
          C 73.5 35 71 32.5 64 31
          C 71 29.5 73.5 27 75 20
          Z
        "
        fill="url(#lumo-star-gradient)"
      />

      {/*
       * Маленькая искра.
       */}
      <path
        d="
          M 88 36
          C 89 40 90.5 41.5 94.5 42.5
          C 90.5 43.5 89 45 88 49
          C 87 45 85.5 43.5 81.5 42.5
          C 85.5 41.5 87 40 88 36
          Z
        "
        fill="#F0C5D5"
      />
    </svg>
  );
}

export function LumoBrand({
  markSize = 44,
  showTagline = false,
  className = '',
  wordmarkClassName = '',
}: LumoBrandProps) {
  useLanguageVersion();

  return (
    <div
      aria-label="Lumo"
      className={[
        'flex items-center gap-3',
        className,
      ].join(
        ' ',
      )}
    >
      <LumoMark
        size={markSize}
        className="shrink-0"
      />

      <div className="min-w-0">

        <div
          className={[
            'leading-none font-semibold tracking-[-0.045em] text-[#5f4d68] dark:text-[#f1e7f3]',
            wordmarkClassName ||
              'text-[25px]',
          ].join(
            ' ',
          )}
        >
          Lumo
        </div>

        {showTagline && (
          <div className="mt-1 whitespace-nowrap text-[10px] tracking-[0.01em] text-[#b29e98] dark:text-[#b6a2aa]">
            {tr(
              'пространство для двоих',
            )}
          </div>
        )}

      </div>

    </div>
  );
}