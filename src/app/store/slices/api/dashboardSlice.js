import { customResponseHandler } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

// ? the dashboard's figures, counted by the server over every lead and booking (the page used to download the
// ? first 1,000 of each and count them itself)
export const dashboardSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        getDashboard: build.query({
            query: () => ({
                url: '/dashboard',
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['dashboard']
        })
    })
})

export const { useGetDashboardQuery } = dashboardSlice
