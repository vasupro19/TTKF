export const locations = [
    {
        id: 1,
        location: 'Warehouse A',
        SKUNo: 'SKU001',
        EAN: 'EAN849201',
        description: 'Premium White T-Shirt',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 250,
        availableQuantity: 240,
        blockedQuantity: 10,
        itemCategory: 'Apparel'
    },
    {
        id: 2,
        location: 'Warehouse A',
        SKUNo: 'SKU002',
        EAN: 'EAN849202',
        description: 'Black Jeans',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 180,
        availableQuantity: 175,
        blockedQuantity: 5,
        itemCategory: 'Apparel'
    },
    {
        id: 3,
        location: 'Warehouse B',
        SKUNo: 'SKU003',
        EAN: 'EAN849203',
        description: 'Wireless Headphones',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 120,
        availableQuantity: 110,
        blockedQuantity: 10,
        itemCategory: 'Electronics'
    },
    {
        id: 4,
        location: 'Warehouse C',
        SKUNo: 'SKU004',
        EAN: 'EAN849204',
        description: 'Water Bottle',
        storageType: 'QUARANTINE',
        inventoryType: 'BAD',
        totalQuantity: 50,
        availableQuantity: 0,
        blockedQuantity: 50,
        itemCategory: 'Accessories'
    },
    {
        id: 5,
        location: 'Warehouse B',
        SKUNo: 'SKU005',
        EAN: 'EAN849205',
        description: 'Smartphone Case',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 300,
        availableQuantity: 285,
        blockedQuantity: 15,
        itemCategory: 'Electronics'
    },
    {
        id: 6,
        location: 'Warehouse A',
        SKUNo: 'SKU006',
        EAN: 'EAN849206',
        description: 'Running Shoes',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 95,
        availableQuantity: 90,
        blockedQuantity: 5,
        itemCategory: 'Footwear'
    },
    {
        id: 7,
        location: 'Warehouse C',
        SKUNo: 'SKU007',
        EAN: 'EAN849207',
        description: 'Laptop Charger',
        storageType: 'QUARANTINE',
        inventoryType: 'BAD',
        totalQuantity: 75,
        availableQuantity: 0,
        blockedQuantity: 75,
        itemCategory: 'Electronics'
    },
    {
        id: 8,
        location: 'Warehouse A',
        SKUNo: 'SKU008',
        EAN: 'EAN849208',
        description: 'Coffee Mug',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 200,
        availableQuantity: 190,
        blockedQuantity: 10,
        itemCategory: 'Homeware'
    },
    {
        id: 9,
        location: 'Warehouse B',
        SKUNo: 'SKU009',
        EAN: 'EAN849209',
        description: 'Backpack',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 150,
        availableQuantity: 140,
        blockedQuantity: 10,
        itemCategory: 'Accessories'
    },
    {
        id: 10,
        location: 'Warehouse C',
        SKUNo: 'SKU010',
        EAN: 'EAN849210',
        description: 'Bluetooth Speaker',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 85,
        availableQuantity: 80,
        blockedQuantity: 5,
        itemCategory: 'Electronics'
    },
    {
        id: 11,
        location: 'Warehouse A',
        SKUNo: 'SKU011',
        EAN: 'EAN849211',
        description: 'Sunglasses',
        storageType: 'QUARANTINE',
        inventoryType: 'BAD',
        totalQuantity: 30,
        availableQuantity: 0,
        blockedQuantity: 30,
        itemCategory: 'Accessories'
    },
    {
        id: 12,
        location: 'Warehouse B',
        SKUNo: 'SKU012',
        EAN: 'EAN849212',
        description: 'Wireless Mouse',
        storageType: 'SELLABLE',
        inventoryType: 'GOOD',
        totalQuantity: 170,
        availableQuantity: 160,
        blockedQuantity: 10,
        itemCategory: 'Electronics'
    }
]

export const headers = [
    {
        id: 1000,
        label: 'Sr. No.',
        isFrontend: true,
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    // {
    //     id: 12,
    //     label: 'Location',
    //     search: true,
    //     sort: true,
    //     key: 'location_code',
    //     visible: true,
    //     stick: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // }, // ! removed as told by Mr. Yogesh 20/06/20225
    {
        id: 0,
        label: 'SKU No',
        search: true,
        sort: true,
        key: 'no',
        visible: true,
        stick: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 101,
    //     label: 'Storage Type',
    //     search: false,
    //     sort: false,
    //     filter: true,
    //     options: ['SELLABLE', 'QUARANTINE'],
    //     key: 'storage_type',
    //     visible: true,
    //     minWidth: 9,
    //     maxWidth: 9
    // }, // ! removed as told by Mr. Yogesh 23/06/20225
    {
        id: 7,
        label: 'EAN',
        search: true,
        sort: true,
        key: 'item_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Description',
        search: true,
        sort: true,
        key: 'description',
        visible: true,
        minWidth: 10,
        maxWidth: 10
    },

    {
        id: 17,
        label: 'Inventory Type',
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
        id: 13,
        label: 'Total Quantity',
        search: true,
        sort: true,
        key: 'total_quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'Available Quantity',
        search: true,
        sort: true,
        key: 'available_quantity',
        stick: false,
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Blocked Quantity',
        search: true,
        sort: true,
        key: 'blocked_quantity',
        visible: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'Item Category',
        search: true,
        sort: true,
        key: 'item_category',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'MRP',
        search: true,
        sort: true,
        key: 'mrp',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Lot No',
        search: true,
        sort: true,
        key: 'lot_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'MFG Date',
        search: true,
        sort: true,
        key: 'mfd_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'Expiry Date',
        search: true,
        sort: true,
        key: 'expiry_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
