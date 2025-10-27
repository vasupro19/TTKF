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
        discount: '10%',
        taxPercentage: '23%'
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
        discount: '15%',
        taxPercentage: '13%'
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
        discount: '20%',
        taxPercentage: '23%'
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
        discount: '25%',
        taxPercentage: '33%'
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
        discount: '30%',
        taxPercentage: '12%'
    }
]

export const headers = [
    {
        id: 0,
        label: 'Sr.No.',
        align: 'center',
        search: false,
        sort: false,
        stick: true,
        key: 's_no',
        isFrontend: true,
        accessKey: 's_no',
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 1,
        label: 'Product Code',
        align: 'center',
        search: false,
        sort: false,
        stick: true,
        key: 'item_no',
        accessKey: 'item_no',
        visible: true,
        minWidth: 10,
        maxWidth: 10
    },
    {
        id: 2,
        label: 'EAN UPC',
        search: false,
        sort: false,
        stick: true,
        key: 'ean',
        accessKey: 'ean',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 3,
        label: 'Quantity',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'quantity',
        accessKey: 'quantity',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'MRP',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'mrp',
        accessKey: 'mrp',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Unit Cost',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'unit_price',
        accessKey: 'unit_price',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Discount',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'discount',
        accessKey: 'discount',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Tax Percentage',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'tax',
        accessKey: 'tax',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]

export const getImage = stringifiedArray => {
    const imageArray = JSON.parse(stringifiedArray) || []
    return imageArray.length ? imageArray[0] : ''
}