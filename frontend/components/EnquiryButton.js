import { useState } from 'react';
import { useRouter } from 'next/router';
import { createEnquiry } from '../lib/api';
import { buildWhatsAppLink } from '../lib/whatsapp';

export default function EnquiryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      // Save the lead first, so it's captured even if the customer closes
      // WhatsApp before sending — this is the "not just a link" part.
      await createEnquiry({
        name,
        phone,
        message: message || undefined,
        source_page: router.asPath,
      });

      const whatsappMessage =
        `Hi, I'm ${name}. ${message ? message : "I'd like to know more about booking a taxi."}`;
      window.open(buildWhatsAppLink(whatsappMessage), '_blank', 'noopener,noreferrer');

      setOpen(false);
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Enquire on WhatsApp"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: '#25D366',
          border: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          fontSize: 26,
          cursor: 'pointer',
          zIndex: 40,
        }}
      >
        💬
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 44, 82, 0.45)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 24,
            zIndex: 50,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            style={{ width: 320, marginBottom: 74 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>Quick Enquiry</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              We'll open WhatsApp with your message ready to send.
            </p>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="eqName">Name</label>
                <input id="eqName" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eqPhone">Phone</label>
                <input id="eqPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="eqMessage">Message (optional)</label>
                <input
                  id="eqMessage"
                  placeholder="e.g. Need a cab from Delhi to Manali"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Sending…' : 'Chat on WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
