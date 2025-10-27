import React, { useState } from 'react'
import { Box, RadioGroup, FormControlLabel, Radio, Typography, Divider } from '@mui/material'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
// import Papa from 'papaparse'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { closeModal } from '@/app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import {
    useGetGenerateSerialTemplateMutation,
    useUploadGenerateSerialTemplateMutation
} from '@/app/store/slices/api/serialSlice'
import { objectLength } from '@/utilities'
import { openSnackbar } from '@/app/store/slices/snackbar'
import MasterSerialForm from '../../forms/serial'

// eslint-disable-next-line react/prop-types
function CreateSerialModal({ isEdit }) {
    const dispatch = useDispatch()

    const [getGenerateSerialTemplate] = useGetGenerateSerialTemplateMutation()
    const [uploadGenerateSerialTemplate] = useUploadGenerateSerialTemplateMutation()

    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected
    const { uploadGenerateSerialTemplateLKey, getGenerateSerialTemplateLKey } = useSelector(state => state.loading)
    const handleChange = event => {
        setSelectedMethod(event.target.value)
    }

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

        // if (validPageCreated) {
        doc.save('labels.pdf')
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
        // } else {
        //     console.warn('No valid data to generate labels. PDF not saved.')
        // }
    }

    const handleFileUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)

        let isError = false
        let message = ''
        try {
            const response = await uploadGenerateSerialTemplate(formData).unwrap()
            message = response.message
            if (response.data) handleQRGeneration(response.data)
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
        // Papa.parse(file, {
        //     header: true, // Read the CSV headers into JSON keys
        //     complete: function (results) {
        //         let csvData = results.data // Parsed CSV rows
        //         console.log('csvData-==-=->>', csvData)
        //         // Pass the parsed data to the function to generate the labels
        //         handleQRGenerationFromCSV(csvData.filter(item => item['Product Code/EAN'] && item.Quantity))
        //         dispatch(closeModal())
        //     },
        //     error: function () {
        //         dispatch(
        //             openSnackbar({
        //                 open: true,
        //                 message: 'Error parsing the CSV file',
        //                 variant: 'alert',
        //                 alert: { color: 'error' },
        //                 anchorOrigin: { vertical: 'top', horizontal: 'center' }
        //             })
        //         )
        //     }
        // })
    }

    const getTemplate = async () => getGenerateSerialTemplate().unwrap()

    return (
        <Box
            sx={{
                width:
                    selectedMethod === 'form'
                        ? { lg: '600px', sm: '500px', xs: '260px' }
                        : { lg: '400px', sm: '400px', xs: '260px' }
            }}
        >
            <Box sx={{ p: 1 }}>
                <Typography variant='h3'>
                    Generate Serial Ids
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
                {!isEdit && (
                    <RadioGroup
                        row
                        value={selectedMethod}
                        onChange={handleChange}
                        sx={{
                            marginBottom: '8px'
                        }}
                    >
                        <FormControlLabel value='form' control={<Radio />} label='Form' />
                        <FormControlLabel value='upload' control={<Radio />} label='Upload' />
                    </RadioGroup>
                )}
                {selectedMethod === 'form' ? (
                    <MasterSerialForm />
                ) : (
                    <ImportFileModal
                        handleFileSubmission={file => {
                            handleFileUpload(file)
                        }}
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        // sampleFilePath='/csv/masters/serials.csv'
                        isDownloadSample
                        isLoadingDownload={getGenerateSerialTemplateLKey}
                        isLoadingUpload={uploadGenerateSerialTemplateLKey}
                        handleGetTemplate={getTemplate}
                    />
                )}
            </Box>
        </Box>
    )
}

export default CreateSerialModal
