import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
    },
  },
});

queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
    throwOnError: false,
  },
});

// Listen for 401 responses and redirect to login
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error') {
    const error = event.action.error as { status?: number };
    if (error?.status === 401) {
      window.location.href = '/';
    }
  }
});

export async function apiRequest(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? body.error ?? response.statusText);
  }

  return response;
}

export default queryClient;
