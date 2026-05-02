import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, safeCall } from '@common/result';
import { randomBytes } from 'crypto';

const UPLOAD_TTL_SEC = 600;

export interface UploadUrlInfo {
  uploadUrl:    string;
  publicUrl:    string;
  fileKey:      string;
  expiresAt:    string;
  thumbnailUrl: string | null;
}

export interface RequestUploadUrlInput {
  userId:   string;
  fileName: string;
  fileMime: string;
  fileSize: number;
  purpose:  'file' | 'image' | 'voice' | 'video';
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly config: ConfigService) {}

  async requestUrl(
    userId: string,
    input: { fileName: string; fileMime: string; fileSize: number; purpose: 'file' | 'image' | 'voice' | 'video' },
  ): Promise<Result<UploadUrlInfo>> {
    return safeCall(async () => {
      const objectStorageBase = this.config.get<string>('OBJECT_STORAGE_BASE_URL') ?? '/storage';
      const uploadEndpoint    = this.config.get<string>('OBJECT_STORAGE_UPLOAD_URL') ?? `${objectStorageBase}/upload`;
      const random = randomBytes(16).toString('hex');
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const fileKey  = `chat/${userId}/${input.purpose}/${Date.now()}-${random}-${safeName}`;
      return {
        uploadUrl:    `${uploadEndpoint}?key=${encodeURIComponent(fileKey)}&mime=${encodeURIComponent(input.fileMime)}`,
        publicUrl:    `${objectStorageBase}/${fileKey}`,
        fileKey,
        expiresAt:    new Date(Date.now() + UPLOAD_TTL_SEC * 1000).toISOString(),
        thumbnailUrl: input.purpose === 'image' ? `${objectStorageBase}/${fileKey}?thumb=1` : null,
      };
    }, 'EXTERNAL_SERVICE');
  }
}
