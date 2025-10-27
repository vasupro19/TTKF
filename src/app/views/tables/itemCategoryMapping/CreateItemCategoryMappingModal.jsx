import React, { useCallback, useState } from 'react'
import { Box, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import FileUploadComponent from '@core/components/FileUploadComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import MasterItemCategoryMappingForm from '../../forms/itemCategoryMapping'

function CreateItemCategoryMappingModal() {
    const dispatch = useDispatch()

    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected

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

    const handleDownloadSample = () => {
        // Assuming you have a sample CSV file
        const link = document.createElement('a')
        link.href = '/csv/masters/itemCategoryMapping.csv' // Path relative to the public folder
        link.download = 'itemCategoryMapping.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleFileUpload = () => {
        // eslint-disable-next-line no-console
        console.log('file::', file)
        // dispatch(
        //     openSnackbar({
        //         open: true,
        //         message: 'Error parsing the CSV file',
        //         variant: 'alert',
        //         alert: { color: 'error' },
        //         anchorOrigin: { vertical: 'top', horizontal: 'center' }
        //     })
        // )
    }

    return (
        <Box sx={{ width: { lg: '700px', sm: '500px', xs: '260px' } }}>
            <Box sx={{ p: 1 }}>
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
                    <MasterItemCategoryMappingForm />
                ) : (
                    <FileUploadComponent
                        file={file}
                        fileInfo={fileInfo}
                        handleDownloadSample={handleDownloadSample}
                        handleFileUpload={handleFileUpload}
                        accept={{ 'text/csv': ['.csv'] }}
                        maxFiles={1}
                        isDownloadSample
                        onDrop={onDrop}
                    />
                )}
            </Box>
        </Box>
    )
}

export default CreateItemCategoryMappingModal
