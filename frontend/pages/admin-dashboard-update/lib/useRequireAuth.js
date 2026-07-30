import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getToken } from './auth';

/**
 * Call at the top of any admin page. Returns true once it's safe to render
 * (a token exists) — until then it redirects to /admin/login and renders
 * nothing, so protected content never flashes on screen for a logged-out
 * visitor.
 */
export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login');
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return ready;
}
