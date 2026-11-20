import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Camera, Link as LinkIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Resizes and compresses an image in-browser using HTML5 Canvas.
 * Produces a lightweight, optimized base64 data URL (JPEG, max 400x400, ~25-50 KB).
 */
const processImageFile = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WebP, SVG).'));
    }

    // SVG files can be read directly as DataURL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

const ImageUpload = ({
  label = 'Upload Photo',
  value = '',
  onChange,
  placeholder = 'https://...',
  aspect = 'square', // 'square' or 'wide'
  helperText = 'Select JPG, PNG or WebP from your computer'
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 10MB raw file
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    setProcessing(true);
    try {
      const optimizedDataUrl = await processImageFile(file);
      onChange(optimizedDataUrl);
      toast.success('Photo selected & optimized!');
    } catch (err) {
      toast.error(err.message || 'Error processing image');
    } finally {
      setProcessing(false);
      // Reset input value so re-selecting same file triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? 'Upload from PC' : 'Or paste URL'}
        </button>
      </div>

      {showUrlInput ? (
        <div className="relative">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
          />
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          {value ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="relative flex-shrink-0">
                <img
                  src={value}
                  alt="Preview"
                  className={`w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 ${
                    aspect === 'square' ? 'rounded-xl' : 'rounded-lg'
                  }`}
                  onError={(e) => (e.target.style.display = 'none')}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">Photo loaded</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready to save
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-primary-50/30 dark:hover:bg-primary-500/5 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer group"
            >
              <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
              <span>{processing ? 'Processing Photo...' : 'Upload from Local PC'}</span>
            </button>
          )}

          <p className="text-[10px] text-slate-400 mt-1 pl-1">{helperText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
