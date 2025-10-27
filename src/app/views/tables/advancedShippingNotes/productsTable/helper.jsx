/* eslint-disable */

export const locations = [
    {
        id: 1,
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107'
        ],
        productName: 'Hand Sanitizer',
        description: '500ml alcohol-based hand sanitizer',
        productCode: 'PRD001',
        EAN_UPC: '1234567890123',
        quantity: 100,
        MRP: 75,
        unitCost: 50,
        lotNo: 'LOT12345',
        mfgDate: '2024-01-15',
        expiryDate: '2026-01-15'
    },
    {
        id: 2,
        imageUrl: ['https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg'],
        productName: 'N95 Mask',
        description: 'Pack of 5 N95 masks',
        productCode: 'PRD002',
        EAN_UPC: '9876543210987',
        quantity: 200,
        MRP: 200,
        unitCost: 150,
        lotNo: 'LOT98765',
        mfgDate: '2023-09-01',
        expiryDate: '2025-09-01'
    },
    {
        id: 3,
        imageUrl: ['https://img.freepik.com/free-vector/beautiful-cosmetic-ad_23-2148471068.jpg'],
        productName: 'Digital Thermometer',
        description: 'Digital thermometer with high accuracy',
        productCode: 'PRD003',
        EAN_UPC: '1230984567890',
        quantity: 50,
        MRP: 300,
        unitCost: 200,
        lotNo: 'LOT54321',
        mfgDate: '2024-02-20',
        expiryDate: '2027-02-20'
    },
    {
        id: 4,
        imageUrl: [
            'https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg'
        ],
        productCode: 'PRD004',
        productName: 'Vitamin C Tablets',
        description: 'Bottle of 100 tablets',
        EAN_UPC: '7890123456789',
        quantity: 150,
        MRP: 350,
        unitCost: 250,
        lotNo: 'LOT11223',
        mfgDate: '2023-06-10',
        expiryDate: '2025-06-10'
    },
    {
        id: 5,
        imageUrl: [
            'https://b2861582.smushcdn.com/2861582/wp-content/uploads/2023/02/splash-03-605-v1.png?lossy=2&strip=1&webp=1'
        ],
        productName: 'Protein Powder',
        description: '1kg chocolate-flavored protein powder',
        EAN_UPC: '4561237890123',
        productCode: 'PRD005',
        quantity: 200,
        MRP: 1500,
        unitCost: 1000,
        lotNo: 'LOT66778',
        mfgDate: '2024-03-05',
        expiryDate: '2026-03-05'
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr.No.',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        isFrontend: true,
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1,
        align: 'center'
    },
    {
        id: 2,
        label: 'Product Code',
        search: false,
        sort: true,
        stick: true,
        key: 'item_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'EAN UPC',
        search: false,
        sort: true,
        stick: true,
        key: 'ean',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 12,
        label: 'Quantity',
        search: false,
        sort: true,
        stick: false,
        key: 'quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'MRP',
        search: false,
        sort: true,
        stick: false,
        key: 'mrp',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 15,
        label: 'Unit Cost',
        search: false,
        sort: true,
        stick: false,
        key: 'unit_cost',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 1,
    //     label: 'no',
    //     search: false,
    //     sort: true,
    //     stick: false,
    //     key: 'no',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    // {
    //     id: 4,
    //     label: 'remaining',
    //     search: false,
    //     sort: true,
    //     stick: false,
    //     key: 'remaining',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 5,
        label: 'Lot No.',
        search: false,
        sort: true,
        stick: false,
        key: 'lot_no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Mfg Date',
        search: false,
        sort: true,
        stick: false,
        key: 'mfd_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Expiry Date',
        search: false,
        sort: true,
        stick: false,
        key: 'expiry_date',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export const getImage = stringifiedArray => {
    const imageArray = JSON.parse(stringifiedArray) || []
    return imageArray.length ? imageArray[0] : ''
}
