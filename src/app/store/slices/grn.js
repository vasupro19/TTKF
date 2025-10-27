import { getObjectKeys } from '@/utilities'
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    grnList: [],
    skuData: {
        id: null,
        no: null,
        no_2: null,
        description: null,
        description_2: null,
        image: [],
        mrp_price: null,
        unit_price: null,
        dual_mrp: null,
        manufacturing_reqd: null,
        expiry_reqd: null,
        lot_reqd: null,
        item_properties: {
            'SKU No': 'N/A',
            Name: 'N/A',
            Description: 'N/A'
        },
        geSkuDetail: null
    }, // data from scan/validate ean api
    boxIdData: {
        gate_entry_id: null,
        document_no: null,
        document_type: null,
        ext_document_no: null,
        document_id: null,
        invoice_no: null,
        invoice_date: null,
        invoice_quantity: null
    }, // data from scan boxId api
    binData: {
        bin_id: null,
        bin_no: null,
        qc_status: 'ok',
        quantity: null
    },
    uidData: {
        uid: '',
        external_uid: ''
    },
    grnData: {
        no: null,
        id: null
    },
    shouldRemoveGrn: false,
    refetchGateEntries: false
}

const grnSlice = createSlice({
    name: 'grn',
    initialState,
    reducers: {
        setGrnList: (state, action) => {
            state.grnList = action.payload || []
        },
        setSkuData: (state, action) => {
            const geSkuDetail = {}
            // eslint-disable-next-line no-unused-expressions
            action.payload?.geSkuDetail &&
                getObjectKeys(action.payload?.geSkuDetail).map(
                    // eslint-disable-next-line no-return-assign
                    key =>
                        (geSkuDetail[key] = action.payload?.geSkuDetail[key]
                            ? action.payload?.geSkuDetail[key].split(',')
                            : [])
                )
            state.skuData = {
                id: action.payload.id || null,
                no: action.payload.no || null,
                no_2: action.payload.no_2 || null,
                description: action.payload.description || null,
                description_2: action.payload.description_2 || null,
                image: action.payload.image || [],
                mrp_price: action.payload.mrp_price || null,
                unit_price: action.payload.unit_price || null,
                dual_mrp: action.payload.dual_mrp || null,
                manufacturing_reqd: action.payload.manufacturing_reqd || null,
                expiry_reqd: action.payload.expiry_reqd || null,
                lot_reqd: action.payload.lot_reqd || null,
                item_properties:
                    {
                        'SKU No': `${action.payload.no_2}/${action.payload.no}`,
                        Name: action.payload.description,
                        Description: action.payload.description_2,
                        ...(action.payload?.item_properties ? action.payload.item_properties : {})
                    } || null,
                geSkuDetail
            }
        },
        setBoxIdData: (state, action) => {
            state.boxIdData = {
                gate_entry_id: action.payload.gate_entry_id || null,
                document_no: action.payload.document_no || null,
                document_type: action.payload.document_type || null,
                ext_document_no: action.payload.ext_document_no || null,
                document_id: action.payload.document_id || null,
                invoice_no: action.payload.invoice_no || null,
                invoice_date: action.payload.invoice_date || null,
                invoice_quantity: action.payload.invoice_quantity || null
            }
        },
        setBinData: (state, action) => {
            state.binData = {
                bin_id: action.payload.bin_id,
                bin_no: action.payload.bin_no,
                qc_status: action.payload?.qc_status || 'ok',
                quantity: action.payload.quantity
            }
        },
        setUidData: (state, action) => {
            state.uidData = {
                uid: action.payload?.uid || null,
                external_uid: action.payload?.external_uid || null
            }
        },
        setGrnData: (state, action) => {
            state.grnData = {
                no: action.payload.no,
                id: action.payload.id
            }
        },
        setRefetchGateEntries: (state, action) => {
            state.refetchGateEntries = action.payload || false
        },
        setShouldRemoveGrn: (state, action) => {
            state.shouldRemoveGrn = action.payload
        },
        removeSkuData: state => {
            state.skuData = {
                ...initialState.skuData
            }
        },
        removeBoxIdData: state => {
            state.boxIdData = {
                ...initialState.boxIdData
            }
        },
        removeData: state => {
            state.currentOptions = { ...initialState }
        },
        removeBinData: state => {
            state.binData = initialState.binData
        },
        removeUidData: state => {
            state.uidData = initialState.uidData
        },
        removeGrnData: state => {
            state.grnData = initialState.grnData
            state.skuData = initialState.skuData
            state.binData = initialState.binData
            state.boxIdData = initialState.boxIdData
            state.uidData = initialState.uidData
        }
    }
})

export const {
    setGrnList,
    setSkuData,
    setBoxIdData,
    setBinData,
    setUidData,
    setGrnData,
    removeBoxIdData,
    removeSkuData,
    removeData,
    removeBinData,
    removeUidData,
    removeGrnData,
    setShouldRemoveGrn,
    setRefetchGateEntries
} = grnSlice.actions
export default grnSlice.reducer
