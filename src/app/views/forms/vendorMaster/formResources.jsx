/* eslint-disable */
import { expressions } from '@/constants'
import { z } from 'zod'

export const notes = [
    { id: 'n1', text: 'Enter the Company Name (minimum 2 characters required).' },
    { id: 'n2', text: 'Optionally, provide the Vendor Code and Brand Name.' },
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
    { id: 'n14', text: 'Indicate whether Excess GRN is allowed and, if so, provide the Tolerance Margin.' },
    { id: 'n15', text: 'Indicate whether QC is required.' },
    { id: 'n16', text: 'Optionally, specify Shipping Terms, Currency, and Credit Period.' },
    {
        id: 'n17',
        text: 'Verify that all required fields are filled accurately and click Submit to save the information.'
    }
]

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
    bill_pincode: '',
    bill_pincode_id: '',
    bill_city_id: '',
    bill_state_id: '',
    bill_country_id: '',
    bill_contact_name: '',
    bill_contact_email: '',
    bill_contact_no: '',
    bill_lat_long: '',
    same_as_billing_address: '',
    ship_address_1: '',
    ship_address_2: '',
    ship_pincode: '',
    ship_pincode_id: '',
    ship_city_id: '',
    ship_state_id: '',
    ship_country_id: '',
    ship_contact_name: '',
    ship_contact_no: '',
    ship_contact_email: '',
    ship_lat_long: '',
    allow_excess_grn: true,
    qc_required: false,
    shipping_term: '',
    currency: '',
    credit_period_day: '',
    tolerance: 0
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
    allow_excess_grn: '',
    qc_required: '',
    shipping_term: '',
    currency: '',
    credit_period_day: ''
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

export const validationSchema = [
    z.object({
        name: z.string().min(2, 'Company Name is required'),
        code: z.string().min(1, 'Vendor code is required'),
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
        bill_country_id: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Country is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Country is required'
                })
        ),
        bill_state_id: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.number().min(1, { message: 'State is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'State is required'
                    })
            )
            .optional(),
        bill_city_id: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.number().min(1, { message: 'City is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'City is required'
                    })
            )
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
        ship_country_id: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Country is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Country is required'
                })
        ),
        ship_state_id: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.number().min(1, { message: 'State is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'State is required'
                    })
            )
            .optional(),
        ship_city_id: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.number().min(1, { message: 'City is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'City is required'
                    })
            )
            .optional(),
        ship_pincode: z
            .string()
            .min(6, 'Postcode must be at least 6 digits')
            .max(10, 'Postcode must be less than 10 digits'),
        ship_contact_name: z.string().optional(),
        ship_contact_no: z.string().optional(),
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
    z
        .object({
            allow_excess_grn: z.boolean(),

            tolerance: z.union([z.number().optional(), z.string().optional()]),

            qc_required: z.boolean(),

            shipping_term: z.union([
                z.object({
                    value: z.string().min(1, { message: 'Shipping Term is required' }),
                    label: z.string()
                }),
                z.string().min(1, 'Shipping Term is required')
            ]),

            currency: z.union([
                z.object({
                    value: z.string().min(1, { message: 'currency is required' }),
                    label: z.string()
                }),
                z.string().min(1, 'Currency is required')
            ]),

            credit_period_day: z.union([
                z.number().min(0, 'credit period cannot be negative'),
                z.string().min(1, 'Credit period is required')
            ])
        })
        .superRefine((data, ctx) => {
            if (data.allow_excess_grn && !data.tolerance) {
                ctx.addIssue({
                    code: z.ZodIssueCode.too_small,
                    path: ['tolerance'],
                    minimum: 1,
                    type: 'number',
                    inclusive: true,
                    exact: false,
                    message: 'Tolerance is required'
                })
            }
        })
]
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

export const tabsFields = [
    {
        label: 'General Information',
        fields: [
            {
                name: 'company_name',
                label: 'Company Name*',
                placeholder: 'eg: John Doe',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'vendor_code',
                label: 'Vendor Code',
                placeholder: 'eg: VENT12345',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'brand_name',
                label: 'Brand Name',
                placeholder: 'eg: BrandX',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'gst_in',
                label: 'GSTIN*',
                placeholder: 'eg: 22ABCDE1234FZ1',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'pan_no',
                label: 'PAN*',
                placeholder: 'eg: ABCDE1234F',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'fssai_no',
                label: 'FSSAI No',
                placeholder: 'eg: 12345678912345',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'tin_no',
                label: 'Tax Identification Number',
                placeholder: 'eg: 1234567890',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'cin_no',
                label: 'CIN',
                placeholder: 'eg: U12345MH2000PTC123456',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            }
        ]
    },
    {
        label: 'Bill From Address',
        fields: [
            {
                name: 'billing_address_line_1',
                label: 'Address Line 1*',
                placeholder: 'eg: 123 Street Name',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 6 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'billing_address_line_2',
                label: 'Address Line 2',
                placeholder: 'eg: Apt 456',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 6 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'billing_postcode',
                label: 'Post Code*',
                placeholder: 'eg: 400001',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'billing_city',
                label: 'City',
                placeholder: 'Select a city',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: billingCities,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'billing_state',
                label: 'State',
                placeholder: 'Select a state',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: billingStates,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'billing_country',
                label: 'Country',
                placeholder: 'Select a country',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: countries,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },

            {
                name: 'billing_contact_name',
                label: 'Contact name',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                placeholder: 'eg: Michael Scott'
            },
            {
                name: 'billing_phone_number',
                label: 'Contact Number',
                placeholder: 'eg: +91 98765-43210',
                type: 'phone',
                required: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'billing_email_id',
                label: 'Contact Email',
                placeholder: 'eg: johndoe@gmail.com',
                type: 'email',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'billing_lat_lang',
                label: 'Latitude, Longitude',
                placeholder: 'eg: 12.3456,78.9101',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            }
        ]
    },
    {
        label: 'Ship From Address',
        fields: [
            {
                name: 'shipping_address_line_1',
                label: 'Address Line 1*',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 6 },
                size: 'small',
                customSx: customSx,
                placeholder: '123 Main Street'
            },
            {
                name: 'shipping_address_line_2',
                label: 'Address Line 2',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 6 },
                size: 'small',
                customSx: customSx,
                placeholder: 'Apartment 4B'
            },
            ,
            {
                name: 'shipping_postcode',
                label: 'Post Code*',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                placeholder: '400001'
            },

            {
                name: 'shipping_city',
                label: 'City',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: shippingCities,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                placeholder: 'Select a city',
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'shipping_state',
                label: 'State',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: shippingStates,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                placeholder: 'Select a state',
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'shipping_country',
                label: 'Country',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: countries,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                placeholder: 'Select a country',
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'shipping_contact_name',
                label: 'Contact name',
                type: 'text',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx,
                placeholder: 'eg: Michael Scott'
            },
            {
                name: 'shipping_phone_number',
                label: 'Contact Number',
                placeholder: 'eg: +91 98765-43210',
                type: 'phone',
                required: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'shipping_email_id',
                label: 'Contact Email',
                placeholder: 'eg: johndoe@gmail.com',
                type: 'email',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            },
            {
                name: 'shipping_lat_lang',
                label: 'Latitude, Longitude',
                placeholder: 'eg: 12.3456,78.9101',
                type: 'text',
                required: false,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 4 },
                size: 'small',
                customSx: customSx
            }
        ]
    },
    {
        label: 'Other Details',
        fields: [
            {
                name: 'allowExcessGRN',
                type: 'checkboxLabel',
                label: 'Allow excess GRN',
                grid: { xs: 12, sm: 6 },
                relatedField: {
                    name: 'tolerance',
                    label: 'Tolerance (%)',
                    type: 'number',
                    placeholder: 'percentage',
                    requiredIf: 'allowExcessGRN'
                }
            },
            {
                name: 'qcRequired',
                type: 'checkboxLabel',
                label: 'QC Required',
                grid: { xs: 12, sm: 6 }
            },
            {
                name: 'shipping_terms',
                label: 'Shipping Terms',
                placeholder: 'Select a shipping term',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: [
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
                ],
                grid: { xs: 12, sm: 6, md: 6 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'currency',
                label: 'Currency',
                placeholder: 'Select a currency',
                type: 'CustomAutocomplete',
                required: true,
                CustomFormInput: false,
                options: [
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
                ],
                grid: { xs: 12, sm: 6, md: 3 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                isOptionEqualToValue: (option, selectedValue) =>
                    (option?.value || option) === (selectedValue?.value || selectedValue)
            },
            {
                name: 'credit_period',
                label: 'Credit Period (days)',
                placeholder: 'Enter Credit Period',
                type: 'number',
                required: true,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: 3 },
                size: 'small',
                customSx: customSx,
                customInputSx: customInputSx,
                customTextSx: customTextSx,
                rightAddon: 'days'
            }
        ]
    }
]
