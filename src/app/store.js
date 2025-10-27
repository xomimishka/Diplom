import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/userSlice";
import linksReducer from "../features/linksSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    links: linksReducer,
  },
});
