import path from 'path';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { assertS3Config, getS3Bucket, s3Client } from '../config/s3';

const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const extOk = ALLOWED_EXT.test(path.extname(file.originalname));
  const mimeOk = ALLOWED_MIME.includes(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPG, JPEG, PNG, and WEBP images are allowed', 400));
  }
};

const createS3Storage = () =>
  multerS3({
    s3: s3Client,
    bucket: (_req, _file, cb) => {
      try {
        cb(null, getS3Bucket());
      } catch (err) {
        cb(err as Error);
      }
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (_req, file, cb) => {
      cb(null, { fieldName: file.fieldname, originalName: file.originalname });
    },
    key: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `products/${unique}${ext}`);
    },
  });

export const upload = multer({
  storage: createS3Storage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/** Run multer only for multipart requests so JSON APIs still work. */
export const optionalImageUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  try {
    assertS3Config();
  } catch (err) {
    return next(err);
  }

  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Image must be 5 MB or smaller', 400));
        }
        return next(new AppError(`Upload failed: ${err.message}`, 400));
      }
      if (err instanceof AppError) {
        return next(err);
      }
      console.error('S3 upload error:', err);
      return next(new AppError('Failed to upload image to S3. Check AWS credentials and bucket permissions.', 500));
    }
    next();
  });
};

export const requireImageUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    assertS3Config();
  } catch (err) {
    return next(err);
  }

  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Image must be 5 MB or smaller', 400));
        }
        return next(new AppError(`Upload failed: ${err.message}`, 400));
      }
      if (err instanceof AppError) {
        return next(err);
      }
      console.error('S3 upload error:', err);
      return next(new AppError('Failed to upload image to S3. Check AWS credentials and bucket permissions.', 500));
    }
    next();
  });
};

export const getUploadedImageUrl = (file?: Express.Multer.File | Express.MulterS3.File) => {
  if (!file) return undefined;
  const s3File = file as Express.MulterS3.File;
  if (s3File.location) return s3File.location;
  return undefined;
};
 
