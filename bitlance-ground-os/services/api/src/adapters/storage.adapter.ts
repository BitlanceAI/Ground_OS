// ============================================================
// OBJECT STORAGE ADAPTER (Mock / Supabase / S3)
// ============================================================

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer | string, destinationPath: string, mimeType?: string): Promise<{ url: string; key: string; sizeBytes: number }>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getUploadUrl(key: string, contentType?: string): Promise<{ uploadUrl: string; downloadUrl: string }>;
}

export class MockStorageProvider implements StorageProvider {
  private baseUrl = 'https://storage.bitlance-os.internal';

  async uploadFile(
    fileBuffer: Buffer | string,
    destinationPath: string,
    _mimeType = 'application/octet-stream'
  ): Promise<{ url: string; key: string; sizeBytes: number }> {
    const isBuffer = Buffer.isBuffer(fileBuffer);
    const size = isBuffer ? fileBuffer.length : (typeof fileBuffer === 'string' ? fileBuffer.length : 1024);
    const mockUrl = `${this.baseUrl}/uploads/${destinationPath.replace(/^\//, '')}`;
    return { url: mockUrl, key: destinationPath, sizeBytes: size };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return `${this.baseUrl}/signed/${key}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  async getUploadUrl(key: string, _contentType = 'audio/webm'): Promise<{ uploadUrl: string; downloadUrl: string }> {
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    return {
      uploadUrl: `${this.baseUrl}/upload/${key}?expires=${expires}&mock=true`,
      downloadUrl: `${this.baseUrl}/uploads/${key}`,
    };
  }
}

export class SupabaseStorageProvider implements StorageProvider {
  private supabaseUrl: string;
  private secretKey: string;
  private bucket: string;

  constructor() {
    this.supabaseUrl = (process.env.SUPABASE_URL || 'https://yxamhmqwcngubdgjjuag.supabase.co').replace(/\/$/, '');
    this.secretKey = process.env.SUPABASE_SECRET_KEY || '';
    this.bucket = process.env.STORAGE_BUCKET || 'ground-os-media';
  }

  async uploadFile(
    fileBuffer: Buffer | string,
    destinationPath: string,
    mimeType = 'application/octet-stream'
  ): Promise<{ url: string; key: string; sizeBytes: number }> {
    const cleanPath = destinationPath.replace(/^\//, '');
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    const uploadEndpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${cleanPath}`;

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase Storage upload failed: ${res.status} ${err}`);
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${cleanPath}`;
    return {
      url: publicUrl,
      key: cleanPath,
      sizeBytes: buffer.length,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const cleanPath = key.replace(/^\//, '');
    const signEndpoint = `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${cleanPath}`;

    const res = await fetch(signEndpoint, {
      method: 'POST',
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${cleanPath}`;
    }

    const data = (await res.json()) as { signedURL?: string; signedUrl?: string };
    const relUrl = data.signedURL || data.signedUrl || '';
    return relUrl.startsWith('http') ? relUrl : `${this.supabaseUrl}/storage/v1${relUrl}`;
  }

  async getUploadUrl(key: string, _contentType = 'audio/webm'): Promise<{ uploadUrl: string; downloadUrl: string }> {
    const cleanPath = key.replace(/^\//, '');
    const signEndpoint = `${this.supabaseUrl}/storage/v1/object/upload/sign/${this.bucket}/${cleanPath}`;

    const res = await fetch(signEndpoint, {
      method: 'POST',
      headers: {
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 15 * 60 }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate signed upload URL from Supabase: ${res.statusText}`);
    }

    const data = (await res.json()) as { url: string };
    const uploadUrl = `${this.supabaseUrl}/storage/v1${data.url}`;
    const downloadUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${cleanPath}`;

    return { uploadUrl, downloadUrl };
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'mock';
  if (provider === 'supabase' || (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)) {
    return new SupabaseStorageProvider();
  }
  return new MockStorageProvider();
}
