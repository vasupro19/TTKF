/* eslint-disable */

export const locations = [
    {
        id: 1,
        style_code: 'SC101',
        description: 'High quality product A with great features and benefits for users',
        ean: '1111111111111',
        qty_tab_A: 2,
        brand: 'BrandA',
        colour: 'Red',
        size: 'M',
        mrp: '₹100',
        image: 'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 2,
        style_code: 'SC102',
        description: 'Durable and reliable product B',
        ean: '2222222222222',
        qty_tab_A: 5,
        brand: 'BrandB',
        colour: 'Blue',
        size: 'L',
        mrp: '₹150',
        image: 'https://sojanya.com/cdn/shop/files/SJR-LK-ChknPatta-1165-Dgreen-1.jpg?v=1716882821',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 3,

        style_code: 'SC103',
        description: 'Innovative design product C',
        ean: '3333333333333',
        qty_tab_A: 3,
        brand: 'BrandC',
        colour: 'Green',
        size: 'S',
        mrp: '₹200',
        image: 'https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 4,
        style_code: 'SC104',
        description: 'Eco-friendly product D',
        ean: '4444444444444',
        qty_tab_A: 2,
        brand: 'BrandD',
        colour: 'Yellow',
        size: 'XL',
        mrp: '₹120',
        image: 'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 5,
        style_code: 'SC105',
        description: 'Advanced product E',
        ean: '5555555555555',
        qty_tab_A: 6,
        brand: 'BrandE',
        colour: 'Black',
        size: 'M',
        mrp: '₹180',
        image: 'https://sojanya.com/cdn/shop/files/SJR-LK-ChknPatta-1165-Dgreen-1.jpg?v=1716882821',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 6,
        style_code: 'SC106',
        description: 'Compact and efficient product F',
        ean: '6666666666666',
        qty_tab_A: 2,
        brand: 'BrandF',
        colour: 'White',
        size: 'S',
        mrp: '₹130',
        image: 'https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 7,

        style_code: 'SC107',
        description: 'Reliable and sleek product G',
        ean: '7777777777777',
        qty_tab_A: 3,
        brand: 'BrandG',
        colour: 'Orange',
        size: 'L',
        mrp: '₹160',
        image: 'https://cdn/shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 8,

        style_code: 'SC108',
        description: 'Top performing product H',
        ean: '8888888888888',
        qty_tab_A: 1,
        brand: 'BrandH',
        colour: 'Purple',
        size: 'XL',
        mrp: '₹210',
        image: 'https://sojanya.com/cdn/shop/files/SJR-LK-ChknPatta-1165-Dgreen-1.jpg?v=1716882821',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 9,
        style_code: 'SC109',
        description: 'Innovative and stylish product I',
        ean: '9999999999999',
        qty_tab_A: 1,
        brand: 'BrandI',
        colour: 'Gray',
        size: 'M',
        mrp: '₹190',
        image: 'https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg',
        modified_at: '14-11-2024 10:30'
    },
    {
        id: 10,
        style_code: 'SC110',
        description: 'High performance product J',
        ean: '1010101010101',
        qty_tab_A: 4,
        brand: 'BrandJ',
        colour: 'Teal',
        size: 'L',
        mrp: '₹170',
        image: 'https://cdn/shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107',
        modified_at: '14-11-2024 10:30'
    }
]

export const headers = [
    {
        id: 99,
        label: 'Sr. No.',
        key: 's_no',
        isFrontend: true,
        visible: true,
        search: false,
        sort: false,
        stick: false,
        minWidth: 3.1,
        maxWidth: 3.1
    },
    {
        id: 2,
        label: 'Pack No',
        key: 'no',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 7,
        label: 'Product Code',
        key: 'product_code',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'Image',
        key: 'image',
        visible: true,
        search: false,
        sort: false,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 11,
        label: 'Description',
        key: 'description_2',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 12,
        maxWidth: 12
    },
    {
        id: 0,
        label: 'EAN',
        key: 'item_no',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 4,
        label: 'Qty',
        key: 'total_quantity',
        align: 'center',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 4,
        maxWidth: 4
    },
    {
        id: 8,
        label: 'MRP',
        key: 'mrp_price',
        align: 'center',
        visible: true,
        search: true,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 12,
        label: 'Brand',
        key: 'brand',
        visible: true,
        search: false,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 13,
        label: 'Colour',
        key: 'colour',
        visible: true,
        search: false,
        sort: true,
        stick: false,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'Size',
        key: 'size',
        align: 'center',
        visible: false,
        search: true,
        sort: true,
        stick: false,
        minWidth: 4,
        maxWidth: 4
    },
    {
        id: 5,
        label: 'Updated At',
        key: 'updated_At',
        align: 'left',
        visible: false,
        search: true,
        sort: true,
        stick: false,
        minWidth: 4,
        maxWidth: 4
    },
    {
        id: 3,
        label: 'Created At',
        key: 'created_At',
        align: 'left',
        visible: false,
        search: true,
        sort: true,
        stick: false,
        minWidth: 4,
        maxWidth: 4
    }
]
