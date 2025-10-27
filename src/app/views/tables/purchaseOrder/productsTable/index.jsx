/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router-dom'
import { IconButton, Tooltip, Typography } from '@mui/material'
import Box from '@mui/material/Box'
import { InsertPhotoOutlined, RemoveCircleOutlineOutlined, Upload } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import CustomModal from '@core/components/extended/CustomModal'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import ProductTableForm from '@/app/views/forms/purchaseOrder/productTableForm'
import CustomTooltip from '@/core/components/extended/CustomTooltip'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import {
    purchaseOrderItemDataTable,
    useRemovePurchaseOrderItemMutation,
    usePurchaseOrderItemTemplateMutation,
    useUploadPurchaseOrderItemTemplateMutation
} from '@/app/store/slices/api/purchaseOrderSlice'

import { objectLength } from '@/utilities'
import { isEdit } from '@/constants'
import { headers, getImage } from './helper'

const ProductsFormTable = React.memo(props => {
    const { id: editId } = useParams()
    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.modal.open)
    const modalType = useSelector(state => state.modal.type)
    const { removePurchaseOrderItemLKey, purchaseOrderItemDataTableLKey } = useSelector(state => state.loading)

    // to get the clear all selected rows ref
    const clearSelectionRef = useRef(null)

    const [removePurchaseOrderItem] = useRemovePurchaseOrderItemMutation()
    const [purchaseOrderItemTemplate] = usePurchaseOrderItemTemplateMutation()
    const [uploadPurchaseOrderItemTemplate] = useUploadPurchaseOrderItemTemplateMutation()

    const [tableData, setTableData] = useState([])
    const [deleteId, setDeleteId] = useState()
    const [inputVal, setInputVal] = useState('')
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    const [currentQuery, setCurrentQuery] = useState('?start=0&length=10')
    const [reqStarted, setReqStarted] = useState(false)
    const [pages, setPages] = useState(0)
    const [globalSearch, setGlobalSearch] = useState({
        value: '',
        regex: false
    })

    const queryHandler = async query => {
        if (reqStarted) return
        setReqStarted(true)
        const newQuery =
            editId && !query.startsWith(`?id=${editId}`) ? `?id=${editId}&${query.replace('?', '')}` : query
        setCurrentQuery(newQuery)
        const { data: response } = await dispatch(
            purchaseOrderItemDataTable.initiate(newQuery, { meta: { disableLoader: true } })
        )
        setTableData(
            response?.data.map(item => {
                const tempItem = { ...item }
                tempItem.original_item_no = tempItem.item_no
                tempItem.item_no = (
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
                            {tempItem.item_no}
                        </Typography>
                        <CustomTooltip
                            title={
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        maxHeight: '300px', // Maximum height for the tooltip
                                        overflowY: 'auto' // Enable vertical scrolling
                                    }}
                                >
                                    <img
                                        src={getImage(tempItem?.image || '[]')}
                                        alt={tempItem.item_no}
                                        style={{
                                            width: '100px',
                                            height: 'auto',
                                            objectFit: 'cover',
                                            marginBottom: '8px',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <Typography variant='subtitle1' fontWeight='bold'>
                                        {tempItem?.product_name}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary' fontWeight='bold'>
                                        # {tempItem.item_no}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {tempItem.description_2}
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
                                    justifyContent: 'center',
                                    gap: 1
                                }}
                            >
                                <InsertPhotoOutlined />
                            </Box>
                        </CustomTooltip>
                    </Box>
                )

                return tempItem
            }) || []
        )
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
        } else payload.resource = [{ deleteId }]
        try {
            const deleteResponse = await removePurchaseOrderItem(payload).unwrap()
            dispatch(closeModal())
            message = deleteResponse?.message || deleteResponse?.data?.message || 'removed scan item!'
            queryHandler(currentQuery)
        } catch (error) {
            isError = true
            message = error?.message || 'something went wrong!'
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
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const getExcelTemplate = async () => purchaseOrderItemTemplate().unwrap()

    const handleExcelUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)
        formData.append('po_detail_id', props.config.poId)
        formData.append('vendor_code', props.poData.code)
        formData.append('edd', props.poData.edd)
        formData.append('total_qty', props.poData.total_qty)
        formData.append('remaining_qty', props.poData.remaining_qty)
        formData.append('received_qty', props.poData.received_qty)
        formData.append('po_type', props.poData.po_type?.label)
        formData.append('ext_po_no', props.poData.ext_po_no)
        formData.append('expiry_date', props.poData.expiry_date)
        formData.append('vendor_name', props.poData.vendor_name)

        let isError = false
        let message = ''
        try {
            const response = await uploadPurchaseOrderItemTemplate(formData).unwrap()
            message = response.message
            if (response.data) {
                const { poDetail } = response.data
                props.setConfig({ ...props.config, poId: poDetail.id, submit: true })
                // await queryHandler(currentQuery)
            }
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
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
        dispatch(
            openModal({
                content: (
                    <ImportFileModal
                        handleFileSubmission={file => handleExcelUpload(file)}
                        // sampleFilePath='/csv/inbound/poProducts.csv'
                        isDownloadSample
                        fileType={{
                            'text/csv': ['.csv'],
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                        }}
                        handleGetTemplate={getExcelTemplate}
                    />
                ),
                title: <Typography variant='h3'>Add Products</Typography>
            })
        )
    }

    const bulkDeleteHandler = () => {
        setDeleteId(selectedRow)
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const handleClearInput = () => {
        setInputVal('')
        setGlobalSearch(prev => ({ ...prev, value: '' }))
        // setFilteredData(tableData)
    }

    const handleSearchChange = e => {
        const { value } = e.target
        setGlobalSearch({ ...globalSearch, value: value.trim() })
    }

    useEffect(() => {
        if (props.config.poId) queryHandler(currentQuery)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.config])

    return (
        <MainCard content={false}>
            <Box>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 0.5,
                        py: 1,
                        pt: 0
                    }}
                >
                    <Typography variant='h3'>Add Products</Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        {selectedRow?.length > 0 && (!isEdit(editId) || props.config.canEdit) && (
                            <CustomButton
                                variant='outlined'
                                startIcon={<RemoveCircleOutlineOutlined fontSize='small' color='error' />}
                                customStyles={{
                                    borderColor: 'primary.main',
                                    padding: '2px 8px',
                                    height: '30px'
                                }}
                                onClick={bulkDeleteHandler}
                            >
                                Remove
                            </CustomButton>
                        )}
                        <CustomSearchTextField
                            placeholder='Search here...'
                            inputPropsSx={{ height: '32px' }}
                            search={inputVal}
                            onKeyDownCustom={handleSearchChange}
                            onClear={handleClearInput}
                        />
                        <CustomButton
                            variant='outlined'
                            startIcon={<Upload fontSize='small' />}
                            customStyles={{
                                borderColor: 'primary.main',
                                padding: '2px 8px',
                                height: '30px'
                            }}
                            disabled={isEdit(editId) && !props.config.canEdit}
                            onClick={handleBulkImport}
                        >
                            Upload
                        </CustomButton>
                    </Box>
                </Box>
                <DataTable
                    data={tableData}
                    columns={headers}
                    queryHandler={queryHandler}
                    reqKey='purchaseOrderItemDataTableLKey'
                    isCheckbox={props.config.canEdit}
                    globalSearch={globalSearch}
                    clearFilters={handleClearInput}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <IconButton
                                sx={{ color: 'error.main' }}
                                size='small'
                                aria-label='delete row'
                                onClick={() => deleteHandler(row.id)}
                                disabled={isEdit(editId) && !props.config.canEdit}
                            >
                                <Tooltip title='Remove'>
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
                            config={props.config}
                            poData={props.poData}
                            fetchPOItems={query => queryHandler(query)}
                        />
                    }
                    // tabsFields={tabsFields}
                    // formSubmitHandler={formHandler}
                    setSelectedRow={setSelectedRow}
                    isLoading={purchaseOrderItemDataTableLKey}
                    clearSelectionRef={clearSelectionRef}
                />
            </Box>
            {/* confirm before delete */}
            <ConfirmModal
                title='Remove Product'
                message='Are you sure you want to remove this product from the list?'
                icon='warning'
                confirmText='Yes, Remove'
                customStyle={{ width: { xs: '300px', sm: '456px' } }}
                onConfirm={onModalConfirmHandleDelete}
                isLoading={removePurchaseOrderItemLKey}
            />
            {modalType === 'global_modal' && <CustomModal open={isOpen} />}
        </MainCard>
    )
})

export default ProductsFormTable

ProductsFormTable.prototype = {
    // eslint-disable-next-line react/forbid-prop-types
    config: PropTypes.object,
    setConfig: PropTypes.func,
    poId: PropTypes.number
}
