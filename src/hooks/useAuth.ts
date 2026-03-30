import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  email: string;
  student_name: string;
  current_belt: string;
  class_group: string;
  is_sensei: boolean;
  created_at: string;
  updated_at: string;
}

export default function useAuth() {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) return null as unknown as User;
        throw new Error('Failed to fetch auth');
      }
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  return { user: user ?? null, isLoading, isError };
}
