/* eslint-disable */
import { z } from 'zod'
import { expressions } from '@/constants'
import { generateRandomString } from '@/utilities'
import { Comment, CommentOutlined, Info, InfoOutlined, LocalShipping, LocalShippingOutlined, ShoppingCart, ShoppingCartOutlined } from '@mui/icons-material'

const getUniqueId = generateRandomString()

export const initialValues = {
    // Tab:1 Basic Information
    tabId: 'orderInfo',
    order_no: '',
    external_order_id: getUniqueId,
    original_order_no: '',
    customer_name: '',
    customer_id: '',
    order_type: null,
    shipment_mode: null,
    payment_mode: null,
    order_date: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
    })(),
    fulfilled_by: '',
    channel_code: null,
    priority: null,
    // Tab:2 Bill To Address
    bill_add1: '',
    bill_add2: '',
    bill_pincode: '',
    bill_pincode_id: '',
    bill_to_name: '',
    bill_email: '',
    bill_phone1: '',
    bill_phone2: '',
    bill_lat: '',
    // Tab:3 Ship To Address
    bill_same_ship: '',
    ship_add1: '',
    ship_add2: '',
    ship_pincode: '',
    ship_pincode_id: '',
    ship_to_name: '',
    ship_phone2: '',
    ship_phone1: '',
    ship_email: '',
    ship_lat: '',
    gst_no: '',
    // Tab:4 Invoice & Others
    isGift: false,
    gift_message: '',
    discount_code: '',
    remarks: '',
    invoice_no: '',
    total_amount: '',
    total_discount: '',
    shipping_charges: '',
    other_charges: '',
    currency: { label: 'INR (₹)', value: 'INR' },
    transport_mode: null,
    carrier_name: null,
    tracking_no: '',
    on_hold: false
}

export const validationSchema = [
    z
        .object({
            order_no: z.string().optional(),
            customer_name: z.preprocess(
                val => {
                    if (typeof val === 'string') return { value: val, label: val }
                    if (typeof val === 'object' && val !== null) return val
                    return null
                },
                z
                    .object({
                        value: z.string(),
                        label: z.string()
                    })
                    .nullable()
            ),
            original_order_no: z.string().optional(),
            vendor_name: z.preprocess(
                val => {
                    if (typeof val === 'string') return { value: val, label: val }
                    if (typeof val === 'object' && val !== null) return val
                    return null
                },
                z
                    .object({
                        value: z.string(),
                        label: z.string()
                    })
                    .nullable()
            ),
            external_order_id: z.string().trim().min(1, 'This is required'),
            order_type: z.preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.string().trim().min(1, { message: 'Order Type is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'Order Type is required'
                    })
            ),
            shipment_mode: z
                .preprocess(
                    val => (typeof val === 'object' && val !== null ? val : null),
                    z
                        .object({
                            value: z.string(),
                            label: z.string()
                        })
                        .nullable()
                )
                .optional(),
            payment_mode: z.preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.string().min(1, { message: 'Payment Mode is required' }),
                        label: z.string()
                    })
                    .nullable()
                    .refine(val => val !== null, {
                        message: 'Payment Mode is required'
                    })
            ),
            order_date: z.string().nonempty('Order date is required'),
            fulfilled_by: z.string().nonempty('Fulfilled by is required'),
            priority: z
                .preprocess(
                    val => (typeof val === 'object' && val !== null ? val : null),
                    z
                        .object({
                            value: z.string(),
                            label: z.string()
                        })
                        .nullable()
                )
                .optional(),
            // status: z.preprocess(
            //     val => (typeof val === 'object' && val !== null ? val : null),
            //     z
            //         .object({
            //             value: z.string().min(1, { message: 'Status is required' }),
            //             label: z.string()
            //         })
            //         .nullable()
            //         .refine(val => val !== null, {
            //             message: 'Status is required'
            //         })
            // ),

            channel_code: z
                .preprocess(
                    val => (typeof val === 'object' && val !== null ? val : null),
                    z
                        .object({
                            value: z.coerce.string(),
                            label: z.string()
                        })
                        .nullable()
                )
                .optional()
        })
        .superRefine((data, ctx) => {
            const orderTypeValue = data.order_type?.value
            if (orderTypeValue === 'PurchaseReturn') {
                // For PurchaseReturn orders, vendor_name is required
                if (!data.vendor_name || !data.vendor_name.value || data.vendor_name.value.trim() === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Vendor is required for PurchaseReturn orders',
                        path: ['vendor_name']
                    })
                }
            } else if (!['B2C', 'Exchange', 'Promotion', 'Sample']?.includes(orderTypeValue)) {
                if (!data.customer_name || !data.customer_name.value || data.customer_name.value.trim() === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Customer is required',
                        path: ['customer_name']
                    })
                }
            }
            if (['B2C', 'Sample'].includes(orderTypeValue)) {
                if (!data.shipment_mode?.value) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Shipment Mode is required',
                        path: ['shipment_mode']
                    })
                }
            }
            // Add validation for original_order_no when orderTypeValue is 'Exchange'
            if (orderTypeValue === 'Exchange') {
                if (!data.original_order_no || data.original_order_no.trim() === '') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Required for Exchange orders',
                        path: ['original_order_no']
                    })
                }
            }
        }),
    z.object({
        bill_add1: z.string().trim().min(3, 'Address Line 1 is required').max(250, 'max 250 characters are allowed'),
        bill_add2: z.string().max(250, 'max 250 characters are allowed').optional().nullable(),
        bill_country_id: z
            .string()
            .min(1, { message: 'Country is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'Country is required'
            }),
        bill_state_id: z
            .string()
            .min(1, { message: 'State is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'State is required'
            }),
        bill_city_id: z
            .string()
            .min(1, { message: 'City is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'City is required'
            }),
        bill_pincode: z
            .string()
            .trim()
            .min(6, 'Postcode must be at least 6 digits')
            .max(10, 'Postcode must be less than 10 digits'),
        bill_to_name: z.string().trim().min(1, 'Contact name is required'),
        bill_phone1: z.string().trim().min(10, 'Contact No. is required'),
        bill_phone2: z.string().optional().nullable(),
        bill_email: z
            .string()
            .optional() // Makes email optional
            .refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: 'Invalid Email format'
            })
            .nullable(),
        bill_lat: z
            .string()
            .optional()
            .refine(val => !val || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val), {
                message: 'Must include comma between latitude and longitude'
            })
    }),
    z.object({
        ship_add1: z.string().trim().min(3, 'Address Line 1 is required').max(250, 'max 250 characters are allowed'),
        ship_add2: z.string().trim().max(250, 'max 250 characters are allowed').optional().nullable(),
        ship_country_id: z
            .string()
            .min(1, { message: 'Country is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'Country is required'
            }),
        ship_state_id: z
            .string()
            .min(1, { message: 'State is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'State is required'
            }),
        ship_city_id: z
            .string()
            .min(1, { message: 'City is required' })
            .nullable()
            .refine(val => val !== null && val !== '', {
                message: 'City is required'
            }),
        ship_pincode: z
            .string()
            .trim()
            .min(6, 'Postcode must be at least 6 digits')
            .max(10, 'Postcode must be less than 10 digits'),
        ship_to_name: z.string().trim().min(1, 'Contact name is required'),
        ship_phone1: z.string().trim().min(10, 'Contact No. is required'),
        ship_phone2: z.string().optional().nullable(),
        ship_email: z
            .string()
            .optional() // Makes email optional
            .refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: 'Invalid Email format'
            })
            .nullable(),
        ship_lat: z
            .string()
            .optional()
            .refine(val => !val || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val), {
                message: 'Must include comma between latitude and longitude'
            }),
        gst_no: z
            .string()
            .optional()
            .refine(val => !val || expressions.gst.test(val), { message: 'Invalid GSTIN number' })
    }),
    z.object({
        isGift: z.boolean().optional(),
        gift_message: z.string().max(500, 'max 500 characters are allowed').optional(),
        discount_code: z.string().optional().nullable(),
        on_hold: z.boolean().optional(),
        remarks: z.string().max(500, 'max 500 characters are allowed').optional().nullable(),
        invoice_no: z.string().optional(),
        total_amount: z.union([z.number().optional(), z.string().optional()]),
        total_discount: z.union([z.number().optional(), z.string().optional()]),
        shipping_charges: z.union([z.number().optional(), z.string().optional()]),
        other_charges: z.union([z.number().optional(), z.string().optional()]),
        transport_mode: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.string(),
                        label: z.string()
                    })
                    .nullable()
            )
            .optional(),
        carrier_name: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.string(),
                        label: z.string()
                    })
                    .nullable()
            )
            .optional(),
        tracking_no: z.string().optional().nullable(),

        currency: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                z
                    .object({
                        value: z.string(), // no .min() since it's optional
                        label: z.string()
                    })
                    .nullable()
            )
            .optional()
    })
]

export const customSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '12px 8px',
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white'
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray'
    },
    flexGrow: 1
}

export function getTabsFields({
    formik,
    billingStates,
    billingCities,
    shippingStates,
    shippingCities,
    countries,
    editId,
    orderTypeOptions,
    paymentMethods,
    shipmentMethods,
    pincodeOptions,
    handlePincodeSearch,
    handleTransporterSearch,
    transporterOptions,
    handleCustomerSearch,
    customerOptions,
    channelOptions,
    getOrderDataLKey,
    getPincodeInfoLKey,
    getTransporterDropDownLKey,
    getCustomerDropDownLKey,
    getChannelsLKey
}) {
    let orderType = formik.values?.order_type?.value || formik.values?.order_type

    return [
        {
            label: 'Order Info',
            icon: {
                outlined: <ShoppingCartOutlined />,
                filled: <ShoppingCart />
            },
            fields: [
                {
                    name: 'external_order_id',
                    label: 'Reference No',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isDisabled: true,
                    customSx
                },
                {
                    name: 'order_no',
                    label: 'Order No',
                    placeholder: 'eg: 12345',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: editId
                },
                formik.values?.order_type === 'Exchange' || formik.values?.order_type?.value === 'Exchange'
                    ? {
                          name: 'original_order_no',
                          label: 'Original Order No*',
                          placeholder: 'eg: 12345',
                          type: 'text',
                          required: true,
                          CustomFormInput: false,
                          grid: { xs: 12, sm: 6, md: 3 },
                          size: 'small',
                          customSx
                      }
                    : {},
                {
                    name: 'order_type',
                    label: 'Order Type',
                    placeholder: 'Select Order Type',
                    type: 'CustomAutocomplete',
                    showAdornment: editId && false,
                    required: true,
                    options: orderTypeOptions,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx,
                    isDisabled: editId,
                    loading: !!getOrderDataLKey
                },
                !['B2C', 'Exchange', 'Promotion', 'Sample']?.includes(orderType)
                    ? {
                          name: orderType === 'PurchaseReturn' ? 'vendor_name' : 'customer_name',
                          label: orderType === 'PurchaseReturn' ? 'Vendor' : 'Customer',
                          placeholder: 'Select Customer',
                          type: orderType === 'B2C' ? 'text' : 'CustomAutocomplete',
                          required: true,
                          options:
                              orderType === 'PurchaseReturn'
                                  ? [
                                        { label: 'Vendor1 (VEND1012)', value: 'Vendor1' },
                                        { label: 'Vendor2 (VEND3298)', value: 'Vendor2' }
                                    ]
                                  : customerOptions || [],
                          grid: { xs: 12, sm: 6, md: 3 },
                          size: 'small',
                          isOptionEqualToValue: (option, selectedValue) =>
                              option.value === selectedValue?.value && option.label === selectedValue?.label,
                          customSx,
                          showAdornment: editId && false,
                          loading: !!getCustomerDropDownLKey,
                          onInputChange: handleCustomerSearch,
                          isDisabled: editId && !(orderType === 'B2C')
                      }
                    : {},
                {
                    name: 'shipment_mode',
                    label: 'Shipment Mode',
                    placeholder: 'Select Shipment Mode',
                    type: 'CustomAutocomplete',
                    showAdornment: true,
                    required: true,
                    options: shipmentMethods,
                    grid: { xs: 12, sm: 6, md: 3 },
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    size: 'small',
                    loading: !!getOrderDataLKey,
                    customSx
                },
                {
                    name: 'channel_code',
                    label: 'Channel',
                    placeholder: 'Select channel',
                    type: 'CustomAutocomplete',
                    showAdornment: true,
                    required: false,
                    CustomFormInput: false,
                    options: channelOptions || [],
                    loading: !!getChannelsLKey,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx
                },
                {
                    name: 'payment_mode',
                    label: 'Payment Status',
                    placeholder: 'Select Payment Status*',
                    type: 'CustomAutocomplete',
                    showAdornment: true,
                    required: true,
                    options: paymentMethods,
                    grid: { xs: 12, sm: 6, md: 3 },
                    loading: !!getOrderDataLKey,
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx
                },
                {
                    name: 'order_date',
                    label: 'Order Date',
                    placeholder: 'Select date',
                    type: 'dateTime',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: editId
                },
                {
                    name: 'fulfilled_by',
                    label: 'Fulfilled By',
                    placeholder: 'Select date',
                    type: 'dateTime',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    inputProps: {
                        min: new Date().toISOString().slice(0, 16)
                    },
                    customSx
                },
                {
                    name: 'priority',
                    label: 'Priority',
                    placeholder: 'Select channel',
                    type: 'CustomAutocomplete',
                    // showAdornment: true,
                    required: false,
                    CustomFormInput: false,
                    options: [
                        { label: 'Normal', value: 'normal' },
                        { label: 'High', value: 'high' },
                        { label: 'Urgent', value: 'urgent' }
                    ],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    showAdornment: false,
                    customSx
                }
                // {
                //     name: 'status',
                //     label: 'Status*',
                //     placeholder: 'Status',
                //     type: 'CustomAutocomplete',
                //     showAdornment: false,
                //     required: true,
                //     options: [
                //         { label: 'In Progress 🔵', value: 'exchange' },
                //         { label: 'Hold 🟡', value: 'hold' },
                //         { label: 'Complete 🟢', value: 'complete' }
                //     ],
                //     grid: { xs: 12, sm: 6, md: 3 },
                //     isOptionEqualToValue: (option, selectedValue) =>
                //         option.value === selectedValue?.value && option.label === selectedValue?.label,
                //     size: 'small',
                //     customSx
                // },
            ]
        },
        {
            label: 'Bill To Address',
            icon: {
                outlined: <LocalShippingOutlined />,
                filled: <LocalShipping />
            },
            fields: [
                {
                    name: 'bill_add1',
                    label: 'Address Line 1',
                    placeholder: 'eg: 123 Street Name',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx: { marginBottom: '4px', ...customSx }
                },
                {
                    name: 'bill_add2',
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
                    name: 'bill_pincode',
                    label: 'Post Code',
                    placeholder: 'eg: 400001',
                    type: 'CustomAutocomplete',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    options: pincodeOptions || [],
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx: customSx,
                    onInputChange: handlePincodeSearch,
                    loading: !!getPincodeInfoLKey
                },
                {
                    name: 'bill_city_id',
                    label: 'City',
                    placeholder: 'Select a city',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: billingCities,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    // customInputSx: customInputSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === selectedValue?.value && option.label === selectedValue?.label

                    // customTextSx: customTextSx
                },
                {
                    name: 'bill_state_id',
                    label: 'State',
                    placeholder: 'Select a state',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: billingStates,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === selectedValue?.value && option.label === selectedValue?.label

                    // customInputSx: customInputSx,
                    // customTextSx: customTextSx
                },
                {
                    name: 'bill_country_id',
                    label: 'Country',
                    placeholder: 'Select a country',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: countries,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === selectedValue?.value && option.label === selectedValue?.label

                    // customInputSx: customInputSx,
                    // customTextSx: customTextSx
                },
                {
                    name: 'bill_to_name',
                    label: 'Contact Name',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    placeholder: 'eg: Michael Scott'
                },
                {
                    name: 'bill_email',
                    label: 'Contact Email',
                    placeholder: 'eg: johndoe@gmail.com',
                    type: 'email',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'bill_phone1',
                    label: 'Contact Number*',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'bill_phone2',
                    label: 'Alternate Contact Number',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'bill_lat',
                    label: 'Latitude, Longitude',
                    placeholder: 'eg: 12.3456,78.9101',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                }
            ]
        },
        {
            label: 'Ship To Address',
            icon: {
                outlined: <CommentOutlined />,
                filled: <Comment />
            },
            // eslint-disable-next-line no-sparse-arrays
            fields: [
                {
                    name: 'ship_add1',
                    label: 'Address Line 1',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx: { marginBottom: '4px', ...customSx },
                    placeholder: '123 Main Street'
                },
                {
                    name: 'ship_add2',
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
                    name: 'ship_pincode',
                    label: 'Post Code',
                    type: 'CustomAutocomplete',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    options: pincodeOptions || [],
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx: customSx,
                    placeholder: '400001',
                    onInputChange: handlePincodeSearch,
                    loading: !!getPincodeInfoLKey
                },

                {
                    name: 'ship_city_id',
                    label: 'City',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: shippingCities,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    // customInputSx: customInputSx,
                    // customTextSx: customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        option.value === selectedValue?.value && option.label === selectedValue?.label,

                    placeholder: 'Select a city'
                },
                {
                    name: 'ship_state_id',
                    label: 'State',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: shippingStates,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    // customInputSx: customInputSx,
                    // customTextSx: customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),

                    placeholder: 'Select a state'
                },
                {
                    name: 'ship_country_id',
                    label: 'Country',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    options: countries,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    // customInputSx: customInputSx,
                    // customTextSx: customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),

                    placeholder: 'Select a country'
                },
                {
                    name: 'ship_to_name',
                    label: 'Contact Name',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx,
                    placeholder: 'eg: Michael Scott'
                },
                {
                    name: 'ship_email',
                    label: 'Contact Email',
                    placeholder: 'eg: johndoe@gmail.com',
                    type: 'email',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'ship_phone1',
                    label: 'Contact Number',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'ship_phone2',
                    label: 'Alternate Contact Number',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'ship_lat',
                    label: 'Latitude, Longitude',
                    placeholder: 'eg: 12.3456,78.9101',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: customSx
                },
                {
                    name: 'gst_no',
                    label: 'GSTIN',
                    placeholder: 'Enter GSTIN',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                    // isDisabled: editId
                }
            ]
        },
        {
            label: 'Invoice & Others',
            icon: {
                outlined: <InfoOutlined />,
                filled: <Info />
            },
            fields: [
                {
                    name: 'invoice_no',
                    label: 'Invoice No.',
                    placeholder: 'eg: INV12345',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                    // isDisabled: editId
                },
                {
                    name: 'total_amount',
                    label: 'Total Order Amount',
                    placeholder: 'Enter valid number',
                    type: 'number',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    // isDisabled: true,
                    customSx
                },

                {
                    name: 'currency',
                    label: 'Currency',
                    placeholder: 'Select currency',
                    type: 'CustomAutocomplete',
                    required: false,
                    CustomFormInput: false,
                    options: [
                        { label: 'INR (₹)', value: 'INR' },
                        { label: 'USD ($)', value: 'USD' },
                        { label: 'AED (د.إ)', value: 'AED' },
                        { label: 'Pound £', value: 'Pound' }
                    ],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    showAdornment: false,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx
                },
                {
                    name: 'discount_code',
                    label: 'Discount Code',
                    placeholder: 'Enter discount code',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'total_discount',
                    label: 'Total Discount',
                    placeholder: 'Enter valid number',
                    type: 'number',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'shipping_charges',
                    label: 'Shipping Charges',
                    placeholder: 'Enter valid number',
                    type: 'number',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'other_charges',
                    label: 'Other Charges',
                    placeholder: 'Enter valid number',
                    type: 'number',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'transport_mode',
                    label: 'Transport Mode',
                    placeholder: 'Select Transport mode',
                    type: 'CustomAutocomplete',
                    showAdornment: true,
                    required: false,
                    options: transporterOptions || [],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx,
                    onInputChange: handleTransporterSearch,
                    loading: !!getTransporterDropDownLKey
                },
                {
                    name: 'carrier_name',
                    label: 'Carrier Name',
                    placeholder: 'Select Carrier name',
                    type: 'CustomAutocomplete',
                    showAdornment: true,
                    required: false,
                    options: [
                        { label: 'HDMS', value: 'HDMS' },
                        { label: 'DELHIVERY', value: 'DELHIVERY' },
                        { label: 'BLUEDART', value: 'BLUEDART' },
                        { label: 'EKART', value: 'EKART' }
                    ],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx
                },
                {
                    name: 'tracking_no',
                    label: 'Tracking No.',
                    placeholder: 'eg: EWDS876DS',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'isGift',
                    label: 'Mark As Gift',
                    type: 'checkbox',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                formik.values?.isGift
                    ? {
                          name: 'gift_message',
                          label: 'Gift Message',
                          placeholder: 'Enter gift message',
                          type: 'text',
                          required: false,
                          CustomFormInput: false,
                          grid: { xs: 12, sm: 6, md: 3 },
                          isDisabled: !formik?.values?.isGift,
                          size: 'small',
                          customSx
                      }
                    : {},
                {
                    name: 'on_hold',
                    label: 'Put Order On Hold',
                    type: 'checkbox',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'remarks',
                    label: 'Remarks',
                    type: 'textarea',
                    placeholder: 'Enter your remarks here',
                    grid: { xs: 12, sm: 6 },
                    size: 'small',
                    customSx,
                    rows: 1,
                    innerLabel: true
                }
            ]
        }
    ]
}
