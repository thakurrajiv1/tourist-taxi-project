import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { getEnquiries, UnauthorizedError } from '../../lib/adminApi';
import { buildWhatsAppLink } from '../../lib/whatsapp';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px', verticalAlign: 'top' };

export default function AdminEnquiriesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const data = await getEnquiries();
      setEnquiries(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace('/admin/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return null;

  return (
    <AdminLayout title="Enquiries">
      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        {loading && <p style={{ padding: 16 }}>Loading…</p>}
        {error && (
          <div className="error-banner" style={{ margin: 16 }}>
            {error}
          </div>
        )}
        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Message</th>
                <th style={th}>Page</th>
                <th style={th}>Received</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((eq) => (
                <tr key={eq.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={td}>{eq.name}</td>
                  <td style={td}>{eq.phone}</td>
                  <td style={td}>{eq.message || '—'}</td>
                  <td style={td}>{eq.source_page || '—'}</td>
                  <td style={td}>{new Date(eq.created_at).toLocaleString('en-IN')}</td>
                  <td style={td}>
                    <a
                      href={buildWhatsAppLink(`Hi ${eq.name}, thanks for reaching out to Roaming Route!`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Reply on WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
              {enquiries.length === 0 && (
                <tr>
                  <td style={td} colSpan={6}>
                    No enquiries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
