import { Box, Tooltip, Typography } from '@mui/material'
import { ArrowForwardIos, InfoOutlined, RemoveRedEye } from '@mui/icons-material'
import CustomImage from '@/core/components/CustomImage'
import StatusBadge from '@/core/components/StatusBadge'

export const locations = [
    {
        id: 1,
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107',
            'https://sojanya.com/cdn/shop/files/SJR-LK-ChknPatta-1165-Dgreen-1.jpg?v=1716882821'
        ],
        productName: 'Hand Sanitizer',
        productCode: 'PRD001',
        EAN_UPC: '1234567890123',
        description: '500ml alcohol-based hand sanitizer',
        category: 'Health & Hygiene',
        unitCost: 50,
        MRP: 75,
        expiry: true,
        MFG: false,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Piece',
        taxPercentage: '23%',
        createdBy: 'Alice',
        createdAt: '07-12-2024 10:40',
        modifiedBy: 'Bob',
        modifiedAt: '07-12-2024 11:00'
    },
    {
        id: 2,
        imageUrl: ['https://cdn.pixabay.com/photo/2021/02/18/09/26/coca-cola-6026672_640.jpg'],
        productCode: 'PRD002',
        EAN_UPC: '9876543210987',
        productName: 'N95 Mask',
        description: 'Pack of 5 N95 masks',
        category: 'Health & Hygiene',
        unitCost: 150,
        MRP: 200,
        expiry: false,
        MFG: true,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Pack',
        taxPercentage: '13%',
        createdBy: 'Charlie',
        createdAt: '07-12-2024 10:50',
        modifiedBy: 'Dave',
        modifiedAt: '07-12-2024 11:20'
    },
    {
        id: 3,
        imageUrl: ['https://img.freepik.com/free-vector/beautiful-cosmetic-ad_23-2148471068.jpg'],
        productCode: 'PRD003',
        EAN_UPC: '1230984567890',
        productName: 'Digital Thermometer',
        description: 'Digital thermometer with high accuracy',
        category: 'Health Devices',
        unitCost: 200,
        MRP: 300,
        expiry: true,
        MFG: true,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Piece',
        taxPercentage: '23%',
        createdBy: 'Eve',
        createdAt: '07-12-2024 09:45',
        modifiedBy: 'Frank',
        modifiedAt: '07-12-2024 10:15'
    },
    {
        id: 4,
        imageUrl: [
            'https://d2v5dzhdg4zhx3.cloudfront.net/web-assets/images/storypages/primary/ProductShowcasesampleimages/JPEG/Product+Showcase-1.jpg'
        ],
        productCode: 'PRD004',
        EAN_UPC: '7890123456789',
        productName: 'Vitamin C Tablets',
        description: 'Bottle of 100 tablets',
        category: 'Supplements',
        unitCost: 250,
        MRP: 350,
        expiry: true,
        MFG: true,
        LoT: false,
        pickCriteria: 'FIFO',
        UOM: 'Bottle',
        taxPercentage: '33%',
        createdBy: 'Grace',
        createdAt: '07-12-2024 11:00',
        modifiedBy: 'Heidi',
        modifiedAt: '07-12-2024 11:30'
    },
    {
        id: 5,
        imageUrl: [
            'https://b2861582.smushcdn.com/2861582/wp-content/uploads/2023/02/splash-03-605-v1.png?lossy=2&strip=1&webp=1'
        ],
        productCode: 'PRD005',
        EAN_UPC: '4561237890123',
        productName: 'Protein Powder',
        description: '1kg chocolate-flavored protein powder',
        category: 'Supplements',
        unitCost: 1000,
        MRP: 1500,
        expiry: true,
        MFG: false,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Kg',
        taxPercentage: '12%',
        createdBy: 'Ivy',
        createdAt: '07-12-2024 10:25',
        modifiedBy: 'Jack',
        modifiedAt: '07-12-2024 10:55'
    },
    {
        id: 6,
        imageUrl: [
            'https://www.shutterstock.com/image-vector/skin-moisture-product-water-cosmetics-260nw-2508224915.jpg'
        ],
        productCode: 'PRD006',
        EAN_UPC: '3214569870123',
        productName: 'Face Wash',
        description: '200ml face wash for all skin types',
        category: 'Personal Care',
        unitCost: 120,
        MRP: 180,
        expiry: true,
        MFG: true,
        LoT: false,
        pickCriteria: 'FIFO',
        UOM: 'Bottle',
        taxPercentage: '22%',
        createdBy: 'Kim',
        createdAt: '07-12-2024 09:50',
        modifiedBy: 'Lee',
        modifiedAt: '07-12-2024 10:20'
    },
    {
        id: 7,
        productCode: 'PRD007',
        EAN_UPC: '6547893210123',
        productName: 'Shampoo',
        description: '500ml anti-dandruff shampoo',
        category: 'Personal Care',
        unitCost: 250,
        MRP: 300,
        expiry: false,
        MFG: true,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Bottle',
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107'
        ],
        taxPercentage: '21%',
        createdBy: 'Mona',
        createdAt: '07-12-2024 10:15',
        modifiedBy: 'Nina',
        modifiedAt: '07-12-2024 10:45'
    },
    {
        id: 8,
        productCode: 'PRD008',
        EAN_UPC: '4567891230123',
        productName: 'Green Tea',
        description: 'Pack of 25 green tea bags',
        category: 'Beverages',
        unitCost: 150,
        MRP: 220,
        expiry: true,
        MFG: false,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Pack',
        imageUrl: [
            'https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?cs=srgb&dl=pexels-alexazabache-3766111.jpg&fm=jpg'
        ],
        taxPercentage: '22%',
        createdBy: 'Oscar',
        createdAt: '07-12-2024 10:30',
        modifiedBy: 'Pete',
        modifiedAt: '07-12-2024 11:00'
    },
    {
        id: 9,
        productCode: 'PRD009',
        EAN_UPC: '9873216540123',
        productName: 'Almonds',
        description: '500g raw almonds',
        category: 'Dry Fruits',
        unitCost: 400,
        MRP: 600,
        expiry: false,
        MFG: true,
        LoT: false,
        pickCriteria: 'FIFO',
        UOM: 'Pack',
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107'
        ],
        taxPercentage: '17%',
        createdBy: 'Quinn',
        createdAt: '07-12-2024 09:35',
        modifiedBy: 'Rick',
        modifiedAt: '07-12-2024 10:05'
    },
    {
        id: 10,
        productCode: 'PRD010',
        EAN_UPC: '3219876540123',
        productName: 'Olive Oil',
        description: '1L extra virgin olive oil',
        category: 'Cooking Essentials',
        unitCost: 800,
        MRP: 1100,
        expiry: true,
        MFG: false,
        LoT: true,
        pickCriteria: 'FIFO',
        UOM: 'Litre',
        imageUrl: [
            'https://cdn.shopify.com/s/files/1/0870/1634/1808/files/clean-front-linen-blend-embroidered-qurta-navniv-1.jpg?v=1714462107'
        ],
        taxPercentage: '22%',
        createdBy: 'Sam',
        createdAt: '07-12-2024 09:40',
        modifiedBy: 'Tina',
        modifiedAt: '07-12-2024 10:10'
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
        visible: true,
        minWidth: 3.1,
        maxWidth: 3.1,
        backEndIndex: 0
    },
    {
        id: 17,
        label: 'Image',
        align: undefined,
        search: false,
        sort: false,
        stick: true,
        key: 'image',
        visible: true,
        minWidth: 4.8,
        maxWidth: 4.8
    },
    {
        id: 4,
        label: 'Product Name',
        align: undefined,
        search: true,
        sort: false,
        stick: true,
        key: 'description',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 1,
        label: 'Product Code',
        align: undefined,
        search: true,
        sort: true,
        stick: false,
        key: 'no',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 2,
        label: 'EAN/UPC',
        align: undefined,
        search: true,
        sort: true,
        stick: false,
        key: 'no_2',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 5,
        label: 'Description',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'description_2',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 6,
        label: 'Category',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'category_name',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 14,
        label: 'Unit Cost',
        align: undefined,
        search: false,
        sort: true,
        stick: false,
        key: 'unit_price',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 8,
        label: 'MRP',
        align: undefined,
        search: false,
        sort: true,
        stick: false,
        key: 'mrp_price',
        visible: true,
        minWidth: 8,
        maxWidth: 8,
        backEndIndex: 14 // same index as Unit cost
    },
    {
        id: 11,
        label: 'Expiry',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'expiry_reqd',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 10,
        label: 'MFG',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'manufacturing_reqd',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 9,
        label: 'LoT',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'lot_reqd',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 16,
        label: 'Pick Criteria',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'pick_criteria',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    // {
    //     id: 12,
    //     label: 'UOM',
    //     align: undefined,
    //     search: false,
    //     sort: false,
    //     stick: false,
    //     key: 'pick_criteria',
    //     visible: true,
    //     minWidth: 8,
    //     maxWidth: 8,
    //     backEndIndex: 16
    // }
    {
        id: 24,
        label: 'Created By',
        align: undefined,
        search: true,
        sort: false,
        stick: false,
        key: 'created_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 26,
        label: 'Created At',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'created_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 25,
        label: 'Modified By',
        align: undefined,
        search: true,
        sort: false,
        stick: false,
        key: 'modified_by',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    },
    {
        id: 27,
        label: 'Modified At',
        align: undefined,
        search: false,
        sort: false,
        stick: false,
        key: 'modified_at',
        visible: true,
        minWidth: 8,
        maxWidth: 8
    }
]
const getImage = array => {
    if (!array || !array.length) return ''
    return JSON.parse(array)[0]
}
export const transformData = (data, handleProductClick) =>
    data?.map((item, index) => ({
        id: item?.id || index + 1, // Assuming 'id' if not provided is index + 1
        image: (
            <Box
                sx={{
                    display: 'flex',
                    padding: '2px',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => handleProductClick(item?.id)}
            >
                <CustomImage
                    src={getImage(item?.image) || ''} // Assuming imageUrl is an array and getting the first element
                    alt='product image'
                    styles={{
                        width: '40px',
                        height: '50px',
                        border: '1px solid',
                        borderRadius: '8px'
                    }}
                />
            </Box>
        ),
        // : item?.productName || 'Unknown Product', // Replace with actual property if it exists
        description: (
            <Tooltip
                title={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                        <RemoveRedEye fontSize='small' />
                        <Typography sx={{ fontSize: '0.75rem' }}>View Catalogue</Typography>
                    </Box>
                }
                arrow
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        // Styles for the entire clickable area on hover
                        '&:hover': {
                            '& .description-text': {
                                // Target the Typography component
                                color: 'blue.dark' // Darker blue on hover
                            },
                            '& .chevron-icon': {
                                // Target the icon
                                color: 'blue.dark', // Darker blue on hover
                                transform: 'translateX(2px)' // Slight movement to the right
                            }
                        }
                    }}
                    onClick={() => handleProductClick(item?.id)}
                >
                    <Typography
                        className='description-text' // Add a class name for targeting in hover
                        sx={{
                            color: 'blue.dark',
                            fontWeight: '500',
                            fontSize: '13px',
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.2s ease-in-out' // Smooth transition for color change
                        }}
                    >
                        {item?.description}
                    </Typography>
                    <ArrowForwardIos
                        className='chevron-icon' // Add a class name for targeting in hover
                        sx={{
                            fontSize: '0.85rem', // Slightly larger than '0.75rem'
                            ml: 0.5,
                            color: 'blue.dark', // Initial blue color
                            transition: 'color 0.2s ease-in-out, transform 0.2s ease-in-out' // Smooth transitions
                        }}
                    />
                </Box>
            </Tooltip>
        ),
        no: item?.no || 'Unknown Code', // Replace with actual property if it exists
        no_2: item?.no_2 || 'Unknown UPC', // Replace with actual property if it exists
        description_2: item?.description_2 || 'No description available', // Replace with actual property if it exists
        category_name: item?.category_name || 'Miscellaneous', // Replace with actual property if it exists
        unit_price: item?.unit_price || 0, // Replace with actual property if it exists
        mrp_price: item?.mrp_price || 0, // Replace with actual property if it exists
        expiry_reqd: item?.expiry_reqd ? (
            <StatusBadge type='success' label='Yes' />
        ) : (
            <StatusBadge type='danger' label='No' />
        ),
        manufacturing_reqd: item?.manufacturing_reqd ? (
            <StatusBadge type='success' label='Yes' />
        ) : (
            <StatusBadge type='danger' label='No' />
        ),
        lot_reqd: item?.lot_reqd ? (
            <StatusBadge type='success' label='Yes' />
        ) : (
            <StatusBadge type='danger' label='No' />
        ),
        pick_criteria: item?.pick_criteria || 'FIFO', // Replace with actual property if it exists
        // UOM: item?.UOM || 'Piece', // Replace with actual property if it exists
        // taxPercentage: item?.taxPercentage,
        created_by: item?.created_by,
        created_at: item?.created_at,
        modified_by: item?.modified_by,
        modified_at: item?.modified_at
    }))
