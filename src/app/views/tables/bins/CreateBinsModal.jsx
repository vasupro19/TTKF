import { useCallback, useState, useRef } from 'react'
import { Box, RadioGroup, FormControlLabel, Radio, Typography, Divider } from '@mui/material'
import FileUploadComponent from '@core/components/FileUploadComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
// import Papa from 'papaparse'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { CSVLink } from 'react-csv'
import { useGetTemplateBinsMutation, useUploadTemplateBinsMutation } from '@/app/store/slices/api/storageLocationSlice'
import { objectLength } from '@/utilities'
import MasterBinForm from '../../forms/bins'

function CreateBinsModal() {
    const dispatch = useDispatch()
    const csvLinkRef = useRef(null) // Ref for CSVLink
    const [csvData, setCsvData] = useState([]) // State for CSV data
    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected

    const [getTemplateBins] = useGetTemplateBinsMutation()
    const [uploadTemplateBins] = useUploadTemplateBinsMutation()
    const { getTemplateBinsLKey, uploadTemplateBinsLKey } = useSelector(state => state.loading)

    const handleChange = event => {
        setSelectedMethod(event.target.value)
    }
    const [file, setFile] = useState(null)
    const [fileInfo, setFileInfo] = useState({ name: '', size: 0 })

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length === 0) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select one file to upload.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        } else if (acceptedFiles.length > 1) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'You can only upload one file at a time.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        } else {
            const uploadedFile = acceptedFiles[0]
            setFile(uploadedFile)
            setFileInfo({ name: uploadedFile.name, size: uploadedFile.size })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleDownloadSample = async () => {
        const response = await getTemplateBins().unwrap()
        dispatch(
            openSnackbar({
                open: true,
                message: response?.error?.data?.message || 'template file downloaded.',
                variant: response?.error?.data?.message ? 'alert' : 'success',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        // Assuming you have a sample CSV file
        // const link = document.createElement('a')
        // link.href = '/csv/masters/bins.csv' // Path relative to the public folder
        // link.download = 'bins.csv'
        // document.body.appendChild(link)
        // link.click()
        // document.body.removeChild(link)
    }

    const handleQRGenerationFromCSV = async data => {
        // eslint-disable-next-line new-cap
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'pt',
            format: [50 * 2.83465, 25 * 2.83465] // 50mm x 25mm dimensions
        })

        const labelWidth = 50 * 2.83465 // Convert 50mm to points
        const labelHeight = 25 * 2.83465 // Convert 25mm to points
        const fontSize = 8 // Default font size for text
        const fontBold = 'bold' // Font weight for bold text
        const qrCodeSize = 40 // QR code size
        const gapBetweenQrAndText = 10 // Space between QR code and text
        const gapBetweenTextAndTopText = 0 // Gap for additional spacing

        // Track whether any valid pages were created
        let validPageCreated = false

        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.length; i++) {
            const binCode = data[i] // Destructure Bin ID and Bin Type

            // Validate "Bin ID" and skip invalid rows
            // if (!binCode || binCode.trim() === '') {
            //     console.warn(`Skipping row ${i + 1} due to missing "Bin ID"`)
            //     continue // Skip this iteration if "Bin ID" is invalid
            // }

            validPageCreated = true // Mark that at least one valid page was created

            // Generate QR code as a base64 image

            // eslint-disable-next-line no-await-in-loop
            const qrCodeImage = await QRCode.toDataURL(binCode, {
                width: 100, // Width of the QR code
                margin: 0 // No margin around the QR code
            })

            // Center align QR code
            const qrCodeX = (labelWidth - qrCodeSize) / 2
            const qrCodeY = 15 + gapBetweenTextAndTopText

            // Add QR Code
            doc.addImage(qrCodeImage, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize)

            // Add Bin ID below the QR Code
            const idTextY = qrCodeY + qrCodeSize + gapBetweenQrAndText
            doc.setFontSize(fontSize)
            doc.setFont('helvetica', fontBold) // Bold text for Bin ID
            doc.text(binCode, labelWidth / 2, idTextY, { align: 'center' })

            // Add the "wms.cerebrum.io" text at the top
            const topTextY = 10 // Text position at the top
            doc.setFontSize(6)
            doc.setFont('helvetica', 'normal') // Normal font for website text
            doc.text(import.meta.env.VITE_APP_URI || '', labelWidth / 2, topTextY, { align: 'center' })

            // If not the last valid label, add a new page
            if (i < data.length - 1) {
                doc.addPage([labelWidth, labelHeight])
            }
        }

        // Save the PDF only if at least one valid page was created
        if (validPageCreated) {
            doc.save('bin_labels.pdf')
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Downloaded Successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const handleFileUpload = async () => {
        const formData = new FormData()
        formData.append('excel', file)
        let isError = false
        let message = ''
        try {
            const response = await uploadTemplateBins(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) {
                const bins = response?.data || response?.data?.data
                handleQRGenerationFromCSV(bins)
                const generatedData = bins.map(item => ({
                    ID: item
                }))
                setCsvData(generatedData)
                setTimeout(() => {
                    if (csvLinkRef?.current) {
                        csvLinkRef.current.link.click()
                    }
                    dispatch(closeModal())
                }, 100)
            }
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
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
        }
    }

    return (
        <Box sx={{ width: { lg: '700px', sm: '500px', xs: '300px' } }}>
            <Box sx={{ p: 1 }}>
                <Typography variant='h3'>
                    {selectedMethod === 'form' ? 'Generate Bins' : 'Import Bins'}
                    <Divider sx={{ borderColor: 'primary.main', marginTop: '4px' }} />
                </Typography>
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

                {selectedMethod === 'form' ? (
                    <MasterBinForm />
                ) : (
                    <>
                        <FileUploadComponent
                            file={file}
                            fileInfo={fileInfo}
                            handleDownloadSample={handleDownloadSample}
                            handleFileUpload={handleFileUpload}
                            isLoadingDownload={getTemplateBinsLKey}
                            isLoadingUpload={uploadTemplateBinsLKey}
                            accept={{
                                'text/csv': ['.csv'],
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                            }}
                            maxFiles={1}
                            isDownloadSample
                            onDrop={onDrop}
                        />

                        <CSVLink
                            data={csvData}
                            filename='bin_ids.csv'
                            className='hidden'
                            ref={csvLinkRef} // Reference to trigger download
                        />
                    </>
                )}
            </Box>
        </Box>
    )
}

export default CreateBinsModal
