import React, { useCallback, useState } from 'react'
import { Box, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import FileUploadComponent from '@core/components/FileUploadComponent'
import LocalImportForm from '@views/forms/pincodeMaster/LocalImportForm'
import TpaImportForm from '@views/forms/pincodeMaster/TpaImportForm'
import { useGetPinCodeTemplateMutation, useUploadPinCodesMutation } from '@store/slices/api/geoSlice'

import { closeModal } from '@app/store/slices/modalSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import { objectLength } from '@/utilities'
import CustomTabsGroupedBtns from '@/core/components/extended/CustomTabsGroupedBtns'

// eslint-disable-next-line react/prop-types
function ImportPincodes({ formId = null }) {
    const dispatch = useDispatch()
    const [getPinCodeTemplate] = useGetPinCodeTemplateMutation()
    const [uploadPinCodes] = useUploadPinCodesMutation()
    const { uploadPincodeLKey, downloadPincodeLKey } = useSelector(state => state.loading)

    const [tabIndex, setTabIndex] = useState(0)
    const [selectedMethod, setSelectedMethod] = useState('form') // Default selected

    const handleTabChange = newIndex => {
        setTabIndex(newIndex)
    }
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
        // const response = await dispatch(getCityTemplate.initiate())
        const response = await getPinCodeTemplate().unwrap()
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

    const handleFileUpload = async () => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)

            const response = await uploadPinCodes(formData).unwrap()
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
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <CustomTabsGroupedBtns
                    labels={['Import Local', 'Import Online']}
                    onChange={handleTabChange}
                    tabValue={tabIndex}
                />
            </Box>

            {tabIndex === 0 && (
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
                        <LocalImportForm formId={formId} />
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
                            maxFiles={1}
                            isDownloadSample
                            onDrop={onDrop}
                            isLoadingUpload={uploadPincodeLKey}
                            isLoadingDownload={downloadPincodeLKey}
                        />
                    )}
                </Box>
            )}

            {tabIndex === 1 && <TpaImportForm />}
        </Box>
    )
}

export default ImportPincodes
