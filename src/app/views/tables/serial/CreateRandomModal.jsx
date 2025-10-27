import { Box, Typography, Divider } from '@mui/material'
import FormComponent from '@/core/components/forms/FormComponent'
import { useFormik } from 'formik'
import { z } from 'zod'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useGenerateRandomSerialsMutation } from '@/app/store/slices/api/serialSlice'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

function CreateRandomModal() {
    const dispatch = useDispatch()
    const { generateRandomSerialsLKey } = useSelector(state => state.loading)
    const [generateRandomSerials] = useGenerateRandomSerialsMutation()

    const fields = [
        {
            name: 'quantity',
            label: 'Enter Quantity*',
            type: 'number',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 12 },
            size: 'small',
            customSx: { mb: 1 }
        }
    ]
    // Define Zod schema
    const validationSchema = z.object({
        quantity: z.coerce
            .number()
            .min(1, 'Quantity must be at least 1')
            .max(500, 'Quantity cannot exceed 500')
            .refine(val => val > 0, { message: 'must be positive number' })
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
        formik.handleChange(e)
    }

    const handleQRGeneration = async (values, doc) => {
        // Label dimensions in points (for 25mm x 50mm)
        const labelWidth = 50 * 2.83465 // Convert 50mm to points
        const labelHeight = 25 * 2.83465 // Convert 25mm to points

        const fontSize = 8 // Font size for the text
        // const fontBold = 'bold' // Font weight for bold text
        const qrCodeSize = 40 // Size of the QR code in the PDF
        const gapBetweenQrAndText = 10 // Gap between QR code and ID text
        const gapBetweenTextAndTopText = 0 // Gap between "wms.cerebrum.io" and the QR code/text area

        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < values.length; i++) {
            const id = values[i].uid

            // Generate QR code as a base64 image
            // eslint-disable-next-line no-await-in-loop
            const qrCodeImage = await QRCode.toDataURL(id, {
                width: 100, // Width of the QR code
                margin: 0 // No margin around the QR code
            })

            // Define QR code position and dimensions
            const qrCodeX = (labelWidth - qrCodeSize) / 2 // Center QR code horizontally
            const qrCodeY = 15 + gapBetweenTextAndTopText // Add some spacing from the top for "wms.cerebrum.io" text

            // Add the QR code image to the PDF
            doc.addImage(qrCodeImage, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)

            // Add ID text below the QR code
            const idTextY = qrCodeY + qrCodeSize + gapBetweenQrAndText // Place text below the QR code
            doc.setFontSize(fontSize)
            doc.setFont('helvetica', 'bold') // Set font weight to bold
            doc.text(id, labelWidth / 2, idTextY, { align: 'center' }) // Center-align the text

            // Add the "wms.cerebrum.io" text at the top of the label
            const topTextY = 10 // Text near the top of the label
            doc.setFontSize(6)
            doc.setFont('helvetica', 'normal') // Set top text to normal font
            doc.text(import.meta.env.VITE_APP_URI || '', labelWidth / 2, topTextY, { align: 'center' })

            // Add a new page for the next label unless it's the last label
            if (i < values.length - 1) {
                doc.addPage([labelWidth, labelHeight]) // Set page size for the label
            }
        }
    }

    const formik = useFormik({
        initialValues: {
            quantity: 0
        },
        validate,
        onSubmit: async values => {
            try {
                const response = await generateRandomSerials({ ...values }).unwrap()

                const serialIds = response?.data
                // Initialize the PDF document
                // eslint-disable-next-line new-cap
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
                })

                // Generate QR codes and add to the PDF
                await handleQRGeneration(serialIds, doc)

                // Save the PDF
                doc.save('qrcodes.pdf')

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

    return (
        <Box
            sx={{
                width: { lg: '400px', sm: '400px', xs: '260px' }
            }}
        >
            <Box sx={{ p: 1 }}>
                <Typography variant='h3'>
                    Generate Serial Ids
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>

                <FormComponent
                    fields={fields}
                    formik={formik}
                    handleCustomChange={handleCustomChange}
                    customStyle={{
                        backgroundColor: 'none'
                    }}
                    submitting={generateRandomSerialsLKey}
                    submitButtonSx={{
                        textAlign: 'end',
                        width: '100%',
                        '& button': {
                            width: 'max-content',
                            height: '30px'
                        }
                    }}
                />
            </Box>
        </Box>
    )
}

export default CreateRandomModal
