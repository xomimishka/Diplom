// src/components/RedactName.jsx
import { useState, useEffect } from "react";
import "../styles/redactname.scss";
import "../styles/link-shortening.scss";
import "../styles/link-list.scss";
import { x, radio, radio_active } from "../images";
import DropdownSelect from "./DropdownSelect";
import { updateLink } from "../api/linksApi"; // добавь в linksApi.js

const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function RedactName({ link, onClose, user }) {
    const [newTitle, setNewTitle] = useState(link?.title || link?.short || "");
    const [newLong, setNewLong] = useState(link?.long || "");

    const initialFrom = link?.valid_from ? new Date(link.valid_from) : new Date();
    const initialUntil = link?.valid_until ? new Date(link.valid_until) : null;

    const [fromDay, setFromDay] = useState(initialFrom.getDate());
    const [fromMonth, setFromMonth] = useState(initialFrom.getMonth());
    const [fromYear, setFromYear] = useState(initialFrom.getFullYear());
    const [fromHour, setFromHour] = useState(initialFrom.getHours());
    const [fromMinute, setFromMinute] = useState(initialFrom.getMinutes());

    const [hasEndDate, setHasEndDate] = useState(Boolean(link?.has_end_date));
    const [untilDay, setUntilDay] = useState(initialUntil ? initialUntil.getDate() : initialFrom.getDate());
    const [untilMonth, setUntilMonth] = useState(initialUntil ? initialUntil.getMonth() : initialFrom.getMonth());
    const [untilYear, setUntilYear] = useState(initialUntil ? initialUntil.getFullYear() : initialFrom.getFullYear());
    const [untilHour, setUntilHour] = useState(initialUntil ? initialUntil.getHours() : initialFrom.getHours());
    const [untilMinute, setUntilMinute] = useState(initialUntil ? initialUntil.getMinutes() : initialFrom.getMinutes());

    const fromDaysInMonth = new Date(fromYear, fromMonth + 1, 0).getDate();
    const untilDaysInMonth = new Date(untilYear, untilMonth + 1, 0).getDate();

    useEffect(() => {
        if (fromDay > fromDaysInMonth) setFromDay(fromDaysInMonth);
    }, [fromDay, fromMonth, fromYear, fromDaysInMonth]);

    useEffect(() => {
        if (untilDay > untilDaysInMonth) setUntilDay(untilDaysInMonth);
    }, [untilDay, untilMonth, untilYear, untilDaysInMonth]);

    if (!link) return null;

    const clearTitle = () => setNewTitle("");
    const clearLong = () => setNewLong("");

    const handleSave = async () => {
        const valid_from = new Date(fromYear, fromMonth, fromDay, fromHour, fromMinute);
        const valid_until = hasEndDate ? new Date(untilYear, untilMonth, untilDay, untilHour, untilMinute) : null;

        const body = {
            ...(newTitle.trim() ? { title: newTitle.trim() } : {}),
            ...(newLong.trim() && newLong !== link.long ? { long: newLong.trim() } : {}),
            valid_from: valid_from.toISOString(),
            has_end_date: hasEndDate,
            valid_until: valid_until ? valid_until.toISOString() : null,
        };

        try {
            await updateLink(user.id, link.id, body);
            onClose();
            window.location.reload();
        } catch (err) {
            console.error("Ошибка обновления ссылки:", err);
            alert("Не удалось сохранить изменения");
        }
    };

    return (
        <div id="rd-overlay" onClick={onClose}>
            <div id="rd-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Редактирование ссылки</h2>

                <div className="input-container">
                    <input className="input-shortening" type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Введите название ссылки" maxLength={100} />
                    {newTitle.trim() && <button type="button" className="clear-btn" onClick={clearTitle}><img src={x} alt="Очистить" /></button>}
                </div>

                <div className="link-info">
                    <p className="text-average-black"><a href={`http://localhost:5000/r/${link.short}`} target="_blank" rel="noopener noreferrer" className="short-link">http://localhost:5000/r/{link.short}</a></p>
                </div>
                {link.type === false && (
                    <div className="input-container">
                        <input className="input-shortening" type="text" value={newLong} onChange={(e) => setNewLong(e.target.value)} placeholder="Введите новую длинную ссылку" maxLength={1000} />
                        {newLong.trim() && <button type="button" className="clear-btn" onClick={clearLong}><img src={x} alt="Очистить" /></button>}
                    </div>
                )}
                <div className="link-info">
                    <p className="text-average-grey long-url">{link.long}</p>
                    <p className="text-average-grey">{link.type ? "Публичная" : "Личная"} ссылка</p>
                    {typeof link.clicks !== "undefined" && <p className="text-average-grey"><strong>Переходы:</strong> {link.clicks}</p>}
                    {link.owner_login && (
                        <p className="text-average-grey">
                            <strong>Автор:</strong> {link.owner_login}
                        </p>
                    )}

                    {/* Статус безопасности ссылки - только для личных ссылок */}
                    {link.type === false && (
                        <>
                            {/* Статус действия ссылки - только для личных ссылок */}
                            <p className="text-average-grey">
                                <strong>Статус:</strong>{" "}
                                {link.is_active === false ? (
                                    <span style={{ color: "#c62828", fontWeight: "bold" }}>🔒 Заблокирована</span>
                                ) : link.has_end_date && link.valid_until && new Date(link.valid_until) < new Date() ? (
                                    <span style={{ color: "#f57c00", fontWeight: "bold" }}>⚠ Срок действия истёк</span>
                                ) : link.has_end_date && link.valid_until ? (
                                    <span style={{ color: "#1976d2" }}>Действует до {new Date(link.valid_until).toLocaleString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                                ) : (
                                    <span style={{ color: "#2e7d32" }}>∞ Бессрочная</span>
                                )}
                            </p>
                        </>
                    )}
                    <p className="text-average-grey">
                        <strong>Безопасность:</strong>{" "}
                        <span style={{ color: link.is_active ? "#2e7d32" : "#c62828", fontWeight: link.is_active ? "normal" : "bold" }}>
                            {link.is_active ? "✓ Безопасная" : "✗ Небезопасная"}
                        </span>
                    </p>
                    {link.last_checked && (
                        <p className="text-average-grey" style={{ fontSize: "0.85em", color: "#757575" }}>
                            Последняя проверка: {new Date(link.last_checked).toLocaleString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                    )}

                </div>

                {/* Время действия ссылки - только для личных ссылок */}
                {link.type === false && (
                    <div className="link-info">
                        <br />
                        <p className="text-primary-black">Время действия ссылки</p>

                        {/* Дата начала — всегда редактируема */}
                        <p className="text-primary-black weight-300">Дата начала действия ссылки</p>
                        <div className="block-time">
                            <DropdownSelect options={Array.from({ length: fromDaysInMonth }, (_, i) => i + 1)} value={fromDay} onChange={setFromDay} width="65px" />
                            <DropdownSelect options={months} value={months[fromMonth]} onChange={(m) => setFromMonth(months.indexOf(m))} width="138px" />
                            <DropdownSelect options={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)} value={fromYear} onChange={setFromYear} width="105px" />
                            <DropdownSelect options={Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))} value={String(fromHour).padStart(2, "0")} onChange={(v) => setFromHour(Number(v))} width="86px" />
                            <DropdownSelect options={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))} value={String(fromMinute).padStart(2, "0")} onChange={(v) => setFromMinute(Number(v))} width="86px" />
                        </div>

                        {/* Переключатель окончания — включает/выключает поля окончания */}
                        <div className="block-time" style={{ alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                            <p className="text-primary-black weight-300">Дата окончания действия ссылки</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img
                                    src={hasEndDate ? radio_active : radio}
                                    alt={hasEndDate ? "Включено" : "Выключено"}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setHasEndDate(v => !v)}
                                />
                                <span style={{ userSelect: 'none' }}>{hasEndDate ? "Включено" : "Выключено"}</span>
                            </div>
                        </div>

                        {/* Поля окончания — активны только если hasEndDate === true */}
                        <div className="block-time" style={{ marginTop: 8 }}>
                            <DropdownSelect options={Array.from({ length: untilDaysInMonth }, (_, i) => i + 1)} value={untilDay} onChange={setUntilDay} width="65px" disabled={!hasEndDate} />
                            <DropdownSelect options={months} value={months[untilMonth]} onChange={(m) => setUntilMonth(months.indexOf(m))} width="138px" disabled={!hasEndDate} />
                            <DropdownSelect options={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)} value={untilYear} onChange={setUntilYear} width="105px" disabled={!hasEndDate} />
                            <DropdownSelect options={Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))} value={String(untilHour).padStart(2, "0")} onChange={(v) => setUntilHour(Number(v))} width="86px" disabled={!hasEndDate} />
                            <DropdownSelect options={Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))} value={String(untilMinute).padStart(2, "0")} onChange={(v) => setUntilMinute(Number(v))} width="86px" disabled={!hasEndDate} />
                        </div>
                    </div>
                )}

                <div className="block-buttons block-center">
                    <button className="text-average-black button-website" onClick={onClose}>Отмена</button>
                    <button
                        className="text-average-black button-website button-save"
                        onClick={handleSave}
                        disabled={!newTitle.trim()}
                    >
                        Сохранить
                    </button>
                </div>
                <br /><br />
            </div>
        </div>
    );
}
