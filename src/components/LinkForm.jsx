import { useState } from "react";
import axios from "axios";

export default function LinkForm({ onAdd, userId }) {
  const [url, setUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return alert("Введите URL");

    try {
      const response = await axios.post("http://localhost:5000/links", {
        long: url,
        userId: userId || null,
        type: !!isPublic, // true = public, false = private
      });

      if (response.data && response.data.success) {
        onAdd(response.data.link);
        setUrl("");
      } else {
        alert(response.data?.message || "Не удалось добавить ссылку");
      }
    } catch (err) {
      console.error("Ошибка при добавлении ссылки:", err);
      const msg = err.response?.data?.message || err.message || "Ошибка сети";
      alert(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Вставьте длинную ссылку"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <label >
        <input
          type="checkbox"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
        />{" "}
        публичная
      </label>
      <button type="submit" >Сократить</button>
    </form>
  );
}
