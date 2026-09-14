import { useState } from 'react';
import { uploadImage } from '../../lib/adminApi';

/**
 * A drop-in replacement for manually typing a file path — picks a file,
 * uploads it to Cloudinary via the backend, and hands the resulting URL
 * back to the parent form via onUploaded. The parent still owns the
 * actual "coverImageUrl" field value, so pasting a URL directly still
 * works too (e.g. for someone who already has an image hosted
 * elsewhere) — this just adds a faster path for the common case.
 */
export default function ImageUploadField({ value, onUploaded, label = 'Cover Image' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const result = await uploadImage(file);
      onUploaded(result.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting the same file if needed
    }
  }

  return (
    <div className="field">
      <label>{label}</label>

      {value && (
        <div style={{ position: 'relative', marginBottom: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {/* Plain img, not next/image — this lives in the admin panel
              only, so the optimization pipeline isn't worth the extra
              config for external Cloudinary URLs here. */}
          <img src={value} alt="Preview" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '9px 14px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            cursor: uploading ? 'default' : 'pointer',
            background: uploading ? 'var(--color-bg)' : 'white',
            color: 'var(--color-text)',
          }}
        >
          {uploading ? 'Uploading…' : value ? 'Replace Photo' : 'Upload Photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onUploaded('')}
            style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: 12, cursor: 'pointer' }}
          >
            Remove
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 6 }}>{error}</div>}
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
        JPEG, PNG, or WEBP — up to 5MB. Or paste a URL directly below if you already have one hosted elsewhere.
      </p>
    </div>
  );
}
