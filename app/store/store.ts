"use client";

import { configureStore } from "@reduxjs/toolkit";
import poolsReducer from "./pools-slice";
import farmReducer from "./farm-slice"

export const store = configureStore({
  reducer: {
    pools: poolsReducer,
    farm:farmReducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
