/* eslint-disable camelcase */
import { Box, Typography, Divider } from '@mui/material'
import FormComponent from '@/core/components/forms/FormComponent'
import { useFormik } from 'formik'
import { z } from 'zod'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

import { useGenerateRandomSerialsMutation } from '@/app/store/slices/api/serialSlice'

// eslint-disable-next-line react/prop-types
function EditSerialGenerateModal({ uid }) {
    const dispatch = useDispatch()

    const customSx = {
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

    // eslint-disable-next-line no-unused-vars
    const [generateRandomSerials] = useGenerateRandomSerialsMutation()

    // Define Zod schema
    const validationSchema = z.object({
        product_code: z
            .string({
                required_error: 'product code/EAN is required',
                invalid_type_error: 'product code/EAN is required'
            })
            .min(1, 'product code/EAN is required'),
        uid: z.string().min(1, 'Quantity must be at least 1')
    })

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const handleCustomChange = (e, formik) => {
        if (e.target.name === 'product_code') {
            e.target.value = e.target?.value?.value
        }
        formik.handleChange(e)
    }

    const handleGeneratePdf = async serials => {
        try {
            if (!Array.isArray(serials) || serials.length === 0) {
                throw new Error('No serials provided to generate the PDF.')
            }

            // Initialize jsPDF for custom paper size (25mm x 50mm per page)
            // eslint-disable-next-line new-cap
            const doc = new jsPDF({
                orientation: 'landscape', // Landscape for 50mm width
                unit: 'mm',
                format: [50, 25] // Label size [width: 50mm, height: 25mm]
            })

            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < serials.length; i++) {
                const serial = serials[i]

                // Add QR Code to the page (centered horizontally on the label)
                doc.setFontSize(6)
                doc.text(`https://cerebrum.io`, 18.5, 4) // UID text [x, y]
                // Generate QR code for the current label
                // eslint-disable-next-line no-await-in-loop
                const qrImage = await QRCode.toDataURL(serial.uid, { width: 100, margin: 0 })

                // Add QR Code to the page (centered horizontally on the label)
                const qrSize = 14 // QR code size in mm
                doc.addImage(qrImage, 'PNG', 6, 5, qrSize, qrSize) // [x, y, width, height]

                // Add item details under the QR code
                doc.setFont('Arial', 'normal')
                doc.setFontSize(6)
                doc.text(`UID: ${serial.uid}`, 4, 22) // UID text [x, y]

                // Add Item No / EAN
                doc.setFontSize(5)
                doc.text(`Item No: ${serial.item_no || 'N/A'}`, 28, 8)
                doc.text(`EAN: ${serial.item_no_2 || 'N/A'}`, 28, 12)

                // Add page if not the last label
                if (i < serials.length - 1) {
                    doc.addPage() // Create a new page for the next label
                }
            }

            // Save the PDF
            doc.save('labels.pdf') // Save the file
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to generate product labels PDF!',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    function generateSerialArray(n) {
        const serials = []
        const baseUid = 2500100000033
        const item_no = '42255'
        const item_id = 2
        const created_by = 'piyush Rai'
        const created_at = '2025-01-28 14:35:35'
        const masterclient_id = 1

        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < n; i++) {
            serials.push({
                uid: (baseUid + i).toString(),
                item_no,
                item_no_2: item_no,
                item_id,
                source_id: null,
                source_type: null,
                created_by,
                created_at,
                masterclient_id
            })
        }

        return serials
    }

    const formik = useFormik({
        initialValues: {
            uid: uid || '',
            product_code: null
        },
        validate,
        // eslint-disable-next-line no-unused-vars
        onSubmit: async values => {
            try {
                // const response = await generateRandomSerials({ ...values }).unwrap()

                // const serialIds = response?.data??
                const serials = generateSerialArray(5)
                // Initialize the PDF document
                // eslint-disable-next-line new-cap, no-unused-vars
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
                })

                // Generate QR codes and add to the PDF
                // await handleQRGeneration(serialIds, doc)

                // Save the PDF
                // doc.save('qrcodes.pdf')
                await handleGeneratePdf(serials)

                dispatch(closeModal())
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Downloaded Successfully',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error generating files:', error)
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    const fields = [
        {
            name: 'uid',
            label: 'UID*',
            type: 'text',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            isDisabled: true,
            customSx: { minHeight: { sm: '100px' }, ...customSx }
        },
        {
            name: 'product_code',
            label: 'Product Code/EAN',
            type: 'CustomAutocomplete',
            options: [
                { label: '8901111111178', value: '8901111111178' },
                { label: '8901111111179', value: '8901111111179' }
            ],
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            placeholder: 'Search & select Product Code/EAN',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        }
    ]

    return (
        <Box
            sx={{
                width: { lg: '500px', sm: '500px', xs: '260px' }
            }}
        >
            <Box>
                <Typography variant='h3'>
                    Update UID EAN Mapping
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                <Box>
                    <FormComponent
                        fields={fields}
                        formik={formik}
                        handleCustomChange={handleCustomChange}
                        customStyle={{
                            backgroundColor: 'none'
                        }}
                        isStraightAlignedButton={false}
                        submitButtonSx={{ marginBottom: '-4px', textAlign: 'right' }}
                        gridStyles={{ px: 2 }}
                        submitButtonText='Update'
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default EditSerialGenerateModal
