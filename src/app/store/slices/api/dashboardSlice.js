import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const dashboardSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        // ? the dashboard's numbers, worked out on the server: `{ from, to, assignedTo }` (all optional; this month)
        getDashboardSummary: build.query({
            query: ({ from, to, assignedTo } = {}) => {
                const params = new URLSearchParams()
                if (from) params.set('from', from)
                if (to) params.set('to', to)
                if (assignedTo) params.set('assignedTo', String(assignedTo))
                const text = params.toString()
                return {
                    url: `/dashboard/summary${text ? `?${text}` : ''}`,
                    responseHandler: async result => customResponseHandler({ result })
                }
            },
            // ? a lead or booking changed anywhere (verified, converted, a payment taken): the numbers are stale
            providesTags: ['dashboardSummary', 'getLeads', 'confirmedBooking', 'GuestPayment', 'PaymentHistory']
        })
    })
})

export const { useGetDashboardSummaryQuery } = dashboardSlice
