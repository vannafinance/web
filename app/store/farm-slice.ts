"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { mockPools } from "../lib/static-values";
import { RootState } from "../store/store"; // assuming store.ts is in same folder

interface FarmInitalData {
  FarmData: PoolsType[] | undefined;
}

const initialState: FarmInitalData = {
  FarmData: mockPools,
};

const FarmDataSlice = createSlice({
  name: "farm",
  initialState,
  reducers: {
    setFarmData: (state, action: PayloadAction<PoolsType[]>) => {
      state.FarmData = action.payload;
    },
  },
});

export const { setFarmData } = FarmDataSlice.actions;

export const selectFarmData = (state: RootState) => state.farm.FarmData;

// Selector to get a pool by id
export const selectFarmDataById = (id: string) => (state: RootState) => {
  return state.farm.FarmData?.find(
    (pool: PoolsType) => String(pool.id) === String(id)
  );
};

export default FarmDataSlice.reducer;
