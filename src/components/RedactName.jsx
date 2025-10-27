import { useState } from 'react';
import "../styles/redactname.scss";
import "../styles/link-shortening.scss";
import "../styles/link-list.scss";
import { x } from "../images";

export default function RedactName({ link, onClose, onRename }) {
    const [newTitle, setNewTitle] = useState(link?.title || link?.short || '');

    const handleClear = () => setNewTitle("");

    const isFilled = newTitle.trim().length > 0;

    if (!link) return null;

    const handleSave = () => {
        if (newTitle && newTitle.trim()) {
            onRename(link.id, newTitle);
            onClose();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const handleShortLinkClick = () => {
        const shortUrl = `http://localhost:5000/r/${link.short}`;
        window.open(shortUrl, '_blank');
    };

    return (
        <div id="rd-overlay" onClick={onClose}>
            <div id="rd-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Редактирование названия ссылки</h2>

                {/* Поле для редактирования названия */}
                <div className="input-container">
                    <input
                        className="input-shortening"
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Введите новое название"
                        maxLength={100}
                    />
                    {isFilled && (
                        <button type="button" className="clear-btn" onClick={handleClear}>
                            <img src={x} alt="Очистить" />
                        </button>
                    )}
                </div>

                {/* Информация о ссылке */}
                <div className="link-info">
                    {link.title && link.title !== "" && (
                        <div>
                            <p className="text-primary-black">
                                Текущее название: {link.title}
                            </p>
                        </div>
                    )}
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

                {/* Кнопки действий */}
                <div className="block-buttons block-center">
                    <button
                        className="text-average-black button-website"
                        onClick={handleCancel}
                    >
                        Отмена
                    </button>
                    <button
                        className="text-average-black button-website button-save"
                        onClick={handleSave}
                        disabled={!newTitle.trim()}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
}