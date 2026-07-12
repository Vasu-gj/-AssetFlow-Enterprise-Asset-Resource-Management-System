import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../features/auth/authSlice.js';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    const tenantId = getState().auth.tenantId;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    if (tenantId) {
      headers.set('x-tenant-id', tenantId);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // try to get a new access token using refresh token cookie
    const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);
    if (refreshResult?.data) {
      // store the new token
      api.dispatch(setCredentials({ 
        user: refreshResult.data.data.user, 
        accessToken: refreshResult.data.data.accessToken 
      }));
      // retry the original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Department', 'Category', 'Asset', 'Allocation', 'Transfer', 'Booking', 'Maintenance', 'Audit', 'Notification', 'Log'],
  endpoints: (builder) => ({}),
});
