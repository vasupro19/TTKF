import React, { useCallback, useState } from 'react'
import { PropTypes } from 'prop-types'

import { Box, FormControlLabel, Radio, RadioGroup } from '@mui/material'

import FileUploadComponent from '@core/components/FileUploadComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { useGetStateTemplateMutation, useUploadStateMutation } from '@app/store/slices/api/geoSlice'
import { objectLength } from '@/utilities'
import { closeModal } from '@app/store/slices/modalSlice'

import StateMaster from '../../forms/stateMaster'

function ImportStates({ formId = null }) {
    const dispatch = useDispatch()
    const [uploadState] = useUploadStateMutation()
    const [getStateTemplate] = useGetStateTemplateMutation()

    const { getStateTemplateLKey, uploadStateLKey } = useSelector(state => state.loading)
    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected
    const [file, setFile] = useState(null)
    const [fileInfo, setFileInfo] = useState({ name: '', size: 0 })

    const handleChange = event => {
        setSelectedMethod(event.target.value)
    }
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
        // Assuming you have a sample CSV file
        const response = await getStateTemplate().unwrap()
        dispatch(
            openSnackbar({
                open: true,
                message: response?.error?.data?.message || 'template file downloaded.',
                variant: response?.error?.data?.message ? 'alert' : 'success',
                alert: { color: 'error' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
    }

    const handleSubmit = values => {
        // eslint-disable-next-line no-console
        console.log('Form submitted with values:', values)
    }

    const handleFileUpload = async () => {
        const formData = new FormData()
        formData.append('excel', file)
        let isError = false
        let message = ''
        try {
            const response = await uploadState(formData).unwrap()
            message = response.message
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
                    alert: { color: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }
    return (
        <Box sx={{ width: { lg: '800px', sm: '600px', xs: '300px' } }}>
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
                    <StateMaster handleSubmit={handleSubmit} formId={formId} />
                ) : (
                    <FileUploadComponent
                        file={file}
                        fileInfo={fileInfo}
                        handleDownloadSample={handleDownloadSample}
                        handleFileUpload={handleFileUpload}
                        accept={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        isLoadingUpload={uploadStateLKey}
                        isLoadingDownload={getStateTemplateLKey}
                        maxFiles={1}
                        isDownloadSample
                        onDrop={onDrop}
                    />
                )}
            </Box>
        </Box>
    )
}

ImportStates.propTypes = {
    formId: PropTypes.number
}
export default ImportStates
