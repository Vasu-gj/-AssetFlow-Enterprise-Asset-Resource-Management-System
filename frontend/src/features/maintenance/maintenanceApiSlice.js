import { apiSlice } from '../../api/apiSlice.js';

export const maintenanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceRequests: builder.query({
      query: (params) => ({
        url: '/maintenance-requests',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Maintenance', id: _id })), { type: 'Maintenance', id: 'LIST' }]
          : [{ type: 'Maintenance', id: 'LIST' }],
    }),
    createMaintenanceRequest: builder.mutation({
      query: (body) => ({
        url: '/maintenance-requests',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Maintenance', id: 'LIST' }],
    }),
    approveMaintenance: builder.mutation({
      query: (id) => ({
        url: `/maintenance-requests/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Maintenance', id }, { type: 'Maintenance', id: 'LIST' }, { type: 'Asset', id: 'LIST' }],
    }),
    rejectMaintenance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/maintenance-requests/${id}/reject`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Maintenance', id }, { type: 'Maintenance', id: 'LIST' }],
    }),
    assignTechnician: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/maintenance-requests/${id}/assign`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Maintenance', id }, { type: 'Maintenance', id: 'LIST' }],
    }),
    updateMaintenanceProgress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/maintenance-requests/${id}/progress`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Maintenance', id }, { type: 'Maintenance', id: 'LIST' }, { type: 'Asset', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMaintenanceRequestsQuery,
  useCreateMaintenanceRequestMutation,
  useApproveMaintenanceMutation,
  useRejectMaintenanceMutation,
  useAssignTechnicianMutation,
  useUpdateMaintenanceProgressMutation,
} = maintenanceApiSlice;
