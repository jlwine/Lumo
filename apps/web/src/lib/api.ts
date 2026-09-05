import { tr } from '@/i18n/core';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

type ApiErrorResponse = {
  message?:
    | string
    | string[];
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers =
    new Headers(
      options.headers,
    );

  /*
   * Для FormData браузер сам
   * должен выставить Content-Type
   * вместе с boundary.
   */
  const isFormData =
    options.body instanceof
    FormData;

  if (
    !isFormData &&
    !headers.has(
      'Content-Type',
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      },
    );

  const contentType =
    response.headers.get(
      'content-type',
    );

  let data: unknown =
    null;

  if (
    contentType?.includes(
      'application/json',
    )
  ) {
    data =
      await response.json();
  } else {
    const text =
      await response.text();

    data =
      text || null;
  }

  if (!response.ok) {
    const errorData =
      data as ApiErrorResponse;

    let message =
      tr('Произошла ошибка при обращении к серверу');

    if (
      Array.isArray(
        errorData?.message,
      )
    ) {
      message =
        errorData.message
          .map((item) => tr(item))
          .join(', ');
    } else if (
      errorData?.message
    ) {
      message =
        tr(errorData.message);
    }

    throw new Error(
      message,
    );
  }

  return data as T;
}