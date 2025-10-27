import "../styles/global.scss"
import "../styles/qr.scss"
import "../styles/login.scss"
import { useState } from 'react';
import QRCode from 'qrcode';

export default function QRcode({ qr, onClose, linkData }) {
  const [codeColor, setCodeColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [styledQR, setStyledQR] = useState(qr);

  if (!qr) return null;

  const generateStyledQR = async (darkColor, lightColor) => {
    try {
      const url = `http://localhost:5000/r/${linkData.short}`;
      const newQR = await QRCode.toDataURL(url, {
        width: 200,
        color: {
          dark: darkColor,
          light: lightColor
        }
      });
      setStyledQR(newQR);
      return newQR;
    } catch (err) {
      console.error('Error generating styled QR:', err);
      return qr;
    }
  };

  const downloadQR = async (format) => {
    const qrToDownload = await generateStyledQR(codeColor, bgColor);
    const link = document.createElement("a");
    link.href = qrToDownload;
    link.download = `qrcode.${format}`;
    link.click();
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
    <div id="qr-overlay" onClick={onClose}>
      <div id="qr-modal" onClick={handleModalClick}>
        <h2>Настройка QR-кода</h2>
        <div className="block-styles">
          <p className="text-primary-black">Цвет кода</p>
          <div className="gap">
            <div
              className="input-login color-block"
              style={{ backgroundColor: codeColor }}
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
            <button className="text-average-black button-website" onClick={() => downloadQR("svg")}>SVG</button>
            <button className="text-average-black button-website" onClick={() => downloadQR("jpeg")}>JPEG</button>
          </div>
        </div>
      </div>
    </div>
  );
}