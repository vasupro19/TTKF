import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import FileUploadComponent from '@core/components/FileUploadComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch, useSelector } from 'react-redux'
import {
    useGetTemplateLocationCodeMutation,
    useUploadTemplateLocationCodeMutation
} from '@/app/store/slices/api/storageLocationSlice'
import { objectLength } from '@/utilities'
import { closeModal } from '@/app/store/slices/modalSlice'
import MasterLocationCodeForm from '../../forms/locationCode'

function CreateLocationCodeModal({ editId = null }) {
    const dispatch = useDispatch()
    const { getTemplateLocationCodeLKey, uploadTemplateLocationCodeLKey } = useSelector(state => state.loading)
    const [getTemplateLocationCode] = useGetTemplateLocationCodeMutation()
    const [uploadTemplateLocationCode] = useUploadTemplateLocationCodeMutation()
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

    const handleDownloadSample = async () => {
        const response = await getTemplateLocationCode().unwrap()
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
        // link.href = '/csv/masters/locationCodes.csv' // Path relative to the public folder
        // link.download = 'locationCodes.csv'
        // document.body.appendChild(link)
        // link.click()
        // document.body.removeChild(link)
    }

    const handleFileUpload = async () => {
        let isError = false
        let message = ''
        try {
            const formData = new FormData()
            formData.append('excel', file)

            const response = await uploadTemplateLocationCode(formData).unwrap()
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
        <Box sx={{ width: { lg: selectedMethod === 'form' ? '680px' : '400', sm: '500px', xs: '300px' } }}>
            <Box sx={{ p: 1, pb: 0 }}>
                <RadioGroup
                    row
                    value={selectedMethod}
                    onChange={handleChange}
                    sx={{
                        marginBottom: '2px'
                    }}
                >
                    <FormControlLabel value='form' control={<Radio />} label='Form' />
                    <FormControlLabel value='upload' control={<Radio />} label='Upload' />
                </RadioGroup>

                {selectedMethod === 'form' ? (
                    <MasterLocationCodeForm editId={editId} />
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
                        isLoadingDownload={getTemplateLocationCodeLKey}
                        isLoadingUpload={uploadTemplateLocationCodeLKey}
                    />
                )}
            </Box>
        </Box>
    )
}

export default CreateLocationCodeModal
CreateLocationCodeModal.propTypes = {
    editId: PropTypes.number
}
