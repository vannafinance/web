"use client";

import { configureStore } from "@reduxjs/toolkit";
import poolsReducer from "./pools-slice";

export const store = configureStore({
  reducer: {
    pools: poolsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
