import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Uploads a Buffer to Cloudinary using an unsigned upload preset.
 * Uses upload_stream with f_auto + q_auto for optimized delivery.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  _mimetype: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        upload_preset:   'Geekhoot',
        asset_folder:    'Geekhoot/products',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload failed:', error.message);
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        if (!result?.secure_url) {
          return reject(new Error('Cloudinary upload returned no URL'));
        }
        console.log('✨ Uploaded to Cloudinary:', result.secure_url);
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}
