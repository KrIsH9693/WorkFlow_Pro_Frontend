import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes tak data ko "fresh" consider karega (no extra API calls)
      gcTime: 1000 * 60 * 30,    // 30 minutes tak cache memory me rakhega
      refetchOnWindowFocus: false, // Tab switch karne par faltu API hit na ho
      retry: 1,                  // API fail hone par max 1 retry karega
    },
  },
});