/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'
import { Autocomplete, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { RemoveCircleOutlineOutlined, Upload } from '@mui/icons-material'
import SearchIcon from '@mui/icons-material/Search'
import CancelIcon from '@mui/icons-material/Cancel'
import {
    orderItemDataTable,
    useOrderItemTemplateMutation,
    useRemoveOrderItemMutation,
    useUploadOrderItemTemplateMutation
} from '@/app/store/slices/api/orderSlice'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import ConfirmModal from '@/core/components/modals/ConfirmModal'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { isEdit, OUTBOUND_STATUS } from '@/constants'
import InputConfirmModal from '@/core/components/modals/InputConfirmModal'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import { objectLength } from '@/utilities'
import { setOrderId } from '@/app/store/slices/orderData'
import { headers } from './helper'

const customSx = {
    '& input': {
        backgroundColor: '#fff',
        padding: '8px'
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    }
}

const JobWorkProductTable = React.memo(props => {
    const { id: editId } = useParams()
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)
    const clearSelectionRef = useRef(null)
    const orderData = useSelector(state => state.orderData.orderDetails)

    const [tableData, setTableData] = useState([])
    const [inputVal, setInputVal] = useState('')
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    const [selectedItem, setSelectedItem] = useState(null)
    const [pages, setPages] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    // eslint-disable-next-line no-unused-vars
    const [columns, setColumns] = useState([...headers])
    const [currentQuery, setCurrentQuery] = useState('?start=0&length=10')
    const [reqStarted, setReqStarted] = useState(false)
    const [orderItemTemplate] = useOrderItemTemplateMutation()
    const [uploadOrderItemTemplate] = useUploadOrderItemTemplateMutation()
    const [removeOrderItem] = useRemoveOrderItemMutation()

    // ref and state related to confirmation modal
    const reasonRef = useRef(null)
    const bulkReasonRef = useRef(null)
    const [cancelError, setCancelError] = useState(false)
    const [bulkCancelError, setBulkCancelError] = useState(false)

    const cancellationReasons = [
        'Incorrect Product Added',
        'Product Out of Stock',
        'Customer Changed Mind',
        'Pricing Issue'
    ]

    // Memoized value for edit status to prevent unnecessary rerenders
    const isEditMode = useMemo(() => isEdit(editId), [editId])

    // function and component related to confirmation modal starts here
    const handleBulkConfirm = () => {
        const reason = bulkReasonRef.current?.value
        if (!reason) {
            setBulkCancelError(true)
            return
        }
        if (clearSelectionRef?.current) {
            clearSelectionRef.current()
        }
        dispatch(
            openSnackbar({
                open: true,
                message: 'Canceled successfully',
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        dispatch(closeModal())
    }

    const handleSingleConfirm = () => {
        const reason = reasonRef.current?.value
        let valid = true
        if (!reason) {
            setCancelError(true)
            valid = false
        }

        if (!valid) return
        dispatch(
            openSnackbar({
                open: true,
                message: `Product cancelled successfully`,
                variant: 'alert',
                alert: { color: 'info', icon: 'info' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        dispatch(closeModal())
    }

    const handleCancel = () => {
        if (bulkReasonRef.current) bulkReasonRef.current.value = ''
        if (reasonRef.current) reasonRef.current.value = ''
        setBulkCancelError(false)
        setCancelError(false)
        setSelectedItem(null)
        dispatch(closeModal())
    }

    const renderBulkAutocomplete = () => (
        <Autocomplete
            options={cancellationReasons}
            getOptionLabel={option => option}
            onChange={(event, newValue) => {
                if (bulkReasonRef.current) {
                    bulkReasonRef.current.value = newValue || ''
                }
                setBulkCancelError(!newValue)
            }}
            size='small'
            sx={{
                mb: 2
            }}
            renderInput={params => (
                <TextField
                    {...params}
                    label='Reason for Cancellation*'
                    variant='outlined'
                    error={bulkCancelError}
                    helperText={bulkCancelError ? 'Please select a reason' : ''}
                    inputRef={bulkReasonRef}
                    sx={customSx}
                />
            )}
        />
    )

    const renderSingleAutocomplete = () => (
        <Autocomplete
            options={cancellationReasons}
            getOptionLabel={option => option}
            onChange={(event, newValue) => {
                if (reasonRef.current) {
                    reasonRef.current.value = newValue || ''
                }
                setCancelError(!newValue)
            }}
            size='small'
            renderInput={params => (
                <TextField
                    {...params}
                    label='Reason for Cancellation*'
                    variant='outlined'
                    error={cancelError}
                    helperText={cancelError ? 'Please select a reason' : ''}
                    inputRef={reasonRef}
                    sx={customSx}
                />
            )}
        />
    )

    const queryHandler = async query => {
        if (reqStarted) return
        setReqStarted(true)
        const orderId = props.config?.orderId || orderData?.id || editId

        const newQuery =
            orderId && !query.startsWith(`?id=${orderId}`) ? `?id=${orderId}&${query.replace('?', '')}` : query

        setCurrentQuery(newQuery)
        const { data: response } = await dispatch(orderItemDataTable.initiate(newQuery))

        const formattedItems = response.data.map((loc, index) => ({
            id: loc.id || index,
            uid: (
                <Tooltip
                    title={loc.uid || loc.product_code || ''}
                    placement='bottom'
                    unselectable='on'
                    disableInteractive
                    arrow
                >
                    <Typography
                        sx={{
                            fontSize: '12px',
                            userSelect: 'none',
                            cursor: 'default'
                        }}
                    >
                        {loc.uid ? `${loc.uid.slice(0, 2)}****${loc.uid.slice(-2)}` : loc.product_code || ''}
                    </Typography>
                </Tooltip>
            ),
            uid_unmasked: loc.uid || loc.product_code || '',
            unit_price: loc.unit_cost ? `₹ ${loc.unit_cost}` : '-',
            lot: loc.lot_no || '-',
            discount: loc.discount_amount || '-',
            tax: loc.tax || '-',
            qualityCheck: (
                <Typography color={loc.qc_status ? 'secondary' : 'error'}>{loc.qc_status ? 'OK' : 'Reject'}</Typography>
            ),
            qcReason: loc.qc_reason || '',
            ...(isEditMode && {
                status: (
                    <ArrowButton
                        label={
                            <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                {OUTBOUND_STATUS[loc.status]?.label || 'Undefined'}
                            </Typography>
                        }
                        variant={OUTBOUND_STATUS[loc.status]?.variant || 'Undefined'}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                )
            })
        }))

        setTableData(formattedItems || [])
        setPages(response?.recordsTotal || 0)
        setReqStarted(false)
    }

    const deleteHandler = async (id, isArray = false) => {
        let isError = false
        let message
        const payload = {}

        if (isArray) {
            payload.resource = id.map(item => ({ id: item }))
        } else payload.resource = [{ id }]

        try {
            const deleteResponse = await removeOrderItem(payload).unwrap()
            message = deleteResponse?.message || deleteResponse?.data?.message || 'Removed order item!'
            queryHandler(currentQuery)
        } catch (error) {
            isError = true
            message = error?.message || 'Something went wrong!'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const getExcelTemplate = async () => {
        try {
            const formData = new FormData()

            if (isEditMode) {
                const orderType = props.config?.orderType || orderData?.order_type?.label || orderData?.order_type || ''

                formData.append('order_type', orderType)

                if (props.config.orderId) {
                    formData.append('order_detail_id', props.config.orderId)
                }
            } else {
                const orderType = orderData?.order_type?.label || orderData?.order_type || ''
                formData.append('order_type', orderType)
            }

            if (isEditMode) {
                formData.append('is_edit', 'true')
            }

            await orderItemTemplate(formData).unwrap()
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Failed to download template: ${error?.message || 'Unknown error'}`,
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const handleExcelUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)

        const orderType = orderData.order_type?.label || orderData.order_type || ''
        formData.append('order_type', orderType)

        if (isEditMode && props.config?.orderId) {
            formData.append('order_detail_id', props.config.orderId)
            formData.append('is_edit', 'true')
        }

        const extraFields = {
            bill_add1: orderData.bill_add1,
            bill_add2: orderData.bill_add2,
            bill_city: orderData.bill_city_id,
            bill_country: orderData.bill_country_id,
            bill_email: orderData.bill_email,
            bill_lat: orderData.bill_lat,
            bill_phone1: orderData.bill_phone1,
            bill_phone2: orderData.bill_phone2,
            bill_pincode: orderData.bill_pincode,
            bill_same_ship: orderData.bill_same_ship === 1 ? 'y' : 'n',
            bill_state: orderData.bill_state_id,
            bill_to_name: orderData.bill_to_name,
            carrier_code: orderData.carrier_name,
            channel_code: orderData.channel_code,
            currency: orderData.currency?.label || orderData.currency,
            customer_no: orderData.customer_name?.split('(')[0]?.trim(),
            discount_code: orderData.discount_code,
            external_order_id: orderData.external_order_id,
            fulfilled_by: orderData.fulfilled_by,
            gift_message: orderData.gift_message,
            gst_no: orderData.gst_no,
            invoice_no: orderData.invoice_no,
            is_gift: orderData.isGift ? '1' : '0',
            order_date: orderData.order_date,
            order_no: orderData.order_no,
            other_charges: orderData.other_charges,
            payment_mode: orderData.payment_mode?.label || orderData.payment_mode,
            priority: orderData.priority,
            remarks: orderData.remarks,
            ship_add1: orderData.ship_add1,
            ship_add2: orderData.ship_add2,
            ship_city: orderData.ship_city_id,
            ship_country: orderData.ship_country_id,
            ship_email: orderData.ship_email,
            ship_lat: orderData.ship_lat,
            ship_phone1: orderData.ship_phone1,
            ship_phone2: orderData.ship_phone2,
            ship_pincode: orderData.ship_pincode,
            ship_state: orderData.ship_state_id,
            ship_to_name: orderData.ship_to_name,
            shipment_mode: orderData.shipment_mode?.label || orderData.shipment_mode,
            shipping_charges: orderData.shipping_charges,
            status: orderData.status?.toString(),
            tabId: orderData.tabId,
            total_price: orderData.total_amount,
            total_discounts: orderData.total_discount,
            awb_no: orderData.tracking_no,
            transport_method: orderData.transport_mode?.split('(')[1]?.replace(')', '')?.trim()
        }

        Object.entries(extraFields).forEach(([key, value]) => {
            formData.append(key, value || '')
        })

        let isError = false
        let message = ''
        try {
            const response = await uploadOrderItemTemplate(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
            dispatch(setOrderId(response.data.orderDetail.id))
            queryHandler(currentQuery)
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

    const handleBulkImport = () => {
        setActiveModal('bulkUpload')
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleFileSubmission={file => handleExcelUpload(file)}
                        handleGetTemplate={() => getExcelTemplate(orderData)}
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                    />
                ),
                title: <Typography variant='h3'>Add Products</Typography>,
                modalType: 'global_modal'
            })
        )
    }

    const bulkCancelHandler = () => {
        setActiveModal('bulkCancel')
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const handleClearInput = () => {
        setInputVal('')
    }

    const handleInputChange = e => {
        setInputVal(e.target.value)
    }

    return (
        <MainCard content={false}>
            <Box
                sx={{
                    position: 'relative'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant='h3'>Add Items</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            px: 0.5,
                            py: 1,
                            pt: 0
                        }}
                    >
                        <TextField
                            value={inputVal}
                            onChange={handleInputChange}
                            placeholder='Search here...'
                            fullWidth
                            sx={{
                                '& input': {
                                    backgroundColor: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '4px !important',
                                    borderColor: '#2c2c2c !important'
                                },
                                width: '180px',
                                backgroundColor: '#fff',
                                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                    borderRadius: '4px !important',
                                    borderColor: '#2c2c2c !important',
                                    backgroundColor: 'white' // Apply the white background to the root element
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderRadius: '4px !important',
                                    borderColor: '#2c2c2c !important'
                                }
                            }}
                            InputProps={{
                                sx: { height: 30 },
                                endAdornment: inputVal ? (
                                    <IconButton onClick={handleClearInput} edge='end'>
                                        <CancelIcon sx={{ color: 'primary.main' }} fontSize='small' />
                                    </IconButton>
                                ) : (
                                    <SearchIcon fontSize='small' />
                                )
                            }}
                        />
                        <CustomButton
                            variant='outlined'
                            startIcon={<Upload fontSize='small' />}
                            customStyles={{
                                borderColor: 'primary.main',
                                padding: '2px 8px',
                                height: '30px'
                            }}
                            disabled={isEdit(editId) && !props.config.canScanItems}
                            onClick={handleBulkImport}
                        >
                            Upload
                        </CustomButton>
                        {selectedRow?.length > 0 && (
                            <CustomButton
                                variant='outlined'
                                startIcon={<RemoveCircleOutlineOutlined fontSize='small' color='error' />}
                                customStyles={{
                                    borderColor: 'primary.main',
                                    padding: '2px 8px',
                                    height: '30px'
                                }}
                                onClick={bulkCancelHandler}
                            >
                                {isEditMode ? 'Cancel' : 'Remove'}
                            </CustomButton>
                        )}
                    </Box>
                </Box>
                <DataTable
                    data={tableData}
                    columns={columns}
                    queryHandler={queryHandler}
                    isCheckbox
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <IconButton
                                sx={{ color: 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => deleteHandler(row.id)}
                                disabled={isEdit(editId) && !props.config.canScanItems}
                            >
                                <Tooltip title={isEditMode ? 'Cancel' : 'Remove'}>
                                    <RemoveCircleOutlineOutlined fontSize='8px' />
                                </Tooltip>
                            </IconButton>
                        </Box>
                    )}
                    totalRecords={pages}
                    showStripes={false}
                    isColumnsSearchable={false}
                    setSelectedRow={setSelectedRow}
                />
            </Box>
            {/* eslint-disable-next-line no-nested-ternary */}
            {activeModal === 'bulkCancel' ? (
                !isEditMode ? (
                    <ConfirmModal
                        title='Remove Product'
                        message={`Are you sure you want to cancel ${selectedRow?.length} ${selectedRow?.length > 1 ? 'products' : 'product'} from the list?`}
                        icon='warning'
                        confirmText='Yes, Remove'
                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                        onConfirm={async () => {
                            await deleteHandler(selectedRow, true)
                            if (clearSelectionRef?.current) {
                                clearSelectionRef?.current()
                            }
                            setSelectedRow([])
                            dispatch(closeModal())
                        }}
                    />
                ) : (
                    <InputConfirmModal
                        title={selectedRow?.length > 1 ? 'Cancel Products' : 'Cancel Product'}
                        message={`Please select a reason before permanently cancelling ${selectedRow?.length} ${selectedRow?.length > 1 ? 'products' : 'product'} from the list.`}
                        icon='warning'
                        confirmText={selectedRow?.length > 1 ? 'Cancel Products' : 'Cancel Product'}
                        cancelText='Back'
                        onConfirm={handleBulkConfirm}
                        onCancel={handleCancel}
                        childComponent={renderBulkAutocomplete()}
                    />
                )
            ) : activeModal === 'singleDelete' ? (
                <InputConfirmModal
                    title='Cancel Product'
                    message={
                        <Typography>
                            Please select a reason before cancelling{' '}
                            <b>{selectedItem?.uid_unmasked ?? 'the product'}</b>
                        </Typography>
                    }
                    icon='warning'
                    confirmText='Cancel Product'
                    cancelText='Back'
                    onConfirm={handleSingleConfirm}
                    onCancel={handleCancel}
                    childComponent={<Box mb={2}>{renderSingleAutocomplete()}</Box>}
                />
            ) : null}
            {modalType === 'global_modal' && activeModal === 'bulkUpload' && <CustomModal />}
        </MainCard>
    )
})

export default JobWorkProductTable

JobWorkProductTable.prototype = {
    // props: PropTypes.objectOf({

    // })
    // eslint-disable-next-line react/forbid-prop-types
    config: PropTypes.object,
    setConfig: PropTypes.func,
    poId: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    products: PropTypes.array
}
