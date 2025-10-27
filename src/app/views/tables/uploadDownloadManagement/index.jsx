/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Chip, Divider, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import {
    CalendarTodayOutlined,
    Cancel,
    DownloadForOffline,
    FileDownloadOutlined,
    FileUploadOutlined,
    FilterAltOff,
    FilterAltOutlined,
    Info,
    PictureAsPdfOutlined
} from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import StatusBadge from '@/core/components/StatusBadge'
import GlobalModal from '@/core/components/modals/GlobalModal'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// ** import from redux
import { closeModal, openModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { getVendors } from '@/app/store/slices/api/vendorSlice'
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import utils
import { getObjectKeys, toCapitalizedWords } from '@/utilities'
import CircularProgressWithLabel from '@/core/components/CircularProgressWithLabel'
import PdfIcon from '@/assets/icons/PdfIcon'
import ExcelIcon from '@/assets/icons/ExcelIcon'

// ** import dummy data
import { locations } from './locations'

const staticQuery = '?start=0&length=10'
function UploadDownloadManagement() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)

    const [columns, setColumns] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)

    const [asnData, setASNData] = useState([])
    // eslint-disable-next-line no-unused-vars
    const [recordCount, setRecordCount] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    const queryHandler = async queryString => {
        // eslint-disable-next-line no-unused-vars
        const { data } = await dispatch(getVendors.initiate(queryString))
        // if (!data?.data)
        // return
        // setASNData(data.data)
        // setRecordCount(data.recordsTotal)
    }

    const cancelHandler = id => {
        console.log('cancelled id ', id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        setActiveModal('cancelModal')
    }

    const openMoreInfoHandler = id => {
        console.log('closed id ', id)
        setIsModalOpen(true)
        setActiveModal(null)
    }

    const menuOptions = useMemo(
        () => [
            {
                label: 'Download file',
                icon: <DownloadForOffline fontSize='small' sx={{ color: 'secondary.main' }} />,
                onClick: row => {
                    console.log('Downloading file')
                },
                condition: row => row?.statusText === 'Success'
            },
            {
                label: 'Download error file',
                icon: <DownloadForOffline fontSize='small' sx={{ color: 'error.main' }} />,
                onClick: row => {
                    console.log('Downloading Error file')
                },
                condition: row => row?.statusText === 'Failed'
            },
            {
                label: 'Cancel',
                icon: (
                    <Cancel
                        fontSize='small'
                        sx={{
                            color: row => (row?.statusText === 'Cancelled' ? 'orange.main' : 'orange.dark')
                        }}
                    />
                ),
                onClick: row => {
                    if (row?.statusText === 'Cancelled') {
                        return
                    }
                    cancelHandler(row?.id)
                },
                condition: row => row?.statusText === 'Running' && row?.statusText !== 'Cancelled'
            },
            {
                label: 'View more info',
                icon: <Info fontSize='small' sx={{ color: 'blue.main' }} />,
                onClick: row => openMoreInfoHandler(row?.id),
                condition: () => true
            }
        ],
        [cancelHandler, openMoreInfoHandler]
    )

    useEffect(() => {
        /* eslint-disable no-nested-ternary */
        let ObjectKeys = []
        // TODO: Once API integrated, remove this block completely
        /* eslint-disable */
        const updatedDummyData = locations?.map(loc => ({
            id: loc?.id,
            type: (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <Chip
                        label={loc?.type === 'Download' ? 'Download' : 'Upload'}
                        color='success'
                        icon={
                            loc?.type === 'Download' ? (
                                <FileDownloadOutlined fontSize='small' customSx={{ cursor: 'default' }} />
                            ) : (
                                <FileUploadOutlined fontSize='small' customSx={{ cursor: 'default' }} />
                            )
                        }
                        sx={{
                            height: '20px',
                            width: '110px',
                            fontSize: '12px',
                            padding: '2px 4px !important',
                            '& .MuiChip-labelMedium': {
                                paddingX: '8px !important'
                            },
                            background: loc?.type === 'Download' ? '#f37142' : '#1697B7',
                            color: '#fff'
                        }}
                        onClick={e => {
                            e.stopPropagation()
                            return
                        }}
                        clickable={false}
                    />
                </Box>
            ),
            process: loc?.process ?? '',
            sources: loc?.sources ?? '',
            status: (
                <StatusBadge
                    type={
                        loc?.status === 'Success'
                            ? 'success'
                            : loc?.status === 'Failed'
                              ? 'danger'
                              : loc?.status === 'Cancelled'
                                ? 'alert'
                                : 'info'
                    }
                    label={loc?.status ?? 'Pending'}
                />
            ),
            statusText: loc?.status,
            requestedBy: loc?.requestedBy ?? '',
            requestedAt: loc?.requestedAt ?? ''
        }))

        setASNData(updatedDummyData ?? [])

        const desiredOrder = ['id', 'process', 'type', 'sources', 'status', 'requestedBy', 'requestedAt'] // Desired order of keys

        locations.map((user, index) => {
            if (index === 0) {
                ObjectKeys = [...getObjectKeys(user)]
                const excludedKeys = [] // Keys to exclude

                // Sort ObjectKeys based on the desiredOrder
                ObjectKeys.sort((a, b) => {
                    const indexA = desiredOrder.indexOf(a)
                    const indexB = desiredOrder.indexOf(b)

                    // Items not found in desiredOrder will retain their initial order (or be placed at the end if desired)
                    return (indexA === -1 ? ObjectKeys.length : indexA) - (indexB === -1 ? ObjectKeys.length : indexB)
                })
                setColumns(
                    ObjectKeys.filter(key => !excludedKeys.includes(key)).map((key, keyIndex) => ({
                        id: keyIndex,
                        label: key === 'id' ? 'Sr.No.' : key === 'status' ? 'Status' : toCapitalizedWords(key),
                        align: key === 'id' || key === 'type' || key === 'status' ? 'center' : undefined,
                        search: true, // Enable search for all fields
                        sort: true, // Enable sorting for all fields
                        stick: [0].includes(keyIndex), // Stick the first column
                        key,
                        accessKey: key,
                        visible: true, // Make all columns visible
                        minWidth: key === 'id' ? 3.1 : 8, // Set column widths
                        maxWidth: key === 'id' ? 3.1 : 8
                    }))
                )
            }

            return ObjectKeys.map(key => user[key])
        })
    }, [])

    useEffect(() => {
        queryHandler(staticQuery)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <ContextMenuProvider>
            <MainCard content={false}>
                <Box sx={{ paddingY: 2, paddingX: 2, paddingTop: '2px' }}>
                    {/* Add your dummy buttons here */}
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant='h3'>All Uploads & Downloads</Typography>
                        </Box>
                        <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                            {isShowClearButton && (
                                <CustomButton
                                    variant='text'
                                    customStyles={{
                                        color: 'error.main',
                                        '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                    }}
                                    startIcon={<FilterAltOff />}
                                    onClick={() => {
                                        setClearAllFilters(prev => !prev)
                                    }}
                                >
                                    Clear All Filters
                                </CustomButton>
                            )}
                            <CSVExport handleExcelClick={handleExcelClick} />
                            {/* render action column can be made dynamic based on user authorization  */}
                            <ToggleColumns columns={[...columns.map(c => c.label), 'Action']} />
                        </Stack>
                    </Box>
                    <DataTable
                        data={asnData}
                        columns={columns}
                        addExcelQuery={excelHandler}
                        queryHandler={queryHandler}
                        totalRecords={recordCount}
                        isCheckbox={false}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {row?.statusText === 'Success' && (
                                    <IconButton
                                        sx={{ color: 'secondary.main' }}
                                        size='small'
                                        aria-label='download file'
                                        onClick={() => {
                                            console.log('Downloading file')
                                        }}
                                    >
                                        <Tooltip title='Download file'>
                                            <DownloadForOffline fontSize='small' />
                                        </Tooltip>
                                    </IconButton>
                                )}

                                {row?.statusText === 'Failed' && (
                                    <IconButton
                                        size='small'
                                        sx={{
                                            color: 'error.main'
                                        }}
                                        aria-label='download error file'
                                        onClick={() => {
                                            console.log('Downloading Error file')
                                        }}
                                    >
                                        <Tooltip title='Download error file'>
                                            <DownloadForOffline fontSize='small' />
                                        </Tooltip>
                                    </IconButton>
                                )}
                                {(row?.statusText === 'Running' || row?.statusText === 'Cancelled') && (
                                    <IconButton
                                        size='small'
                                        sx={{
                                            cursor: row?.statusText === 'Cancelled' ? 'default' : 'pointer',
                                            color: row?.statusText === 'Cancelled' ? 'orange.main' : 'orange.dark'
                                        }}
                                        disableFocusRipple={row?.statusText === 'Cancelled'}
                                        disableRipple={row?.statusText === 'Cancelled'}
                                        onClick={() => {
                                            if (row?.statusText === 'Cancelled') {
                                                return
                                            }
                                            cancelHandler(row?.id)
                                        }}
                                    >
                                        <Tooltip title={row?.statusText === 'Cancelled' ? 'Cancelled' : 'Cancel'}>
                                            <Cancel fontSize='small' />
                                        </Tooltip>
                                    </IconButton>
                                )}
                                <IconButton
                                    sx={{ color: 'blue.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => openMoreInfoHandler(row?.id)}
                                >
                                    <Tooltip title='View more info'>
                                        <Info fontSize='8px' />
                                    </Tooltip>
                                </IconButton>
                            </Box>
                        )}
                        setIsShowClearButton={setIsShowClearButton}
                        clearAllFilters={clearAllFilters}
                        enableContextMenu
                    />
                    <PopperContextMenu options={menuOptions} />
                </Box>
                {activeModal === 'cancelModal' && (
                    <ConfirmModal
                        title='Confirmation Before Cancelling'
                        message='Are you sure you want to cancel the process ?'
                        icon='warning'
                        confirmText='Yes'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={() => {
                            dispatch(
                                openSnackbar({
                                    open: true,
                                    message: 'Cancelled successfully!',
                                    variant: 'alert',
                                    alert: { color: 'info', icon: 'info' },
                                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                })
                            )
                            dispatch(closeModal())
                            setActiveModal(null)
                        }}
                    />
                )}
                <GlobalModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} closeOnBackdropClick>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            maxWidth: '90wh',
                            maxHeight: '70vh',
                            backgroundColor: '#fff',
                            boxShadow: 24,
                            p: 1,
                            borderRadius: '8px',
                            outline: 'none',
                            overflowY: { sm: 'hidden', xs: 'auto' },
                            overflowX: 'hidden'
                        }}
                    >
                        <CustomButton
                            onClick={() => setIsModalOpen(false)}
                            customStyles={{
                                mt: 2,
                                position: 'absolute',
                                top: '-15px',
                                right: '-14px',
                                '&:hover': {
                                    backgroundColor: 'transparent', // Keep the background color the same on hover
                                    boxShadow: 'none' // Remove any shadow effect
                                },
                                '&:focus': {
                                    backgroundColor: 'transparent', // Keep the background color the same on hover
                                    boxShadow: 'none' // Remove any shadow effect
                                }
                            }}
                            variant='text'
                            disableRipple
                        >
                            <Cancel />
                        </CustomButton>
                        <Box
                            sx={{
                                width: { xs: '340px', sm: '400px' },
                                padding: 2,
                                backgroundColor: '#fff'
                            }}
                        >
                            <Typography variant='subtitle1' fontWeight='bold'>
                                File name 1 (1.23 mb)
                            </Typography>
                            <Divider sx={{ my: 0.5 }} />
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant='body2' color='textSecondary'>
                                        Requested by:
                                    </Typography>
                                    <Typography variant='body1'>Michael Scott</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant='body2' color='textSecondary'>
                                        Requested At:
                                    </Typography>
                                    <Typography variant='body1'>2024-12-01 10:30 am</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant='body2' color='textSecondary'>
                                        Cancelled By:
                                    </Typography>
                                    <Typography variant='body1'>Dwight Schrute</Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant='body2' fontWeight='bold' display='flex' alignItems='center'>
                                <FilterAltOutlined sx={{ fontSize: 20, mr: 1 }} />
                                Filter Applied
                            </Typography>
                            <Box display='flex' alignItems='center' mt={1}>
                                <CalendarTodayOutlined sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                <Typography variant='body2' color='textSecondary'>
                                    Date range: 2024-10-01 to 2024-11-01
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </GlobalModal>
                {/* dummy toaster triggers could be used to show toaster message related to the process */}
                {/* <ProcessToasters />  */}
            </MainCard>
        </ContextMenuProvider>
    )
}
/* eslint-disable */
export default UploadDownloadManagement
