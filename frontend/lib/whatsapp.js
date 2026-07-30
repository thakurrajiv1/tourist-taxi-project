const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '910000000000';

/**
 * Builds a wa.me deep link that opens WhatsApp with the message pre-filled.
 * Works with zero WhatsApp Business API setup — just a real WhatsApp chat,
 * ready for the customer or your ops team to send.
 */
export function buildWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export default WHATSAPP_NUMBER;
