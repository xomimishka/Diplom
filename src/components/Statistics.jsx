import { useEffect, useState } from "react";
import "../styles/statistics.scss";
import "../styles/global.scss";

export default function Statistics({ link, onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!link) return;

    fetch(`http://localhost:5000/stats/${link.id}`)
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Stats error:", err));
  }, [link]);

  if (!link) return null;

  const handleShortLinkClick = () => {
    const shortUrl = `http://localhost:5000/r/${link.short}`;
    window.open(shortUrl, "_blank");
  };

  return (
    <div id="stats-overlay" onClick={onClose}>
      <div id="stats-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Статистика</h2>

        <div className="link-info">
          <p className="text-primary-black">
            <a
              href={`http://localhost:5000/r/${link.short}`}
              target="_blank"
              rel="noopener noreferrer"
              className="short-link"
              onClick={handleShortLinkClick}
            >
              http://localhost:5000/r/{link.short}
            </a>
          </p>

          <p className="text-average-grey long-url">
            <strong>Оригинальная ссылка:</strong> {link.long}
          </p>

          <p className="text-average-grey">
            <strong>Тип ссылки:</strong> {link.type ? "Публичная" : "Личная"}
          </p>

          {link.clicks !== undefined && (
            <p className="text-average-grey">
              <strong>Переходы:</strong> {link.clicks}
            </p>
          )}
        </div>

        <img src={link.qr} alt="QR Code" />

        {/* ====== Новая статистика ====== */}

        {!stats && <p className="text-average-grey">Загрузка статистики...</p>}

        {stats && (
          <div className="stats-section">

            {(!stats.countries || stats.countries.length === 0) ? (
              <h3>Нет данных</h3>) : (<h3>География</h3>)}

            {/* ===== Страны ===== */}
            {(!stats.countries || stats.countries.length === 0) ? (
              <></>
            ) : (
              <div className="geo-block">
                <div className="geo-header">
                  <span>Страна</span>
                  <span>Количество</span>
                </div>

                {stats.countries.map((item, i) => (
                  <div className="geo-row" key={i}>
                    <div className="geo-left">
                      <span className="dot" />
                      <span>Россия</span>
                    </div>
                    <div className="geo-right">
                      {((item.count / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== Города ===== */}
            {(!stats.cities || stats.cities.length === 0) ? (
              <></>
            ) : (
              <div className="geo-block">
                <div className="geo-header">
                  <span>Город</span>
                  <span>Количество</span>
                </div>

                {stats.cities.map((item, i) => (
                  <div className="geo-row" key={i}>
                    <div className="geo-left">
                      <span className="dot" />
                      <span>Таганрог</span>
                    </div>
                    <div className="geo-right">
                      {((item.count / stats.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
