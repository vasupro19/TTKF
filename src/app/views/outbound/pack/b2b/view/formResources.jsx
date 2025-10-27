/* eslint-disable */
import { z } from 'zod'
import { expressions } from '@/constants'
import { generateRandomString, getCustomSx } from '@/utilities'
import { Comment, Info, LocalShipping, ShoppingCart } from '@mui/icons-material'

const customSx = getCustomSx()

export const initialValues = {
    order_id: 'VYP048830',
    pack_id: 'PKID-04',
    total_quantity: '120',
    pending_quantity: '30',
    total_boxes: '21',
    invoice_no: 'INVDS3203DS',
    actual_weight: 30, // Removed 'Kg' to match number type
    dimensions: { length: '200', breadth: '200', height: '200', unit: 'cm' }, // Removed '(cm)' to match dimensions type
    courier: { label: 'XYZ Transport', value: 'xyz_transport' }, // Using object format for CustomAutocomplete
    awb_no: 'DS09DS9090'
}

export const validationSchema = z.object({
    actual_weight: z
        .number({ invalid_type_error: 'Total Weight is required' })
        .min(0.01, 'Weight must be greater than 0')
        .nullable()
        .refine(val => val === null || val === undefined || val === '' || val >= 0.01, {
            message: 'Weight must be greater than 0'
        }),
    // First, update the schema to validate 2 decimal places
    dimensions: z
        .object({
            length: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Length must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Length must be a positive number')
                ])
                .optional()
                .nullable(),
            breadth: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Breadth must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Breadth must be a positive number')
                ])
                .optional()
                .nullable(),
            height: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Height must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Height must be a positive number')
                ])
                .optional()
                .nullable(),
            unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm').nullable()
        })
        .optional()
        .nullable()
        .refine(
            dimensions => {
                if (!dimensions) return true // If no dimensions object is provided, that's fine

                const hasValues = {
                    length: dimensions.length !== undefined && dimensions.length !== '',
                    breadth: dimensions.breadth !== undefined && dimensions.breadth !== '',
                    height: dimensions.height !== undefined && dimensions.height !== ''
                }

                const providedCount = Object.values(hasValues).filter(Boolean).length

                // Either all three must be provided, or none
                return providedCount === 0 || providedCount === 3
            },
            {
                message: 'Please provide all 3 dimensions (LxBxH) or leave them all empty'
            }
        ),
    courier_code: z.preprocess(
        val => (typeof val === 'object' && val !== null ? val : null),
        z
            .object({
                value: z.string().min(1, { message: 'Courier is required' }),
                label: z.string()
            })
            .nullable()
            .refine(val => val !== null, {
                message: 'Courier is required'
            })
    ),
    awb_no: z.string().min(1, 'AWB No. is required'),
    discount_code: z.string().optional()
})

export const fields = packStatus => {
    return [
        {
            name: 'orderNo',
            label: 'Order ID',
            placeholder: 'eg: VYP048830',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'pack_id',
            label: 'Pack ID',
            placeholder: 'eg: PKID-04',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'total_quantity',
            label: 'Total Quantity',
            placeholder: 'eg: 120',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'pending_quantity',
            label: 'Pending Quantity',
            placeholder: 'eg: 30',
            type: 'text',
            required: false,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'total_boxes',
            label: 'Total Boxes',
            placeholder: 'eg: 21',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'invoice_no',
            label: 'Invoice No.',
            placeholder: 'eg: INVDS3203DS',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: true
        },
        {
            name: 'actual_weight',
            label: 'Total Weight',
            type: 'number',
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            customSx,
            endAdornment: <b>KG</b>,
            showEndAdornment: true,
            autoComplete: 'off',
            CustomFormInput: false,
            required: true,
            isDisabled: packStatus === 'In Progress'
        },
        {
            name: 'dimensions',
            label: 'LxBxH',
            placeholder: 'eg: 32x48x32 (cm)',
            type: 'dimensions',
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            required: true,
            outerLabel: false,
            isDisabled: packStatus === 'In Progress'
        },
        {
            name: 'courier_code',
            label: 'Courier',
            placeholder: 'Select Courier',
            type: 'CustomAutocomplete',
            showAdornment: true,
            required: true,
            options: [
                { label: 'XYZ Transport', value: 'xyz_transport' },
                { label: 'ABC Transport', value: 'abc_transport' },
                { label: 'MNO Transport', value: 'mno_transport' },
                { label: 'RST Transport', value: 'rst_transport' }

                // Additional options would be added here
            ],
            grid: { xs: 12, sm: 6, md: 2.4 },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            size: 'small',
            isDisabled: packStatus === 'In Progress',
            customSx
        },
        {
            name: 'awb_no',
            label: 'AWB No.',
            placeholder: 'eg: DS09DS9090',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12, sm: 6, md: 2.4 },
            size: 'small',
            isDisabled: packStatus === 'In Progress',
            customSx: customSx
        }
    ]
}
