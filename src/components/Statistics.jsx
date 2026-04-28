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
            <strong>Дата создания:</strong>{" "}
            {link.created_at
              ? new Date(link.created_at).toLocaleString("ru-RU", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Не указана"}
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

            <h3>Всего переходов: {stats.total || 0}</h3>

            {/* ===== Страны ===== */}
            <h4>Статистика по странам</h4>
            {(!stats.countries || stats.countries.length === 0) ? (
              <p className="text-average-grey">Нет данных</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Страна</th>
                    <th>Переходы</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.countries.map((item, i) => (
                    <tr key={i}>
                      <td>Россия</td>
                      <td>{item.count}</td>
                      <td>{((item.count / stats.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ===== Города ===== */}
            <h4>Статистика по городам</h4>
            {(!stats.cities || stats.cities.length === 0) ? (
              <p className="text-average-grey">Нет данных</p>
            ) : (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Город</th>
                    <th>Переходы</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cities.map((item, i) => (
                    <tr key={i}>
                      <td>Таганрог</td>
                      <td>{item.count}</td>
                      <td>{((item.count / stats.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
