import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// MUI Imports
import { Box, Stack, IconButton, Tooltip, Typography, Chip, TextField, Divider } from '@mui/material'
import { Edit, AccountBalanceWallet, Hotel, LocalTaxi, FilterAltOff } from '@mui/icons-material'

// Project Core Components
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import ToggleColumns from '@/core/components/ToggleColumns'

// Store & API Actions
import { openSnackbar } from '@app/store/slices/snackbar'
import { closeModal } from '@app/store/slices/modalSlice'
import {
    getConfirmedServices,
    useUpdateConfirmedServiceMutation,
    usePaySupplierMutation
} from '@/app/store/slices/api/confirmedService' // Adjust based on your actual slice path

import { TOGGLE_ALL } from '@/constants'
import { ledgerHeaders } from './helper'
import SupplierPaymentModal from '../../../../core/components/modals/SupplierPaymentModal'

function ServiceLedgerTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    // States
    const [services, setServices] = useState([])
    const [columns, setColumns] = useState([...ledgerHeaders])
    const [totalRecords, setTotalRecords] = useState(0)
    const [refetch, setRefetch] = useState(false)
    const [paymentModal, setPaymentModal] = useState({ open: false, data: null })

    // Filters
    const [search, setSearch] = useState({ value: '', regex: false })
    const [filters, setFilters] = useState({ created_at: { from: '', to: '' } })
    const [isShowClearButton, setIsShowClearButton] = useState(false)

    // API Mutations
    // const [updateService] = useUpdateConfirmedServiceMutation()
    const [paySupplier, { isLoading: isPaying }] = usePaySupplierMutation()

    // 1. Fetch Data & Calculate Balance
    const queryHandler = async queryString => {
        const { data: response } = await dispatch(getConfirmedServices.initiate(queryString, false))
        const formatted =
            response?.data?.map(item => ({
                ...item,
                // Map backend 'businessname' to 'supplierName' for the table
                supplierName: item.supplier?.businessname || 'N/A',
                // Map backend 'lead.fullName' to 'guestName'
                guestName: item.package?.lead?.fullName || 'N/A',
                // Calculate balance on the fly
                balance: (item.cost - (item.paidAmount || 0)).toFixed(2)
            })) || []

        setServices(formatted)
        setTotalRecords(response?.recordsTotal || 0)
    }

    // 2. Handle Payment Update
    // Change this function to accept the 'formData' from the modal
    const handleAddPayment = async formData => {
        const { data } = paymentModal // 'data' is the row info we stored when opening

        try {
            await paySupplier({
                confirmedServiceId: data.id,
                supplierId: data.supplierId,
                amount: parseFloat(formData.amount),
                method: formData.paymentMethod,
                transactionId: formData.transactionId,
                paymentDate: formData.paymentDate,
                remarks: formData.remarks || `Payment for ${data.type} - Guest: ${data.guestName}`
            }).unwrap()

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Supplier payment recorded successfully!',
                    variant: 'alert',
                    alert: { color: 'success' }
                })
            )

            // Close modal and refresh
            setPaymentModal({ open: false, data: null })
            setRefetch(true)
            setTimeout(() => setRefetch(false), 500)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Failed to record supplier payment',
                    variant: 'alert',
                    alert: { color: 'error' }
                })
            )
        }
    }

    const handleCheckToggle = key => {
        setColumns(
            columns.map(item =>
                // eslint-disable-next-line no-nested-ternary
                key === TOGGLE_ALL
                    ? { ...item, visible: true }
                    : item.key === key
                      ? { ...item, visible: !item.visible }
                      : item
            )
        )
    }

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Typography variant='h3'>Transaction Ledger</Typography>
                <Stack direction='row' spacing={2} alignItems='center'>
                    {isShowClearButton && (
                        <CustomButton
                            variant='text'
                            startIcon={<FilterAltOff />}
                            color='error'
                            onClick={() => setRefetch(true)}
                        >
                            Clear
                        </CustomButton>
                    )}
                    <CustomSearchTextField search={search} setSearch={setSearch} placeholder='Search Suppliers...' />
                    <ToggleColumns columns={columns} handler={handleCheckToggle} />
                </Stack>
            </Box>

            {/* Data Table */}
            <DataTable
                data={services}
                columns={columns}
                queryHandler={queryHandler}
                refetch={refetch}
                globalSearch={search}
                globalFilters={filters}
                totalRecords={totalRecords}
                renderAction={row => (
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title='Add Payment'>
                            <IconButton
                                size='small'
                                color='primary'
                                disabled={row.paymentStatus === 'Fully Paid'}
                                onClick={() => setPaymentModal({ open: true, data: row, amount: '' })}
                            >
                                <AccountBalanceWallet fontSize='small' />
                            </IconButton>
                        </Tooltip>
                        {/* <IconButton size='small' onClick={() => navigate(`/services/edit/${row.id}`)}>
                            <Edit fontSize='small' />
                        </IconButton> */}
                    </Box>
                )}
                // Custom Cell Rendering for Type and Status
                customCellRender={{
                    // eslint-disable-next-line react/no-unstable-nested-components
                    type: row => (
                        <Stack direction='row' spacing={1} alignItems='center'>
                            {row.type === 'Hotel' ? (
                                <Hotel color='primary' fontSize='small' />
                            ) : (
                                <LocalTaxi color='secondary' fontSize='small' />
                            )}
                            <Typography variant='body2'>{row.type}</Typography>
                        </Stack>
                    ),
                    // eslint-disable-next-line react/no-unstable-nested-components
                    paymentStatus: row => (
                        <Chip
                            label={row.paymentStatus}
                            size='small'
                            color={
                                // eslint-disable-next-line no-nested-ternary
                                row.paymentStatus === 'Fully Paid'
                                    ? 'success'
                                    : row.paymentStatus === 'Partially Paid'
                                      ? 'warning'
                                      : 'error'
                            }
                        />
                    )
                }}
            />

            {/* Payment Modal */}
            <SupplierPaymentModal
                open={paymentModal.open}
                row={paymentModal.data}
                isLoading={isPaying}
                onClose={() => setPaymentModal({ open: false, data: null })}
                onSave={handleAddPayment}
            />
        </MainCard>
    )
}

export default ServiceLedgerTable
