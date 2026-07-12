import { apiSlice } from '../../api/apiSlice.js';

export const bookingsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: (params) => ({
        url: '/bookings',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Booking', id: _id })), { type: 'Booking', id: 'LIST' }]
          : [{ type: 'Booking', id: 'LIST' }],
    }),
    createBooking: builder.mutation({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Booking', id: 'LIST' }],
    }),
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Booking', id }, { type: 'Booking', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
} = bookingsApiSlice;
