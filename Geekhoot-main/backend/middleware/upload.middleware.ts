import multer from 'multer';

// Use memory storage — files live only in RAM as a Buffer.
// They are never written to disk, so there is no local file to lose on restart.
// The buffer is passed directly to Cloudinary via a stream in cloudinary.service.ts.
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
