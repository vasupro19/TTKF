import { customResponseHandler, dispatchLoaderEvent } from '@store/helpers'
import { apiSliceConfig } from './configSlice'

export const jobSlice = apiSliceConfig.injectEndpoints({
    endpoints: build => ({
        submitJobApplication: build.mutation({
            query: payload => {
                const KEY = 'submitJobApplicationKey'
                dispatchLoaderEvent(KEY)

                return {
                    url: '/jobs/public/apply',
                    method: 'POST',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['jobApplication']
        }),

        getJobApplicationStatus: build.query({
            query: ({ email, phone }) => ({
                url: `/jobs/public/status?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`,
                responseHandler: async result => customResponseHandler({ result })
            }),
            providesTags: ['jobApplication']
        }),

        getJobCandidates: build.query({
            query: (query, removeLoader = true) => {
                const KEY = 'getJobCandidatesKey'
                dispatchLoaderEvent(KEY)

                return {
                    url: `/jobs/candidates${query || ''}`,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY, removeLoader })
                }
            },
            providesTags: ['jobCandidates']
        }),

        updateJobCandidate: build.mutation({
            query: ({ id, ...payload }) => {
                const KEY = 'updateJobCandidateKey'
                dispatchLoaderEvent(KEY)

                return {
                    url: `/jobs/candidates/${id}`,
                    method: 'PUT',
                    body: payload,
                    responseHandler: async result => customResponseHandler({ result, requestKey: KEY })
                }
            },
            invalidatesTags: ['jobCandidates', 'jobCandidateById']
        })
    })
})

export const {
    useSubmitJobApplicationMutation,
    useLazyGetJobApplicationStatusQuery,
    useGetJobCandidatesQuery,
    useUpdateJobCandidateMutation,
    endpoints: { getJobCandidates }
} = jobSlice
