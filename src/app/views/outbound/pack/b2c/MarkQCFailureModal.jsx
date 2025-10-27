/* eslint-disable */
import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography } from '@mui/material'
import { Warning } from '@mui/icons-material'
import { useFormik } from 'formik'
import * as z from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { getCustomSx } from '@/utilities'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import CustomButton from '@/core/components/extended/CustomButton'

const QC_FAILURE_REASONS = [
    'Colour Faded',
    'Batch Mismatch',
    'Stiches broken',
    'Colour Mismatch',
    'Corner Damage',
    'Expired',
    'Stains',
    'Packaging broken',
    'Product Damaged',
    'Size Mismatch',
    'Product Dirty',
    'Wrong Piece returned',
    'MRP Mismatch',
    'Pair Incomplete'
]

// Mock item data with IDs and names - replace with actual data source
const ITEM_DATA = [
    { id: 'ITM123456789', name: 'Black Kurta' },
    { id: 'ITM987654321', name: 'Blue Jeans' },
    { id: 'ITM456789123', name: 'White Shirt' },
    { id: 'ITM789123456', name: 'Red Dress' },
    { id: 'ITM321654987', name: 'Green Jacket' }
]

const customSx = getCustomSx()

// Zod validation schema
const validationSchema = z.object({
    selectedItemId: z
        .union([
            z.object({
                value: z.string().min(1, 'Item ID is required'),
                label: z.string()
            }),
            z.string().min(1, 'Item ID is required'),
            z.null()
        ])
        .superRefine((val, ctx) => {
            if (!val || (typeof val === 'object' && !val.value) || (typeof val === 'string' && val.trim() === '')) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Item ID selection is required'
                })
            }
        }),
    qcFailureReason: z
        .union([
            z.object({
                value: z.string().min(1, 'QC failure reason is required'),
                label: z.string()
            }),
            z.string().min(1, 'QC failure reason is required'),
            z.null()
        ])
        .superRefine((val, ctx) => {
            if (!val || (typeof val === 'object' && !val.value) || (typeof val === 'string' && val.trim() === '')) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'QC failure reason is required'
                })
            }
        })
})

// Helper function to hide middle 3 characters of ID
const hideMiddleCharacters = (id) => {
    if (!id || id.length <= 3) return id
    const start = id.slice(0, Math.floor((id.length - 3) / 2))
    const end = id.slice(Math.floor((id.length - 3) / 2) + 3)
    return start + '***' + end
}

export default function MarkQCFailureModal({
    isOpen,
    setIsOpen,
    onSubmit,
    onClose,
    ...modalProps
}) {
    // Formik setup
    const formik = useFormik({
        initialValues: {
            selectedItemId: null,
            qcFailureReason: null
        },
        validationSchema: toFormikValidationSchema(validationSchema),
        onSubmit: (values) => {
            // Extract actual values in case they're objects
            const selectedItemId = typeof values.selectedItemId === 'object' && values.selectedItemId?.value 
                ? values.selectedItemId.value 
                : values.selectedItemId
            
            const qcFailureReason = typeof values.qcFailureReason === 'object' && values.qcFailureReason?.value 
                ? values.qcFailureReason.value 
                : values.qcFailureReason

            const formData = {
                status: 'QC_FAILED',
                selectedItemId,
                failureReason: qcFailureReason
            }
            onSubmit?.(formData)
        }
    })

    // Process item ID options with hidden middle characters and names
    const processedItemIdOptions = useMemo(() => {
        return ITEM_DATA.map(item => ({
            label: `${hideMiddleCharacters(item.id)} (${item.name})`,
            value: item.id
        }))
    }, [])

    // Handle item ID selection change
    const handleItemIdChange = useCallback(
        (name, value) => {
            formik.setFieldValue('selectedItemId', value)
        },
        [formik]
    )

    // Handle item ID selection blur
    const handleItemIdBlur = useCallback(() => {
        formik.setFieldTouched('selectedItemId', true)
    }, [formik])

    // Clear selected item ID
    const clearSelectedItemId = useCallback(() => {
        formik.setFieldValue('selectedItemId', '')
    }, [formik])

    // Handle QC failure reason change
    const handleQcReasonChange = useCallback(
        (name, value) => {
            formik.setFieldValue('qcFailureReason', value)
        },
        [formik]
    )

    // Handle QC failure reason blur
    const handleQcReasonBlur = useCallback(() => {
        formik.setFieldTouched('qcFailureReason', true)
    }, [formik])

    // Clear QC failure reason
    const clearQcReason = useCallback(() => {
        formik.setFieldValue('qcFailureReason', '')
    }, [formik])

    // Handle modal close
    const handleClose = useCallback(() => {
        formik.resetForm()
        setIsOpen(false)
        onClose?.()
    }, [formik, setIsOpen, onClose])

    // Modal title with warning icon
    const modalTitle = useMemo(
        () => (
            <Box display='flex' alignItems='center' gap={1}>
                <Warning sx={{ color: 'error.main' }} />
                <Typography variant='h4' component='span'>
                    Update QC Status
                </Typography>
            </Box>
        ),
        []
    )

    return (
        <TitleModalWrapper
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            onClose={handleClose}
            title={modalTitle}
            boxContainerSx={{
                width: { xs: '95%', sm: '460px' },
                maxWidth: '500px',
                p: 1.5
            }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...modalProps}
        >
            <Box sx={{ mt: 2 }}>
                <form onSubmit={formik.handleSubmit}>
                    <Box sx={{ mt: 2 }}>
                        {/* Item ID Selection */}
                        <Box sx={{ mb: 3 }}>
                            <CustomAutocomplete
                                name='selectedItemId'
                                label='Select Item ID*'
                                options={processedItemIdOptions}
                                value={formik.values.selectedItemId}
                                onChange={handleItemIdChange}
                                onBlur={handleItemIdBlur}
                                touched={formik.touched.selectedItemId}
                                setFieldValue={handleItemIdChange}
                                setFieldTouched={handleItemIdBlur}
                                showAdornment
                                clearValFunc={clearSelectedItemId}
                                placeholder='Search for item ID or name...'
                                customSx={customSx}
                                error={formik.touched.selectedItemId && formik.errors.selectedItemId}
                                helperText={formik.touched.selectedItemId && formik.errors.selectedItemId}
                                innerLabel={false}
                            />
                        </Box>

                        {/* QC Failure Reason */}
                        <Box sx={{ mb: 4 }}>
                            <CustomAutocomplete
                                name='qcFailureReason'
                                label='Select reason for QC failure*'
                                options={QC_FAILURE_REASONS}
                                value={formik.values.qcFailureReason}
                                onChange={handleQcReasonChange}
                                onBlur={handleQcReasonBlur}
                                touched={formik.touched.qcFailureReason}
                                setFieldValue={handleQcReasonChange}
                                setFieldTouched={handleQcReasonBlur}
                                showAdornment
                                clearValFunc={clearQcReason}
                                placeholder='Search here...'
                                customSx={customSx}
                                error={formik.touched.qcFailureReason && formik.errors.qcFailureReason}
                                helperText={formik.touched.qcFailureReason && formik.errors.qcFailureReason}
                                innerLabel={false}
                            />
                        </Box>

                        {/* Action Buttons */}
                        <Box display='flex' justifyContent='flex-end' gap={1} sx={{ mt: 3 }}>
                            <CustomButton
                                variant='outlined'
                                onClick={handleClose}
                                disabled={formik.isSubmitting}
                                customStyles={{ height: '30px' }}
                            >
                                Cancel
                            </CustomButton>
                            <CustomButton
                                type='submit'
                                variant='contained'
                                loading={formik.isSubmitting}
                                disabled={formik.isSubmitting}
                                customStyles={{ height: '30px' }}
                            >
                                Mark QC Failed
                            </CustomButton>
                        </Box>
                    </Box>
                </form>
            </Box>
        </TitleModalWrapper>
    )
}

// PropTypes for type checking
MarkQCFailureModal.propTypes = {
    /** Controls modal visibility */
    isOpen: PropTypes.bool.isRequired,
    /** Function to set modal visibility */
    setIsOpen: PropTypes.func.isRequired,
    /** Callback function called when form is submitted with form data */
    onSubmit: PropTypes.func,
    /** Callback function called when modal is closed */
    onClose: PropTypes.func,
    /** Additional props passed to TitleModalWrapper */
    closeOnBackdropClick: PropTypes.bool,
    disableEscapeKeyDown: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    boxContainerSx: PropTypes.object,
    showCancelButton: PropTypes.bool
}