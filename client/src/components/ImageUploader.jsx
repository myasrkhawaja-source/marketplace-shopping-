/**
 * components/ImageUploader.jsx
 * ---------------------------------------------------------
 * Uploads product images to the API and keeps the returned URLs.
 * Used by the product form and by the shop profile page.
 */
import { useRef, useState } from 'react';
import { sellerApi } from '../api/seller.api';
import { useToast } from '../hooks/useToast';
import Loader from './Loader';

const ImageUploader = ({ images = [], onChange, max = 8, label = 'Product images' }) => {
  const inputRef = useRef(null);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (event) => {
    const files = event.target.files;
    if (!files || !files.length) return;

    if (images.length + files.length > max) {
      showToast(`You can upload up to ${max} images`, 'error');
      return;
    }

    setUploading(true);
    try {
      const response = await sellerApi.uploadImages(files);
      onChange([...images, ...response.data.urls]);
      showToast(`${response.data.urls.length} image(s) uploaded`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (url) => onChange(images.filter((image) => image !== url));

  return (
    <div className="field">
      <label>{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        disabled={uploading}
      />
      <span className="hint">
        JPG / PNG / WEBP · up to {max} images · {images.length} added
      </span>

      {uploading && <Loader label="Uploading…" inline />}

      {images.length > 0 && (
        <div className="image-preview">
          {images.map((url) => (
            <div className="image-preview-item" key={url}>
              <img src={url} alt="preview" />
              <button type="button" onClick={() => removeImage(url)} title="Remove">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
