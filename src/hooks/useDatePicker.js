import { useState, useEffect } from "react";

/**
 * Custom hook для управления датой с разбивкой на день, месяц, год, час, минуту
 */
export function useDatePicker(initialDate = null) {
  const dateObj = initialDate ? new Date(initialDate) : new Date();

  const [day, setDay] = useState(dateObj.getDate());
  const [month, setMonth] = useState(dateObj.getMonth());
  const [year, setYear] = useState(dateObj.getFullYear());
  const [hour, setHour] = useState(dateObj.getHours());
  const [minute, setMinute] = useState(dateObj.getMinutes());

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Автоматически корректируем день если он превышает дни в месяце
  useEffect(() => {
    if (day > daysInMonth) setDay(daysInMonth);
  }, [day, month, year, daysInMonth]);

  const toDate = () => new Date(year, month, day, hour, minute);

  return {
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    hour,
    setHour,
    minute,
    setMinute,
    daysInMonth,
    toDate,
  };
}
