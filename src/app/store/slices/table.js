import { createSlice } from '@reduxjs/toolkit'
import { createQueryString } from '@/utilities'

const initialState = {
    title: '',
    headers: [],
    data: [],
    limit: 10,
    page: 1,
    totalPage: 0,
    sort: {},
    filters: {},
    query: ''
}

const TableSlice = createSlice({
    name: 'dataGrid',
    initialState,
    reducers: {
        setTotalPage: (state, action) => {
            state.totalPage = action.payload
        },
        nextPage: state => {
            if (state.page < state.totalPage) {
                state.page += 1
            }
        },
        prevPage: state => {
            if (state.page > 1) {
                state.page -= 1
            }
        },
        changeLimit: (state, action) => {
            state.limit = action.payload
            state.page = 1 // Reset to first page on limit change
        },
        modifyFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
            state.page = 1 // Reset to first page on filter change
        },
        setHeader: (state, action) => {
            state.headers = action.payload
        },
        setData: (state, action) => {
            state.data = action.payload.data
            state.totalPage = action.payload.totalPage
        },
        generateQuery: state => {
            state.query = createQueryString(state.filters)
        },
        resetTable: state => initialState
    }
})

export const { nextPage, prevPage, changeLimit, modifyFilters, setHeader } = TableSlice.actions
