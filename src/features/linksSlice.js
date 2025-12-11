import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API = "http://localhost:5000";

export const fetchLinks = createAsyncThunk("links/fetch", async (userId) => {
  const res = await axios.get(`${API}/links/${userId}`);
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.links;
});

export const addLink = createAsyncThunk("links/add", async ({ long, userId, type }) => {
  const res = await axios.post(`${API}/links`, { long, userId, type });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.link;
});

export const deleteLink = createAsyncThunk("links/delete", async ({ userId, linkId }) => {
  const res = await axios.delete(`${API}/links/${userId}/${linkId}`);
  if (!res.data.success) throw new Error(res.data.message);
  return linkId;
});

// Обновление ссылки
export const updateLinkInStore = createAsyncThunk(
  "links/update",
  async ({ userId, linkId, data }) => {
    const res = await axios.put(`${API}/links/${userId}/${linkId}`, data);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.link; // вернём обновлённую ссылку
  }
);

const linksSlice = createSlice({
  name: "links",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLinks.pending, (state) => { state.loading = true; })
      .addCase(fetchLinks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(addLink.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(deleteLink.fulfilled, (state, action) => {
        state.items = state.items.filter(l => l.id !== action.payload);
      })
      .addCase(updateLinkInStore.fulfilled, (state, action) => {
        const idx = state.items.findIndex(l => l.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addMatcher((action) => action.type.endsWith("rejected"), (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default linksSlice.reducer;
