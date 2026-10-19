import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

const ALLOWED_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.csv', '.zip',
]);

function uploader(subdir: string) {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const now = new Date();
      const dir = join(UPLOAD_ROOT, subdir, `${now.getFullYear()}`, `${String(now.getMonth() + 1).padStart(2, '0')}`);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname || '').toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

function fileFilter(_req: any, file: any, cb: any) {
  const ext = extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(new BadRequestException(`File type ${ext || 'unknown'} is not allowed`), false);
  }
  cb(null, true);
}

@ApiTags('Admin Uploads')
@Controller('admin/uploads')
@UseGuards(AuthGuard('jwt'), TenantGuard, AdminGuard)
@ApiBearerAuth()
export class AdminUploadsController {
  @Post()
  @ApiOperation({ summary: 'Upload an image or document (max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, folder: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: uploader(''), fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded (field name must be "file")');
    const rel = join(file.destination, file.filename)
      .replace(UPLOAD_ROOT + '/', '')
      .split('\\')
      .join('/');
    return {
      url: `/uploads/${rel}`,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload an image (alias, max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: uploader('images'), fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.upload(file);
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload a document (alias, max 25MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: uploader('documents'), fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }))
  uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return this.upload(file);
  }
}
