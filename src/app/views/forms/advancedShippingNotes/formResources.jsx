/* eslint-disable */
import { z } from 'zod'

export const initialValues = {
    tabId: 'generalInformation',
    asn_type: '', // Dropdown for ASN Type
    po_no: '', // Purchase Order Number
    vendor_code: '',
    challan_no: '', // Challan Number
    ext_asn_no: '', // External ASN Number
    status: null, // Dropdown for Status
    invoice_no: '', // Invoice Number
    invoice_date: '',
    invoice_value: '',
    invoice_value_currency: 'INR',
    manifest_no: '',
    seal_no: '',
    edd: null,
    expiry_date: null,
    no_of_cases: null,
    docket_no: '',
    transporter_name: null,
    transport_method: null,
    driver_name: '',
    driver_mobile_no: '',
    freight_amount: undefined,
    vehicle_no: ''
}

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

export const validationSchema = [
    z.object({
        asn_type: z.string().min(1, 'ASN Type is required'),
        po_no: z.union([
            z.object({
                value: z.number().min(1, { message: 'PO No. is required' }),
                label: z.string()
            }),
            z.string().min(1, { message: 'PO No. is required' })
        ]),
        vendor_code: z.union([
            z.object({
                value: z.number().min(1, { message: 'Vendor Code is required' }),
                label: z.string()
            }),
            z.string().min(1, { message: 'Vendor Code is required' })
        ]),
        challan_no: z.string().optional(),
        ext_asn_no: z.string().min(1, 'Ext ASN No. is required'),
        status: z.preprocess(
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
        invoice_no: z.string().min(1, 'Invoice No is required'),
        invoice_value: z.string().min(1, 'Invoice Value is required'),
        invoice_date: z.string({ required_error: 'Invoice Date is required' }).min(1, 'Invoice Date is required'),
        manifest_no: z.string().min(1, 'Manifest No. is required'),
        seal_no: z.string().min(1, 'Seal No. is required')
    }),
    z.object({
        edd: z.string().nullable(), // EDD must not be null
        expiry_date: z.string().nullable(),
        no_of_cases: z.number({ invalid_type_error: 'This is required' }).min(1, 'Positive value is required'),
        docket_no: z.string().min(1, 'Docket No. is required'),
        driver_name: z.string().min(1, 'Driver Name is required'),
        driver_mobile_no: z.string().min(1, 'Driver Mobile No. is required'),
        transporter_name: z.string({ invalid_type_error: 'This is required' }).min(1, 'Transporter Name is required'),
        transport_method: z.string().min(1, 'Transport method is required'),
        freight_amount: z.number().optional(),
        vehicle_no: z.string().min(1, 'Vehicle No. is required')
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
        padding: '12px 8px',
        height: '20px' // Decrease input height
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    },
    flexGrow: 1
}
