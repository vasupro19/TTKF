/* eslint-disable */
import { z } from 'zod'

// Array of country objects
const countries = [
    { id: 1, label: 'United States', value: 'US' },
    { id: 2, label: 'Canada', value: 'CA' },
    { id: 3, label: 'India', value: 'IN' },
    { id: 4, label: 'Australia', value: 'AU' },
    { id: 5, label: 'Germany', value: 'DE' }
]

// Array of billing states
const billingStates = [
    { id: 1, label: 'California', value: 'CA', countryCode: 'US' },
    { id: 2, label: 'Texas', value: 'TX', countryCode: 'US' },
    { id: 3, label: 'Ontario', value: 'ON', countryCode: 'CA' },
    { id: 4, label: 'New South Wales', value: 'NSW', countryCode: 'AU' },
    { id: 5, label: 'Bavaria', value: 'BY', countryCode: 'DE' }
]

// Array of billing cities
const billingCities = [
    { id: 1, label: 'Los Angeles', value: 'LA', stateId: 1 },
    { id: 2, label: 'San Francisco', value: 'SF', stateId: 1 },
    { id: 3, label: 'Austin', value: 'ATX', stateId: 2 },
    { id: 4, label: 'Toronto', value: 'TOR', stateId: 3 },
    { id: 5, label: 'Sydney', value: 'SYD', stateId: 4 }
]

// Array of shipping states
const shippingStates = [
    { id: 6, label: 'Nevada', value: 'NV', countryCode: 'US' },
    { id: 7, label: 'Quebec', value: 'QC', countryCode: 'CA' },
    { id: 8, label: 'Karnataka', value: 'KA', countryCode: 'IN' },
    { id: 9, label: 'Victoria', value: 'VIC', countryCode: 'AU' },
    { id: 10, label: 'Berlin', value: 'BE', countryCode: 'DE' }
]

// Array of shipping cities
const shippingCities = [
    { id: 6, label: 'Las Vegas', value: 'LV', stateId: 6 },
    { id: 7, label: 'Montreal', value: 'MTL', stateId: 7 },
    { id: 8, label: 'Bangalore', value: 'BLR', stateId: 8 },
    { id: 9, label: 'Melbourne', value: 'MEL', stateId: 9 },
    { id: 10, label: 'Berlin City', value: 'BCTY', stateId: 10 }
]

export const initialValues = {
    tabId: 'generalInformation',
    vendor_code: '',
    po_type: null, // Dropdown for Status
    vendor_name: '',
    ext_po_no: '',
    total_qty: null,
    remaining_qty: null,
    received_qty: null,
    code: null,
    edd: null,
    expiry_date: null
}

export const validationSchema = [
    z.object({
        vendor_code: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Vendor Code is required' }),
                    label: z.string(),
                    text: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Vendor Code is required'
                })
        ),
        po_type: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.string().min(1, { message: 'Status is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Status is required'
                })
        ),
        vendor_name: z.string().min(2, 'Vendor Name is required'),
        ext_po_no: z.string().min(1, 'Ext. PO No. is required'),
        total_qty: z.number({ invalid_type_error: 'Must be a number' }).nullable(),
        remaining_qty: z.number({ invalid_type_error: 'Must be a number' }).nullable(),
        received_qty: z.number({ invalid_type_error: 'Must be a number' }).nullable()
    }),
    z.object({
        edd: z.string({ required_error: 'EDD is required' }).min(1, 'EDD is required'),
        expiry_date: z.string({ required_error: 'Expiry Date is required' }).min(1, 'Expiry Date is required')
    })
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
        padding: '12px 8px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    },
    flexGrow: 1
}
