import { apiSlice } from '../../api/apiSlice.js';

export const assetsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query({
      query: (params) => ({
        url: '/assets',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Asset', id: _id })), { type: 'Asset', id: 'LIST' }]
          : [{ type: 'Asset', id: 'LIST' }],
    }),
    getAssetById: builder.query({
      query: (id) => `/assets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Asset', id }],
    }),
    createAsset: builder.mutation({
      query: (body) => ({
        url: '/assets',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Asset', id: 'LIST' }],
    }),
    updateAsset: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/assets/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Asset', id }, { type: 'Asset', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useGetAssetByIdQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
} = assetsApiSlice;
