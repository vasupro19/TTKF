import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { useGenerateEanSkuSerialsMutation } from '@/app/store/slices/api/serialSlice'
import { getItems } from '@/app/store/slices/api/commonSlice'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

export default function MasterSerialForm() {
    const dispatch = useDispatch()
    const [generateEanSkuSerials] = useGenerateEanSkuSerialsMutation()

    const [eanOptions, setEanOptions] = useState([])

    const { generateEanSkuSerialsLKey, getItemsLKey } = useSelector(state => state.loading)

    const fields = [
        {
            name: 'item_id',
            label: 'Product Code/EAN',
            type: 'CustomAutocomplete',
            options: eanOptions,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false,
            loading: !!getItemsLKey
        },
        {
            name: 'quantity',
            label: 'Enter Quantity*',
            type: 'number',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx }
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        item_id: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'Bin Type is required' }),
                    label: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'Bin Type is required'
                })
        ),
        quantity: z.coerce
            .number()
            .min(1, 'Quantity must be at least 1')
            .max(100, 'Quantity cannot exceed 100')
            .refine(val => val > 0, { message: 'Must be positive number' })
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

    const handleCustomChange = (e, formik) => formik.handleChange(e)

    const handleQRGeneration = async values => {
        // eslint-disable-next-line new-cap
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
        })

        // Label dimensions in points (for 25mm x 50mm)
        const labelWidth = 50 * 2.83465 // Convert 50mm to points
        const labelHeight = 25 * 2.83465 // Convert 25mm to points

        const fontSize = 8 // Font size for the text
        const qrCodeSize = 40 // Size of the QR code in the PDF
        const lesserSectionGap = 5 // Reduced gap between left (QR code) and right sections
        const gapBetweenQrAndIdText = 10 // Gap between QR code and ID text
        const gapBetweenTopTextAndQRCode = 10 // Gap between website text and QR Code
        const gapBetweenLines = 0.2 // Small gap above and below each text element

        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < values.length; i++) {
            const id = values[i].uid

            // Generate QR code as a base64 image
            // eslint-disable-next-line no-await-in-loop
            const qrCodeImage = await QRCode.toDataURL(id, {
                width: 100, // Width of the QR code
                margin: 0 // No margin around the QR code
            })

            // Website text at top center
            const websiteTextY = 5 // Aligned closer to the top
            const websiteTextX = labelWidth / 2 // Center horizontally
            doc.setFontSize(6)
            doc.setFont('helvetica', 'normal')
            doc.text(import.meta.env.VITE_APP_URI || '', websiteTextX, websiteTextY, { align: 'center' })

            // Left Section: QR Code and ID
            const qrCodeX = (labelWidth / 2 - lesserSectionGap - qrCodeSize) / 2 // Center QR code in the left section
            const qrCodeY = websiteTextY + gapBetweenTopTextAndQRCode // Adjusted spacing below website text
            doc.addImage(qrCodeImage, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)

            const idTextY = qrCodeY + qrCodeSize + gapBetweenQrAndIdText // Place text below the QR code
            doc.setFontSize(fontSize)
            doc.setFont('helvetica', 'bold')
            doc.text(id, labelWidth / 4, idTextY, { align: 'center' })

            // Right Section: Product Details
            const rightSectionX = labelWidth / 2 + lesserSectionGap // Starting X position of the right section
            const contentWidth = labelWidth / 2 - lesserSectionGap // Width of the right section
            const rightTextCenterX = rightSectionX + contentWidth / 2 // Center the text horizontally

            // Start positioning for right section
            let currentY = (labelHeight - (fontSize + gapBetweenLines) * 6) / 2 // Center vertically

            doc.setFontSize(fontSize)

            // // Style Code
            // doc.setFont('helvetica', 'bold')
            // doc.text(`Style Code:`, rightTextCenterX, currentY, { align: 'center', maxWidth: contentWidth })
            // currentY += fontSize + gapBetweenLines

            // doc.setFont('helvetica', 'normal')
            // doc.text(values.styleCode || 'N/A', rightTextCenterX, currentY, { align: 'center', maxWidth: contentWidth })
            // currentY += fontSize + gapBetweenLines

            // Product Code
            doc.setFont('helvetica', 'bold')
            doc.text(`Product Code:`, rightTextCenterX, currentY + 2, { align: 'center', maxWidth: contentWidth })
            currentY += fontSize + gapBetweenLines

            doc.setFont('helvetica', 'normal')
            doc.text(values[i]?.item_no || 'N/A', rightTextCenterX, currentY + 2, {
                align: 'center',
                maxWidth: contentWidth
            })
            currentY += fontSize + gapBetweenLines

            // EAN
            doc.setFont('helvetica', 'bold')
            doc.text(`EAN:`, rightTextCenterX, currentY + 2, { align: 'center', maxWidth: contentWidth })
            currentY += fontSize + gapBetweenLines

            doc.setFont('helvetica', 'normal')
            doc.text(values[i]?.item_no_2 || 'N/A', rightTextCenterX, currentY + 2, {
                align: 'center',
                maxWidth: contentWidth
            })

            // Add a new page for the next label unless it's the last label
            if (i < values.length - 1) {
                doc.addPage([labelWidth, labelHeight]) // Set page size for the label
            }
        }

        return doc
    }

    const getData = async () => {
        try {
            const { data: response } = await dispatch(getItems.initiate())
            setEanOptions(response?.data || [])
            return response?.data || []
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to get EAN/SKU!',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return []
        }
    }

    const formik = useFormik({
        initialValues: {
            quantity: 0,
            item_id: null
        },
        validate,
        onSubmit: async values => {
            try {
                const { data: serials } = await generateEanSkuSerials({
                    ...values,
                    item_id: values.item_id.value
                }).unwrap()
                // Initialize the PDF document

                if (!serials || !serials?.length) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message:
                                'serials created successfully, pdf is being generated, we will notify you once the pdf is ready!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    return
                }

                // Generate QR codes and add to the PDF
                const doc = await handleQRGeneration(serials)

                // Save the PDF
                doc.save('serial_QR_codes.pdf')

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
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Something went wrong, please try again',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                submitting={generateEanSkuSerialsLKey}
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
    )
}
