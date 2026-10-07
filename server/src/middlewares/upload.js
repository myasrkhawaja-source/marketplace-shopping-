/**
 * middlewares/upload.js
 * ---------------------------------------------------------
 * Multer configuration for image uploads.
 * Files are stored in `server/uploads` and served as
 * `http://localhost:5000/uploads/<filename>`.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Make sure the folder exists before the first upload
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'image';
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files (jpg, png, webp, gif) are allowed'));
};

const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: env.maxFileUploadMb * 1024 * 1024,
    files: 8,
  },
});

/** Ready to use middlewares. */
const uploadProductImages = upload.array('images', 8);
const uploadSingleImage = upload.single('image');
const uploadAvatar = upload.single('avatar');
const uploadShopMedia = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

/** Build the public URL of an uploaded file. */
const buildFileUrl = (req, file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

/** Map multer files into URL strings (used by the controllers). */
const filesToUrls = (req) => {
  if (req.files && Array.isArray(req.files)) {
    return req.files.map((file) => buildFileUrl(req, file));
  }
  if (req.file) return [buildFileUrl(req, req.file)];
  return [];
};

module.exports = {
  upload,
  uploadProductImages,
  uploadSingleImage,
  uploadAvatar,
  uploadShopMedia,
  filesToUrls,
  buildFileUrl,
  UPLOAD_DIR,
};
