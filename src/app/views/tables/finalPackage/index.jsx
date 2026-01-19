import { useState, useEffect, useMemo, useCallback } from 'react'

import { Box, IconButton, Tooltip, Menu, MenuItem, Typography, Divider } from '@mui/material'
import Stack from '@mui/material/Stack'
// import Box from '@mui/material/Box'
// import Tooltip from '@mui/material/Tooltip'
// import IconButton from '@mui/material/IconButton'
// import TextField from '@mui/material/TextField'
import { Apartment, DirectionsCar, Edit, Delete, FilterAltOff, Add, Visibility } from '@mui/icons-material'
import {
    getAllConfirmedPackages,
    useUpdateConfirmedBookingMutation,
    useAddServiceToPackageMutation,
    useGetServicesByPackageQuery,
    useDeleteServiceMutation,
    useSendSupplierEmailMutation
} from '@/app/store/slices/api/packageConvert' // Use your new slice
import AssignmentModal from '@/core/components/modals/AssignmentModal'
import ServiceListModal from '@/core/components/modals/ServiceListModal'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
// project imports
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import { openSnackbar } from '@app/store/slices/snackbar'

import { getCampaigns, removeLocationMaster } from '@/app/store/slices/api/campaignSlice'
import { getDestinationClients } from '@/app/store/slices/api/destinationSlice'

import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

// import { getObjectKeys, toCapitalizedWords } from '@/utilities'
// import { Typography } from '@mui/material'
import ToggleColumns from '@/core/components/ToggleColumns'

import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'
// const slimTextFieldStyle = {
//     '& .MuiInputBase-input': {
//         fontSize: 12,
//         height: 8,
//         padding: 1
//     }
// }

function FinalPackageTable() {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const params = useParams()
    // State to track which row ID the menu was opened for
    const [currentRowId, setCurrentRowId] = useState(null)
    const [listModal, setListModal] = useState({ open: false, type: '', services: [] })
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const [addService, { isLoading: isAddingService }] = useAddServiceToPackageMutation()
    const { getLocationMasterLKey, removeLocationMasterLKey } = useSelector(state => state.loading)

    const [columns, setColumns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)
    const [removeId, setRemoveId] = useState(null)

    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [activeRow, setActiveRow] = useState(null)

    const [assignModal, setAssignModal] = useState({ open: false, type: '', row: null })
    const [updatePackage, { isLoading: isUpdating }] = useUpdateConfirmedBookingMutation()
    const { data: serviceResponse, isLoading } = useGetServicesByPackageQuery(
        { packageId: activeRow?.id, type: listModal.type },
        { skip: !listModal.open || !activeRow?.id }
    )
    // const [getDestinationClient] = useGetDestinationClientsQuery()

    const [search, setSearch] = useState({
        // value: '',
        // regex: false
    })
    const [filters, setFilters] = useState({
        created_at: { from: '', to: '' },
        campaignId: params.id
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHandler = useCallback(async id => navigate(`/master/destinations/edit/${id}`), [])

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const clearFilters = () => {
        setSearch({
            value: '',
            regex: false
        })
        setFilters({ created_at: { from: '', to: '' } })
    }
    useEffect(() => {
        if (serviceResponse?.data) {
            setListModal(prev => ({
                ...prev,
                services: serviceResponse.data // This sets the services into your state
            }))
        }
    }, [serviceResponse])
    const deleteHandler = useCallback(async id => {
        setRemoveId(id)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const deleteActionHandler = async () => {
        try {
            await dispatch(removeLocationMaster.initiate(removeId))
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'removed location successfully!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } catch (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to remove location!',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            dispatch(closeModal())
        }
    }

    // column toggler
    const handleCheckToggle = key => {
        setColumns([
            ...columns.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        ])
    }

    const handleAdd = () => {
        navigate('/master/destinations/add')
    }

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    // use keyboard shortcut
    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            handleAdd()
        }
    })

    const { getConfirmedBookingLKey } = useSelector(state => state.loading) // Update loading key

    // Logic to handle navigation to assignment pages
    const handleAddHotel = id => navigate(`/bookings/assign-hotel/${id}`)
    const handleAddTransport = id => navigate(`/bookings/assign-transport/${id}`)

    const queryHandler = async queryString => {
        // Change from getDestinationClients to your new booking endpoint
        const { data: response } = await dispatch(getAllConfirmedPackages.initiate(queryString, false))
        if (isExcelQuery(queryString)) return true

        const processedData = (response?.data || []).map(row => ({
            ...row,
            hotelName: 'View Added Hotels',
            transporterName: 'View Added Transporter'
        }))

        setUsers(processedData)
        setRecordsCount(response?.recordsTotal || 0)
        return true
    }
    const handleViewHotels = row => {
        setActiveRow(row)
        setListModal({ open: true, type: 'Hotel', services: [] }) // Reset list while loading
    }

    const handleViewTransport = row => {
        setActiveRow(row)
        setListModal({ open: true, type: 'Taxi', services: [] })
    }
    const enhancedColumns = useMemo(
        () =>
            columns.map(col => {
                if (col.key === 'guestName') {
                    return {
                        ...col,
                        label: 'Guest Name',
                        isClickable: true,
                        onClick: row => navigate(`/process/guest/add/${row.leadId}`)
                    }
                }
                if (col.key === 'hotelName') {
                    return {
                        ...col,
                        label: 'Hotel Details',
                        isClickable: true,
                        onClick: row => handleViewHotels(row)
                    }
                }
                if (col.key === 'transporterName') {
                    return {
                        ...col,
                        label: 'Transport Details',
                        isClickable: true,
                        onClick: row => handleViewTransport(row)
                    }
                }
                return col
            }),
        [columns]
    )
    const menuOptions = useMemo(
        () => [
            {
                label: 'Assign Hotel',
                icon: <Apartment fontSize='small' color='primary' />,
                onClick: row => handleAddHotel(row.id)
            },
            {
                label: 'Assign Transport',
                icon: <DirectionsCar fontSize='small' color='secondary' />,
                onClick: row => handleAddTransport(row.id)
            },
            {
                label: 'Edit Info',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row => editHandler(row.id),
                condition: row => hasEditAccess
            }
        ],
        [navigate, hasEditAccess]
    )
    const handleOpenModal = (row, type) => {
        setAssignModal({ open: true, type, row })
    }

    // const handleSaveAssignment = async formData => {
    //     const payload = {
    //         id: assignModal.row.id,
    //         sellingPrice: assignModal.row.sellingPrice,
    //         ...(assignModal.type === 'Hotel'
    //             ? { hotelId: formData.supplierId, hotelCost: formData.cost }
    //             : { transporterId: formData.supplierId, transporterCost: formData.cost })
    //     }

    //     try {
    //         await updatePackage(payload).unwrap()
    //         setAssignModal({ open: false, type: '', row: null }) // Close Modal
    //         // Optional: Dispatch success snackbar
    //     } catch (err) {
    //         console.error('Update failed', err)
    //     }
    // }
    const handleSaveAssignment = async formData => {
        console.log(formData, 'form')
        // 1. Construct the comprehensive payload
        const payload = {
            ...formData,

            packageId: activeRow.id,
            // We spread formData to include: supplierId, cost, type, remarks,
            // startDate, endDate, quantity, and paidAmount
            // Ensure numbers are correctly formatted just in case
            cost: parseFloat(formData.cost || 0),
            paidAmount: parseFloat(formData.paidAmount || 0),
            quantity: formData.quantity ? parseInt(formData.quantity, 10) : null
        }

        try {
            // 2. Call the mutation
            await addService(payload).unwrap()

            // 3. Close modal and reset state on success
            setAssignModal(prev => ({ ...prev, open: false }))
            setActiveRow(null) // Clean up active row state

            // 4. Success Notification
            dispatch(
                openSnackbar({
                    open: true,
                    message: `${formData.type} "${formData.supplierName || ''}" added successfully!`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (err) {
            // Most errors are caught by your customResponseHandler,
            // but you can add local error handling here if needed.
            console.error('Failed to add service:', err)
        }
    }
    const handleEditService = service => {
        console.log(service, 'ser')
        // 1. Close the view list
        setListModal(prev => ({ ...prev, open: false }))

        // 2. Open the assignment modal in "Update" mode
        setAssignModal({
            open: true,
            type: service.type, // 'Hotel' or 'Taxi'
            row: service // Passing the actual service record instead of the parent row
        })
    }
    const [deleteService] = useDeleteServiceMutation()
    // const [sendEmail] = useSendSupplierEmailMutation()
    // Inside FinalPackageTable function
    const [sendEmail, { isLoading: isSendingEmail }] = useSendSupplierEmailMutation()

    const handleDeleteService = async id => {
        if (window.confirm('Are you sure you want to remove this service?')) {
            await deleteService(id).unwrap()
            dispatch(
                openSnackbar({
                    message: 'Removed and profit recalculated',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        }
    }

    const handleSendEmail = async id => {
        try {
            await sendEmail(id).unwrap()
            dispatch(openSnackbar({ message: 'Email sent to supplier', variant: 'alert', alert: { color: 'success' } }))
        } catch (err) {
            dispatch(openSnackbar({ message: 'Failed to send email', variant: 'alert', alert: { color: 'error' } }))
        }
    }
    return (
        <ContextMenuProvider>
            <MainCard content={false} sx={{ py: '2px' }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant='h3'>Confirmed Bookings Operations</Typography>
                    {/* ... Search and Date Filters ... */}
                </Box>

                <DataTable
                    isCheckbox
                    data={users || []}
                    columns={enhancedColumns}
                    queryHandler={queryHandler}
                    reqKey='getConfirmedBookingLKey' // Use the correct loading key
                    refetch={refetch}
                    totalRecords={recordsCount}
                    renderAction={row => (
                        <Stack direction='row' spacing={1} justifyContent='center'>
                            {/* Add Hotel Button */}
                            <Tooltip title='Assign Hotel'>
                                <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={() => {
                                        setActiveRow(row) // 'activeRow' now holds the ID and data of this specific guest
                                        setAssignModal({ open: true, type: 'Hotel' })
                                    }}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: row.hotelId ? 'success.light' : 'primary.light'
                                    }}
                                >
                                    <Apartment fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            {/* Add Transport Button */}
                            <Tooltip title='Assign Transport'>
                                <IconButton
                                    size='small'
                                    color='secondary'
                                    onClick={() => {
                                        setActiveRow(row) // 'activeRow' now holds the ID and data of this specific guest
                                        setAssignModal({ open: true, type: 'Taxi' })
                                    }}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: row.transporterId ? 'success.light' : 'secondary.light'
                                    }}
                                >
                                    <DirectionsCar fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            <Divider orientation='vertical' flexItem />

                            {/* <IconButton size='small' onClick={() => editHandler(row.id)}>
                                <Edit fontSize='small' sx={{ color: '#60498a' }} />
                            </IconButton> */}
                        </Stack>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    isLoading={getConfirmedBookingLKey}
                    enableContextMenu
                />
                <PopperContextMenu options={menuOptions} />
            </MainCard>
            <AssignmentModal
                open={assignModal.open}
                type={assignModal.type}
                row={assignModal.row}
                onClose={() => setAssignModal({ ...assignModal, open: false })}
                onSave={handleSaveAssignment}
                isLoading={isUpdating}
            />
            <ServiceListModal
                open={listModal.open}
                type={listModal.type}
                services={listModal.services} // Now coming from your local state
                isLoading={isLoading} // Still good to show a loader from the hook
                isSendingEmail={isSendingEmail}
                onClose={() => setListModal({ ...listModal, open: false, services: [] })}
                onEdit={handleEditService}
                onDelete={id => handleDeleteService(id)} // Function to call your delete mutation
                onSendEmail={id => handleSendEmail(id)} // Function to call your email mutation
            />
        </ContextMenuProvider>
    )
}

export default FinalPackageTable
