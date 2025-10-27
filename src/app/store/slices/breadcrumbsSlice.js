import { createSlice } from '@reduxjs/toolkit'

const breadcrumbsSlice = createSlice({
    name: 'breadcrumbs',
    initialState: {
        customBreadcrumbs: null
    },
    reducers: {
        setCustomBreadcrumbs: (state, action) => {
            state.customBreadcrumbs = action.payload
        },
        clearCustomBreadcrumbs: state => {
            state.customBreadcrumbs = null
        }
    }
})

export const { setCustomBreadcrumbs, clearCustomBreadcrumbs } = breadcrumbsSlice.actions
export default breadcrumbsSlice.reducer
