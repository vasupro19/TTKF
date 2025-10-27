import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    zones: [],
    // data from scan/validate ean api
    currentPick: {
        pickId: null,
        storageAddress: null,
        bin: null,
        bin_id: null,
        pickNo: null,
        totalPickedQuantity: 0,
        pendingQuantity: 0
    },
    selectedZone: {
        zoneId: null,
        zone: null
    },
    lastScannedItem: {
        lot: null,
        mfd: null,
        exp: null,
        mrp: null,
        ean: null
    },
    refetchSkuList: false
}

const pickSlice = createSlice({
    name: 'PickData',
    initialState,
    reducers: {
        setZones: (state, action) => {
            state.zones = action.payload || []
        },
        setPickData: (state, action) => {
            state.currentPick.pickId = action.payload.pickId || null
            state.currentPick.storageAddress = action.payload?.storageAddress || null
            state.currentPick.bin = action.payload?.bin || null
            state.currentPick.bin_id = action.payload?.bin_id || null
            state.currentPick.pickNo = action.payload?.pickNo || null
            state.currentPick.totalPickedQuantity = action.payload?.totalPickedQuantity || 0
            state.currentPick.pendingQuantity = action.payload?.pendingQuantity || 0
        },
        setSelectedZone: (state, action) => {
            state.selectedZone = {
                zoneId: action.payload.zone_id || null,
                zone: action.payload.zone || null
            }
        },
        setLastScannedItem: (state, action) => {
            state.lastScannedItem = {
                lot: action.payload?.lot || null,
                mfd: action.payload?.mfd || null,
                exp: action.payload?.exp || null,
                mrp: action.payload?.mrp || null,
                ean: action.payload?.ean || null
            }
        },
        setRefetchList: (state, action) => {
            state.refetchSkuList = action.payload || false
        }
    }
})

export const { setZones, setPickData, setSelectedZone, setLastScannedItem, setRefetchList } = pickSlice.actions
export default pickSlice.reducer
