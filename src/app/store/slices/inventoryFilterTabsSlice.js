import { createSlice } from '@reduxjs/toolkit'

const initialState = [
    { label: 'Storage', acc: 'storage', count: 0 },
    { label: 'Receiving', acc: 'receiving', count: 0 },
    { label: 'Picked', acc: 'picked', count: 0 }, // This will show as 99+
    { label: 'Kit Picked', acc: 'kit_picked', count: 0 },
    { label: 'Cancel', acc: 'cancel', count: 0 },
    { label: 'Return', acc: 'returned', count: 0 }, // No badge will show
    { label: 'Missing', acc: 'missing', count: 0 }
]

const inventoryFilter = createSlice({
    name: 'inventoryFilterCount',
    initialState,
    reducers: {
        addFilterCounts: (state, action) => {
            state.forEach(item => {
                item.count = action?.payload[item?.acc] || 0
            })
            return state
        },
        removeFilterCounts: state => {
            state.forEach(item => {
                item.count = 0
            })
            return state
        }
    }
})

export const { addFilterCounts, removeFilterCounts } = inventoryFilter.actions
export const inventoryFilterCount = inventoryFilter.reducer
