import { apiSlice } from '../../api/apiSlice.js';

export const reportsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardKPIs: builder.query({
      query: () => '/reports/dashboard/kpis',
    }),
    getUtilizationReport: builder.query({
      query: () => '/reports/utilization',
    }),
    getMaintenanceFrequency: builder.query({
      query: () => '/reports/maintenance-frequency',
    }),
    getRetirementForecast: builder.query({
      query: () => '/reports/retirement-forecast',
    }),
    getDepartmentSummary: builder.query({
      query: () => '/reports/department-allocation-summary',
    }),
    getBookingHeatmap: builder.query({
      query: () => '/reports/booking-heatmap',
    }),
  }),
});

export const {
  useGetDashboardKPIsQuery,
  useGetUtilizationReportQuery,
  useGetMaintenanceFrequencyQuery,
  useGetRetirementForecastQuery,
  useGetDepartmentSummaryQuery,
  useGetBookingHeatmapQuery,
} = reportsApiSlice;
