import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Divider, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { Cancel, RemoveCircleOutlineOutlined } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import CustomButton from '@core/components/extended/CustomButton'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'

// import permission guard
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ** import utils
import { TOGGLE_ALL } from '@/constants'

// ** import from redux
import { openModal, closeModal } from '@app/store/slices/modalSlice'
import { useDispatch, useSelector } from 'react-redux'

// ** import sub-components
import { openSnackbar } from '@/app/store/slices/snackbar'

// ** import helper
import CustomSearchTextField from '@/core/components/extended/CustomSearchTextField'
import GlobalModal from '@/core/components/modals/GlobalModal'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import CustomMultiSelect from '@/core/components/CustomMultiSelect'
import TabsWithSlide from '@/core/components/TabsWithSlide'
import { getCustomSx } from '@/utilities'
import { getPickListItemLocationDataTable, getPickListSerialItemDataTable } from '@/app/store/slices/api/pickListSlice'
import { headers } from './helper'

function ViewPicklistTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { id: editId } = useParams()
    const { pickListStatus } = location.state || {}
    const { pickLocationDataTableLKey, pickSerialItemDataTableLKey } = useSelector(state => state.loading)

    const path = location.pathname
    const isEditPage = path.includes('/edit/')
    const customSx = getCustomSx()
    const modalType = useSelector(state => state.modal.type)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [rows, setRows] = useState([])
    const [columns, setColumns] = useState([...headers[0]])
    const [records, setRecords] = useState(0)
    const [excelHandler, setExcelHandler] = useState(false)

    const [tabVal, setTabVal] = useState(0)
    const [search, setSearch] = useState({
        value: '',
        regex: false
    })
    const [selectedOrders, setSelectedOrders] = useState([])
    const [orderError, setOrderError] = useState(false)
    const [activeModal, setActiveModal] = useState(null)

    const queryHandler = async query => {
        const newQuery = `${editId}${query}`
        let resData = []
        let resPageCount = 0
        if (tabVal) {
            const { data: response, error: reqError } = await dispatch(
                getPickListSerialItemDataTable.initiate(newQuery, false)
            )

            if (reqError) throw new Error(reqError?.data?.message || 'unable to get pick items')

            resData = [...response.data]
            resPageCount = response?.recordsTotal || 0
        } else {
            const { data: response, error: reqError } = await dispatch(
                getPickListItemLocationDataTable.initiate(newQuery, false)
            )

            if (reqError) throw new Error(reqError?.data?.message || 'unable to scan pick items')

            resData = [...response.data]
            resPageCount = response?.recordsTotal || 0
        }

        setRows(
            resData.map(loc => {
                const rowData = {
                    // id: loc?.id,
                    order_no: loc?.order_no ?? '-',
                    address: loc?.address ?? '-',
                    bin_no: loc?.bin_no ?? '-',
                    item_no: loc?.item_no ?? '-',
                    description: loc?.description ?? '-',
                    expected_picked_quantity: loc?.expected_picked_quantity || '0',
                    expected_quantity: loc?.expected_quantity || '0',
                    picked_quantity: loc?.picked_quantity || '0',
                    removed_quantity: loc?.removed_quantity || '0',
                    pna_quantity: loc?.pna_quantity || '0',
                    uid:
                        parseInt(loc?.uid, 10) > 100000000
                            ? `${loc?.uid.slice(0, 2)}****${loc?.uid.slice(-2)}`
                            : loc?.uid || '-',
                    // item_id: loc?.item_id || '-',
                    picker_id: loc?.picker_id ?? '-',
                    picked_at: loc?.picked_at ?? '-',
                    remarks: loc?.remarks ?? '-',
                    lot_no: loc?.lot_no ?? '-',
                    mfd_date: loc?.mfd_date ?? '-',
                    expiry_date: loc?.expiry_date ?? '-',
                    mrp: loc?.mrp ?? '-',
                    pick_bin: loc?.pick_bin ?? '-',
                    picker_name: loc?.picker_name ?? '-',
                    created_at: loc?.created_at ?? '-',
                    updated_at: loc?.updated_at ?? '-'
                }
                return rowData
            }) || []
        )

        setRecords(resPageCount || 0)
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

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        setColumns(headers[tabVal])
        // if (!isOpen) queryHandler(staticQuery)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabVal])

    const handleTabChange = (event, newValue) => {
        setTabVal(newValue)
    }

    const orderRemoveHandler = () => {
        setIsModalOpen(true)
    }

    useEffect(() => {
        if (!isModalOpen) {
            setSelectedOrders([])
            setOrderError(false)
            setActiveModal(null)
        }
    }, [isModalOpen])

    return (
        <MainCard content={false}>
            <Box sx={{ paddingTop: '2px' }}>
                {/* Add your dummy buttons here */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginBottom: 0.5
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            paddingTop: { xs: 2, sm: 0 },
                            width: '100%'
                        }}
                    >
                        <TabsWithSlide
                            labels={['SKU by Location', 'Item Id View']}
                            tabIndex={tabVal}
                            onTabChange={handleTabChange}
                        />
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='4px'>
                        {isEditPage && (
                            <CustomButton
                                variant='outlined'
                                startIcon={<RemoveCircleOutlineOutlined fontSize='small' color='error' />}
                                customStyles={{
                                    borderColor: 'primary.main'
                                }}
                                onClick={orderRemoveHandler}
                            >
                                Remove
                            </CustomButton>
                        )}
                        <CustomSearchTextField
                            search={search}
                            setSearch={setSearch}
                            placeholder='Search...'
                            customSx={{
                                '& .MuiInputBase-root': {
                                    height: '36px',
                                    width: '100%'
                                }
                            }}
                        />

                        {/* add your custom filters here */}
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                    </Stack>
                </Box>

                <DataTable
                    reqKey={tabVal ? 'pickSerialItemDataTableLKey' : 'pickLocationDataTableLKey'}
                    data={(pickListStatus === 'Open' || pickListStatus === 'Pendency') && tabVal === 1 ? [] : rows}
                    columns={columns}
                    queryHandler={queryHandler}
                    excelHandler={excelHandler}
                    totalRecords={records}
                    isCheckbox={false}
                    isLoading={pickSerialItemDataTableLKey || pickLocationDataTableLKey}
                    noDataText='Picking not started yet!'
                />
                {modalType === 'confirm_modal' &&
                    (activeModal === 'removedOrders' ? (
                        <ConfirmModal
                            title='Remove Orders'
                            message='Are you sure you want to remove all selected orders?'
                            icon='warning'
                            cancelText='Go Back'
                            confirmText='Yes, Remove'
                            customStyle={{ width: { xs: '320px', sm: '480px' } }}
                            onConfirm={() => {
                                dispatch(
                                    openSnackbar({
                                        open: true,
                                        message: 'Removed successfully!',
                                        variant: 'alert',
                                        alert: { color: 'info', icon: 'info' },
                                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                                    })
                                )
                                navigate('/outbound/pickList')
                                setIsModalOpen(false)
                                setSelectedOrders([])
                                dispatch(closeModal())
                            }}
                            btnContainerSx={{
                                flexDirection: 'row-reverse',
                                gap: 1,
                                justifyContent: 'end'
                            }}
                        />
                    ) : null)}

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
                        <Box sx={{ width: '100%', position: 'relative' }}>
                            <Typography variant='h4' component='div'>
                                Remove Orders
                            </Typography>
                            <CustomButton
                                onClick={() => {
                                    setIsModalOpen(false)
                                }}
                                customStyles={{
                                    mt: 2,
                                    position: 'absolute',
                                    top: '-28px',
                                    right: '-14px',
                                    width: 'min-content',
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
                            <Divider sx={{ borderColor: 'primary.main', marginTop: '2px' }} />
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 1,
                                    width: '100%'
                                }}
                            >
                                <CustomMultiSelect
                                    label='Select Orders'
                                    name='orders'
                                    options={[
                                        { label: 'SP-39323923', value: 'SP-39323923' },
                                        { label: 'SP-19288293', value: 'SP-19288293' },
                                        { label: 'SP-19182928', value: 'SP-19182928' },
                                        { label: 'SP-98798798', value: 'SP-98798798' },
                                        { label: 'SP-29383821', value: 'SP-29383821' }
                                    ]}
                                    value={selectedOrders || []}
                                    onChange={(event, newValue) => {
                                        setSelectedOrders(newValue)
                                        setOrderError(newValue.length === 0) // Remove error when an order is selected
                                    }}
                                    getOptionLabel={option => option.label}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    showAdornment={false}
                                    innerLabel
                                    customSx={{ ...customSx, width: 300, paddingTop: 2 }}
                                    helperText={
                                        orderError
                                            ? 'Please select at least one order'
                                            : 'You can select multiple orders'
                                    }
                                    error={orderError} // Display error state
                                    touched={orderError}
                                    showErrors={false} // it should be false when formik is not used
                                    placeholder='Search...'
                                />
                            </Box>
                            <Divider sx={{ borderColor: 'primary.main', marginTop: '2px' }} />
                            <Box sx={{ display: 'flex', paddingTop: 1, gap: 1, justifyContent: 'flex-end' }}>
                                <CustomButton
                                    variant='clickable'
                                    customStyles={{ height: '30px' }}
                                    onClick={() => {
                                        if (selectedOrders?.length > 0) {
                                            setActiveModal('removedOrders')
                                            dispatch(
                                                openModal({
                                                    type: 'confirm_modal'
                                                })
                                            )
                                            return
                                        }
                                        setOrderError(true)
                                    }}
                                >
                                    Remove
                                </CustomButton>
                                <CustomButton
                                    variant='outlined'
                                    customStyles={{ height: '30px' }}
                                    onClick={() => {
                                        setSelectedOrders([])
                                        setOrderError(false)
                                        setIsModalOpen(false)
                                    }}
                                >
                                    Go Back
                                </CustomButton>
                            </Box>
                        </Box>
                    </Box>
                </GlobalModal>
            </Box>
        </MainCard>
    )
}

export default ViewPicklistTable
