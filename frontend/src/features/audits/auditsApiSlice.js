import { apiSlice } from '../../api/apiSlice.js';

export const auditsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditCycles: builder.query({
      query: () => '/audit-cycles',
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Audit', id: _id })), { type: 'Audit', id: 'LIST' }]
          : [{ type: 'Audit', id: 'LIST' }],
    }),
    createAuditCycle: builder.mutation({
      query: (body) => ({
        url: '/audit-cycles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Audit', id: 'LIST' }],
    }),
    markAuditEntry: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/audit-cycles/${id}/entries`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Audit', id }, { type: 'Audit', id: 'LIST' }],
    }),
    getDiscrepancyReport: builder.query({
      query: (id) => `/audit-cycles/${id}/discrepancy-report`,
      providesTags: (result, error, id) => [{ type: 'Audit', id: `DISCREPANCY_${id}` }],
    }),
    closeAuditCycle: builder.mutation({
      query: (id) => ({
        url: `/audit-cycles/${id}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Audit', id }, { type: 'Audit', id: 'LIST' }, { type: 'Asset', id: 'LIST' }, { type: 'Maintenance', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAuditCyclesQuery,
  useCreateAuditCycleMutation,
  useMarkAuditEntryMutation,
  useGetDiscrepancyReportQuery,
  useCloseAuditCycleMutation,
} = auditsApiSlice;
