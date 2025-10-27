import { createSlice } from '@reduxjs/toolkit'

const initialState = []

const routeLabelSlice = createSlice({
    name: 'routeLabel',
    initialState,
    reducers: {
        setRouteLabel: (state, action) => action.payload
    }
})

export const { setRouteLabel } = routeLabelSlice.actions
export const routeLabelVal = state => state.routeLabel
/* eslint-disable */
export const RouteLabel = routeLabelSlice.reducer