import { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'

import { Box, IconButton, Tooltip, Typography, Divider, CircularProgress, Modal, Button, Chip } from '@mui/material'
import Stack from '@mui/material/Stack'
import {
    Apartment,
    DirectionsCar,
    Edit,
    Visibility,
    Email as EmailIcon,
    PictureAsPdf,
    AccountBalanceWallet
} from '@mui/icons-material'

import {
    getAllConfirmedPackages,
    getConfirmedVoucherPreview,
    useAddServiceToPackageMutation,
    useGetServicesByPackageQuery,
    useDeleteServiceMutation,
    useSendSupplierEmailMutation,
    useAddGuestPaymentMutation,
    useSendVoucherEmailMutation,
    useSendGuestHotelConfirmationEmailMutation,
    useSendGuestTaxiConfirmationEmailMutation,
    useDownloadConfirmedVoucherPdfMutation
} from '@/app/store/slices/api/packageConvert'
import { usePaySupplierMutation } from '@/app/store/slices/api/confirmedService'
import { openSnackbar } from '@app/store/slices/snackbar'

import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import AssignmentModal from '@/core/components/modals/AssignmentModal'
import ServiceListModal from '@/core/components/modals/ServiceListModal'
import GuestPaymentModal from '@/core/components/modals/GuestPaymentModal'
import GuestLedgerModal from '@/core/components/modals/GuestLedgerModal'
import SupplierPaymentModal from '@/core/components/modals/SupplierPaymentModal'
import { ContextMenuProvider, PopperContextMenu } from '@/core/components/RowContextMenu'

import { isExcelQuery } from '@/constants'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import useUiAccess from '@/hooks/useUiAccess'
import { headers } from './helper'

const downloadBlob = (blob, filename) => {
    const fileUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = fileUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(fileUrl)
}

const getReadinessStyles = status => {
    if (status === 'Ready to travel') {
        return { bg: '#f0fdf4', color: '#16a34a' }
    }

    if (status === 'In progress') {
        return { bg: '#eff6ff', color: '#2563eb' }
    }

    return { bg: '#fffbeb', color: '#b45309' }
}

function FinalPackageTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const hasEditAccess = useUiAccess('edit')
    const { getConfirmedBookingLKey } = useSelector(state => state.loading)

    const [columns] = useState([...headers])
    const [users, setUsers] = useState([])
    const [recordsCount, setRecordsCount] = useState(0)
    const [refetch, setRefetch] = useState(false)
    const [activeRow, setActiveRow] = useState(null)
    const [rowActionKey, setRowActionKey] = useState('')

    const [assignModal, setAssignModal] = useState({ open: false, type: '', row: null })
    const [listModal, setListModal] = useState({ open: false, type: '', services: [] })
    const [paymentModal, setPaymentModal] = useState({ open: false, row: null })
    const [supplierPaymentModal, setSupplierPaymentModal] = useState({ open: false, row: null })
    const [ledgerModal, setLedgerModal] = useState({ open: false, packageId: null, guestName: '' })
    const [previewState, setPreviewState] = useState({
        open: false,
        loading: false,
        html: '',
        guestName: ''
    })

    const [addService] = useAddServiceToPackageMutation()
    const [deleteService] = useDeleteServiceMutation()
    const [sendSupplierEmail, { isLoading: isSendingSupplierEmail }] = useSendSupplierEmailMutation()
    const [addGuestPayment, { isLoading: isPayingGuest }] = useAddGuestPaymentMutation()
    const [paySupplier, { isLoading: isPayingSupplier }] = usePaySupplierMutation()
    const [sendVoucherEmail] = useSendVoucherEmailMutation()
    const [sendGuestHotelEmail] = useSendGuestHotelConfirmationEmailMutation()
    const [sendGuestTaxiEmail] = useSendGuestTaxiConfirmationEmailMutation()
    const [downloadConfirmedVoucherPdf] = useDownloadConfirmedVoucherPdfMutation()

    const { data: serviceResponse, isLoading: isServiceLoading } = useGetServicesByPackageQuery(
        { packageId: activeRow?.id, type: listModal.type },
        { skip: !listModal.open || !activeRow?.id }
    )

    useEffect(() => {
        if (serviceResponse?.data) {
            setListModal(prev => ({
                ...prev,
                services: serviceResponse.data
            }))
        }
    }, [serviceResponse])

    useEffect(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
    }, [location.pathname])

    useKeyboardShortcut('Alt+A', () => {
        if (hasCreateAccess) {
            navigate('/bookings/assign-hotel')
        }
    })

    const withRowLoader = async (key, callback) => {
        setRowActionKey(key)
        try {
            await callback()
        } finally {
            setRowActionKey('')
        }
    }

    const queryHandler = async queryString => {
        const { data: response } = await dispatch(getAllConfirmedPackages.initiate(queryString, false))
        if (isExcelQuery(queryString)) return true

        const processedData = (response?.data || []).map(row => ({
            ...row,
            hotelName: 'View Added Hotels',
            transporterName: 'View Added Transporter'
        }))

        setUsers(processedData)
        setRecordsCount(response?.recordsTotal || response?.count || processedData.length)
        return true
    }

    const handleViewServices = (row, type) => {
        setActiveRow(row)
        setListModal({ open: true, type, services: [] })
    }

    const handleViewPaymentLedger = row => {
        setLedgerModal({
            open: true,
            packageId: row.id,
            guestName: row.guestName || 'Guest'
        })
    }

    const enhancedColumns = useMemo(
        () =>
            columns.map(col => {
                if (col.key === 'guestPaidAmount') {
                    return {
                        ...col,
                        isClickable: true,
                        render: row => (
                            <Typography
                                variant='body2'
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
                                }}
                            >
                                ₹{row.guestPaidAmount || 0}
                            </Typography>
                        ),
                        onClick: row => handleViewPaymentLedger(row)
                    }
                }

                if (col.key === 'guestName') {
                    return {
                        ...col,
                        label: 'Guest Name',
                        isClickable: true,
                        onClick: row =>
                            navigate(`/process/guest/add/${row.leadId}`, {
                                state: { convertedQuoteNo: row.quotationNo }
                            })
                    }
                }

                if (col.key === 'hotelName') {
                    return {
                        ...col,
                        label: 'Hotel Details',
                        isClickable: true,
                        onClick: row => handleViewServices(row, 'Hotel')
                    }
                }

                if (col.key === 'transporterName') {
                    return {
                        ...col,
                        label: 'Transport Details',
                        isClickable: true,
                        onClick: row => handleViewServices(row, 'Taxi')
                    }
                }

                if (col.key === 'status') {
                    return {
                        ...col,
                        render: row => (
                            <Chip
                                size='small'
                                label={row.status || 'Confirmed'}
                                sx={{
                                    bgcolor: row.status === 'Voucher Sent' ? '#eff6ff' : '#f0fdf4',
                                    color: row.status === 'Voucher Sent' ? '#2563eb' : '#16a34a',
                                    fontWeight: 700
                                }}
                            />
                        )
                    }
                }

                if (col.key === 'readinessStatus') {
                    return {
                        ...col,
                        render: row => {
                            const readinessStyles = getReadinessStyles(row.readinessStatus)

                            return (
                                <Stack spacing={0.5}>
                                    <Chip
                                        size='small'
                                        label={`${row.readinessStatus || 'Action needed'} (${row.readinessCompleted || 0}/${row.readinessTotal || 0})`}
                                        sx={{
                                            bgcolor: readinessStyles.bg,
                                            color: readinessStyles.color,
                                            fontWeight: 700
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {(row.readinessItems || []).map(item => (
                                            <Chip
                                                key={item.label}
                                                size='small'
                                                label={item.label}
                                                variant={item.done ? 'filled' : 'outlined'}
                                                sx={{
                                                    height: 20,
                                                    bgcolor: item.done ? '#f0fdf4' : 'transparent',
                                                    color: item.done ? '#16a34a' : '#64748b',
                                                    borderColor: item.done ? '#bbf7d0' : '#cbd5e1',
                                                    fontSize: '0.68rem'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Stack>
                            )
                        }
                    }
                }

                return col
            }),
        [columns, navigate]
    )

    const menuOptions = useMemo(
        () => [
            {
                label: 'Assign Hotel',
                icon: <Apartment fontSize='small' color='primary' />,
                onClick: row => {
                    setActiveRow(row)
                    setAssignModal({ open: true, type: 'Hotel', row })
                }
            },
            {
                label: 'Assign Transport',
                icon: <DirectionsCar fontSize='small' color='secondary' />,
                onClick: row => {
                    setActiveRow(row)
                    setAssignModal({ open: true, type: 'Taxi', row })
                }
            },
            {
                label: 'Edit Info',
                icon: <Edit fontSize='small' sx={{ fill: '#60498a' }} />,
                onClick: row =>
                    navigate(`/process/guest/add/${row.leadId}`, { state: { convertedQuoteNo: row.quotationNo } }),
                condition: () => hasEditAccess
            }
        ],
        [hasEditAccess, navigate]
    )

    const handleSaveAssignment = async formData => {
        try {
            const response = await addService({
                ...formData,
                packageId: activeRow.id,
                cost: parseFloat(formData.cost || 0),
                paidAmount: parseFloat(formData.paidAmount || 0),
                quantity: formData.quantity ? parseInt(formData.quantity, 10) : null
            }).unwrap()

            setAssignModal(prev => ({ ...prev, open: false, row: null }))
            setActiveRow(null)
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)

            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || `${formData.type} saved successfully`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to save service',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handleEditService = service => {
        setListModal(prev => ({ ...prev, open: false }))
        setAssignModal({
            open: true,
            type: service.type,
            row: service
        })
    }

    const handleDeleteService = async id => {
        if (!window.confirm('Are you sure you want to remove this service?')) return

        try {
            const response = await deleteService(id).unwrap()
            dispatch(
                openSnackbar({
                    message: response?.message || 'Service removed successfully',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    message: error?.data?.message || 'Failed to remove service',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handleSendSupplierInquiry = async id => {
        try {
            const response = await sendSupplierEmail(id).unwrap()
            dispatch(
                openSnackbar({
                    message: response?.message || 'Supplier inquiry mail sent',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    message: error?.data?.message || 'Failed to send supplier inquiry mail',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handlePreviewVoucher = async row => {
        setPreviewState({
            open: true,
            loading: true,
            html: '',
            guestName: row.guestName || 'Guest'
        })

        try {
            const { data } = await dispatch(getConfirmedVoucherPreview.initiate(row.id))
            setPreviewState({
                open: true,
                loading: false,
                html: data?.data?.html || '',
                guestName: row.guestName || 'Guest'
            })
        } catch (error) {
            setPreviewState({
                open: false,
                loading: false,
                html: '',
                guestName: ''
            })
            dispatch(
                openSnackbar({
                    message: error?.data?.message || 'Unable to load voucher preview',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handleDownloadVoucherPdf = async row => {
        await withRowLoader(`pdf-${row.id}`, async () => {
            const blob = await downloadConfirmedVoucherPdf(row.id).unwrap()
            downloadBlob(blob, `confirmed_package_${row.id}.pdf`)
        })
    }

    const handleSendVoucher = async row => {
        await withRowLoader(`voucher-${row.id}`, async () => {
            const response = await sendVoucherEmail(row.id).unwrap()
            dispatch(
                openSnackbar({
                    message: response?.message || `Voucher sent to ${row.guestName} successfully`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        })
    }

    const handleSendGuestHotelMail = async row => {
        await withRowLoader(`hotel-mail-${row.id}`, async () => {
            const response = await sendGuestHotelEmail(row.id).unwrap()
            dispatch(
                openSnackbar({
                    message: response?.message || `Hotel confirmation sent to ${row.guestName}`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        })
    }

    const handleSendGuestTaxiMail = async row => {
        await withRowLoader(`taxi-mail-${row.id}`, async () => {
            const response = await sendGuestTaxiEmail(row.id).unwrap()
            dispatch(
                openSnackbar({
                    message: response?.message || `Taxi confirmation sent to ${row.guestName}`,
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        })
    }

    const handleSaveGuestPayment = async formData => {
        try {
            const response = await addGuestPayment({
                packageId: paymentModal.row.id,
                ...formData
            }).unwrap()

            setPaymentModal({ open: false, row: null })
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)

            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || 'Guest payment recorded successfully',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to record guest payment',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handleOpenSupplierPayment = service => {
        setSupplierPaymentModal({
            open: true,
            row: {
                ...service,
                supplierName: service.supplier?.businessname || 'Supplier',
                guestName: activeRow?.guestName || 'Guest'
            }
        })
    }

    const handleSaveSupplierPayment = async formData => {
        try {
            const { row } = supplierPaymentModal
            const response = await paySupplier({
                confirmedServiceId: row.id,
                amount: parseFloat(formData.amount),
                method: formData.paymentMethod,
                transactionId: formData.transactionId,
                paymentDate: formData.paymentDate,
                remarks: formData.remarks || `Payment for ${row.type} - ${row.guestName}`
            }).unwrap()

            setSupplierPaymentModal({ open: false, row: null })
            dispatch(
                openSnackbar({
                    open: true,
                    message: response?.message || 'Supplier payment recorded successfully',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to record supplier payment',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const isProcessing = key => rowActionKey === key

    const bookingSummary = useMemo(() => {
        const total = users.length
        const fullyPaid = users.filter(item => item.guestPaymentStatus === 'Fully Paid').length
        const partiallyPaid = users.filter(item => item.guestPaymentStatus === 'Partially Paid').length
        const unpaid = users.filter(item => !item.guestPaymentStatus || item.guestPaymentStatus === 'Unpaid').length

        return [
            { label: 'Bookings', value: total, color: '#1d4ed8', bg: '#eff6ff' },
            { label: 'Fully Paid', value: fullyPaid, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Partially Paid', value: partiallyPaid, color: '#b45309', bg: '#fffbeb' },
            { label: 'Unpaid', value: unpaid, color: '#dc2626', bg: '#fef2f2' }
        ]
    }, [users])

    return (
        <ContextMenuProvider>
            <MainCard content={false} sx={{ py: '2px' }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexDirection: { xs: 'column', md: 'row' },
                        p: 2
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant='h3'>Confirmed Bookings Operations</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Preview confirmations, send guest mails, manage supplier queries, and track payments from
                            one screen.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {bookingSummary.map(item => (
                                <Chip
                                    key={item.label}
                                    label={`${item.label}: ${item.value}`}
                                    size='small'
                                    sx={{
                                        bgcolor: item.bg,
                                        color: item.color,
                                        fontWeight: 700,
                                        borderRadius: '8px'
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {[
                            { label: 'Preview', color: '#1d4ed8', bg: '#eff6ff' },
                            { label: 'PDF', color: '#dc2626', bg: '#fef2f2' },
                            { label: 'Guest Mail', color: '#0284c7', bg: '#f0f9ff' },
                            { label: 'Payment', color: '#15803d', bg: '#f0fdf4' }
                        ].map(item => (
                            <Chip
                                key={item.label}
                                label={item.label}
                                size='small'
                                sx={{
                                    bgcolor: item.bg,
                                    color: item.color,
                                    fontWeight: 700,
                                    borderRadius: '8px'
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <DataTable
                    isCheckbox
                    data={users || []}
                    columns={enhancedColumns}
                    queryHandler={queryHandler}
                    reqKey='getConfirmedBookingLKey'
                    refetch={refetch}
                    totalRecords={recordsCount}
                    renderAction={row => (
                        <Stack direction='row' spacing={1} justifyContent='center' flexWrap='wrap'>
                            <Tooltip title='Preview Confirmation'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'primary.main', border: '1px solid', borderColor: 'primary.light' }}
                                    onClick={() => handlePreviewVoucher(row)}
                                >
                                    <Visibility fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Download PDF'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.light' }}
                                    onClick={() => handleDownloadVoucherPdf(row)}
                                    disabled={isProcessing(`pdf-${row.id}`)}
                                >
                                    {isProcessing(`pdf-${row.id}`) ? (
                                        <CircularProgress size={18} color='inherit' />
                                    ) : (
                                        <PictureAsPdf fontSize='small' />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Send Full Confirmation Voucher'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'info.main', border: '1px solid', borderColor: 'info.light' }}
                                    onClick={() => handleSendVoucher(row)}
                                    disabled={isProcessing(`voucher-${row.id}`)}
                                >
                                    {isProcessing(`voucher-${row.id}`) ? (
                                        <CircularProgress size={18} color='inherit' />
                                    ) : (
                                        <EmailIcon fontSize='small' />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Send Hotel Confirmation to Guest'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'primary.dark', border: '1px solid', borderColor: 'primary.light' }}
                                    onClick={() => handleSendGuestHotelMail(row)}
                                    disabled={isProcessing(`hotel-mail-${row.id}`)}
                                >
                                    {isProcessing(`hotel-mail-${row.id}`) ? (
                                        <CircularProgress size={18} color='inherit' />
                                    ) : (
                                        <Apartment fontSize='small' />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Send Taxi Confirmation to Guest'>
                                <IconButton
                                    size='small'
                                    sx={{
                                        color: 'secondary.main',
                                        border: '1px solid',
                                        borderColor: 'secondary.light'
                                    }}
                                    onClick={() => handleSendGuestTaxiMail(row)}
                                    disabled={isProcessing(`taxi-mail-${row.id}`)}
                                >
                                    {isProcessing(`taxi-mail-${row.id}`) ? (
                                        <CircularProgress size={18} color='inherit' />
                                    ) : (
                                        <DirectionsCar fontSize='small' />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Record Guest Payment'>
                                <IconButton
                                    size='small'
                                    sx={{ color: 'success.main', border: '1px solid', borderColor: 'success.light' }}
                                    onClick={() => setPaymentModal({ open: true, row })}
                                >
                                    <AccountBalanceWallet fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Assign Hotel'>
                                <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={() => {
                                        setActiveRow(row)
                                        setAssignModal({ open: true, type: 'Hotel', row })
                                    }}
                                    sx={{ border: '1px solid', borderColor: 'primary.light' }}
                                >
                                    <Apartment fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title='Assign Transport'>
                                <IconButton
                                    size='small'
                                    color='secondary'
                                    onClick={() => {
                                        setActiveRow(row)
                                        setAssignModal({ open: true, type: 'Taxi', row })
                                    }}
                                    sx={{ border: '1px solid', borderColor: 'secondary.light' }}
                                >
                                    <DirectionsCar fontSize='small' />
                                </IconButton>
                            </Tooltip>

                            <Divider orientation='vertical' flexItem />
                        </Stack>
                    )}
                    isLoading={getConfirmedBookingLKey}
                    enableContextMenu
                />
                <PopperContextMenu options={menuOptions} />
            </MainCard>

            <AssignmentModal
                open={assignModal.open}
                type={assignModal.type}
                row={assignModal.row}
                onClose={() => setAssignModal({ ...assignModal, open: false, row: null })}
                onSave={handleSaveAssignment}
                isLoading={false}
            />

            <ServiceListModal
                open={listModal.open}
                type={listModal.type}
                services={listModal.services}
                isLoading={isServiceLoading}
                isSendingEmail={isSendingSupplierEmail}
                onClose={() => setListModal({ ...listModal, open: false, services: [] })}
                onEdit={handleEditService}
                onDelete={handleDeleteService}
                onSendEmail={handleSendSupplierInquiry}
                onAddPayment={handleOpenSupplierPayment}
            />

            <GuestPaymentModal
                open={paymentModal.open}
                row={paymentModal.row}
                isLoading={isPayingGuest}
                onClose={() => setPaymentModal({ open: false, row: null })}
                onSave={handleSaveGuestPayment}
            />

            <SupplierPaymentModal
                open={supplierPaymentModal.open}
                row={supplierPaymentModal.row}
                isLoading={isPayingSupplier}
                onClose={() => setSupplierPaymentModal({ open: false, row: null })}
                onSave={handleSaveSupplierPayment}
            />

            <GuestLedgerModal
                open={ledgerModal.open}
                packageId={ledgerModal.packageId}
                guestName={ledgerModal.guestName}
                onClose={() => setLedgerModal({ ...ledgerModal, open: false })}
            />

            <Modal open={previewState.open} onClose={() => setPreviewState(prev => ({ ...prev, open: false }))}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '85vw',
                        maxWidth: 960,
                        height: '85vh',
                        bgcolor: 'background.paper',
                        borderRadius: '16px',
                        boxShadow: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box
                        sx={{
                            px: 3,
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e2e8f0'
                        }}
                    >
                        <Typography variant='h6' fontWeight={700}>
                            Confirmation Preview — {previewState.guestName}
                        </Typography>
                        <Button onClick={() => setPreviewState(prev => ({ ...prev, open: false }))}>Close</Button>
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        {previewState.loading ? (
                            <Box
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : (
                            <iframe
                                srcDoc={previewState.html}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title='Confirmed Package Preview'
                            />
                        )}
                    </Box>
                </Box>
            </Modal>
        </ContextMenuProvider>
    )
}

export default FinalPackageTable
