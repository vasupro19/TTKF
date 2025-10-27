/* eslint-disable */
import React, { useState, useRef } from 'react'
import { Tabs, Tab, Typography, Box, Button, Tooltip, Divider } from '@mui/material'
import { DownloadAnimIcon } from '@/assets/icons/DownloadAnimIcon'
import fileImg from '@assets/illustrations/documentFile.svg'
import noFiles from '@assets/illustrations/noFiles.svg'
import { RestorePage } from '@mui/icons-material'
import { UploadAnimIcon } from '@/assets/icons/UploadAnimIcon'
import ConfirmModal from './modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { LOCAL_STORAGE_KEYS, useLocalStorage } from '@/hooks/useLocalStorage'

import { getGateEntryDocuments } from '@/app/store/slices/api/gateEntrySlice'
import CustomButton from './extended/CustomButton'

function FileUploadModal({ modalData, onFileUpload }) {
    const dispatch = useDispatch()
    const [value, setValue] = useState(0)

    const [storedClientLocation] = useLocalStorage(LOCAL_STORAGE_KEYS.clientLocation, null, true)
    const { user } = useSelector(state => state.auth)

    // Reference for the file input
    const fileInputRef = useRef(null)
    // Function to trigger file input click
    const handleButtonClick = () => {
        fileInputRef.current.click()
    }

    const handleFileChange = async event => {
        const file = event.target.files[0]
        if (file) {
            const currentTab = modalData[value]
            const gateEntryId = parseInt(currentTab?.gateEntryId, 10)

            if (isNaN(gateEntryId)) {
                console.error('Error: Invalid gateEntryId')
                return
            }

            if (onFileUpload) {
                await onFileUpload(file, currentTab.key, currentTab.label)

                dispatch(getGateEntryDocuments.initiate(gateEntryId))
                    .unwrap()
                    .then(updatedDocs => {
                        setModalDataState(prevState => ({
                            ...prevState,
                            [docKey]: updatedDocs[docKey] || file
                        }))
                    })
                    .catch(error => {
                        console.error('Error fetching updated documents:', error)
                    })
            }
        }
    }

    const handleChange = (event, newValue) => {
        setValue(newValue)
    }

    const handleDownload = async url => {
        if (!url) return

        const clientLocation = storedClientLocation?.[user?.id]?.current.id
        const fullUrl = `${import.meta.env.VITE_APP_BASE_URL}/ge_doc/${clientLocation}/${url}`

        try {
            const response = await fetch(fullUrl, { responseType: 'blob' })
            const blob = await response.blob()

            const url = URL.createObjectURL(blob)
            const filename = fullUrl.split('/').pop()
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename || 'download')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Download failed:', error)
        }
    }

    const closeHandler = id => {
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const getSize = () => {}

    const getFileName = path => {
        if (!path) return 'Unknown file'
        return path.split('/').pop() || 'Unknown file'
    }

    return (
        <Box sx={{ width: '100%', typography: 'body1' }}>
            {/* Heading */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center'
                }}
            >
                <Typography
                    variant='h5'
                    component='div'
                    sx={{
                        marginBottom: 1
                    }}
                >
                    Attachment
                </Typography>
                <Typography
                    variant='h5'
                    component='div'
                    sx={{
                        fontWeight: 'bold',
                        marginBottom: 1,
                        color: 'primary.dark'
                    }}
                >
                    : {modalData?.[0]?.title}
                </Typography>
            </Box>
            {/* Tabs */}
            <Tabs
                value={value}
                onChange={handleChange}
                aria-label='Attachment Tabs'
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider'
                }}
            >
                {modalData.map((tab, index) => (
                    <Tab
                        key={tab.key}
                        label={tab.label}
                        sx={{
                            textTransform: 'none',
                            fontWeight: value === index ? 'bold' : 'normal'
                        }}
                    />
                ))}
            </Tabs>

            {/* Content */}
            <Box sx={{ paddingBottom: 0.5 }}>
                {modalData.map((tab, index) => (
                    <Box
                        key={tab.key}
                        sx={{
                            display: value === index ? 'block' : 'none'
                        }}
                    >
                        {tab.src ? (
                            <Box
                                sx={{
                                    minHeight: { sm: '250px' },
                                    minWidth: { xs: '160', sm: '600px' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                {/* File preview/download */}
                                <Box
                                    sx={{
                                        '--dot-bg': 'white',
                                        '--dot-color': 'gray',
                                        '--dot-size': '1px',
                                        '--dot-space': '10px',
                                        background: `linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
                                             linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
                                             var(--dot-color)`,
                                        width: '260px',
                                        height: '180px', // Adjust height or width based on your layout
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: '8px',
                                        margin: 3
                                    }}
                                >
                                    <Tooltip title={`${getFileName(tab.src)} `}>
                                        <img
                                            src={fileImg}
                                            alt='file'
                                            style={{
                                                boxShadow:
                                                    'rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
                                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                            }}
                                            onMouseEnter={e => {
                                                e.target.style.transform = 'scale(1.05) translateY(-5px)'
                                            }}
                                            onMouseLeave={e => {
                                                e.target.style.transform = 'scale(1) translateY(0)'
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                                <Divider sx={{ borderColor: 'primary.main', width: '100%', marginBottom: 1 }} />
                                <Box
                                    sx={{
                                        display: 'flex',
                                        width: '100%',
                                        justifyContent: 'flex-end',
                                        gap: 1.5
                                    }}
                                >
                                    {/* Invisible file input */}
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }} // Hide the input element
                                    />

                                    {/* Button triggers file input */}
                                    <Button variant='outlined' onClick={closeHandler} endIcon={<RestorePage />}>
                                        Add New File
                                    </Button>
                                    <CustomButton
                                        variant='contained'
                                        onClick={() => handleDownload(tab.src)}
                                        endIcon={<DownloadAnimIcon />}
                                        shouldAnimate
                                    >
                                        Download
                                    </CustomButton>
                                </Box>
                                <ConfirmModal
                                    title='Confirmation To Replace File'
                                    message={`Are you sure? this action will delete old file and upload new one.`}
                                    icon='warning'
                                    confirmText='Yes'
                                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                                    onConfirm={() => {
                                        dispatch(closeModal())
                                        handleButtonClick()
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    minHeight: '250px',
                                    minWidth: { xs: '160', sm: '600px' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingTop: 2
                                }}
                            >
                                <img src={noFiles} alt='no-files' style={{ width: '150px' }} />
                                <Typography
                                    variant='h3'
                                    sx={{
                                        color: 'text.secondary',
                                        fontWeight: 'bold',
                                        marginTop: 1,
                                        marginBottom: 3
                                    }}
                                >
                                    No Files Here!
                                </Typography>
                                <Divider sx={{ borderColor: 'primary.main', width: '100%', marginBottom: 1 }} />

                                <Box
                                    sx={{
                                        display: 'flex',
                                        width: '100%',
                                        justifyContent: 'flex-end',
                                        gap: 1.5
                                    }}
                                >
                                    {/* Invisible file input */}
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }} // Hide the input element
                                    />

                                    {/* Button triggers file input */}
                                    <CustomButton
                                        variant='contained'
                                        onClick={handleButtonClick}
                                        endIcon={<UploadAnimIcon />}
                                        shouldAnimate
                                    >
                                        Upload File
                                    </CustomButton>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

export default FileUploadModal
