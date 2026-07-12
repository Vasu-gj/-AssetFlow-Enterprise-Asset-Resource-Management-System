import { apiSlice } from '../../api/apiSlice.js';

export const departmentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: () => '/departments',
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: 'Department', id: _id })), { type: 'Department', id: 'LIST' }]
          : [{ type: 'Department', id: 'LIST' }],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} = departmentsApiSlice;
