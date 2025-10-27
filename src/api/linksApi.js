import axios from "axios";
const API = "http://localhost:5000";

export const fetchUserLinks = (userId) => axios.get(`${API}/links/${userId}`);
export const createLink = (data) => axios.post(`${API}/links`, data); // data: { long, userId, type }
export const deleteLink = (userId, linkId) => axios.delete(`${API}/links/${userId}/${linkId}`);
