import React, { useRef, useState } from 'react'
import { Box } from '@mui/material'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@core/components/forms/FormComponent'
import jsPDF from 'jspdf'
import { CSVLink } from 'react-csv'
import QRCode from 'qrcode'
import { closeModal } from '@app/store/slices/modalSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { useCreatePalletMutation } from '@/app/store/slices/api/storageLocationSlice'
import { getCustomSx } from '@/utilities'

const customSx = getCustomSx()

export default function MasterPalletsForm() {
    const dispatch = useDispatch()

    const { createPalletLKey } = useSelector(state => state.loading)

    const csvLinkRef = useRef(null) // Ref for CSVLink
    const [createPallet] = useCreatePalletMutation()
    const [csvData, setCsvData] = useState([]) // State for CSV data

    const palletTypes = [
        { label: 'Storage', value: 'storage' },
        { label: 'Picking', value: 'picking' }
    ]

    const fields = [
        {
            name: 'prefix',
            label: 'Prefix*',
            type: 'text',
            placeholder: 'eg: PQ',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx }
        },
        {
            name: 'type',
            label: 'Pallet Type',
            type: 'CustomAutocomplete',
            placeholder: 'select an option',

            options: palletTypes,
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx },
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            innerLabel: false
        },
        {
            name: 'quantity',
            label: 'Quantity*',
            type: 'number',
            placeholder: 'eg:2',
            required: true,
            CustomFormInput: true,
            grid: { xs: 12, sm: 6, md: 4 },
            size: 'small',
            customSx: { minHeight: { sm: '100px' }, ...customSx }
        }
    ]

    // Define Zod schema
    const validationSchema = z.object({
        prefix: z.string().min(1, 'Prefix is required'),
        type: z.string().min(1, 'Pallet Type is required'),
        quantity: z.coerce
            .number()
            .min(1, 'Quantity must be at least 1')
            .max(99, 'Quantity cannot exceed 99')
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
        if (e.target.name === 'type') {
            e.target.value = e.target?.value?.value
        }

        if (e.target.name === 'prefix') {
            // Transform input to uppercase
            const formattedPrefix = e.target.value
                .replace(/[^A-Za-z0-9]/g, '')
                .toUpperCase() // Automatically convert to uppercase
                .slice(0, 10) // Ensure length no more than 10
            // Set the formatted prefix in Formik
            formik.setFieldValue(e.target.name, formattedPrefix)
            return
        }

        formik.handleChange(e)
    }

    const handleQRGeneration = async (values, doc) => {
        // const startingID = 1
        // Label dimensions in points (for 25mm x 50mm)
        const labelWidth = 50 * 2.83465 // Convert 50mm to points
        const labelHeight = 25 * 2.83465 // Convert 25mm to points

        const fontSize = 8 // Font size for the text
        const qrCodeSize = 40 // Size of the QR code in the PDF
        const gapBetweenQrAndText = 10 // Gap between QR code and ID text
        const gapBetweenTextAndTopText = 0 // Gap between "wms.cerebrum.io" and the QR code/text area

        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < values.length; i++) {
            const id = values[i]
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
            prefix: '',
            quantity: 0,
            type: ''
        },
        validate,
        onSubmit: async values => {
            let message
            let isError
            try {
                const response = await createPallet(values).unwrap()
                message = response?.data?.message || response?.message || 'operation successful'

                const pallets = response?.data || response?.data?.data
                // Initialize the PDF document
                // eslint-disable-next-line new-cap
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'pt',
                    format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
                })
                // Generate QR codes and add to the PDF
                await handleQRGeneration(pallets, doc)

                // Save the PDF
                doc.save('qrcodes.pdf')

                const generatedData = pallets.map(item => ({
                    ID: item
                }))
                setCsvData(generatedData) // Update CSV data state
            } catch (error) {
                if (error.data?.data?.errors || error.data?.errors?.errors) {
                    const backendErrors = error.data.data.errors || error.data.errors.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                }
                isError = true
                message =
                    error?.data?.message || error?.message || 'something went wrong, please try again after some time!'
            } finally {
                dispatch(
                    openSnackbar({
                        open: true,
                        message,
                        variant: 'alert',
                        alert: { color: isError ? 'error' : 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )

                if (!isError) {
                    // Trigger CSV download
                    setTimeout(() => {
                        if (csvLinkRef?.current) {
                            csvLinkRef.current.link.click()
                        }
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
                    }, 100)
                }
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    return (
        <Box>
            <FormComponent
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                submitting={createPalletLKey}
                submitButtonSx={{
                    textAlign: 'end',
                    width: '100%',
                    '& button': {
                        width: 'max-content',
                        height: '30px'
                    }
                }}
            />
            {/* Hidden CSVLink Component */}
            <CSVLink
                data={csvData}
                filename='pallet_ids.csv'
                className='hidden'
                ref={csvLinkRef} // Reference to trigger download
            />
        </Box>
    )
}
