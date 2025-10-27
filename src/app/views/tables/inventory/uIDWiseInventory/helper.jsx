// export const headers = [
//     {
//         id: 999,
//         label: 'Sr. No.',
//         search: false,
//         sort: false,
//         stick: true,
//         key: 's_no',
//         isFrontend: true,
//         visible: true,
//         minWidth: 3.188,
//         maxWidth: 3.188
//     },
//     {
//         id: 19,
//         label: 'SKU No', // Matches 'SKU No' in config
//         search: true,
//         sort: true,
//         key: 'no',
//         visible: true,
//         stick: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 39,
//         label: 'UID',
//         search: true,
//         sort: true,
//         key: 'uid',
//         visible: true,
//         stick: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 10,
//         label: 'Bin No', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'bin_no',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 4,
//         label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'address',
//         visible: true,
//         minWidth: 10,
//         maxWidth: 10
//     },
//     {
//         id: 22,
//         label: 'Storage Type', // Matches 'Storage Type' in config
//         search: false,
//         sort: false,
//         filter: true,
//         options: ['BIN', 'SELLABLE', 'QUARANTINE'],
//         key: 'storage_type',
//         visible: true,
//         minWidth: 9,
//         maxWidth: 9
//     },
//     {
//         id: 20,
//         label: 'Description', // Matches 'Description' in config
//         search: true,
//         sort: true,
//         key: 'description',
//         visible: true,
//         minWidth: 10,
//         maxWidth: 10
//     },
//     {
//         id: 23,
//         label: 'Inventory Type', // Matches 'Inventory Type' in config
//         search: false,
//         sort: false,
//         filter: true,
//         options: ['GOOD', 'BAD'],
//         key: 'inventory_type',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 30,
//         label: 'Total Quantity', // Matches 'Total Quantity' in config
//         search: true,
//         sort: true,
//         key: 'total_quantity',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 31,
//         label: 'Available Quantity', // Matches 'Available Quantity' in config
//         search: true,
//         sort: true,
//         key: 'available_quantity',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 32,
//         label: 'Blocked Quantity', // Matches 'Blocked Quantity' in config
//         search: true,
//         sort: true,
//         key: 'blocked_quantity',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 38,
//         label: 'Picked Quantity', // Matches 'Picked Quantity' in config
//         search: true,
//         sort: true,
//         key: 'picked_quantity',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     // --- New headers added based on columnConfig ---
//     {
//         id: 13,
//         label: 'Style Code', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'styleCode',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 140,
//         label: 'Size', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'size',
//         visible: true,
//         minWidth: 5,
//         maxWidth: 5
//     },
//     {
//         id: 15,
//         label: 'Zone', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'zone',
//         visible: true,
//         minWidth: 6,
//         maxWidth: 6
//     },
//     {
//         id: 17,
//         label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'mrp',
//         visible: true,
//         minWidth: 6,
//         maxWidth: 6
//     },
//     {
//         id: 14,
//         label: 'Lot', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'lot_no',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 100,
//         label: 'Item Category', // Matches 'Item Category' in config
//         search: true,
//         sort: true,
//         key: 'item_category',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 20,
//         label: 'Shelf Life', // From 'storage' tab
//         search: true,
//         sort: true,
//         key: 'shelfLife',
//         visible: false,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 220,
//         label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
//         search: true,
//         sort: true,
//         key: 'lpn',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 230,
//         label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'vendorCode',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 24,
//         label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'vendorSKUCode',
//         visible: true,
//         minWidth: 10,
//         maxWidth: 10
//     },
//     {
//         id: 25,
//         label: 'Reference No', // From 'receiving', 'picked', 'kitPicked' tabs
//         search: true,
//         sort: true,
//         key: 'referenceNo',
//         visible: true,
//         minWidth: 10,
//         maxWidth: 10
//     },
//     {
//         id: 26,
//         label: 'Status', // From 'receiving', 'picked', 'kitPicked' tabs
//         search: true,
//         sort: true,
//         key: 'status',
//         visible: true,
//         minWidth: 7,
//         maxWidth: 7
//     },
//     {
//         id: 27,
//         label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'mfgDate',
//         visible: false,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 28,
//         label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'expiryDate',
//         visible: false,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 29,
//         label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: false,
//         sort: true,
//         key: 'lotNo',
//         visible: false,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 300,
//         label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'boxNo',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 310,
//         label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'uom',
//         visible: true,
//         minWidth: 5,
//         maxWidth: 5
//     },
//     {
//         id: 320,
//         label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'uomLabel',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 33,
//         label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'hub',
//         visible: false,
//         minWidth: 6,
//         maxWidth: 6
//     },
//     {
//         id: 34,
//         label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'remainingShelfLife',
//         visible: false,
//         minWidth: 12,
//         maxWidth: 12
//     },
//     {
//         id: 35,
//         label: 'Hold', // From 'cancelled', 'return' tabs
//         search: true,
//         sort: true,
//         key: 'hold',
//         visible: false,
//         minWidth: 6,
//         maxWidth: 6
//     },
//     {
//         id: 36,
//         label: 'Available Quantity (In Pieces)', // From 'cancelled', 'return', 'missing' tabs
//         search: true,
//         sort: true,
//         key: 'availableQuantityPieces',
//         visible: true,
//         minWidth: 15,
//         maxWidth: 15
//     },
//     {
//         id: 37,
//         label: 'LPN NO', // From 'missing' tab (keeping this as is from your config for exact match)
//         search: true,
//         sort: true,
//         key: 'lpnNo',
//         visible: true,
//         minWidth: 8,
//         maxWidth: 8
//     },
//     {
//         id: 21,
//         label: 'Created At', // From multiple tabs
//         search: true,
//         sort: true,
//         key: 'created_at',
//         visible: true,
//         minWidth: 10,
//         maxWidth: 10
//     }
// ]

export const headers = {
    storage: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 24,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 0,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 15,
            label: 'Bin No', // From 'storage' tab
            search: true,
            sort: true,
            key: 'bin_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 11,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 27,
            label: 'Storage Type', // Matches 'Storage Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['BIN', 'SELLABLE', 'QUARANTINE'],
            key: 'storage_type',
            visible: true,
            minWidth: 9,
            maxWidth: 9
        },
        {
            id: 25,
            label: 'Description', // Matches 'Description' in config
            search: true,
            sort: true,
            key: 'description',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 28,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        // {
        //     id: 30,
        //     label: 'Total Quantity', // Matches 'Total Quantity' in config
        //     search: true,
        //     sort: true,
        //     key: 'total_quantity',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        // {
        //     id: 31,
        //     label: 'Available Quantity', // Matches 'Available Quantity' in config
        //     search: true,
        //     sort: true,
        //     key: 'available_quantity',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        // {
        //     id: 32,
        //     label: 'Blocked Quantity', // Matches 'Blocked Quantity' in config
        //     search: true,
        //     sort: true,
        //     key: 'blocked_quantity',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        // {
        //     id: 38,
        //     label: 'Picked Quantity', // Matches 'Picked Quantity' in config
        //     search: true,
        //     sort: true,
        //     key: 'picked_quantity',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        {
            id: 130,
            label: 'Style Code', // From 'storage' tab
            search: false,
            sort: false,
            key: 'style_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 140,
            label: 'Size', // From 'storage' tab
            search: false,
            sort: false,
            key: 'size',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 32,
            label: 'Zone', // From 'storage' tab
            search: true,
            sort: true,
            key: 'zone',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 22,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 19,
            label: 'Lot', // From 'storage' tab
            search: true,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 8,
            label: 'MFD', // From 'storage' tab
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 2,
            label: 'Available Quantity', // Matches 'Total Quantity' in config
            search: true,
            sort: true,
            key: 'available_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: true,
            sort: true,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 14,
            label: 'Hold', // From 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'hold',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 5,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ],
    receiving: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 1,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'item_no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 21,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 999,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: false,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 10,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 16,
            label: 'Total Quantity', // Matches 'Total Quantity' in config
            search: true,
            sort: true,
            key: 'total_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        // --- New headers added based on columnConfig ---

        {
            id: 7,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 220,
            label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'lpn',
            visible: false,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 13,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 240,
            label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_sku_code',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 11,
            label: 'Reference No', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'reference_no',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 12,
            label: 'Status', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'status',
            visible: true,
            minWidth: 7,
            maxWidth: 7
        },
        {
            id: 9,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 8,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 6,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 300,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'box_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 15,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        },
        {
            id: 18,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ],
    picked: [
        {
            id: 0,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 19,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 39,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 4,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 23,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 30,
            label: 'Total Quantity', // Matches 'Total Quantity' in config
            search: true,
            sort: true,
            key: 'total_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        // --- New headers added based on columnConfig ---
        {
            id: 17,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: true,
            sort: true,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 20,
            label: 'Shelf Life', // From 'storage' tab
            search: true,
            sort: true,
            key: 'shelf_life',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 220,
            label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'lpn',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 230,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 24,
            label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_sku_code',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 25,
            label: 'Reference No', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'reference_no',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 26,
            label: 'Status', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'status',
            visible: true,
            minWidth: 7,
            maxWidth: 7
        },
        {
            id: 27,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 28,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 29,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 300,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'box_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 34,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'remaining_shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        }
    ],
    kit_picked: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 24,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 0,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 11,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },

        {
            id: 28,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 22,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },

        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: false,
            sort: false,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 220,
            label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
            search: false,
            sort: false,
            key: 'lpn',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 34,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        // {
        //     id: 24,
        //     label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
        //     search: false,
        //     sort: false,
        //     key: 'vendor_sku_code',
        //     visible: true,
        //     minWidth: 10,
        //     maxWidth: 10
        // },
        {
            id: 25,
            label: 'Reference No', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'reference_no',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 26,
            label: 'Status', // From 'receiving', 'picked', 'kitPicked' tabs
            search: true,
            sort: true,
            key: 'status',
            visible: true,
            minWidth: 7,
            maxWidth: 7
        },
        {
            id: 30,
            label: 'Total Quantity', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'total_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 20,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 21,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 19,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 300,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'box_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 340,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'remaining_shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        },

        {
            id: 5,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ],
    cancel: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 24,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 0,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 11,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 27,
            label: 'Storage Type', // Matches 'Storage Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['BIN', 'SELLABLE', 'QUARANTINE'],
            key: 'storage_type',
            visible: true,
            minWidth: 9,
            maxWidth: 9
        },
        {
            id: 28,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 2,
            label: 'Available Quantity', // Matches 'Available Quantity' in config
            search: true,
            sort: true,
            key: 'available_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 22,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        // {
        //     id: 19,
        //     label: 'Lot', // From 'storage' tab
        //     search: true,
        //     sort: true,
        //     key: 'lot_no',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: true,
            sort: true,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 220,
            label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'lpn',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 34,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        // {
        //     id: 24,
        //     label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
        //     search: true,
        //     sort: true,
        //     key: 'vendor_sku_code',
        //     visible: true,
        //     minWidth: 10,
        //     maxWidth: 10
        // },
        {
            id: 20,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 21,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 19,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 300,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'box_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 340,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'remaining_shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        },
        {
            id: 35,
            label: 'Hold', // From 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'hold',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 36,
            label: 'Available Quantity (In Pieces)', // From 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'available_quantity_pieces',
            visible: true,
            minWidth: 15,
            maxWidth: 15
        },
        {
            id: 5,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ],
    returned: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 24,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 0,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 11,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 27,
            label: 'Storage Type', // Matches 'Storage Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['BIN', 'SELLABLE', 'QUARANTINE'],
            key: 'storage_type',
            visible: true,
            minWidth: 9,
            maxWidth: 9
        },
        {
            id: 28,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 2,
            label: 'Available Quantity', // Matches 'Total Quantity' in config
            search: true,
            sort: true,
            key: 'available_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 22,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: true,
            sort: true,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 220,
            label: 'LPN', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'lpn',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 34,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 240,
            label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_sku_cCode',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 20,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 21,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 19,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 111,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'pallet_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 340,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'remaining_shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        },
        {
            id: 9,
            label: 'Hold', // From 'cancelled', 'return' tabs
            search: true,
            sort: true,
            key: 'hold',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        // {
        //     id: 31,
        //     label: 'Available Quantity (In Pieces)', // From 'cancelled', 'return', 'missing' tabs
        //     search: true,
        //     sort: true,
        //     key: 'available_quantity',
        //     visible: true,
        //     minWidth: 15,
        //     maxWidth: 15
        // },
        {
            id: 5,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ],
    missing: [
        {
            id: 999,
            label: 'Sr. No.',
            search: false,
            sort: false,
            stick: true,
            key: 's_no',
            isFrontend: true,
            visible: true,
            minWidth: 3.188,
            maxWidth: 3.188
        },
        {
            id: 24,
            label: 'SKU No', // Matches 'SKU No' in config
            search: true,
            sort: true,
            key: 'no',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 0,
            label: 'UID',
            search: true,
            sort: true,
            key: 'uid',
            visible: true,
            stick: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 11,
            label: 'Address', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'address',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 27,
            label: 'Storage Type', // Matches 'Storage Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['BIN', 'SELLABLE', 'QUARANTINE'],
            key: 'storage_type',
            visible: true,
            minWidth: 9,
            maxWidth: 9
        },
        {
            id: 28,
            label: 'Inventory Type', // Matches 'Inventory Type' in config
            search: false,
            sort: false,
            filter: true,
            options: ['GOOD', 'BAD'],
            key: 'inventory_type',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 2,
            label: 'Available Quantity', // Matches 'Total Quantity' in config
            search: true,
            sort: true,
            key: 'available_quantity',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },

        {
            id: 22,
            label: 'MRP', // From 'storage', 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mrp',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        // {
        //     id: 19,
        //     label: 'Lot No', // From 'storage' tab
        //     search: true,
        //     sort: true,
        //     key: 'lot_no',
        //     visible: true,
        //     minWidth: 8,
        //     maxWidth: 8
        // },
        {
            id: 100,
            label: 'Item Category', // Matches 'Item Category' in config
            search: true,
            sort: true,
            key: 'item_category',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 34,
            label: 'Vendor Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_code',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 240,
            label: 'Vendor SKU Code', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'vendor_sku_code',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        },
        {
            id: 20,
            label: 'MFG Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'mfd_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 21,
            label: 'Exp Date', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'expiry_date',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 19,
            label: 'Lot No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: false,
            sort: true,
            key: 'lot_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 300,
            label: 'Box No', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'box_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 310,
            label: 'UOM', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom',
            visible: true,
            minWidth: 5,
            maxWidth: 5
        },
        {
            id: 320,
            label: 'UOM Label', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'uom_label',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 33,
            label: 'Hub', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'hub',
            visible: true,
            minWidth: 6,
            maxWidth: 6
        },
        {
            id: 340,
            label: 'Remaining Shelf Life (%)', // From 'receiving', 'picked', 'kitPicked', 'cancelled', 'return', 'missing' tabs
            search: true,
            sort: true,
            key: 'remaining_shelf_life',
            visible: true,
            minWidth: 12,
            maxWidth: 12
        },
        // {
        //     id: 36,
        //     label: 'Available Quantity (In Pieces)', // From 'cancelled', 'return', 'missing' tabs
        //     search: true,
        //     sort: true,
        //     key: 'available_quantity_pieces',
        //     visible: true,
        //     minWidth: 15,
        //     maxWidth: 15
        // },
        {
            id: 37,
            label: 'LPN NO', // From 'missing' tab (keeping this as is from your config for exact match)
            search: true,
            sort: true,
            key: 'lpn_no',
            visible: true,
            minWidth: 8,
            maxWidth: 8
        },
        {
            id: 5,
            label: 'Created At', // From multiple tabs
            search: true,
            sort: true,
            key: 'created_at',
            visible: true,
            minWidth: 10,
            maxWidth: 10
        }
    ]
}

export const columnConfig = [
    {
        storage: [
            'Sr. No.',
            'UID',
            'Bin No',
            'Address',
            'SKU No',
            'Total Quantity',
            'Available Quantity',
            'Blocked Quantity',
            'Picked Quantity',
            'Description',
            'Inventory Type',
            'Style Code',
            'Size',
            'Zone',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Item Category Code',
            'Shelf Life',
            'Created At'
        ]
    },
    {
        receiving: [
            'Sr. No.',

            'UID',
            'Address',
            'LPN',
            'SKU No',
            'Vendor Code',
            'Vendor SKU Code',
            'Reference No',
            'Status',
            'Inventory Type',
            'Total Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'Hub',
            'Remaining Shelf Life (%)'
        ]
    },
    {
        picked: [
            'Sr. No.',

            'UID',
            'Address',
            'LPN',
            'SKU No',
            'Vendor Code',
            'Vendor SKU Code',
            'Reference No',
            'Status',
            'Inventory Type',
            'Total Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'Hub',
            'Remaining Shelf Life (%)'
        ]
    },
    {
        kit_picked: [
            'Sr. No.',

            'UID',
            'Address',
            'LPN',
            'SKU No',
            'Vendor Code',
            'Vendor SKU Code',
            'Reference No',
            'Status',
            'Inventory Type',
            'Total Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'Hub',
            'Remaining Shelf Life (%)'
        ]
    },
    {
        cancel: [
            'Sr. No.',

            'UID',
            'Address',
            'LPN',
            'SKU No',
            'Hold',
            'Vendor Code',
            'Vendor SKU Code',
            'Storage Type',
            'Inventory Type',
            'Available Quantity (In Pieces)',
            'Total Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'Hub',
            'Remaining Shelf Life (%)'
        ]
    },
    {
        return: [
            'Sr. No.',

            'UID',
            'Address',
            'LPN',
            'SKU No',
            'Hold',
            'Vendor Code',
            'Vendor SKU Code',
            'Storage Type',
            'Inventory Type',
            'Available Quantity (In Pieces)',
            'Total Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'Hub',
            'Remaining Shelf Life (%)'
        ]
    },
    {
        missing: [
            'Sr. No.',
            'UID',
            'Address',
            'LPN No',
            'SKU No',
            'Vendor Code',
            'Vendor SKU Code',
            'Storage Type',
            'Inventory Type',
            'Available Quantity (in pieces)',
            'Total Quantity',
            'Available Quantity',
            'Blocked Quantity',
            'MRP',
            'MFG Date',
            'Exp Date',
            'Lot No',
            'Box No',
            'UOM',
            'UOM Label',
            'Item Category Code',
            'Created At',
            'HUM',
            'Remaining Shelf Life (%)'
        ]
    }
]
