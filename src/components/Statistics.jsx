import "../styles/statistics.scss";
import "../styles/global.scss";

export default function Statistics({ link, onClose }) {

  if (!link) return null;

  const handleShortLinkClick = () => {
    const shortUrl = `http://localhost:5000/r/${link.short}`;
    window.open(shortUrl, '_blank');
  };

  return (
    <div id="stats-overlay" onClick={onClose}>
      <div id="stats-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Статистика</h2>

        {/* Информация о ссылке */}
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
            <strong>Дата создания:</strong> {link.created_at ? new Date(link.created_at).toLocaleString("ru-RU", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }) : "Не указана"}
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

      </div>
    </div>
  );
}