import { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Radio, RadioGroup, FormControlLabel, FormControl, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'

import FileUploadComponent from '@core/components/FileUploadComponent'
import { openSnackbar } from '@app/store/slices/snackbar'
import { closeModal } from '@app/store/slices/modalSlice'
import { getCustomSx } from '@/utilities'
import CustomAutocomplete from '../extended/CustomAutocomplete'

function ImportFileModal({
    fileType = { 'text/csv': ['.csv'] },
    maxFiles = 1,
    sampleFilePath = '/csv/masters/pincodes.csv',
    sampleFileName = 'sample.csv',
    modalCloseAction = closeModal,
    handleFileSubmission = null,
    handleGetTemplate = null,
    customOnDrop = null,
    isDownloadSample = true,
    modalWidth = { lg: '380px', sm: '380px', xs: '260px' },
    isFileAction = null,
    removeTitle = false,
    downloadSampleTrigger = false,
    downloadOptions = [],
    handleDownloadSampleFile,
    showSelectField = false,
    fieldConfig = {},
    isLoadingUpload = false,
    isLoadingDownload = false
}) {
    const dispatch = useDispatch()
    const [file, setFile] = useState(null)
    const [fileAction, setFileAction] = useState('')
    const [fileInfo, setFileInfo] = useState({ name: '', size: 0 })
    const [selectedOption, setSelectedOption] = useState(null)
    const [uploadError, setUploadError] = useState('')
    const customSx = getCustomSx()

    const onDrop = useCallback(
        acceptedFiles => {
            if (customOnDrop) {
                customOnDrop(acceptedFiles, setFile, setFileInfo)
                return
            }

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
            } else if (acceptedFiles.length > maxFiles) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: `You can only upload up to ${maxFiles} file${maxFiles > 1 ? 's' : ''}.`,
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
        },
        [dispatch, maxFiles, customOnDrop]
    )

    // eslint-disable-next-line no-unused-vars
    const handleDownloadSample = async action => {
        if (handleGetTemplate) {
            try {
                await handleGetTemplate()
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'unable to get template from server',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        } else {
            if (handleDownloadSampleFile) {
                handleDownloadSampleFile(action)
                return
            }
            const link = document.createElement('a')
            link.href = sampleFilePath
            link.download = sampleFileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    const handleFileUpload = async () => {
        if (handleFileSubmission) {
            try {
                if (showSelectField) {
                    if (!selectedOption) {
                        setUploadError('Please select a pick type')
                        return
                    }
                    setUploadError('')
                }
                await handleFileSubmission(file, fileAction, selectedOption)
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'unable to submit file on server',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        } else {
            if (modalCloseAction) {
                dispatch(modalCloseAction())
            }
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Submitted Successfully',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    return (
        <Box sx={{ width: modalWidth }}>
            <Box sx={{ p: 1 }}>
                {isFileAction && (
                    <>
                        <Typography
                            variant='h4'
                            component='div'
                            gutterBottom
                            sx={{ display: 'flex', justifyContent: 'center' }}
                        >
                            Upload file
                        </Typography>
                        <Box sx={{ mb: 2, mt: 1, display: 'flex', justifyContent: 'center' }}>
                            <FormControl component='fieldset'>
                                <RadioGroup
                                    aria-label='action'
                                    name='action'
                                    value={fileAction}
                                    onChange={e => setFileAction(e.target.value)}
                                    row
                                >
                                    <FormControlLabel value='add' control={<Radio />} label='Add' />
                                    <FormControlLabel value='update' control={<Radio />} label='Update' />
                                </RadioGroup>
                            </FormControl>
                        </Box>
                    </>
                )}
                {showSelectField && (
                    <Box
                        sx={{ p: 1, display: 'flex', justifyContent: 'center' }}
                        key={selectedOption?.value || 'initial'}
                    >
                        <CustomAutocomplete
                            name={fieldConfig?.name}
                            label={fieldConfig?.label}
                            options={fieldConfig?.options}
                            value={selectedOption}
                            onChange={(event, newValue) => {
                                setUploadError(false)
                                setSelectedOption(newValue)
                            }}
                            // Dummy functions since you're not using Formik
                            setFieldValue={() => {}}
                            setFieldTouched={() => {}}
                            touched={uploadError}
                            error={uploadError}
                            helperText={uploadError}
                            showErrors
                            customSx={{ width: '16rem', ...customSx }}
                            showAdornment={false}
                        />
                    </Box>
                )}
                <FileUploadComponent
                    file={file}
                    fileInfo={fileInfo}
                    handleDownloadSample={isDownloadSample ? handleDownloadSample : null}
                    handleFileUpload={handleFileUpload}
                    accept={fileType}
                    maxFiles={maxFiles}
                    isDownloadSample={isDownloadSample}
                    onDrop={onDrop}
                    removeTitle={removeTitle}
                    downloadSampleTrigger={downloadSampleTrigger}
                    downloadSampleOptions={downloadOptions}
                    isLoadingUpload={isLoadingUpload}
                    isLoadingDownload={isLoadingDownload}
                />
            </Box>
        </Box>
    )
}

ImportFileModal.propTypes = {
    /* eslint-disable  */
    fileType: PropTypes.object, // Accepted file types
    maxFiles: PropTypes.number, // Maximum number of files allowed
    sampleFilePath: PropTypes.string, // Path to the sample file for download
    sampleFileName: PropTypes.string, // Name of the sample file to be downloaded
    modalCloseAction: PropTypes.func, // Action to close the modal
    handleFileSubmission: PropTypes.func, // Callback for handling file submission
    customOnDrop: PropTypes.func, // Custom onDrop logic
    isDownloadSample: PropTypes.bool, // Enable or disable the download sample button
    modalWidth: PropTypes.object, // Width of the modal box
    handleGetTemplate: PropTypes.func,
    isFileAction: PropTypes.bool,
    removeTitle: PropTypes.bool,
    downloadSampleTrigger: PropTypes.bool,
    handleDownloadSampleFile: PropTypes.func,
    showSelectField: PropTypes.bool,
    fieldConfig: PropTypes.object,
    downloadOptions: PropTypes.array,
    isLoadingUpload: PropTypes.bool,
    isLoadingDownload: PropTypes.bool
}

export default ImportFileModal
