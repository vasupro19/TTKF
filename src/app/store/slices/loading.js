import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    fullScreenCount: 0
}

const loadingSlice = createSlice({
    name: 'loading',
    initialState,
    reducers: {
        setActiveRequests: (state, action) => {
            const { key } = action.payload
            state.activeRequests += 1
            state[key] = true
        },
        removeActiveRequests: (state, action) => {
            const { key } = action.payload
            state.activeRequests -= 1
            state[key] = false
            // state.getCityDTB = true
        },
        incrementGlobalActiveRequest: state => {
            state.fullScreenCount += 1
        },
        decrementGlobalActiveRequest: state => {
            state.fullScreenCount -= 1
        }
    }
})

export const selectIsGlobalLoading = state => state.loading.fullScreenCount > 0
export const { setActiveRequests, removeActiveRequests, incrementGlobalActiveRequest, decrementGlobalActiveRequest } =
    loadingSlice.actions
export const Loading = loadingSlice.reducer
