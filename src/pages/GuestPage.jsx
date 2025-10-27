import { useState, useEffect } from "react";
import axios from "axios";
import LinkShortening from "../components/LinkShortening";
import LinkList from "../components/LinkList";

export default function GuestPage() {
  const [links, setLinks] = useState([]);

  // Загружаем ссылки из localStorage (история гостя)
  useEffect(() => {
    const saved = localStorage.getItem("guest_links");
    if (saved) setLinks(JSON.parse(saved));
  }, []);

  // Сохраняем при изменении
  useEffect(() => {
    localStorage.setItem("guest_links", JSON.stringify(links));
  }, [links]);

  // Создание публичной ссылки (у гостя всегда type = true)
  const handleAddLink = async (url) => {
    try {
      const res = await axios.post("http://localhost:5000/links", {
        long: url,
        type: true, // публичная
      });

      if (res.data.success) {
        const newLink = res.data.link;
        setLinks((prev) => [...prev, newLink]);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Ошибка при создании ссылки:", err);
      alert("Ошибка сервера");
    }
  };

  return (
    <div>
      <h1>Сокращение ссылок</h1>
      <p className="signature">Сделайте вашу ссылку короче и аккуратнее. Меньше символов — больше пользы.</p>
      <LinkShortening onAdd={handleAddLink} guestMode />
      <LinkList links={links} />
    </div>
  );
}
