import { useState, useEffect } from "react";
import axios from "axios";
import LinkShortening from "../components/LinkShortening";
import LinkList from "../components/LinkList";

export default function HomePage({ user }) {
  const [links, setLinks] = useState([]);

  // Загрузка ссылок при входе пользователя
  useEffect(() => {
    if (!user?.id) return;

    axios
      .get(`http://localhost:5000/links/${user.id}`)
      .then((res) => {
        if (res.data.success) setLinks(res.data.links);
        else console.warn("Ошибка:", res.data.message);
      })
      .catch((err) => console.error("Ошибка загрузки ссылок:", err));
  }, [user]);

  // Переименование ссылки
  const handleRename = async (linkId, newTitle) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/links/${user.id}/${linkId}/title`,
        { title: newTitle }
      );
      if (res.data.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === linkId ? { ...l, title: newTitle } : l))
        );
      } else {
        alert(res.data.message || "Ошибка при переименовании");
      }
    } catch (err) {
      console.error("Ошибка при переименовании:", err);
    }
  };

  // Добавление новой ссылки
  const handleAddLink = async (url, type) => {
    try {
      const res = await axios.post("http://localhost:5000/links", {
        long: url,
        type,
        userId: user.id,
      });
      if (res.data.success) {
        setLinks((prev) => [...prev, res.data.link]);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Ошибка добавления ссылки:", err);
    }
  };

  // Удаление ссылки
  const handleDelete = async (linkId) => {
    try {
      const res = await axios.delete(
        `http://localhost:5000/links/${user.id}/${linkId}`
      );
      if (res.data.success) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      } else {
        alert(res.data.message || "Ошибка при удалении");
      }
    } catch (err) {
      console.error("Ошибка удаления ссылки:", err);
    }
  };

  return (
    <div className="home-page">
      <h1>Сокращение ссылок</h1>
      <p className="signature">Сделайте вашу ссылку короче и аккуратнее. Меньше символов — больше пользы.</p>
      <LinkShortening user={user} onAdd={handleAddLink} />
      <LinkList links={links} onDelete={handleDelete} onRename={handleRename} user={user} />
    </div>
  );
}
