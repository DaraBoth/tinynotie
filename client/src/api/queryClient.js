import { QueryClient } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 5, // Cache data for 5 minutes
      staleTime: 1000 * 60 * 1, // Data is considered stale after 1 minute
      refetchOnWindowFocus: true, // Disable refetching on window focus
    },
  },
});

export default queryClient;
