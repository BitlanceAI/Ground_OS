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

export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';
  switch (provider) {
    case 'mock': default: return new MockWhatsAppProvider();
  }
}
