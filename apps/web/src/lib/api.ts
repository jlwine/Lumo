const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

type ApiErrorResponse = {
  message?: string | string[];
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;

    let message =
      'Произошла ошибка при обращении к серверу';

    if (Array.isArray(errorData.message)) {
      message = errorData.message.join(', ');
    } else if (errorData.message) {
      message = errorData.message;
    }

    throw new Error(message);
  }

  return data as T;
}