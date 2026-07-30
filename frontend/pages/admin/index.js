import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getToken } from '../../lib/auth';

export default function AdminIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? '/admin/bookings' : '/admin/login');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return null;
}
