/* eslint-disable */
import { expressions } from '@/constants'
import { z } from 'zod'

export const initialValues = {
    name: '',
    code: '',
    brand_name: '',
    gst_in: '',
    pan_no: '',
    fssai_no: '',
    tin_no: '',
    cin_no: '',
    bill_address_1: '',
    bill_address_2: '',
    bill_contact_email: '',
    bill_contact_no: '',
    bill_contact_name: '',
    bill_lat_long: '',
    bill_country_id: '',
    bill_state_id: '',
    bill_city_id: '',
    bill_pincode_id: '',
    bill_pincode: '',
    ship_address_1: '',
    ship_address_2: '',
    ship_country_id: '',
    ship_state_id: '',
    ship_city_id: '',
    ship_pincode_id: '',
    ship_pincode: '',
    ship_contact_email: '',
    ship_contact_no: '',
    ship_lat_long: '',
    customer_type: '',
    customer_group: '',
    shipping_term: '',
    currency: '',
    credit_period_day: null
}

export const keysToSetForEdit = {
    name: '',
    code: '',
    brand_name: '',
    gst_in: '',
    pan_no: '',
    fssai_no: '',
    tin_no: '',
    cin_no: '',
    bill_address_1: '',
    bill_address_2: '',
    bill_pincode: '',
    bill_pincode_id: '',
    bill_contact_name: '',
    bill_contact_email: '',
    bill_contact_no: '',
    bill_lat_long: '',
    same_as_billing_address: '',
    ship_address_1: '',
    ship_address_2: '',
    ship_pincode: '',
    ship_pincode_id: '',
    ship_contact_name: '',
    ship_contact_no: '',
    ship_contact_email: '',
    ship_lat_long: '',
    customer_type: '',
    customer_group: '',
    shipping_term: '',
    currency: '',
    credit_period_day: null
}

export const notes = [
    { id: 'n1', text: 'Enter the Customer Name (minimum 2 characters required).' },
    { id: 'n2', text: 'Optionally, provide the Customer Code and Brand Name.' },
    { id: 'n3', text: 'Enter a valid GST Number (e.g., 22ABCDE1234F1Z5).' },
    { id: 'n4', text: 'Enter a valid PAN Number (e.g., ABCDE1234F).' },
    { id: 'n5', text: 'Provide optional details like FSSAI Number, TIN Number, and CIN Number.' },
    { id: 'n6', text: 'Fill in the Billing Address Line 1 (minimum 3 characters required).' },
    {
        id: 'n7',
        text: 'Optionally, add Billing Address Line 2, Country, State, City, and Postcode (must be between 6 and 10 digits).'
    },
    {
        id: 'n8',
        text: 'Provide optional Billing Contact Name, Phone Number, and Email Address (if provided, must be in a valid format).'
    },
    {
        id: 'n9',
        text: 'Enter optional Billing Latitude and Longitude in a valid format (e.g., 37.7749, -122.4194).'
    },
    { id: 'n10', text: 'Fill in the Shipping Address Line 1 (minimum 3 characters required).' },
    {
        id: 'n11',
        text: 'Optionally, add Shipping Address Line 2, Country, State, City, and Postcode (must be between 6 and 10 digits).'
    },
    {
        id: 'n12',
        text: 'Provide optional Shipping Contact Name, Phone Number, and Email Address (if provided, must be in a valid format).'
    },
    {
        id: 'n13',
        text: 'Enter optional Shipping Latitude and Longitude in a valid format (e.g., 37.7749, -122.4194).'
    },
    { id: 'n14', text: 'Select Customer Type (optional) from the dropdown list available.' },
    { id: 'n15', text: 'Select Customer Group (optional) from the provided options.' },
    { id: 'n16', text: 'Optionally specify Shipping Terms to clarify delivery conditions.' },
    { id: 'n17', text: 'Optionally choose Currency for transactions (e.g., USD, EUR).' },
    { id: 'n18', text: 'Optionally define the Credit Period in days (e.g., 30 days, can be left blank).' },
    {
        id: 'n19',
        text: 'Verify that all optional fields are filled accurately and click Submit to save the information.'
    }
]

export const validationSchema = [
    z.object({
        // name: z.string().min(2, 'Customer Name is required'),
        name: z.string().superRefine((val, ctx) => {
            const input = val.trim()
            if (!input) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Customer Name is required'
                })
            } else if (input.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Must be at least 2 characters'
                })
            }
        }),
        code: z.string().min(1, 'Customer Code is required'),
        brand_name: z.string().optional(),
        gst_in: z
            .string()
            .refine(val => val && val.length > 0, 'GST Number is required')
            .refine(
                val => !val || /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(val),
                'Invalid GST Number'
            ),
        pan_no: z
            .string()
            .refine(val => val && val.length > 0, 'PAN Number is required')
            .refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(val), 'Invalid PAN Number'),
        fssai_no: z
            .string()
            .optional()
            .refine(val => !val || expressions.fssai.test(val), 'Invalid FSSAI Number'),
        tin_no: z
            .string()
            .optional()
            .refine(val => !val || expressions.tin.test(val), 'Invalid TIN Number'),

        cin_no: z
            .string()
            .optional()
            .refine(val => !val || expressions.cin.test(val), 'Invalid CIN Number')
    }),
    z.object({
        bill_address_1: z.string().min(3, 'Address Line 1 is required').max(250, 'max 250 characters are allowed'),
        bill_address_2: z.string().optional(),
        bill_country_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'Country is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        bill_state_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'States is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        bill_city_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'City is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        bill_pincode: z.string().min(6, 'must be at least 6 digits').max(10, 'Postcode must be less than 10 digits'),
        bill_contact_name: z.string().optional(),
        bill_contact_no: z.string().min(1, { message: 'Contact number is required' }),
        bill_contact_email: z
            .string()
            .optional() // Makes email optional
            .refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: 'Invalid Email format'
            }),
        bill_lat_long: z
            .string()
            .optional()
            .refine(val => !val || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val), {
                message: 'Invalid latitude, longitude format'
            })
    }),
    z.object({
        ship_address_1: z.string().min(3, 'Address Line 1 is required').max(250, 'max 250 characters are allowed'),
        ship_address_2: z.string().optional(),
        ship_country_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'Country is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        ship_state_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'State is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        ship_city_id: z
            .union([
                z
                    .object({
                        value: z.number().min(1, { message: 'Country is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        ship_pincode: z
            .string()
            .min(6, 'Postcode must be at least 6 digits')
            .max(10, 'Postcode must be less than 10 digits'),
        ship_contact_name: z.string().optional(),
        ship_contact_no: z.string().min(1, { message: 'Contact number is required' }),
        ship_contact_email: z
            .string()
            .optional() // Makes email optional
            .refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: 'Invalid Email format'
            }),
        ship_lat_long: z
            .string()
            .optional()
            .refine(val => !val || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val), {
                message: 'Invalid latitude, longitude format'
            })
    }),
    z.object({
        customer_type: z
            .union([
                z
                    .object({
                        value: z.string().min(1, { message: 'customer type is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        customer_group: z
            .union([
                z
                    .object({
                        value: z.string().min(1, { message: 'customer group is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        shipping_term: z
            .union([
                z
                    .object({
                        value: z.string().min(1, { message: 'Shipping term is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        currency: z
            .union([
                z
                    .object({
                        value: z.string().min(1, { message: 'Currency is required' }),
                        label: z.string()
                    })
                    .optional(),
                z.string().optional()
            ])
            .optional(),
        credit_period_day: z
            .union([z.number().min(0, 'credit period cannot be negative'), z.string().optional()])
            .nullable()
    })
]

export const customerTypes = [
    { label: 'MBS - Multi Brand Store', value: 'MBS' },
    { label: 'Marketplace', value: 'Marketplace' },
    { label: 'Warehouse', value: 'Warehouse' },
    { label: 'B2B - Business to Business', value: 'B2B' },
    { label: 'Wholesaler', value: 'Wholesaler' }
]

export const customerGroups = [
    { label: 'Retail Customers', value: 'retail' },
    { label: 'Corporate Clients', value: 'corporate' },
    { label: 'Non-Profit Organizations', value: 'non_profit' },
    { label: 'Government Agencies', value: 'government' },
    { label: 'Educational Institutions', value: 'education' }
]

// Array of country objects
export const countries = [
    { id: 1, label: 'United States', value: 'US' },
    { id: 2, label: 'Canada', value: 'CA' },
    { id: 3, label: 'India', value: 'IN' },
    { id: 4, label: 'Australia', value: 'AU' },
    { id: 5, label: 'Germany', value: 'DE' }
]

// Array of billing states
export const billingStates = [
    { id: 1, label: 'California', value: 'CA', countryCode: 'US' },
    { id: 2, label: 'Texas', value: 'TX', countryCode: 'US' },
    { id: 3, label: 'Ontario', value: 'ON', countryCode: 'CA' },
    { id: 4, label: 'New South Wales', value: 'NSW', countryCode: 'AU' },
    { id: 5, label: 'Bavaria', value: 'BY', countryCode: 'DE' }
]

// Array of billing cities
export const billingCities = [
    { id: 1, label: 'Los Angeles', value: 'LA', stateId: 1 },
    { id: 2, label: 'San Francisco', value: 'SF', stateId: 1 },
    { id: 3, label: 'Austin', value: 'ATX', stateId: 2 },
    { id: 4, label: 'Toronto', value: 'TOR', stateId: 3 },
    { id: 5, label: 'Sydney', value: 'SYD', stateId: 4 }
]

// Array of shipping states
export const shippingStates = [
    { id: 6, label: 'Nevada', value: 'NV', countryCode: 'US' },
    { id: 7, label: 'Quebec', value: 'QC', countryCode: 'CA' },
    { id: 8, label: 'Karnataka', value: 'KA', countryCode: 'IN' },
    { id: 9, label: 'Victoria', value: 'VIC', countryCode: 'AU' },
    { id: 10, label: 'Berlin', value: 'BE', countryCode: 'DE' }
]

// Array of shipping cities
export const shippingCities = [
    { id: 6, label: 'Las Vegas', value: 'LV', stateId: 6 },
    { id: 7, label: 'Montreal', value: 'MTL', stateId: 7 },
    { id: 8, label: 'Bangalore', value: 'BLR', stateId: 8 },
    { id: 9, label: 'Melbourne', value: 'MEL', stateId: 9 },
    { id: 10, label: 'Berlin City', value: 'BCTY', stateId: 10 }
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

export const shippingTerms = [
    { label: 'Not Free (UN)', value: 'UN' },
    { label: 'Free house (FH)', value: 'FH' },
    { label: 'Delivered Duty Unpaid (DDU)', value: 'DDU' },
    { label: 'Delivered Ex Quay (DEQ)', value: 'DEQ' },
    { label: 'Delivered Ex Ship(DES)', value: 'DES' },
    { label: 'Delivered At Frontier(DAF)', value: 'DAF' },
    { label: 'Delivered at Terminal(DAT)', value: 'DAT' },
    { label: 'Cost, Insurance, Freight(CIF)', value: 'CIF' },
    { label: 'Cost and Freight(CFR)', value: 'CFR' },
    { label: 'Free On Board (FOB)', value: 'FOB' },
    { label: 'Free Alongside Ship (FAS)', value: 'FAS' },
    { label: 'Delivered Duty Paid (DDP)', value: 'DDP' },
    { label: 'Delivered At Place (DAP)', value: 'DAP' },
    { label: 'Delivered at Place Unloaded (DPU)', value: 'DPU' },
    { label: 'Carriage and Insurance Paid (CIP)', value: 'CIP' },
    { label: 'Carriage Paid To (CPT)', value: 'CPT' },
    { label: 'Free Carrier (FCA)', value: 'FCA' },
    { label: 'ExWorks (EXW)', value: 'EXW' }
]

export const currencies = [
    { label: 'USD - United States Dollar', value: 'USD' },
    { label: 'EUR - Euro', value: 'EUR' },
    { label: 'GBP - British Pound', value: 'GBP' },
    { label: 'INR - Indian Rupee', value: 'INR' },
    { label: 'JPY - Japanese Yen', value: 'JPY' },
    { label: 'AUD - Australian Dollar', value: 'AUD' },
    { label: 'CAD - Canadian Dollar', value: 'CAD' },
    { label: 'CHF - Swiss Franc', value: 'CHF' },
    { label: 'CNY - Chinese Yuan', value: 'CNY' },
    { label: 'MXN - Mexican Peso', value: 'MXN' },
    { label: 'BRL - Brazilian Real', value: 'BRL' },
    { label: 'RUB - Russian Ruble', value: 'RUB' },
    { label: 'ZAR - South African Rand', value: 'ZAR' }
]
