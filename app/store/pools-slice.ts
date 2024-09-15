"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { poolsPlaceholder } from "../lib/static-values";

interface PoolsState {
  poolsData: PoolTable[];
}

const initialState: PoolsState = {
  poolsData: poolsPlaceholder,
};

const poolsSlice = createSlice({
  name: "pools",
  initialState,
  reducers: {
    setPoolsData: (state, action: PayloadAction<PoolTable[]>) => {
      state.poolsData = action.payload;
    },
  },
});

export const { setPoolsData } = poolsSlice.actions;

export default poolsSlice.reducer;
