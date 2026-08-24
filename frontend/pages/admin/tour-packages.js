import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import {
  getTourPackagesAdmin, getTourPackageAdmin, createTourPackage, updateTourPackage, deactivateTourPackage,
  UnauthorizedError,
} from '../../lib/adminApi';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

function emptyDay(dayNumber) {
  return { day_number: dayNumber, title: '', description: '' };
}

const emptyForm = {
  title: '', slug: '', description: '', price: '', coverImageUrl: '',
  inclusionsText: '', exclusionsText: '', itinerary: [emptyDay(1)],
};

export default function AdminTourPackagesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      setPackages(await getTourPackagesAdmin());
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready) loadData(); }, [ready]);

  function updateDay(index, field, value) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    }));
  }

  function addDay() {
    setForm((prev) => ({ ...prev, itinerary: [...prev.itinerary, emptyDay(prev.itinerary.length + 1)] }));
  }

  function removeDay(index) {
    setForm((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day_number: i + 1 })),
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  async function startEdit(pkg) {
    setLoadingEdit(true);
    setFormError('');
    try {
      const full = await getTourPackageAdmin(pkg.id);
      setEditingId(full.id);
      setForm({
        title: full.title || '',
        slug: full.slug || '',
        description: full.description || '',
        price: full.price || '',
        coverImageUrl: full.cover_image_url || '',
        inclusionsText: (full.inclusions || []).join(', '),
        exclusionsText: (full.exclusions || []).join(', '),
        itinerary: full.itinerary && full.itinerary.length > 0 ? full.itinerary : [emptyDay(1)],
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setFormError(err.message);
    } finally {
      setLoadingEdit(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim() || !form.slug.trim() || !form.price) {
      setFormError('Title, slug, and price are required.');
      return;
    }
    if (form.itinerary.some((d) => !d.title.trim())) {
      setFormError('Every itinerary day needs at least a title.');
      return;
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description || undefined,
      duration_days: form.itinerary.length,
      price: form.price,
      cover_image_url: form.coverImageUrl || undefined,
      inclusions: form.inclusionsText ? form.inclusionsText.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      exclusions: form.exclusionsText ? form.exclusionsText.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      itinerary: form.itinerary,
    };

    setSubmitting(true);
    try {
      if (editingId) await updateTourPackage(editingId, payload);
      else await createTourPackage(payload);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(pkg) {
    if (pkg.is_active && !window.confirm(`Deactivate "${pkg.title}"? It will disappear from the public site.`)) return;
    setRowBusyId(pkg.id);
    try {
      if (pkg.is_active) await deactivateTourPackage(pkg.id);
      else await updateTourPackage(pkg.id, { is_active: true });
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setError(err.message);
    } finally {
      setRowBusyId(null);
    }
  }

  if (!ready) return null;

  return (
    <AdminLayout title="Tour Packages">
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>{editingId ? 'Edit Tour Package' : 'Add Tour Package'}</h3>
          {loadingEdit && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading package…</p>}
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="ptitle">Title</label>
            <input id="ptitle" placeholder="Golden Triangle Tour" value={form.title} onChange={(e) => setField('title', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pslug">Slug</label>
            <input id="pslug" placeholder="golden-triangle-tour" value={form.slug} onChange={(e) => setField('slug', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pdesc">Description</label>
            <input id="pdesc" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pprice">Price (₹)</label>
            <input id="pprice" type="number" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pimg">Cover Image URL (optional)</label>
            <input id="pimg" placeholder="/images/packages/golden-triangle.jpg" value={form.coverImageUrl} onChange={(e) => setField('coverImageUrl', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pinc">Inclusions (comma-separated)</label>
            <input id="pinc" placeholder="Hotel stay, Breakfast, All transfers" value={form.inclusionsText} onChange={(e) => setField('inclusionsText', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pexc">Exclusions (comma-separated)</label>
            <input id="pexc" placeholder="Flights, Personal expenses" value={form.exclusionsText} onChange={(e) => setField('exclusionsText', e.target.value)} />
          </div>

          <div className="field">
            <label>Itinerary ({form.itinerary.length} day{form.itinerary.length !== 1 ? 's' : ''})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.itinerary.map((day, index) => (
                <div key={index} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: 13 }}>Day {day.day_number}</strong>
                    {form.itinerary.length > 1 && (
                      <button type="button" onClick={() => removeDay(index)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: 12, cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Day title, e.g. Arrive in Delhi"
                    value={day.title}
                    onChange={(e) => updateDay(index, 'title', e.target.value)}
                    style={{ width: '100%', marginBottom: 6, padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13 }}
                  />
                  <textarea
                    placeholder="Day description"
                    value={day.description}
                    onChange={(e) => updateDay(index, 'description', e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={addDay} className="btn btn-secondary" style={{ marginTop: 8, fontSize: 13, padding: '8px 14px' }}>
              + Add Day
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? 'Saving…' : editingId ? 'Update Package' : 'Create Package'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
              Cancel Edit
            </button>
          )}
        </form>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {loading && <p style={{ padding: 16 }}>Loading…</p>}
          {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                  <th style={th}>Title</th>
                  <th style={th}>Slug</th>
                  <th style={th}>Days</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)', opacity: p.is_active ? 1 : 0.55 }}>
                    <td style={td}>{p.title}</td>
                    <td style={td}>{p.slug}</td>
                    <td style={td}>{p.duration_days}</td>
                    <td style={td}>₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                    <td style={td}><span className="badge">{p.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(p)}>Edit</button>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12, background: p.is_active ? '#fdecea' : '#e9f7ef', color: p.is_active ? 'var(--color-error)' : 'var(--color-success)' }}
                          onClick={() => handleToggleActive(p)}
                          disabled={rowBusyId === p.id}
                        >
                          {rowBusyId === p.id ? '…' : p.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {packages.length === 0 && <tr><td style={td} colSpan={6}>No tour packages yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
