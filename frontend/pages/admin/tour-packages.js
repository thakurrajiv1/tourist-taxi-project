import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { createTourPackage, UnauthorizedError } from '../../lib/adminApi';
import { getTourPackages } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

function emptyDay(dayNumber) {
  return { day_number: dayNumber, title: '', description: '' };
}

export default function AdminTourPackagesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [inclusionsText, setInclusionsText] = useState('');
  const [exclusionsText, setExclusionsText] = useState('');
  const [itinerary, setItinerary] = useState([emptyDay(1)]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const data = await getTourPackages();
      setPackages(data);
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

  function updateDay(index, field, value) {
    setItinerary((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  function addDay() {
    setItinerary((prev) => [...prev, emptyDay(prev.length + 1)]);
  }

  function removeDay(index) {
    setItinerary((prev) =>
      prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, day_number: i + 1 }))
    );
  }

  function resetForm() {
    setTitle('');
    setSlug('');
    setDescription('');
    setPrice('');
    setCoverImageUrl('');
    setInclusionsText('');
    setExclusionsText('');
    setItinerary([emptyDay(1)]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !slug.trim() || !price) {
      setFormError('Title, slug, and price are required.');
      return;
    }
    if (itinerary.some((d) => !d.title.trim())) {
      setFormError('Every itinerary day needs at least a title.');
      return;
    }

    setSubmitting(true);
    try {
      await createTourPackage({
        title,
        slug,
        description: description || undefined,
        duration_days: itinerary.length,
        price,
        cover_image_url: coverImageUrl || undefined,
        inclusions: inclusionsText
          ? inclusionsText.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        exclusions: exclusionsText
          ? exclusionsText.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        itinerary,
      });
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace('/admin/login');
        return;
      }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <AdminLayout title="Tour Packages">
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add Tour Package</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="ptitle">Title</label>
            <input
              id="ptitle"
              placeholder="Golden Triangle Tour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pslug">Slug</label>
            <input
              id="pslug"
              placeholder="golden-triangle-tour"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pdesc">Description</label>
            <input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="pprice">Price (₹)</label>
            <input
              id="pprice"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pimg">Cover Image URL (optional)</label>
            <input id="pimg" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="pinc">Inclusions (comma-separated)</label>
            <input
              id="pinc"
              placeholder="Hotel stay, Breakfast, All transfers"
              value={inclusionsText}
              onChange={(e) => setInclusionsText(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pexc">Exclusions (comma-separated)</label>
            <input
              id="pexc"
              placeholder="Flights, Personal expenses"
              value={exclusionsText}
              onChange={(e) => setExclusionsText(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Itinerary ({itinerary.length} day{itinerary.length !== 1 ? 's' : ''})</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {itinerary.map((day, index) => (
                <div
                  key={index}
                  style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <strong style={{ fontSize: 13 }}>Day {day.day_number}</strong>
                    {itinerary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    placeholder="Day title, e.g. Arrive in Delhi"
                    value={day.title}
                    onChange={(e) => updateDay(index, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      marginBottom: 6,
                      padding: '8px 10px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  />
                  <textarea
                    placeholder="Day description"
                    value={day.description}
                    onChange={(e) => updateDay(index, 'description', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDay}
              className="btn btn-secondary"
              style={{ marginTop: 8, fontSize: 13, padding: '8px 14px' }}
            >
              + Add Day
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 12 }}>
            {submitting ? 'Creating…' : 'Create Package'}
          </button>
        </form>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
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
                  <th style={th}>Title</th>
                  <th style={th}>Slug</th>
                  <th style={th}>Days</th>
                  <th style={th}>Price</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>{p.title}</td>
                    <td style={td}>{p.slug}</td>
                    <td style={td}>{p.duration_days}</td>
                    <td style={td}>₹{parseFloat(p.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {packages.length === 0 && (
                  <tr>
                    <td style={td} colSpan={4}>
                      No tour packages yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
