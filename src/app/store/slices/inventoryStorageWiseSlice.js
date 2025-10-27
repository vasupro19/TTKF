/* eslint-disable */
import { createSlice } from '@reduxjs/toolkit'

// Filter configuration for different tabs
const filterConfig = {
    storage: [
        {
            id: 1,
            name: 'location',
            label: 'Storage Location',
            value: null,
            options: ['Warehouse Longer text go here to test ellipsis we can show  that in tooltip', 'Warehouse B', 'Warehouse C']
        },
        {
            id: 2,
            name: 'category',
            label: 'Item Category',
            value: null,
            options: ['ElectronicsLonger text go here to test ellipsis we can show  that in tooltip', 'Furniture', 'Raw Materials']
        },
        {
            id: 3,
            name: 'status',
            label: 'Stock Status',
            value: null,
            options: ['In StockLonger text go here to test ellipsis we can show  that in tooltip', 'Low Stock', 'Out of Stock']
        },
        {
            id: 4,
            name: 'supplier',
            label: 'Supplier',
            value: null,
            options: ['Supplier XLonger text go here to test ellipsis we can show  that in tooltip', 'Supplier Y', 'Supplier Z']
        },
        {
            id: 5,
            name: 'lastAuditDate',
            label: 'Last Audit Date',
            value: null,
            options: ['Today', 'Last Week', 'Last Month']
        },
        {
            id: 6,
            name: 'batchNumber',
            label: 'Batch Number',
            value: null,
            options: ['Batch 001', 'Batch 002', 'Batch 003']
        },
        {
            id: 7,
            name: 'unitOfMeasure',
            label: 'Unit of Measure',
            value: null,
            options: ['Kg', 'Litres', 'Pieces']
        },
        {
            id: 8,
            name: 'stockAge',
            label: 'Stock Age',
            value: null,
            options: ['< 30 days', '30-90 days', '> 90 days']
        },
        {
            id: 9,
            name: 'temperatureRequirement',
            label: 'Temperature Requirement',
            value: null,
            options: ['Ambient', 'Chilled', 'Frozen']
        },
        {
            id: 10,
            name: 'hazardous',
            label: 'Hazardous Material',
            value: null,
            options: ['Yes', 'No']
        }
    ],
    receiving: [
        {
            id: 1,
            name: 'receiptDate',
            label: 'Receipt Date',
            value: null,
            options: ['Today', 'This Week', 'This Month']
        },
        { id: 2, name: 'vendor', label: 'Vendor', value: null, options: ['Vendor A', 'Vendor B', 'Vendor C'] },
        {
            id: 3,
            name: 'receiptStatus',
            label: 'Receipt Status',
            value: null,
            options: ['Pending', 'Received', 'Partially Received']
        },
        { id: 4, name: 'purchaseOrder', label: 'Purchase Order', value: null, options: ['PO123', 'PO456', 'PO789'] },
        {
            id: 5,
            name: 'receivedBy',
            label: 'Received By',
            value: null,
            options: ['John Doe', 'Jane Smith', 'David Lee']
        }
    ],
    picked: [
        {
            id: 1,
            name: 'orderNo',
            label: 'Order No',
            value: null,
            options: ['ORD12345', 'ORD67890', 'ORD11223', 'ORD44556']
        },
        {
            id: 2,
            name: 'channel',
            label: 'Channel',
            value: null,
            options: ['Amazon', 'Flipkart', 'Myntra', 'Shopify']
        },
        {
            id: 3,
            name: 'orderAging',
            label: 'Order Aging',
            value: null,
            options: [
                { label: 'Less than 2.5 hours', value: 'Less than 2.5 hours' },
                { label: 'Less than 4 hours', value: 'Less than 4 hours' },
                { label: 'Less than 6 hours', value: 'Less than 6 hours' },
                { label: 'More than 12 hours', value: 'More than 12 hours' }
            ]
        },
        { id: 4, name: 'pickDate', label: 'Pick Date', value: null, options: ['Today', 'Yesterday', 'This Week'] },
        { id: 5, name: 'picker', label: 'Picker', value: null, options: ['User A', 'User B', 'User C'] },
        {
            id: 6,
            name: 'pickStatus',
            label: 'Pick Status',
            value: null,
            options: ['Picked', 'Partially Picked', 'Pending']
        }
    ],
    kit_picked: [
        { id: 1, name: 'kitNumber', label: 'Kit Number', value: null, options: ['Kit A', 'Kit B', 'Kit C'] },
        {
            id: 2,
            name: 'kitPickStatus',
            label: 'Kit Pick Status',
            value: null,
            options: ['Completed', 'In Progress', 'Pending']
        },
        { id: 3, name: 'kitType', label: 'Kit Type', value: null, options: ['Standard', 'Custom'] },
        { id: 4, name: 'kitOwner', label: 'Kit Owner', value: null, options: ['Team A', 'Team B', 'Team C'] }
    ],
    cancel: [
        {
            id: 1,
            name: 'cancelReason',
            label: 'Cancel Reason',
            value: null,
            options: ['Out of Stock', 'Customer Request', 'System Error']
        },
        { id: 2, name: 'cancelDate', label: 'Cancel Date', value: null, options: ['Today', 'Yesterday', 'This Week'] },
        { id: 3, name: 'cancelInitiator', label: 'Cancel Initiator', value: null, options: ['System', 'Manual'] },
        { id: 4, name: 'orderType', label: 'Order Type', value: null, options: ['Single', 'Bulk'] },
        { id: 5, name: 'orderValue', label: 'Order Value', value: null, options: ['<100', '100-500', '>500'] }
    ],
    returned: [
        {
            id: 1,
            name: 'returnReason',
            label: 'Return Reason',
            value: null,
            options: ['Defective', 'Wrong Item', 'Customer Request']
        },
        {
            id: 2,
            name: 'returnStatus',
            label: 'Return Status',
            value: null,
            options: ['Pending', 'Processed', 'Refunded']
        },
        { id: 3, name: 'returnDate', label: 'Return Date', value: null, options: ['Today', 'This Week', 'This Month'] },
        { id: 4, name: 'returnHandler', label: 'Return Handler', value: null, options: ['Alice', 'Bob', 'Charlie'] },
        { id: 5, name: 'returnMethod', label: 'Return Method', value: null, options: ['Courier', 'In-Store'] },
        {
            id: 6,
            name: 'inspectionStatus',
            label: 'Inspection Status',
            value: null,
            options: ['Inspected', 'Not Inspected']
        }
    ],
    missing: [
        { id: 1, name: 'missingItem', label: 'Missing Item', value: null, options: ['Item A', 'Item B', 'Item C'] },
        { id: 2, name: 'missingReason', label: 'Missing Reason', value: null, options: ['Lost', 'Misplaced', 'Theft'] },
        {
            id: 3,
            name: 'reportedDate',
            label: 'Reported Date',
            value: null,
            options: ['Today', 'Yesterday', 'This Week']
        },
        {
            id: 4,
            name: 'reportedBy',
            label: 'Reported By',
            value: null,
            options: ['Employee A', 'Employee B', 'Employee C']
        },
        { id: 5, name: 'resolutionStatus', label: 'Resolution Status', value: null, options: ['Resolved', 'Pending'] },
        { id: 6, name: 'priorityLevel', label: 'Priority Level', value: null, options: ['Low', 'Medium', 'High'] }
    ]
}

const initialState = {
    currentSWITab: 'storage', // Use lowercase for consistency
    filterConfig: filterConfig,
    appliedFilters: {}, // Store applied filters for each tab
    activeFilters: {}, // Store current filter values being edited
    hasUnappliedChanges: false
}

const inventoryStorageWiseSlice = createSlice({
    name: 'inventoryStorageWise',
    initialState,
    reducers: {
        setCurrentSWITab: (state, action) => {
            state.currentSWITab = action.payload
            // Reset active filters when switching tabs
            state.activeFilters = {}
            // When switching tabs, assume no unapplied changes initially
            state.hasUnappliedChanges = false
        },

        setFilterValue: (state, action) => {
            const { filterName, value } = action.payload
            state.activeFilters[filterName] = value
            // Mark as having unapplied changes when a filter value is changed
            state.hasUnappliedChanges = true
        },

        setMultipleFilterValues: (state, action) => {
            // For setting multiple filter values at once
            state.activeFilters = { ...state.activeFilters, ...action.payload }
            state.hasUnappliedChanges = true
        },

        applyFilters: (state, action) => {
            const currentTab = state.currentSWITab
            // Only store filters that have values
            const filtersWithValues = Object.entries(state.activeFilters)
                .filter(([_, value]) => value !== null && value !== '')
                .reduce((acc, [key, value]) => {
                    acc[key] = value
                    return acc
                }, {})

            state.appliedFilters[currentTab] = filtersWithValues
            // After applying filters, there are no unapplied changes
            state.hasUnappliedChanges = false
        },

        clearFilters: (state, action) => {
            const currentTab = state.currentSWITab
            state.activeFilters = {}
            state.appliedFilters[currentTab] = {}
            // Clearing filters also means unapplied changes (unless it's already cleared)
            state.hasUnappliedChanges =
                Object.keys(state.activeFilters).length > 0 ||
                Object.keys(state.appliedFilters[currentTab] || {}).length > 0
        },

        clearSingleFilter: (state, action) => {
            const { filterName } = action.payload
            delete state.activeFilters[filterName]

            // Also remove from applied filters if it exists
            const currentTab = state.currentSWITab
            if (state.appliedFilters[currentTab]) {
                delete state.appliedFilters[currentTab][filterName]
            }
            // Mark as having unapplied changes after clearing a single filter
            state.hasUnappliedChanges = false
        },

        resetAllFilters: state => {
            state.activeFilters = {}
            state.appliedFilters = {}
            state.hasUnappliedChanges = false
        },

        loadAppliedFiltersToActive: (state, action) => {
            // Load applied filters back to active filters for editing
            const currentTab = state.currentSWITab
            state.activeFilters = { ...(state.appliedFilters[currentTab] || {}) }
            // When loading applied filters, there are no unapplied changes initially
            state.hasUnappliedChanges = false
        },

        resetSWITabs: state => {
            return initialState
        }
    }
})

export const {
    setCurrentSWITab,
    setFilterValue,
    setMultipleFilterValues,
    applyFilters,
    clearFilters,
    clearSingleFilter,
    resetAllFilters,
    loadAppliedFiltersToActive,
    resetSWITabs
} = inventoryStorageWiseSlice.actions

// Selectors
export const selectCurrentTab = state => state.inventoryStorageWise.currentSWITab
export const selectFilterConfig = state => state.inventoryStorageWise.filterConfig
export const selectCurrentTabFilterConfig = state => {
    const currentTab = state.inventoryStorageWise.currentSWITab
    return state.inventoryStorageWise.filterConfig[currentTab] || []
}
export const selectActiveFilters = state => state.inventoryStorageWise.activeFilters
export const selectAppliedFilters = state => state.inventoryStorageWise.appliedFilters
export const selectCurrentTabAppliedFilters = state => {
    const currentTab = state.inventoryStorageWise.currentSWITab
    return state.inventoryStorageWise.appliedFilters[currentTab] || {}
}
export const selectHasActiveFilters = state =>
    Object.values(state.inventoryStorageWise.activeFilters).some(value => value !== null && value !== '')
export const selectHasAppliedFilters = state => {
    const currentTab = state.inventoryStorageWise.currentSWITab
    const appliedFilters = state.inventoryStorageWise.appliedFilters[currentTab] || {}
    return Object.keys(appliedFilters).length > 0
}
// New selector for unapplied changes
export const selectHasUnappliedChanges = state => state.inventoryStorageWise.hasUnappliedChanges

export default inventoryStorageWiseSlice.reducer
