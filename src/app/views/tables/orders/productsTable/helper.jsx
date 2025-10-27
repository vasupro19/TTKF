/* eslint-disable */

export const locations = [
    {
        id: 1,
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107'
        ],
        item_no: 'PRD001',
        batch: 'BA87687',
        status: 'PACKED',
        description: '500ml alcohol-based hand sanitizer',
        ean: '1234567890123',
        quantity: 100,
        mrp: 75,
        sellingPrice: 50,
        discount: '10%',
        shelfLife: '85%',
        tax: '23%'
    },
    {
        id: 2,
        imageUrl: ['https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg'],
        item_no: 'PRD002',
        batch: 'BA76787',
        status: 'PICKED',
        description: 'Pack of 5 N95 masks',
        ean: '9876543210987',
        quantity: 200,
        mrp: 200,
        sellingPrice: 150,
        discount: '15%',
        shelfLife: '50%',
        tax: '13%'
    },
    {
        id: 3,
        imageUrl: ['https://img.freepik.com/free-vector/beautiful-cosmetic-ad_23-2148471068.jpg'],
        item_no: 'PRD003',
        batch: 'BA11987',
        description: 'Digital thermometer with high accuracy',
        ean: '1230984567890',
        status: 'PACKED',
        quantity: 50,
        mrp: 300,
        sellingPrice: 200,
        discount: '20%',
        shelfLife: '8%',
        tax: '23%'
    },
    {
        id: 4,
        imageUrl: [
            'https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg'
        ],
        item_no: 'PRD004',
        batch: 'BA9277',
        description: 'Bottle of 100 tablets',
        ean: '7890123456789',
        status: 'PICKED',
        quantity: 150,
        mrp: 350,
        sellingPrice: 250,
        discount: '25%',
        shelfLife: '90%',
        tax: '33%'
    },
    {
        id: 5,
        imageUrl: [
            'https://b2861582.smushcdn.com/2861582/wp-content/uploads/2023/02/splash-03-605-v1.png?lossy=2&strip=1&webp=1'
        ],
        item_no: 'PRD005',
        batch: 'BA29687',
        description: '1kg chocolate-flavored protein powder',
        ean: '4561237890123',
        quantity: 200,
        status: 'PICKED',
        mrp: 1500,
        sellingPrice: 1000,
        discount: '30%',
        shelfLife: '5%',
        tax: '12%'
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
        label: 'Product Code*',
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
        label: 'Description',
        search: false,
        sort: false,
        stick: false,
        key: 'description',
        accessKey: 'description',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Quantity*',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'quantity',
        accessKey: 'quantity',
        visible: true,
        minWidth: 6,
        maxWidth: 6
    },
    {
        id: 5,
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
        id: 6,
        label: 'Selling Price*',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'sellingPrice',
        accessKey: 'sellingPrice',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 7,
    //     label: 'Status',
    //     search: true,
    //     sort: false,
    //     stick: false,
    //     key: 'status',
    //     accessKey: 'status',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8
    // },
    {
        id: 8,
        label: 'Lot/Batch',
        search: false,
        sort: false,
        stick: false,
        key: 'batch',
        accessKey: 'batch',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'Discount %',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'discount',
        accessKey: 'discount',
        visible: true,
        minWidth: 6,
        maxWidth: 6
    },
    {
        id: 10,
        label: 'Tax %',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'tax',
        accessKey: 'tax',
        visible: true,
        minWidth: 6,
        maxWidth: 6
    },
    {
        id: 11,
        label: 'Shelf Life %',
        align: 'center',
        search: false,
        sort: false,
        stick: false,
        key: 'shelfLife',
        accessKey: 'shelfLife',
        visible: true,
        minWidth: 6,
        maxWidth: 6
    }
]

export const getImage = stringifiedArray => {
    const imageArray = JSON.parse(stringifiedArray) || []
    return imageArray.length ? imageArray[0] : ''
}
