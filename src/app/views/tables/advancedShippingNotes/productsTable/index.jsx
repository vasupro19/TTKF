/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, memo } from 'react'
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

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import ProductTableForm from '@/app/views/forms/advancedShippingNotes/productTableForm'
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import CustomTooltip from '@/core/components/extended/CustomTooltip'

// ** import slices
import {
    asnItemDataTable,
    useRemoveAsnItemMutation,
    useAsnItemTemplateMutation,
    useUploadAsnItemTemplateMutation
} from '@/app/store/slices/api/asnSlice'
import { isEdit } from '@/constants'
import { objectLength } from '@/utilities'
import { getImage, headers } from './helper'

const ProductsFormTable = memo(props => {
    const { id: editId } = useParams()
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)
    const isOpen = useSelector(state => state.modal.open)
    const { removeAsnItemLKey, asnItemDataTableLKey } = useSelector(state => state.loading)

    const [removeAsnItem] = useRemoveAsnItemMutation()
    const [asnItemTemplate] = useAsnItemTemplateMutation()
    const [uploadAsnItemTemplate] = useUploadAsnItemTemplateMutation()
    // to get the clear all selected rows ref
    const clearSelectionRef = useRef(null)
    const [deleteId, setDeleteId] = useState()
    const [tableData, setTableData] = useState([])
    const [inputVal, setInputVal] = useState('')
    const [selectedRow, setSelectedRow] = useState([]) // selected checkbox
    const [refetch, setRefetch] = useState(false)
    const [reqStarted, setReqStarted] = useState(false)
    const [pages, setPages] = useState(0)
    const [filteredData, setFilteredData] = useState([])

    const [search, setSearch] = useState({
        value: '',
        regex: false
    })

    const queryHandler = async query => {
        if (reqStarted) return
        setReqStarted(true)
        const newQuery =
            props.config.asnId && !query.startsWith(`?id=${props.config.asnId}`)
                ? `?id=${props.config.asnId}&${query.replace('?', '')}`
                : query
        const { data: response } = await dispatch(
            asnItemDataTable.initiate(newQuery, { meta: { disableLoader: true } })
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
            const deleteResponse = await removeAsnItem(payload).unwrap()
            dispatch(closeModal())
            message = deleteResponse?.message || deleteResponse?.data?.message || 'removed scan item!'
            setRefetch(true)
            setTimeout(() => setRefetch(false))
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

    const getExcelTemplate = async () => asnItemTemplate().unwrap()
    const handleExcelUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)
        formData.append('asn_detail_id', props.config.asnId)
        formData.append('asn_type', props.asnData.asn_type)
        formData.append('challan_no', props.asnData.challan_no)
        formData.append('docket_no', props.asnData.docket_no)
        formData.append('driver_mobile_no', props.asnData.driver_mobile_no)
        formData.append('edd', props.asnData.edd)
        formData.append('expiry_date', props.asnData.expiry_date)
        formData.append('ext_asn_no', props.asnData.ext_asn_no)
        formData.append('freight_amount', props.asnData.freight_amount)
        formData.append('invoice_date', props.asnData.invoice_date)
        formData.append('invoice_no', props.asnData.invoice_no)
        formData.append('invoice_value', props.asnData.invoice_value)
        formData.append('manifest_no', props.asnData.manifest_no)
        formData.append('no_of_cases', props.asnData.no_of_cases)
        formData.append('po_no', props.asnData.po_no)
        formData.append('status', props.asnData.status?.label)
        formData.append('transport_method', props.asnData.transport_method)
        formData.append('vehicle_no', props.asnData.vehicle_no)
        formData.append('seal_no', props.asnData.seal_no)
        formData.append('vendor_code', props.asnData.vendor_code?.label.split('|')[0])
        let isError = false
        let message = ''
        try {
            const response = await uploadAsnItemTemplate(formData).unwrap()
            message = response.message
            if (response.data) {
                const { asnDetail } = response.data
                props.setConfig({ ...props.config, asnId: asnDetail.id, submit: true })
                // enable these two lines if dataTable needs be refreshed
                // setRefetch(true)
                // setTimeout(() => setRefetch(false))
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
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const handleClearInput = () => {
        setInputVal('')
        setSearch(prev => ({ ...prev, value: '' }))
    }

    const handleSearchChange = e => {
        const { value } = e.target
        setSearch({ ...search, value: value.trim() })
    }

    useEffect(() => {
        setFilteredData(tableData)
    }, [tableData])

    useEffect(() => {
        if (props.config.asnId) {
            setRefetch(true)
            setTimeout(() => setRefetch(false))
        }
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
                        {selectedRow?.length > 0 && (
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
                    data={filteredData}
                    columns={headers}
                    queryHandler={queryHandler}
                    totalRecords={pages}
                    reqKey='asnItemDataTableLKey'
                    globalSearch={search}
                    clearFilters={handleClearInput}
                    isCheckbox={props.config.canEdit}
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
                    showStripes={false}
                    isColumnsSearchable={false}
                    addFormRow
                    formRowComponent={
                        <ProductTableForm
                            setConfig={props.setConfig || false}
                            config={props.config}
                            asnData={props.asnData}
                            fetchASNItems={query => queryHandler(query)}
                        />
                    }
                    setSelectedRow={setSelectedRow}
                    isLoading={asnItemDataTableLKey}
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
                isLoading={removeAsnItemLKey}
            />
            {modalType === 'global_modal' && <CustomModal open={isOpen} />}
        </MainCard>
    )
})

export default ProductsFormTable
