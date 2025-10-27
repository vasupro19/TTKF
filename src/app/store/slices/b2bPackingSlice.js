// b2bPackingSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    currentStep: 'TABLE_ID',
    tableId: '',
    scannedOrderId: null,
    boxId: null,
    orderNo: null,
    config: {}
}

const b2bPackingSlice = createSlice({
    name: 'packing',
    initialState,
    reducers: {
        setCurrentStep: (state, action) => {
            state.currentStep = action.payload
        },
        setTableId: (state, action) => {
            state.tableId = action.payload
        },
        setScannedOrderId: (state, action) => {
            state.scannedOrderId = action.payload
        },
        setBoxId: (state, action) => {
            state.boxId = action.payload
        },
        resetPacking: (state, action) => {
            if (action.payload) {
                state.currentStep = action.payload.currentStep || initialState.currentStep
                state.tableId = action.payload.tableId || initialState.tableId
                state.scannedOrderId = action.payload.scannedOrderId || initialState.scannedOrderId
                state.boxId = action.payload.boxId || initialState.boxId
            } else {
                state.currentStep = initialState.currentStep
                state.tableId = initialState.tableId
                state.scannedOrderId = initialState.scannedOrderId
                state.boxId = initialState.boxId
            }
        }
    }
})

export const { setCurrentStep, setTableId, setScannedOrderId, setBoxId, resetPacking } = b2bPackingSlice.actions

export default b2bPackingSlice.reducer
