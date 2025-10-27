import { useState, useRef, useEffect } from "react";

import "../styles/link-shortening.scss";
import "../styles/global.scss";

import { options, x, radio, radio_active } from "../images";

export default function LinkShortening({ onAdd, user }) {
  const [url, setUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const containerRef = useRef(null);

  // Закрытие меню при клике вне контейнера
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAdd(url, user ? isPublic : true);
    setUrl("");
    setShowOptions(false);
  };

  const handleClear = () => setUrl("");

  const isFilled = url.trim().length > 0;

  return (
    <div className="link-wrapper" ref={containerRef}>
      <form className="block-link" onSubmit={handleSubmit}>
        <div className="input-container">
          <input className="input-shortening" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Введите ссылку" />
          {isFilled && (
            <button type="button" className="clear-btn" onClick={handleClear}>
              <img src={x} alt="Очистить" />
            </button>
          )}

          {/* Всплывающее меню */}
          {showOptions && (
            <div className="dropdown-menu">
              <label>
                <input type="radio" name="privacy" checked={isPublic} onChange={() => setIsPublic(true)} />
                <img src={isPublic ? radio_active : radio} alt="radio" className="custom-radio" />
                Публичная ссылка - общая для одинаковых ссылок
              </label>

              <label>
                <input type="radio" name="privacy" checked={!isPublic} onChange={() => setIsPublic(false)} />
                <img src={!isPublic ? radio_active : radio} alt="radio" className="custom-radio" />
                Личная ссылка - принадлежит автору
              </label>
            </div>
          )}
        </div>

        {/* Кнопка с опциями */}
        {user && (<button type="button" className={`button-svg btn ${showOptions ? "active" : ""}`} data-tooltip="Дополнительные опции" onClick={() => setShowOptions((prev) => !prev)}>
          <img src={options} alt="options" />
        </button>
        )}

        {/* Основная кнопка */}
        <button type="submit"
          className={`button-shortening ${isFilled ? "enabled" : ""}`} disabled={!isFilled}>
          Сократить
        </button>
      </form>
    </div>
  );
}
