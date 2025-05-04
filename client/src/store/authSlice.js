import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tokenExpired: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    tokenExpired: (state) => {
      state.tokenExpired = true;
    },
    resetTokenExpired: (state) => {
      state.tokenExpired = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('auth/tokenExpired', (state) => {
        state.tokenExpired = true;
      })
      .addCase('auth/resetTokenExpired', (state) => {
        state.tokenExpired = false;
      });
  }
});

export const { tokenExpired, resetTokenExpired } = authSlice.actions;

export default authSlice.reducer;
