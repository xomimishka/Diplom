import { configureStore } from "@reduxjs/toolkit";
import linksReducer from "../features/linksSlice";
import userReducer from "../features/userSlice";

export default configureStore({
  reducer: {
    links: linksReducer,
    user: userReducer,
  },
});