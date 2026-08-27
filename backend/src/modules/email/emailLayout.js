const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://roamingroute.in';

const COLOR_PRIMARY = '#1f4a38';
const COLOR_PRIMARY_DARK = '#12291f';
const COLOR_ACCENT = '#d9a234';
const COLOR_BG = '#eff1ea';
const COLOR_TEXT = '#16241d';
const COLOR_TEXT_MUTED = '#52655b';
const COLOR_BORDER = '#dcded2';

/**
 * Wraps body content in the branded email shell: header banner image,
 * brand bar, content area, footer. Table-based layout throughout (not
 * flexbox/grid) because Outlook desktop's rendering engine is Word, not
 * a browser, and only reliably supports table layouts. Inline styles on
 * every element for the same reason — many clients strip <style> blocks.
 *
 * The header banner references an image on your own domain
 * (frontend/public/images/email/header.jpg) rather than any hotlinked or
 * AI-generated image — same reasoning as the site's destination photos:
 * you control the license and the file never disappears out from under
 * the template. See frontend/public/images/email/README.md for sourcing
 * guidance.
 */
function buildLayout({ preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Roaming Route</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  body, table, td, a { font-family: 'Poppins', Arial, Helvetica, sans-serif; }
  body { margin: 0; padding: 0; background-color: ${COLOR_BG}; -webkit-text-size-adjust: 100%; }
  img { border: 0; display: block; }
  a { text-decoration: none; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .px-mobile { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${COLOR_BG};">
  <div class="preheader">${preheader || ''}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_BG};padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 14px rgba(18,41,31,0.10);">

          <tr>
            <td style="background-color:${COLOR_PRIMARY};">
              <img src="${SITE_URL}/images/email/header.jpg" width="600" alt="Roaming Route — North India Outstation Taxi &amp; Tours" style="width:100%;max-width:600px;height:auto;display:block;">
            </td>
          </tr>

          <tr>
            <td style="background-color:${COLOR_PRIMARY};padding:18px 32px;text-align:center;">
              <span style="font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:0.6px;text-transform:uppercase;">Roaming Route</span>
            </td>
          </tr>

          <tr>
            <td class="px-mobile" style="padding:36px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color:${COLOR_PRIMARY_DARK};padding:26px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#ffffff;">Roaming Route Travel and Transport</p>
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a9bdb0;">
                <a href="mailto:contactus@roamingroute.in" style="color:#a9bdb0;">contactus@roamingroute.in</a>
                &nbsp;&middot;&nbsp;
                <a href="${SITE_URL}" style="color:#a9bdb0;">roamingroute.in</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b7d6f;">You're receiving this because you made a booking with Roaming Route.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${COLOR_ACCENT};">
        <a href="${url}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${COLOR_PRIMARY_DARK};">${text}</a>
      </td>
    </tr>
  </table>`;
}

function referenceBox(reference) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_BG};border-radius:10px;margin:20px 0;">
    <tr>
      <td style="padding:18px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLOR_TEXT_MUTED};">Your Booking Reference</p>
        <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:700;letter-spacing:2px;color:${COLOR_PRIMARY};">${reference}</p>
      </td>
    </tr>
  </table>`;
}

function detailRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${COLOR_BORDER};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLOR_TEXT_MUTED};width:40%;">${label}</td>
    <td style="padding:9px 0;border-bottom:1px solid ${COLOR_BORDER};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${COLOR_TEXT};text-align:right;">${value}</td>
  </tr>`;
}

function detailTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    ${rows.join('')}
  </table>`;
}

function infoBox({ title, rows, accentColor }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1.5px solid ${accentColor || COLOR_ACCENT};border-radius:10px;margin:20px 0;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${accentColor || COLOR_ACCENT};">${title}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows.join('')}
        </table>
      </td>
    </tr>
  </table>`;
}

function infoRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${COLOR_TEXT_MUTED};width:36%;">${label}</td>
    <td style="padding:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${COLOR_TEXT};">${value}</td>
  </tr>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;color:${COLOR_PRIMARY};">${text}</h1>`;
}

function paragraph(text) {
  return `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${COLOR_TEXT};">${text}</p>`;
}

function mutedParagraph(text) {
  return `<p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${COLOR_TEXT_MUTED};">${text}</p>`;
}

module.exports = {
  SITE_URL,
  COLOR_PRIMARY,
  COLOR_ACCENT,
  buildLayout,
  ctaButton,
  referenceBox,
  detailRow,
  detailTable,
  infoBox,
  infoRow,
  heading,
  paragraph,
  mutedParagraph,
};
