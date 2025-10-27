import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const API = "http://localhost:5000";

export const loginUser = createAsyncThunk("user/login", async ({ login, password }) => {
  const res = await axios.post(`${API}/login`, { login, password });
  if (!res.data.success) throw new Error(res.data.message);
  return res.data.user;
});

const userSlice = createSlice({
  name: "user",
  initialState: { data: null, loading: false, error: null },
  reducers: {
    logout: (state) => {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
