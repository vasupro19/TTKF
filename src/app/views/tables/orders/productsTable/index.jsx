/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'
import {
    IconButton,
    TextField,
    Tooltip,
    Typography,
    styled,
    tooltipClasses,
    Box,
    FormControl,
    Autocomplete
} from '@mui/material'
import {
    RemoveCircleOutlineOutlined,
    Upload,
    Search as SearchIcon,
    Cancel as CancelIcon,
    InsertPhotoOutlined
} from '@mui/icons-material'

// Core components (assuming these are available in your app)
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import ProductTableForm from '@/app/views/forms/order/productTableForm'
import CustomTooltip from '@/core/components/extended/CustomTooltip'
import { setOrderId } from '@/app/store/slices/orderData'
import {
    orderItemDataTable,
    useOrderItemTemplateMutation,
    useRemoveOrderItemMutation,
    useUploadOrderItemTemplateMutation
} from '@/app/store/slices/api/orderSlice'

// Redux actions
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'

import { isEdit, OUTBOUND_STATUS } from '@/constants'
import CustomModal from '@/core/components/extended/CustomModal'
import InputConfirmModal from '@/core/components/modals/InputConfirmModal'
import ArrowButton from '@/core/components/arrowbutton/ArrowButton'
import { objectLength } from '@/utilities'
import { headers, getImage } from './helper'

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

const ProductsFormTable = React.memo(props => {
    const { id: editId } = useParams()
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)
    const clearSelectionRef = useRef(null)
    const orderData = useSelector(state => state.orderData.orderDetails)
    const isOpen = useSelector(state => state.modal.open)
    const { orderItemDataTableLKey, removeOrderItemLKey } = useSelector(state => state.loading)

    // State management
    const [tableData, setTableData] = useState([])
    const [inputVal, setInputVal] = useState('')
    const [selectedRow, setSelectedRow] = useState([])
    const [selectedItem, setSelectedItem] = useState(null)
    const [refetch, setRefetch] = useState(false)
    const [reqStarted, setReqStarted] = useState(false)
    const [pages, setPages] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    const [deleteId, setDeleteId] = useState()
    const [orderItemTemplate] = useOrderItemTemplateMutation()
    const [uploadOrderItemTemplate] = useUploadOrderItemTemplateMutation()
    const [removeOrderItem] = useRemoveOrderItemMutation()

    // ref and state related to confirmation modal
    const reasonRef = useRef(null)
    const bulkReasonRef = useRef(null)
    const quantityRef = useRef(null)
    const [cancelError, setCancelError] = useState(false)
    const [bulkCancelError, setBulkCancelError] = useState(false)
    const [quantityError, setQuantityError] = useState(false)
    const [globalSearch, setGlobalSearch] = useState({
        value: '',
        regex: false
    })
    const cancellationReasons = [
        'Incorrect Product Added',
        'Product Out of Stock',
        'Customer Changed Mind',
        'Pricing Issue'
    ]

    // Memoized value for edit status to prevent unnecessary rerenders
    const isEditMode = useMemo(() => isEdit(editId), [editId])

    const queryHandler = async query => {
        if (reqStarted) return
        setReqStarted(true)
        const newQuery =
            props.config.orderId && !query.startsWith(`?id=${props.config.orderId}`)
                ? `?id=${props.config.orderId}&${query.replace('?', '')}`
                : query

        const { data: response } = await dispatch(orderItemDataTable.initiate(newQuery, false))

        const updatedData = (response?.data || []).map(item => ({
            id: item.id || item.item_id,
            item_no: (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography
                        sx={{
                            color: 'text.dark',
                            fontWeight: '500',
                            fontSize: '12px',
                            maxWidth: '100px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {item?.item_no}
                    </Typography>
                    {item?.image && (
                        <CustomTooltip
                            title={
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <img
                                        src={getImage(item?.image || '[]')}
                                        alt={item.item_no}
                                        style={{
                                            width: '100px',
                                            height: 'auto',
                                            objectFit: 'cover',
                                            marginBottom: '8px',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <Typography variant='subtitle1' fontWeight='bold'>
                                        {item?.product_name}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' fontWeight='bold'>
                                        # {item.item_no}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {item.description_2}
                                    </Typography>
                                </Box>
                            }
                            arrow
                            placement='top'
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    justifyContent: 'center'
                                }}
                            >
                                <InsertPhotoOutlined />
                            </Box>
                        </CustomTooltip>
                    )}
                </Box>
            ),
            original_item_no: item?.item_no,
            description: item?.description_2,
            ean: item?.ean,
            quantity: item?.quantity,
            mrp: item?.mrp || '',
            sellingPrice: Number(item?.selling_price) || '',
            discount: item?.discount_amount,
            shelfLife: (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Typography
                        sx={{
                            color:
                                parseFloat(item?.shelf_life) < 10 &&
                                // eslint-disable-next-line no-restricted-globals
                                !isNaN(parseFloat(item?.shelf_life)) &&
                                'error.main',
                            fontSize: '12px',
                            textAlign: 'center'
                        }}
                    >
                        {item?.shelf_life || '-'}
                    </Typography>
                </Box>
            ),
            batch: <Box sx={{ display: 'flex', justifyContent: 'center' }}>{item?.lot_no}</Box>,
            tax: item?.tax,
            ...(isEditMode && {
                status: (
                    <ArrowButton
                        label={
                            <Typography variant='h6' sx={{ color: '#fff', fontSize: '12px' }}>
                                {OUTBOUND_STATUS[item.status]?.label || 'Undefined'}
                            </Typography>
                        }
                        variant={OUTBOUND_STATUS[item.status]?.variant || 'Undefined'}
                        nonClickable
                        customStyles={{ width: '100%' }}
                    />
                )
            })
        }))

        setTableData(updatedData || [])
        setPages(response?.recordsTotal || 0)
        setReqStarted(false)
    }

    const onModalConfirmHandleDelete = async (isArray = false) => {
        if (!deleteId) return
        let isError = false
        let message
        const payload = {}

        if (isArray) {
            payload.resource = deleteId.map(item => ({ id: item }))
        } else payload.resource = [{ id: deleteId }]

        try {
            const deleteResponse = await removeOrderItem(payload).unwrap()
            dispatch(closeModal())
            message = deleteResponse?.message || deleteResponse?.data?.message || 'Removed order item!'
            setRefetch(true)
            setTimeout(() => setRefetch(false))
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

    const deleteHandler = id => {
        setDeleteId(id)
        // const statusType = orderData?.status === 1 ? 'bulkCancel' : 'singleDelete'
        const statusType = orderData?.status === 1 || !orderData?.status ? 'bulkCancel' : 'singleDelete'
        setActiveModal(statusType)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
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

        if (!isEditMode && props.config?.orderId) {
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
            setRefetch(true)
            setTimeout(() => setRefetch(false))
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
        setDeleteId(selectedRow)
        // setActiveModal(orderData?.status === 1 ? 'bulkCancel' : 'singleDelete')
        setActiveModal(orderData?.status === 1 || !orderData?.status ? 'bulkCancel' : 'singleDelete')
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const handleClearInput = () => {
        setInputVal('')
        setGlobalSearch(prev => ({ ...prev, value: '' }))
    }

    const handleSearchChange = e => {
        const { value } = e.target
        setGlobalSearch({ ...globalSearch, value: value.trim() })
    }

    useEffect(() => {
        if (props.config.orderId) {
            queryHandler(`?id=${props.config.orderId}`)
        }
        if (props.config.orderId) {
            setRefetch(true)
            setTimeout(() => setRefetch(false))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.config, props.config.orderId])

    // const handleBulkConfirm = () => {
    //     const reason = bulkReasonRef.current?.value
    //     if (!reason) {
    //         setBulkCancelError(true)
    //         return
    //     }
    //     if (clearSelectionRef?.current) {
    //         clearSelectionRef.current()
    //     }
    //     setSelectedRow([])
    //     dispatch(
    //         openSnackbar({
    //             open: true,
    //             message: 'Canceled successfully',
    //             variant: 'alert',
    //             alert: { color: 'info', icon: 'info' },
    //             anchorOrigin: { vertical: 'top', horizontal: 'center' }
    //         })
    //     )
    //     dispatch(closeModal())
    // }

    const handleBulkConfirm = async () => {
        const reason = bulkReasonRef.current?.value
        if (!reason) {
            setBulkCancelError(true)
            return
        }
        await onModalConfirmHandleDelete(true)
    }

    const handleSingleConfirm = () => {
        const reason = reasonRef.current?.value
        const quantity = quantityRef.current?.value
        let valid = true
        if (!reason) {
            setCancelError(true)
            valid = false
        }
        if (!quantity || quantity <= 0) {
            setQuantityError(true)
            valid = false
        }
        if (!valid) return
        dispatch(
            openSnackbar({
                open: true,
                message: `Product cancelled successfully (Quantity: ${quantity})`,
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
        if (quantityRef.current) quantityRef.current.value = 1
        setBulkCancelError(false)
        setCancelError(false)
        setQuantityError(false)
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

    // Memoize the component to prevent unnecessary renders
    return useMemo(
        () => (
            <MainCard content={false}>
                <Box sx={{ position: 'relative' }}>
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
                                onChange={e => setInputVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearchChange(e)}
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
                                        backgroundColor: 'white'
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
                                // disabled={isEditMode}
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
                                    {orderData?.status === 1 || !orderData?.status ? 'Remove' : 'Cancel'}
                                </CustomButton>
                            )}
                        </Box>
                    </Box>
                    <DataTable
                        data={tableData}
                        columns={headers}
                        queryHandler={queryHandler}
                        reqKey='orderItemDataTableLKey'
                        isCheckbox={props.config.canScanItems || !props.config.canScanItems}
                        globalSearch={globalSearch}
                        clearFilters={handleClearInput}
                        refetch={refetch}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='delete row'
                                    onClick={() => deleteHandler(row.id)}
                                    // disabled={isEdit(editId) && !props.config.canScanItems}
                                >
                                    <Tooltip
                                        title={orderData?.status === 1 || !orderData?.status ? 'Remove' : 'Cancel'}
                                    >
                                        <RemoveCircleOutlineOutlined fontSize='8px' />
                                    </Tooltip>
                                </IconButton>
                            </Box>
                        )}
                        totalRecords={pages}
                        showStripes={false}
                        isColumnsSearchable={false}
                        addFormRow
                        formRowComponent={
                            <ProductTableForm
                                setConfig={props.setConfig || false}
                                config={props?.config}
                                poData={props?.poData}
                                products={props?.products}
                                fetchOrderItems={query => queryHandler(query)}
                            />
                        }
                        setSelectedRow={setSelectedRow}
                        isLoading={orderItemDataTableLKey}
                        clearSelectionRef={clearSelectionRef}
                    />
                </Box>
                {/* eslint-disable */}
                {activeModal === 'bulkCancel' ? (
                    isEditMode || orderData?.status === 1 || !orderData?.status ? (
                        <ConfirmModal
                            title='Remove Product'
                            message={`Are you sure you want to remove the product from the list?`}
                            icon='warning'
                            confirmText='Yes, Remove'
                            customStyle={{ width: { xs: '300px', sm: '456px' } }}
                            isLoading={removeOrderItemLKey}
                            onConfirm={onModalConfirmHandleDelete}
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
                                Please select a reason and quantity before cancelling{' '}
                                <b>{selectedItem?.item_no ?? 'the product'}</b> ({selectedItem?.description ?? ''})
                            </Typography>
                        }
                        icon='warning'
                        confirmText='Cancel Product'
                        cancelText='Back'
                        onConfirm={handleSingleConfirm}
                        onCancel={handleCancel}
                        childComponent={
                            <Box mb={2}>
                                {/* Quantity Input */}
                                <FormControl fullWidth error={quantityError} margin='normal' sx={{ marginBottom: 1.5 }}>
                                    <TextField
                                        inputRef={quantityRef}
                                        type='number'
                                        label='Quantity*'
                                        variant='outlined'
                                        defaultValue={1}
                                        inputProps={{ min: 1 }}
                                        onChange={() => setQuantityError(quantityRef.current.value <= 0)}
                                        error={quantityError}
                                        helperText={quantityError ? 'Please enter a valid quantity' : ''}
                                        sx={customSx}
                                        size='small'
                                    />
                                </FormControl>
                                {renderSingleAutocomplete()}
                            </Box>
                        }
                    />
                ) : null}
                {modalType === 'global_modal' && activeModal === 'bulkUpload' && <CustomModal open={isOpen} />}
            </MainCard>
        ),
        [
            tableData,
            inputVal,
            selectedRow,
            isEditMode,
            pages,
            props.config,
            handleClearInput,
            handleBulkImport,
            bulkCancelHandler,
            deleteHandler,
            queryHandler,
            dispatch,
            cancelError,
            bulkCancelError,
            quantityError
        ]
    )
})

ProductsFormTable.propTypes = {
    config: PropTypes.object,
    setConfig: PropTypes.func,
    orderId: PropTypes.number
    // products: PropTypes.array
}

export default ProductsFormTable
