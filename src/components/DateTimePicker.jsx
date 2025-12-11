import { useState, useEffect } from "react";
import { ph_caret_up_down } from "../images";
import "../styles/redactname.scss"; // Используем твои стили

const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function DateTimePicker({ onChange, initialDate }) {
  const today = new Date(initialDate || Date.now());

  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [hour, setHour] = useState(today.getHours());
  const [minute, setMinute] = useState(today.getMinutes());

  const [openDropdown, setOpenDropdown] = useState(null); // "day" | "month" | "year" | "hour" | "minute"

  // Количество дней в выбранном месяце/году
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const years = Array.from({ length: 20 }, (_, i) => today.getFullYear() + i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const toggleDropdown = (type) => {
    setOpenDropdown(openDropdown === type ? null : type);
  };

  // Отправляем выбранную дату наверх
  useEffect(() => {
    if (onChange) {
      onChange({ day, month, year, hour, minute });
    }
  }, [day, month, year, hour, minute, onChange]);

  const renderDropdown = (type, options, valueSetter) => {
    if (openDropdown !== type) return null;

    return (
      <ul className="dropdown-list">
        {options.map((opt, idx) => (
          <li key={idx} onClick={() => { valueSetter(opt); setOpenDropdown(null); }}>
            {type === "month" ? months[opt] : opt.toString().padStart(2, "0")}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="block-time">
      <div className="dropdown">
        <button className="button-time" onClick={() => toggleDropdown("day")}>
          {day.toString().padStart(2, "0")} <img src={ph_caret_up_down} alt="Развернуть/Свернуть" />
        </button>
        {renderDropdown("day", days, setDay)}
      </div>

      <div className="dropdown">
        <button className="button-time" onClick={() => toggleDropdown("month")}>
          {months[month]} <img src={ph_caret_up_down} alt="Развернуть/Свернуть" />
        </button>
        {renderDropdown("month", months.map((_, i) => i), setMonth)}
      </div>

      <div className="dropdown">
        <button className="button-time" onClick={() => toggleDropdown("year")}>
          {year} <img src={ph_caret_up_down} alt="Развернуть/Свернуть" />
        </button>
        {renderDropdown("year", years, setYear)}
      </div>

      <div className="dropdown">
        <button className="button-time" onClick={() => toggleDropdown("hour")}>
          {hour.toString().padStart(2, "0")} <img src={ph_caret_up_down} alt="Развернуть/Свернуть" />
        </button>
        {renderDropdown("hour", hours, setHour)}
      </div>

      <div className="dropdown">
        <button className="button-time" onClick={() => toggleDropdown("minute")}>
          {minute.toString().padStart(2, "0")} <img src={ph_caret_up_down} alt="Развернуть/Свернуть" />
        </button>
        {renderDropdown("minute", minutes, setMinute)}
      </div>
    </div>
  );
}
