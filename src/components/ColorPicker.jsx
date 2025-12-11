import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/color-picker.scss';

export default function ColorPicker({ initialColor = '#000000', onColorSelect, onClose }) {
  const [color, setColor] = useState(initialColor);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(50);
  const gradientCanvasRef = useRef(null);
  const hueSliderRef = useRef(null);
  const containerRef = useRef(null);

  // Инициализация hue/saturation/brightness из цвета
  useEffect(() => {
    const hsv = hexToHSV(initialColor);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
  }, [initialColor]);

  // Рисование градиента (белый слева, насыщенный сверху, черный внизу)
  useEffect(() => {
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Создаём градиент от белого к цвету hue (слева направо)
    for (let x = 0; x < width; x++) {
      const saturation = (x / width) * 100;
      
      // Создаём вертикальный градиент от цвета к чёрному
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      const satColor = `hsl(${hue}, 100%, 50%)`;
      gradient.addColorStop(0, satColor);
      gradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, 1, height);
    }

    // Белый градиент слева направо (поверх)
    const whiteGradient = ctx.createLinearGradient(0, 0, width, 0);
    whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, width, height);
  }, [hue]);

  // Закрывать только при клике вне контейнера: глобальный обработчик (capture)
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current) return;
      // Используем composedPath если доступно (shadow DOM-safe)
      const path = e.composedPath ? e.composedPath() : null;
      const clickedInside = path ? path.indexOf(containerRef.current) !== -1 : containerRef.current.contains(e.target);
      if (!clickedInside) onClose();
    };

    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [onClose]);

  function hexToHSV(hex) {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h /= 6;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h: h * 360, s: s * 100, v: v * 100 };
  }

  function hsvToHex(h, s, v) {
    const c = (v / 100) * (s / 100);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v / 100 - c;

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
    else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
    else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
    else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
    else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    const toHex = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  const handleGradientClick = (e) => {
    // keep for click fallback
    e.stopPropagation();
    e.preventDefault();
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const saturation = (x / rect.width) * 100;
    const brightness = 100 - (y / rect.height) * 100;

    const newColor = hsvToHex(hue, saturation, brightness);
    setColor(newColor);
    setSaturation(saturation);
    setBrightness(brightness);
    onColorSelect(newColor);
  };

  // Support dragging on the gradient canvas
  const updateColorFromCoords = (clientX, clientY) => {
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    x = Math.max(0, Math.min(rect.width, x));
    y = Math.max(0, Math.min(rect.height, y));
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    const newColor = hsvToHex(hue, s, v);
    setColor(newColor);
    setSaturation(s);
    setBrightness(v);
    onColorSelect(newColor);
  };

  const handleGradientPointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;
    const pointerId = e.pointerId;
    try { canvas.setPointerCapture?.(pointerId); } catch (err) {}

    const onPointerMove = (ev) => updateColorFromCoords(ev.clientX, ev.clientY);
    const onPointerUp = (ev) => {
      try { canvas.releasePointerCapture?.(pointerId); } catch (err) {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    updateColorFromCoords(e.clientX, e.clientY);
  };

  const handleHueChange = (e) => {
    e.stopPropagation();
    const newHue = Number(e.target.value);
    setHue(newHue);
    // Preserve current saturation/brightness when changing hue
    const newColor = hsvToHex(newHue, saturation, brightness);
    setColor(newColor);
    onColorSelect(newColor);
  };

  const handleInputChange = (e) => {
    e.stopPropagation();
    let hex = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length > 6) hex = hex.substring(0, 6);
    const fullHex = '#' + hex.padEnd(6, '0');
    setColor(fullHex);
    const hsv = hexToHSV(fullHex);
    setHue(hsv.h);
    setSaturation(hsv.s);
    setBrightness(hsv.v);
    onColorSelect(fullHex);
  };

  const handleBackdropClick = (e) => {
    // If click happened inside the picker container, do not close
    if (containerRef.current && containerRef.current.contains(e.target)) return;
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="color-picker-backdrop" onClick={handleBackdropClick}>
      <div
        className="color-picker-container"
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onTouchStartCapture={(e) => e.stopPropagation()}
      >
        <div className="picker-header">
          <p className="text-primary-black">Выберите цвет</p>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Основной градиент */}
        <div className="picker-gradient">
          <canvas
            ref={gradientCanvasRef}
            className="gradient-canvas"
            width={280}
            height={200}
            onClick={handleGradientClick}
            onPointerDown={handleGradientPointerDown}
          />
        </div>

        {/* Hue slider */}
        <div className="hue-slider-container">
          <input
            ref={hueSliderRef}
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={handleHueChange}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="hue-slider"
          />
        </div>

        {/* Цветовой блок и input */}
        <div className="picker-footer">
          <div className="input-login color-block" style={{ backgroundColor: color }} />
          <div className="color-input-group">
            <span className="hash">#</span>
            <input
              type="text"
              value={color.substring(1).toUpperCase()}
              onChange={handleInputChange}
              maxLength="6"
              className="input-login hex-input"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
