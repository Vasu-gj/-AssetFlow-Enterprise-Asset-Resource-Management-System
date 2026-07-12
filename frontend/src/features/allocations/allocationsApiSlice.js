import { apiSlice } from '../../api/apiSlice.js';

export const allocationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllocations: builder.query({
      query: (params) => ({
        url: '/allocations',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Allocation', id: _id })), { type: 'Allocation', id: 'LIST' }]
          : [{ type: 'Allocation', id: 'LIST' }],
    }),
    allocateAsset: builder.mutation({
      query: (body) => ({
        url: '/allocations',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Allocation', id: 'LIST' }, { type: 'Asset', id: 'LIST' }],
    }),
    returnAsset: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/allocations/${id}/return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Allocation', id }, { type: 'Allocation', id: 'LIST' }, { type: 'Asset', id: 'LIST' }],
    }),
    getTransferRequests: builder.query({
      query: () => '/allocations/transfer-requests',
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Transfer', id: _id })), { type: 'Transfer', id: 'LIST' }]
          : [{ type: 'Transfer', id: 'LIST' }],
    }),
    createTransferRequest: builder.mutation({
      query: (body) => ({
        url: '/allocations/transfer-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Transfer', id: 'LIST' }],
    }),
    approveTransfer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/allocations/transfer-requests/${id}/approve`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Transfer', id }, { type: 'Transfer', id: 'LIST' }, { type: 'Allocation', id: 'LIST' }, { type: 'Asset', id: 'LIST' }],
    }),
    rejectTransfer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/allocations/transfer-requests/${id}/reject`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Transfer', id }, { type: 'Transfer', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllocationsQuery,
  useAllocateAssetMutation,
  useReturnAssetMutation,
  useGetTransferRequestsQuery,
  useCreateTransferRequestMutation,
  useApproveTransferMutation,
  useRejectTransferMutation,
} = allocationsApiSlice;
