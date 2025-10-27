import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    pendingPutAwayData: []
}

const putAway = createSlice({
    name: 'putAway',
    initialState,
    reducers: {
        setPendingPutAwayData: (state, action) => {
            state.pendingPutAwayData = action.payload
        },
        removeItemFromPendingPutAwayData: (state, action) => {
            state.pendingPutAwayData = state.pendingPutAwayData.filter(
                item => item.uid !== action.payload && item.external_uid !== action.payload
            )
        }
    }
})

export const { setPendingPutAwayData, removeItemFromPendingPutAwayData } = putAway.actions
export const PutAway = putAway.reducer
