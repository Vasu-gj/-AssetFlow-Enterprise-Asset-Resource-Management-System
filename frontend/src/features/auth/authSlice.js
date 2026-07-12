import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  tenantId: localStorage.getItem('tenantId') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      if (user?.tenantId) {
        state.tenantId = user.tenantId;
        localStorage.setItem('tenantId', user.tenantId);
      }
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
    },
    logOut(state) {
      state.user = null;
      state.accessToken = null;
      state.tenantId = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tenantId');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.accessToken;
export const selectCurrentTenant = (state) => state.auth.tenantId;
