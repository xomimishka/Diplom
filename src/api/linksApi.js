import axios from "axios";
const API = "http://localhost:5000";

export const fetchUserLinks = (userId) => axios.get(`${API}/links/${userId}`);
export const createLink = (data) => axios.post(`${API}/links`, data);
export const deleteLink = (userId, linkId) => axios.delete(`${API}/links/${userId}/${linkId}`);

// Универсальное обновление ссылки (даты, long)
export const updateLink = (userId, linkId, data) =>
  axios.put(`${API}/links/${userId}/${linkId}`, data);

// Отдельное обновление дат
export const updateLinkDates = (userId, linkId, dates) =>
  axios.put(`${API}/links/${userId}/${linkId}`, dates);

// Изменение названия
export async function renameTitle(userId, linkId, title) {
  return axios.put(`${API}/links/${userId}/${linkId}/title`, { title });
}