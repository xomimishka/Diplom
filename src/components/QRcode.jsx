import "../styles/global.scss"
import "../styles/qr.scss"
import "../styles/login.scss"
import { useState } from 'react';
import QRCode from 'qrcode';
import ColorPicker from './ColorPicker';

export default function QRcode({ qr, onClose, linkData }) {
  const [codeColor, setCodeColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [styledQR, setStyledQR] = useState(qr);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'code' or 'bg'

  if (!qr) return null;

  // Generate QR code. Accepts options for width/type to allow higher-quality downloads.
  const generateStyledQR = async (darkColor, lightColor, opts = {}) => {
    try {
      const url = `http://localhost:5000/r/${linkData.short}`;
      const options = {
        width: opts.width || 200,
        color: { dark: darkColor, light: lightColor },
        type: opts.type || 'image/png',
      };
      if (opts.quality) options.quality = opts.quality;

      const newQR = await QRCode.toDataURL(url, options);
      // When generating for display (default small PNG), update preview
      if (!opts.skipPreview) setStyledQR(newQR);
      return newQR;
    } catch (err) {
      console.error('Error generating styled QR:', err);
      return qr;
    }
  };

  const downloadQR = async (format) => {
    const link = document.createElement('a');

    if (format === 'svg') {
      // Generate SVG data URL and download as blob to avoid browser rendering XML
      const dataUrl = await generateStyledQR(codeColor, bgColor, { type: 'image/svg+xml', width: 2048, skipPreview: true });
      // Use fetch on the data URL to obtain a proper Blob (handles encoding correctly)
      try {
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        // Fallback: attempt previous manual decode if fetch fails
        const commaIndex = dataUrl.indexOf(',');
        const header = dataUrl.substring(0, commaIndex);
        const dataPart = dataUrl.substring(commaIndex + 1);
        let svgText;
        if (header.includes('base64')) {
          svgText = atob(dataPart);
        } else {
          try { svgText = decodeURIComponent(dataPart); } catch (e) { svgText = dataPart; }
        }
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      return;
    }

    if (format === 'png') {
      // Generate a higher-resolution PNG for better quality
      const dataUrl = await generateStyledQR(codeColor, bgColor, { type: 'image/png', width: 2048, skipPreview: true });
      link.href = dataUrl;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (format === 'jpeg' || format === 'jpg') {
      // Generate high-quality JPEG
      const dataUrl = await generateStyledQR(codeColor, bgColor, { type: 'image/jpeg', quality: 1.0, width: 2048, skipPreview: true });
      link.href = dataUrl;
      link.download = 'qrcode.jpg';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    // Fallback
    const dataUrl = await generateStyledQR(codeColor, bgColor, { type: 'image/png', width: 1024, skipPreview: true });
    link.href = dataUrl;
    link.download = `qrcode.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCodeColorChange = async (e) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^0-9A-Fa-f]/g, '');
    const newColor = "#" + cleanValue;
    setCodeColor(newColor);
    
    // Генерируем QR-код с новым цветом
    await generateStyledQR(newColor, bgColor);
  };

  const handleBgColorChange = async (e) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^0-9A-Fa-f]/g, '');
    const newColor = "#" + cleanValue;
    setBgColor(newColor);
    
    // Генерируем QR-код с новым цветом
    await generateStyledQR(codeColor, newColor);
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div id="qr-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="qr-modal" onClick={handleModalClick}>
        <h2>Настройка QR-кода</h2>
        <div className="block-styles">
          <p className="text-primary-black">Цвет кода</p>
          <div className="gap">
            <div
              className="input-login color-block"
              style={{ backgroundColor: codeColor }}
              onClick={() => { setPickerTarget('code'); setPickerOpen(true); }}
            />
            <div className="input-with-prefix">
              <span className="prefix">#</span>
              <input
                className="input-login"
                type="text"
                value={codeColor.substring(1)}
                onChange={handleCodeColorChange}
                placeholder="000000"
                maxLength={6}
              />
            </div>
          </div>
          <p className="text-primary-black">Цвет фона</p>
          <div className="gap">
            <div
              className="input-login color-block"
              style={{ backgroundColor: bgColor }}
              onClick={() => { setPickerTarget('bg'); setPickerOpen(true); }}
            />
            <div className="input-with-prefix">
              <span className="prefix">#</span>
              <input
                className="input-login"
                type="text"
                value={bgColor.substring(1)}
                onChange={handleBgColorChange}
                placeholder="FFFFFF"
                maxLength={6}
              />
            </div>
          </div>
        </div>
        <div className="block-center">
          <img src={styledQR} alt="QR Code" />
        </div>
        <hr />
        <div className="block-styles">
          <p className="text-primary-black">Скачать QR-код</p>
          <div className="block-buttons">
            <button className="text-average-black button-website" onClick={() => downloadQR("png")}>PNG</button>
            <button className="text-average-black button-website" onClick={() => downloadQR("jpeg")}>JPEG</button>
          </div>
        </div>

        {pickerOpen && (
          <ColorPicker
            initialColor={pickerTarget === 'code' ? codeColor : bgColor}
            onColorSelect={async (newColor) => {
              if (pickerTarget === 'code') {
                setCodeColor(newColor);
                await generateStyledQR(newColor, bgColor);
              } else {
                setBgColor(newColor);
                await generateStyledQR(codeColor, newColor);
              }
              // Don't auto-close on every color change so dragging/preview works.
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}