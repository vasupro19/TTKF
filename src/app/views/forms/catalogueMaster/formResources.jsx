/* eslint-disable */

export const notes = [
    { id: 'n1', text: 'Complete all required fields marked with an asterisk (*).' },
    { id: 'n2', text: 'Optional fields can be filled for additional details.' },
    { id: 'n3', text: 'Navigate between tabs to fill out all sections.' },
    { id: 'n4', text: 'Ensure address fields are accurate if applicable.' },
    { id: 'n5', text: 'Review all data before submitting the form.' }
]

export const customInputSx = {
    '& .MuiAutocomplete-option': {
        backgroundColor: 'white',
        '&[aria-selected="true"]': {
            backgroundColor: 'white' // Selected option
        },
        '&:hover': {
            backgroundColor: '#f5f5f5' // Optional: hover effect
        }
    }
}
export const customTextSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'white' // Ensures white background for the input
    },
    '& .MuiOutlinedInput-input': {
        backgroundColor: 'white' // Ensures white background for the text area
    }
}

export const customSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '12px 8px',
        height: '18px' // Decrease input height
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    },
    flexGrow: 1
}

export const formFields = [
    // Product Info Section
    {
        label: 'Product Code',
        name: 'no',
        isMandatory: true,
        type: 'text',
        section: 'productInfo'
    },
    {
        label: 'EAN/UPC',
        name: 'no_2',
        isMandatory: true,
        type: 'text',
        section: 'productInfo'
    },
    {
        label: 'Product Name',
        name: 'description',
        isMandatory: true,
        type: 'text',
        section: 'productInfo'
    },
    {
        label: 'Product Description',
        name: 'description_2',
        isMandatory: false,
        type: 'text',
        section: 'productInfo'
    },
    // {
    //     label: 'Style Code',
    //     isMandatory: false,
    //     type: 'text',
    //     section: 'productInfo'
    // },
    {
        label: 'Net Weight',
        name: 'net_weight',
        isMandatory: false,
        type: 'number',
        section: 'productInfo'
    },
    {
        label: 'Length',
        name: 'length',
        isMandatory: false,
        type: 'number',
        section: 'productInfo'
    },
    {
        label: 'Breadth',
        name: 'breadth',
        isMandatory: false,
        type: 'number',
        section: 'productInfo'
    },
    {
        label: 'Height',
        name: 'height',
        isMandatory: false,
        type: 'number',
        section: 'productInfo'
    },
    {
        label: 'Images URL',
        name: 'image',
        isMandatory: false,
        type: 'imageUrls',
        section: 'productInfo',
        maxCount: 10
    },

    // Pricing Section
    {
        label: 'Unit Cost',
        name: 'unit_price',
        isMandatory: true,
        type: 'number',
        section: 'pricing'
    },
    {
        label: 'Maximum Retail Price (MRP)',
        name: 'mrp_price',
        isMandatory: false,
        type: 'number',
        section: 'pricing'
    },
    {
        label: 'HSN Code',
        name: 'hsn_code',
        isMandatory: false,
        type: 'alphaNumeric',
        section: 'pricing'
    },

    // Inventory Section
    {
        label: 'Is Expirable',
        name: 'expiry_reqd',
        isMandatory: false,
        type: 'dropDown',
        section: 'inventory',
        options: ['Yes', 'NO']
    },
    {
        label: 'Manufacturing',
        name: 'manufacturing_reqd',
        isMandatory: true,
        type: 'dropDown',
        section: 'inventory',
        options: ['Yes', 'NO']
    },

    {
        label: 'Batch',
        name: 'lot_reqd',
        isMandatory: false,
        type: 'dropDown',
        section: 'inventory',
        options: ['Yes', 'NO']
    },
    // {
    //     label: 'Threshold Inventory',
    //     isMandatory: true,
    //     type: 'dropDown',
    //     section: 'inventory',
    //     options: ['Yes', 'NO']
    // },
    {
        label: 'Dual MRP',
        name: 'dual_mrp',
        isMandatory: false,
        type: 'dropDown',
        section: 'inventory',
        options: ['Yes', 'NO']
    },
    // {
    //     label: 'Vendor Code',
    //     isMandatory: false,
    //     type: 'dropDown',
    //     section: 'inventory',
    //     options: ['VendorA', 'VendorB', 'VendorC', 'VendorD', 'VendorE', 'VendorF', 'VendorG', 'VendorH', 'VendorI']
    // },
    // {
    //     label: 'Vendor Name',
    //     isMandatory: false,
    //     type: 'text',
    //     section: 'inventory'
    // },
    {
        label: 'Pick Criteria',
        name: 'pick_criteria',
        isMandatory: true,
        type: 'dropDown',
        section: 'inventory',
        options: ['FIFO', 'LIFO', 'FEFO', 'FMFO', 'FLFO']
    },

    // Hierarchy Section
    {
        label: 'Category',
        name: 'category_name',
        isMandatory: true,
        type: 'dropDown',
        section: 'hierarchy',
        options: ['Electronics', 'Apparel', 'Home & Kitchen'] // Example categories
    }
    // {
    //     label: 'Parent Brand',
    //     isMandatory: false,
    //     type: 'text',
    //     section: 'hierarchy'
    // }
]
