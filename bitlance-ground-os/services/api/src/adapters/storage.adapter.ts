// ============================================================
// OBJECT STORAGE ADAPTER (Mock / S3 / GCS)
// ============================================================

export class MockStorageProvider {
  async uploadFile(
    fileBuffer: Buffer | string,
    destinationPath: string,
    mimeType = 'application/octet-stream'
  ): Promise<{ url: string; key: string; sizeBytes: number }> {
    const isBuffer = Buffer.isBuffer(fileBuffer);
    const size = isBuffer ? fileBuffer.length : (typeof fileBuffer === 'string' ? fileBuffer.length : 1024);
    const mockUrl = `https://storage.bitlance-os.internal/uploads/${destinationPath.replace(/^\//, '')}`;

    return {
      url: mockUrl,
      key: destinationPath,
      sizeBytes: size,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return `https://storage.bitlance-os.internal/signed/${key}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }
}

export function getStorageProvider() {
  return new MockStorageProvider();
}
