// ============================================================
// WHATSAPP PROVIDER ADAPTER
// ============================================================

export interface WhatsAppProvider {
  sendMessage(to: string, message: string): Promise<{ messageId: string }>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendTemplate(to: string, templateName: string, params: string[]): Promise<{ messageId: string }>;
  verifyWebhook(token: string): boolean;
  parseInboundMessage(payload: unknown): InboundMessage | null;
}

export interface InboundMessage {
  from: string;
  messageId: string;
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  timestamp: number;
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, message: string) {
    console.log(`[MOCK WA] → ${to}: ${message.slice(0, 80)}...`);
    return { messageId: `mock_${Date.now()}` };
  }

  async sendImage(to: string, imageUrl: string, caption?: string) {
    console.log(`[MOCK WA IMAGE] → ${to}: ${imageUrl} | ${caption}`);
    return { messageId: `mock_img_${Date.now()}` };
  }

  async sendTemplate(to: string, templateName: string, params: string[]) {
    console.log(`[MOCK WA TEMPLATE] → ${to}: ${templateName}(${params.join(', ')})`);
    return { messageId: `mock_tpl_${Date.now()}` };
  }

  verifyWebhook(token: string) {
    return token === process.env.WHATSAPP_VERIFY_TOKEN;
  }

  parseInboundMessage(payload: unknown): InboundMessage | null {
    try {
      const body = payload as any;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message) return null;

      return {
        from: message.from,
        messageId: message.id,
        type: message.type,
        content: message.text?.body || '',
        timestamp: parseInt(message.timestamp),
      };
    } catch { return null; }
  }
}

class MetaWhatsAppProvider implements WhatsAppProvider {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  }

  private async post(body: object): Promise<{ messageId: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[WhatsApp Meta API Error] (${response.status}):`, err);
      throw new Error(`WhatsApp Meta API error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const messageId = data?.messages?.[0]?.id || `meta_${Date.now()}`;
    return { messageId };
  }

  async sendMessage(to: string, message: string) {
    const cleanTo = to.replace(/[^0-9]/g, '');
    return this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: { preview_url: false, body: message },
    });
  }

  async sendImage(to: string, imageUrl: string, caption?: string) {
    const cleanTo = to.replace(/[^0-9]/g, '');
    return this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'image',
      image: { link: imageUrl, caption: caption || '' },
    });
  }

  async sendTemplate(to: string, templateName: string, params: string[]) {
    const cleanTo = to.replace(/[^0-9]/g, '');
    const components: any[] = [];
    if (params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map((p) => ({ type: 'text', text: p })),
      });
      // Meta authentication templates (like ground_os) with a "Copy code" button require button parameter
      if (templateName === 'ground_os' || templateName === 'verification_code') {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: params[0] }],
        });
      }
    }
    return this.post({
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    });
  }

  verifyWebhook(token: string) {
    return token === process.env.WHATSAPP_VERIFY_TOKEN;
  }

  parseInboundMessage(payload: unknown): InboundMessage | null {
    try {
      const body = payload as any;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message) return null;

      return {
        from: message.from,
        messageId: message.id,
        type: message.type,
        content: message.text?.body || '',
        timestamp: parseInt(message.timestamp),
      };
    } catch { return null; }
  }
}

let _providerInstance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (_providerInstance) return _providerInstance;

  const provider = process.env.WHATSAPP_PROVIDER || 'mock';
  if (provider === 'meta') {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (token && phoneId) {
      console.log(`[WhatsApp] Initializing Meta WhatsApp Provider (Phone ID: ${phoneId})`);
      _providerInstance = new MetaWhatsAppProvider(token, phoneId);
      return _providerInstance;
    } else {
      console.warn('[WhatsApp] WHATSAPP_PROVIDER=meta but WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing');
    }
  }

  _providerInstance = new MockWhatsAppProvider();
  return _providerInstance;
}

