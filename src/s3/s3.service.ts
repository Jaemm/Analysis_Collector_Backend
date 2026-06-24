import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private s3: S3Client;

  private bucket = process.env.AWS_BUCKET as string;
  private region = process.env.AWS_REGION as string;

  constructor() {
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
      },
    });
  }

  // 업로드 (CacheControl 포함)
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
        CacheControl: key.includes('/json/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=86400',
      }),
    );

    return key;
  }

  // presigned 업로드
  async getUploadSignedUrl(
    key: string,
    contentType = 'application/json',
    expiresIn = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  // CDN URL 반환 (핵심)
  getCdnUrl(key: string): string {
    return `${process.env.CDN_URL}/${key}`;
  }

  // (필요 시만)
  async getFile(key: string): Promise<Buffer> {
    const res = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const stream = res.Body as Readable;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (c) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async deleteFile(key: string) {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async deleteFiles(keys: string[]) {
    const uniqueKeys = Array.from(new Set(keys.filter(Boolean)));

    for (let i = 0; i < uniqueKeys.length; i += 1000) {
      const chunk = uniqueKeys.slice(i, i + 1000);

      if (!chunk.length) {
        continue;
      }

      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: chunk.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );
    }
  }

  async listKeys(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      (res.Contents || []).forEach((item) => {
        if (item.Key) {
          keys.push(item.Key);
        }
      });

      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  async testConnection() {
    const key = `health-check/${Date.now()}.txt`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: 'health check',
        ContentType: 'text/plain',
      }),
    );

    return {
      success: true,
      key,
      url: this.getCdnUrl(key),
    };
  }
}
