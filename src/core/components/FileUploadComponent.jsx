import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Typography,
    IconButton,
    Link,
    Button,
    Divider,
    Menu,
    MenuItem,
    CircularProgress,
    Tooltip
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Download from '@mui/icons-material/Download'
import { useDropzone } from 'react-dropzone'
import { ArrowDropDown } from '@mui/icons-material'
import CustomButton from './extended/CustomButton'

function FileUploadComponent({
    file,
    fileInfo,
    handleDownloadSample,
    handleFileUpload,
    accept = { 'text/csv': ['.csv'] },
    maxFiles = 1,
    isDownloadSample = false,
    onDrop,
    removeTitle = false,
    downloadSampleTrigger = false,
    downloadSampleOptions = [],
    isLoadingUpload = false,
    isLoadingDownload = false
}) {
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept, maxFiles })

    // State for menu trigger
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)

    const handleClick = event => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ minWidth: 300, p: 2, py: 0, pb: 1, textAlign: 'center' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1,
                        marginBottom: '2px'
                    }}
                >
                    {!removeTitle && (
                        <Typography variant='h4' component='div' gutterBottom>
                            Upload file
                        </Typography>
                    )}
                    {fileInfo?.name && fileInfo?.size && (
                        <Tooltip title={`${fileInfo.name} - ${(fileInfo.size / 1024).toFixed(2)} KB`}>
                            <Typography
                                variant='body2'
                                sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'block',
                                    maxWidth: 200
                                }}
                            >
                                {`${fileInfo.name} - ${(fileInfo.size / 1024).toFixed(2)} KB`}
                            </Typography>
                        </Tooltip>
                    )}
                </Box>
                <Box
                    /* eslint-disable */
                    {...getRootProps()}
                    /* eslint-enable */
                    sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        py: 2,
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        bgcolor: '#f5f5f5'
                    }}
                >
                    {/* eslint-disable */}
                    <input {...getInputProps()} />
                    {/* eslint-enable */}

                    <IconButton color='primary' component='span' disableRipple>
                        <CloudUploadIcon fontSize='large' />
                    </IconButton>
                    <Typography variant='body1'>Drop file here</Typography>
                    <Typography variant='body2' color='textSecondary'>
                        OR
                    </Typography>
                    {/* eslint-disable */}
                    <Link component='button' variant='body2' underline='none' color='primary'>
                        Browse files
                    </Link>
                    {/* eslint-enable */}
                </Box>
                <Divider sx={{ borderColor: 'primary.main', margin: '4px 0px' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {downloadSampleTrigger && downloadSampleOptions?.length > 0 ? (
                        <Box>
                            <CustomButton variant='outlined' onClick={handleClick} endIcon={<ArrowDropDown />}>
                                Download Sample{' '}
                                {isLoadingDownload && <CircularProgress color='success' size='20px' sx={{ ml: 1 }} />}
                            </CustomButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                PaperProps={{
                                    style: {
                                        minWidth: anchorEl ? anchorEl.clientWidth : undefined
                                    }
                                }}
                            >
                                {downloadSampleOptions?.map((option, index) => (
                                    <MenuItem
                                        key={option.value || index}
                                        onClick={() => {
                                            handleDownloadSample(option.value)
                                            handleClose()
                                        }}
                                        sx={{ minWidth: '100' }}
                                    >
                                        {option.icon && (
                                            <Box component='span' sx={{ mr: 1 }}>
                                                {option.icon}
                                            </Box>
                                        )}
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    ) : (
                        isDownloadSample && (
                            <Button
                                onClick={handleDownloadSample}
                                sx={{ cursor: 'pointer', color: 'blue' }}
                                endIcon={<Download />}
                                type='button'
                            >
                                Download sample{' '}
                                {isLoadingDownload && <CircularProgress color='success' size='20px' sx={{ ml: 1 }} />}
                            </Button>
                        )
                    )}
                    <Button
                        type='button'
                        variant='contained'
                        color='primary'
                        disabled={!file || isLoadingUpload}
                        onClick={!isLoadingUpload ? handleFileUpload : undefined}
                    >
                        {isLoadingUpload ? <CircularProgress size='20px' color='success' /> : 'Upload'}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

FileUploadComponent.propTypes = {
    file: PropTypes.instanceOf(File), // Expects a File object
    fileInfo: PropTypes.shape({
        name: PropTypes.string,
        size: PropTypes.number
    }),
    handleDownloadSample: PropTypes.func.isRequired, // Required function
    handleFileUpload: PropTypes.func.isRequired, // Required function
    // eslint-disable-next-line react/forbid-prop-types
    accept: PropTypes.object,
    maxFiles: PropTypes.number, // Maximum number of files allowed
    isDownloadSample: PropTypes.bool, // Boolean indicating download sample option
    onDrop: PropTypes.func, // Function to handle file drop
    removeTitle: PropTypes.bool,
    downloadSampleTrigger: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    downloadSampleOptions: PropTypes.array,
    isLoadingUpload: PropTypes.bool,
    isLoadingDownload: PropTypes.bool
}

export default FileUploadComponent
