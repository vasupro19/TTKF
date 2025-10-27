/* eslint-disable */
import React, { useRef, useState, useEffect } from 'react'
import { Box, Input, Tooltip, Typography, CircularProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Attachment } from '@mui/icons-material'
import { DownloadAnimIcon } from '@/assets/icons/DownloadAnimIcon'
import { LOCAL_STORAGE_KEYS, useLocalStorage } from '@/hooks/useLocalStorage'
import { useSelector } from 'react-redux'

// TODO: This component currently only supports view/download mode when disabled and upload mode when enabled.
// Future enhancement: Add combined view+edit mode where users can both view existing file and replace it with new upload

function CustomFileUpload({ field, handleCustomChange, formik }) {
    const theme = useTheme()
    const fileInputRef = useRef()
    const [displayedFileName, setDisplayedFileName] = useState('')
    const [fullFileName, setFullFileName] = useState('')
    const [isDownloading, setIsDownloading] = useState(false)

    const [storedClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)
    const { user } = useSelector(state => state.auth)

    useEffect(() => {
        const existingFile = formik.values[field.name];
        if (typeof existingFile === 'string' && existingFile) {
            const name = existingFile.split('/').pop();
            setFullFileName(name);
            setDisplayedFileName(name.length > 20 ? `${name.substring(0, 20)}...` : name);
        } else if (existingFile instanceof File) {
            setFullFileName(existingFile.name);
            setDisplayedFileName(existingFile.name.length > 20 ? `${existingFile.name.substring(0, 20)}...` : existingFile.name);
        } else {
            setDisplayedFileName('');
            setFullFileName('');
        }
    }, [formik.values[field.name]]);

    const handleClick = () => {
        if (field?.isDisabled) return
        fileInputRef.current.click()
    }

    const handleFileChange = event => {
        formik.setFieldTouched(field.name, true, false)
        handleCustomChange(event, formik)
    }

    const handleDownload = async (e) => {
        e.stopPropagation();
        const url = formik.values[field.name];
        if (!url || isDownloading) return;

        setIsDownloading(true);
        try {
            const clientLocation = storedClientLocation?.[user?.id]?.current.id
            const fullUrl = `${import.meta.env.VITE_APP_BASE_URL}/ge_doc/${clientLocation}/${url}`
            const response = await fetch(fullUrl)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const filename = fullUrl.split('/').pop()
            const link = document.createElement('a')
            link.href = blobUrl
            link.setAttribute('download', filename || 'download')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error)
        } finally {
            setIsDownloading(false);
        }
    }

    const hasFile = !!fullFileName;
    const isDownloadable = field.isDisabled && hasFile && field.isEdit;
    
    // Get main text based on state
    const getMainText = () => {
        if (field.isDisabled) {
            if (hasFile) return displayedFileName;
            return field.isEdit ? 'No File Available' : 'No File';
        }
        return displayedFileName || field?.label || 'Upload a file';
    };

    // Get tooltip text - only show if not disabled
    const getTooltipText = () => {
        if (field.isDisabled&&hasFile&&field.isEdit) return `Click to download the ${fullFileName}`
        if (field.isDisabled) return ''; // No tooltip for disabled state
        if (field.isEdit && hasFile) {
            return `Download: ${fullFileName}`;
        }
        return field.tooltip || `Select ${field?.label || 'a file'}`;
    }

    // Get cursor style
    const getCursor = () => {
        if (isDownloadable) return 'pointer';
        if (field?.isDisabled) return 'default'; // Changed from 'not-allowed' to 'default'
        return 'pointer';
    }

    // Button click handler - fixed to properly trigger file input
    const handleButtonClick = (e) => {
        e.stopPropagation();
        if (field.isEdit && hasFile) {
            handleDownload(e);
        } else if (!field?.isDisabled) {
            fileInputRef.current.click();
        }
    }

    const tooltipContent = getTooltipText();
    const FileUploadComponent = (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: formik.touched[field.name] && formik.errors[field.name] ? 'error.main' : 'grey.500', // Fixed: Use grey.500
                minHeight: '38px',
                cursor: getCursor(),
                // Improved disabled styling - but not when file exists and editable
                backgroundColor: field?.isDisabled
                    ? (isDownloadable ? '#fff' : theme.palette.grey[50]) // Don't grey out when downloadable
                    : field?.isEdit 
                        ? theme.palette.grey[50] 
                        : '#fff',
                opacity: field?.isDisabled && !isDownloadable ? 0.7 : 1, // Don't reduce opacity when downloadable
                transition: 'all 0.2s ease',
                '&:hover': !field?.isDisabled ? {
                    backgroundColor: theme.palette.grey[50],
                } : {},
            }}
            onClick={isDownloadable ? handleDownload : handleClick}
        >
            <Typography
                variant='body1'
                sx={{
                    flex: 1,
                    color: field?.isDisabled && !isDownloadable ? theme.palette.text.disabled : 'inherit', // Don't disable text color when downloadable
                    marginLeft: '10px',
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: hasFile && field.isDisabled ? 500 : 400,
                }}
            >
                {getMainText()}
            </Typography>

            <Box
                sx={{
                    backgroundColor: field?.isDisabled 
                        ? (isDownloadable ? theme.palette.grey[200] : theme.palette.grey[300]) // Normal colors when downloadable
                        : theme.palette.grey[200],
                    color: field?.isDisabled 
                        ? (isDownloadable ? theme.palette.text.primary : theme.palette.text.disabled) // Normal text when downloadable
                        : theme.palette.text.primary,
                    '&:hover': !field?.isDisabled || isDownloadable ? { // Allow hover when downloadable
                        backgroundColor: theme.palette.grey[300],
                    } : {},
                    borderLeft: '1px solid',
                    borderColor: 'grey.400',
                    padding: '0 10px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                    transition: 'all 0.2s ease',
                    cursor: field?.isDisabled ? (isDownloadable ? 'pointer' : 'default') : 'pointer', // Pointer when downloadable
                }}
                onClick={handleButtonClick} // Fixed: Use proper handler
            >
                {isDownloading ? (
                    <CircularProgress size={18} sx={{ color: 'inherit' }} />
                ) : field?.isEdit ? (
                    hasFile ? (
                        <DownloadAnimIcon />
                    ) : (
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: 'inherit',
                                fontSize: '11px',
                            }}
                        >
                            No File
                        </Typography>
                    )
                ) : (
                    <>
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mr: 0.5,
                                fontSize: '12px',
                            }}
                        >
                            {field?.buttonLabel || 'Select'}
                        </Typography>
                        <Attachment sx={{ fontSize: '16px' }} /> {/* Reverted: Back to Attachment icon */}
                    </>
                )}
            </Box>
        </Box>
    );

    return (
        <>
            {/* Only wrap with tooltip if not disabled */}
            {tooltipContent ? (
                <Tooltip title={tooltipContent} arrow>
                    {FileUploadComponent}
                </Tooltip>
            ) : (
                FileUploadComponent
            )}
            
            {/* Hidden File Input */}
            <Input
                type='file'
                name={field?.name}
                onChange={handleFileChange}
                inputRef={fileInputRef}
                disabled={field?.isDisabled}
                sx={{ display: 'none' }}
            />
            
            {/* Error Message */}
            {formik.touched[field.name] && formik.errors[field.name] && (
                <Typography 
                    variant='caption' 
                    color='error' 
                    sx={{ 
                        ml: '12px',
                        mt: '2px',
                        display: 'block',
                        fontSize: '11px',
                    }}
                >
                    {formik.errors[field.name]}
                </Typography>
            )}
        </>
    )
}

export default CustomFileUpload