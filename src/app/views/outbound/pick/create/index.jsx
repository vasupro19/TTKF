/* eslint-disable no-nested-ternary */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Divider, Typography, Button, debounce } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { closeModal, openModal } from '@/app/store/slices/modalSlice'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import OutboundCreatePickList from '@/app/views/tables/pick/outboundCreatePickList'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CustomTimePicker from '@/core/components/CutomTimePicker'
import CustomMultiSelect from '@/core/components/CustomMultiSelect'
import CustomDateRangePicker from '@/core/components/CustomDateRangePicker'
import { getCustomSx } from '@/utilities'
import { FilterAltOff, FilterAltOutlined, FilterList } from '@mui/icons-material'
import usePrompt from '@/hooks/usePrompt'
import CustomButton from '@/core/components/extended/CustomButton'
import CustomTextField from '@/core/components/extended/CustomTextField'
import dayjs from 'dayjs'
import { getpickListData, useCreatePickListMutation } from '@/app/store/slices/api/pickListSlice'
import { getCouriers, getChannels, getCustomers } from '@/app/store/slices/api/commonSlice'

// Default custom styles if none are provided externally
const customSx = getCustomSx()

/**
 * Index component renders the pick list view with multiple filters, summary card and modals
 *
 * @component
 * @returns {JSX.Element} The rendered component
 */

function Index() {
    usePrompt()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const modalType = useSelector(state => state.modal.type)
    const { getChannelsLKey, allocationDatatableLKey, getDataLKey, getCouriersLKey, getCustomersLKey } = useSelector(
        state => state.loading
    )

    const [channelOptions, setChannelOptions] = useState([])
    const [courierOptions, setCourierOptions] = useState([])

    const [activeModal, setActiveModal] = useState(null)
    const [filters, setFilters] = useState({
        orderType: null,
        shipmentMode: null,
        pickType: null,
        batchType: null,
        customer: null,
        vendor: null,
        sla: null,
        channels: null,
        courier: null,
        sellerId: '',
        cutOffTime: null,
        dateRange: null,
        customSLA: null,
        orderDate: null
    })
    const [touched, setTouched] = useState({})
    const clearSelectionRef = useRef(null)
    const [selectedRow, setSelectedRow] = useState([])
    const [tableData, setTableData] = useState([])
    const [dataHandler, setDataHandler] = useState(false)

    // State controls for dynamic filters
    const [includeCustomSLA, setIncludeCustomSLA] = useState(false)
    const [includeVendor, setIncludeVendor] = useState(false)
    const [customSLAError, setCustomSLAError] = useState(false)
    const [customSLAErrorText, setCustomSLAErrorText] = useState('please enter a valid value')
    const [isBatchTypeDisabled, setIsBatchTypeDisabled] = useState(true)
    const [orderTypeOptions, setOrderTypeOptions] = useState([])
    const [slaOptions, setSlaOptions] = useState([])
    const [shipmentMethods, setShipmentMethods] = useState({})
    const [customerOptions, setCustomerOptions] = useState([])
    const [createPickList] = useCreatePickListMutation()

    const resetFilters = () => {
        setFilters({
            orderType: null,
            shipmentMode: null,
            pickType: null,
            batchType: null,
            customer: null,
            vendor: null,
            sla: null,
            channels: null,
            courier: null,
            sellerId: '',
            cutOffTime: null,
            dateRange: null,
            customSLA: null,
            orderDate: null
        })
    }

    const prepareApiPayload = () => {
        const payload = {
            order_type: filters.orderType?.map(item => item.value) || [],
            shipment_mode: filters.shipmentMode?.map(item => item.value) || [],
            customer_no: filters.customer?.map(item => item.label) || [],
            courier_code: filters.courier?.map(item => item.label) || [],
            channel_code: filters.channels?.map(item => item.label) || [],
            sla: filters.customSLA ? filters.customSLA : filters.sla?.map(item => item.value) || [],
            batch_type: filters.batchType?.value?.toLowerCase() || null,
            dateRange: filters.dateRange
                ? `${dayjs(filters.dateRange[0]).format('YYYY/MM/DD')}~${dayjs(filters.dateRange[1]).format('YYYY/MM/DD')}`
                : null,
            cut_off_time: filters.cutOffTime ? dayjs(filters.cutOffTime).format('HH:mm:ss') : null,
            vendor: filters.vendor?.map(item => item.value) || [],
            seller: filters.sellerId || null,
            pick_method: filters.pickType?.value || null
        }

        Object.keys(payload).forEach(key => {
            if (payload[key] === null || (Array.isArray(payload[key]) && payload[key].length === 0)) {
                delete payload[key]
            }
        })

        return payload
    }

    const fetchAllocationData = async () => {
        const payload = prepareApiPayload()
        setTableData(payload)
        setDataHandler(true)
        setTimeout(() => setDataHandler(false), 1000)
    }

    const fetchPickListData = async () => {
        try {
            const { data: response } = await dispatch(getpickListData.initiate())

            if (response && response.success) {
                const formattedShipmentMethods = Object.entries(response.data.shipmentMethods).map(([label]) => ({
                    label,
                    value: label
                }))
                setShipmentMethods(formattedShipmentMethods)

                const formattedOrderTypes = response.data.orderTypes.map(type => ({ label: type, value: type }))
                setOrderTypeOptions(formattedOrderTypes)

                const formattedSLAOptions = response.data.sla.map(sla => ({ label: sla, value: sla }))
                setSlaOptions(formattedSLAOptions)
            } else {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: response?.message || 'Failed to fetch pick list data',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to fetch pick list data',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        } finally {
            // eslint-disable-next-line no-console
            console.log('error fetching data')
        }
    }

    const getChannelOptions = async callback => {
        const { data: response } = await dispatch(getChannels.initiate(null, { meta: { disableLoader: false } }))

        callback(response?.data || [])
    }

    const getCourierOptions = async callback => {
        const { data: response } = await dispatch(getCouriers.initiate(null, { meta: { disableLoader: false } }))

        callback(response?.data || [])
    }

    const getCustomerOptions = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getCustomers.initiate(request, { meta: { disableLoader: true } })
                )

                callback(response?.items || [])
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const baseFilterConfig = [
        {
            name: 'orderType',
            label: 'Order Type',
            options: orderTypeOptions || [],
            loading: !!getDataLKey
        },
        {
            name: 'shipmentMode',
            label: 'Shipment Mode',
            options: shipmentMethods || [],
            loading: !!getDataLKey
        },
        {
            name: 'pickType',
            label: 'Pick Type*',
            options: [
                { label: 'Order', value: 'DISCRETE' },
                { label: 'Batch', value: 'BATCH' }
            ]
        },
        {
            name: 'batchType',
            label: 'Batch Type',
            options: [
                { label: 'Single Item Order', value: 'single' },
                { label: 'Multi Item Order', value: 'multiple' }
            ]
        },
        {
            name: 'customer',
            label: 'Customer',
            options: customerOptions || [],
            loading: !!getCustomersLKey
        },
        {
            name: 'channels',
            label: 'Channels',
            options: channelOptions || [],
            loading: !!getChannelsLKey
        },
        {
            name: 'courier',
            label: 'Courier',
            options: courierOptions || [],
            loading: !!getCouriersLKey
        },
        {
            name: 'sla',
            label: 'SLA',
            options: slaOptions || [],
            loading: !!getDataLKey
        }
    ]

    const multiSelectFilters = ['channels', 'courier', 'sla', 'customer', 'vendor', 'shipmentMode', 'orderType']

    const handleFilterChange = (name, newValue) => {
        if (name === 'sla') {
            const selectedValues = newValue.map(item => item.value)

            if (selectedValues.includes('Custom')) {
                // Check if user is trying to combine Custom with other options
                if (selectedValues.length > 1) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'Custom SLA cannot be combined with other options',
                            variant: 'alert',
                            alert: { color: 'warning', icon: 'warning' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                }
                // Force selection to only Custom
                setFilters(prev => ({ ...prev, sla: [{ label: 'Custom', value: 'Custom' }] }))
            } else {
                // Remove Custom if present and select others
                setFilters(prev => ({
                    ...prev,
                    sla: newValue.filter(item => item.value !== 'Custom'),
                    customSLA: null
                }))
            }
        } else if (name === 'customSLA') {
            const sanitizedValue = newValue.toString().replace(/^0+/, '')

            if (sanitizedValue === '' || /^\d+$/.test(sanitizedValue)) {
                const numericValue = parseInt(sanitizedValue || '0', 10)

                if (numericValue > 60) {
                    setCustomSLAError(true)
                    setCustomSLAErrorText('Value must be 60 or less')
                } else {
                    setFilters(prev => ({ ...prev, [name]: sanitizedValue }))
                    setCustomSLAError(false)
                    setCustomSLAErrorText('please enter a valid value')
                }
            }
        } else {
            setFilters(prev => ({ ...prev, [name]: newValue }))
        }
    }

    const handleFilterBlur = name => {
        setTouched(prev => ({ ...prev, [name]: true }))
    }

    const executeFilterFetch = () => {
        fetchAllocationData()
        setSelectedRow([])
        if (clearSelectionRef?.current) {
            clearSelectionRef?.current()
        }
    }

    const handleApplyFilters = () => {
        if (!filters?.pickType) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Pick Type is required',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        if (includeCustomSLA && !filters?.customSLA) {
            setCustomSLAError(true)
            return
        }

        if (selectedRow?.length > 0) {
            setActiveModal('updateFilters')
            dispatch(
                openModal({
                    type: 'confirm_modal'
                })
            )
        } else {
            executeFilterFetch()
        }
    }

    const customSLAFilter = {
        name: 'customSLA',
        label: 'Custom SLA (in hours)'
    }

    const vendorFilter = {
        name: 'vendor',
        label: 'Vendor',
        options: [
            { label: 'Vendor A', value: 'VendorA' },
            { label: 'Vendor B', value: 'VendorB' },
            { label: 'Vendor C', value: 'VendorC' }
        ]
    }

    const filterConfig = useMemo(() => {
        const updatedFilters = [...baseFilterConfig]

        // Insert customSLA after the 'sla' filter
        if (includeCustomSLA) {
            const slaIndex = updatedFilters.findIndex(f => f.name === 'sla')
            if (slaIndex !== -1) {
                setCustomSLAError(false)
                setCustomSLAErrorText('please enter a valid value')
                updatedFilters.splice(slaIndex + 1, 0, customSLAFilter)
            }
        }

        if (includeVendor) {
            const customerIndex = updatedFilters.findIndex(f => f.name === 'customer')
            if (customerIndex !== -1) {
                updatedFilters.splice(customerIndex + 1, 0, vendorFilter)
            }
        }

        return updatedFilters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeCustomSLA, includeVendor, slaOptions, courierOptions, orderTypeOptions, shipmentMethods, channelOptions])

    const isCustomerDisabled = useMemo(() => {
        const orderTypes = filters.orderType
        if (!orderTypes || orderTypes.length === 0) return true

        const allowedTypes = ['B2C', 'PurchaseReturn', 'Exchange', 'Sample', 'Promotion']
        const onlyAllowed = orderTypes.every(item => allowedTypes.includes(item.value.trim()))
        return onlyAllowed
    }, [filters?.orderType])

    // Updated useEffect to check for array inclusion
    useEffect(() => {
        setIncludeCustomSLA(filters.sla?.some(item => item.value === 'Custom'))
    }, [filters.sla])

    useEffect(() => {
        setIncludeVendor(filters?.orderType?.some(item => item.value === 'PurchaseReturn'))
        if (isCustomerDisabled) {
            if (filters?.customer?.length > 0) {
                setFilters(prev => ({
                    ...prev,
                    customer: []
                }))
            }
        }
    }, [filters?.customer?.length, filters?.orderType, isCustomerDisabled])

    useEffect(() => {
        if (filters?.pickType?.value !== 'BATCH' || !filters?.pickType?.value) {
            setIsBatchTypeDisabled(true)
            setFilters(prev => ({
                ...prev,
                batchType: null
            }))
        } else {
            setIsBatchTypeDisabled(false)
        }
    }, [filters.pickType])

    useEffect(() => {
        fetchPickListData()
        getChannelOptions(data => setChannelOptions(data || []))
        getCourierOptions(data => setCourierOptions(data || []))
        getCustomerOptions(data => setCustomerOptions(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{
                px: '2px',
                py: 1,
                my: 1,
                border: '1px solid',
                borderColor: 'grey.borderLight',
                borderRadius: '8px',
                minHeight: '86vh'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    paddingX: 1,
                    marginY: 1
                }}
            >
                <Typography variant='h4' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterAltOutlined fontSize='medium' /> Select Filters
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {/* Clear Filters Button at End */}
                    {Object.values(filters).some(value => {
                        if (Array.isArray(value)) return value.length > 0 // Check if array is not empty
                        if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0 // Check if object is not empty
                        return !!value // Check for non-null/undefined/falsy values
                    }) && (
                        <Button
                            variant='outlined'
                            sx={{
                                color: 'error.main',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                            }}
                            startIcon={<FilterAltOff />}
                            onClick={() => {
                                resetFilters()
                                if (clearSelectionRef?.current) {
                                    clearSelectionRef?.current()
                                }

                                setSelectedRow([])
                            }}
                        >
                            Clear All Filters
                        </Button>
                    )}
                    <CustomButton
                        variant='clickable'
                        startIcon={<FilterList />}
                        onClick={handleApplyFilters}
                        loading={allocationDatatableLKey}
                        showTooltip={
                            !Object.values(filters).some(value => {
                                if (Array.isArray(value)) return value.length > 0 // Check if array is not empty
                                if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0 // Check if object is not empty
                                return !!value // Check for non-null/undefined/falsy values
                            })
                        }
                        tooltip='Please select a filter first'
                        disabled={
                            !Object.values(filters).some(value => {
                                if (Array.isArray(value)) return value.length > 0 // Check if array is not empty
                                if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0 // Check if object is not empty
                                return !!value // Check for non-null/undefined/falsy values
                            })
                        }
                    >
                        Apply Filters
                    </CustomButton>
                </Box>
            </Box>
            <Grid
                container
                gap={4}
                sx={{
                    px: 1
                }}
            >
                <Grid container spacing={1} sx={{ px: '4px' }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container item md={12} spacing={1.5} sx={{ px: '4px', py: 1.5 }}>
                            {filterConfig.map(filter => (
                                <Grid item xs={12} sm={6} md={2} key={filter.name}>
                                    {multiSelectFilters.includes(filter.name) ? (
                                        <CustomMultiSelect
                                            label={filter.label}
                                            name={filter.name}
                                            options={filter.options}
                                            value={filters?.[filter.name] || []}
                                            onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                            loading={filter.loading}
                                            getOptionLabel={option => option.label} // Update this according to your option structure
                                            isOptionEqualToValue={(option, value) => option.value === value.value}
                                            showAdornment={false}
                                            // Optional props:
                                            innerLabel
                                            customSx={customSx}
                                            placeholder='Search...'
                                            // Use the same disable condition as customer or a separate one if needed
                                            isDisabled={filter.name === 'customer' && isCustomerDisabled}
                                            header={
                                                filter.name === 'customer'
                                                    ? 'This will only get applied to B2B order type'
                                                    : 'This will only apply to Purchase Return order type '
                                            } // custom header prop
                                            showHeader={filter.name === 'customer' || filter.name === 'vendor'} // boolean to show header in the menu
                                        />
                                    ) : filter.name === 'customSLA' ? ( // Add this condition
                                        <CustomTextField
                                            label={filter?.label}
                                            value={filters?.customSLA}
                                            onChange={newValue => handleFilterChange('customSLA', newValue)}
                                            type='number'
                                            size='small'
                                            name='customSLA'
                                            placeholder='eg: 12'
                                            animateGlow
                                            error={customSLAError}
                                            errorText={customSLAErrorText}
                                        />
                                    ) : (
                                        <CustomAutocomplete
                                            name={filter.name}
                                            label={filter.label}
                                            options={filter.options}
                                            value={filters[filter.name]}
                                            onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                            onBlur={() => handleFilterBlur(filter.name)}
                                            touched={touched[filter.name]}
                                            setFieldValue={(name, value) => handleFilterChange(name, value)}
                                            setFieldTouched={name => handleFilterBlur(name)}
                                            showAdornment={false}
                                            clearValFunc={() => handleFilterChange(filter.name, null)}
                                            customSx={customSx}
                                            placeholder='Search here...'
                                            isDisabled={filter.name === 'batchType' && isBatchTypeDisabled}
                                        />
                                    )}
                                </Grid>
                            ))}
                            <Grid item xs={12} sm={6} md={2}>
                                <CustomTextField
                                    label='Seller'
                                    value={filters.sellerId}
                                    onChange={newValue => handleFilterChange('sellerId', newValue)}
                                    type='text'
                                    size='small'
                                    name='sellerId'
                                    placeholder='Enter Seller ID'
                                    animateGlow
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <CustomTimePicker
                                    label='Cut Off Time'
                                    value={filters.cutOffTime}
                                    onChange={newValue => handleFilterChange('cutOffTime', newValue)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <CustomDateRangePicker
                                    dateRange={filters.dateRange || null}
                                    onDateRangeChange={newRange => handleFilterChange('dateRange', newRange)}
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-1.5rem',
                            marginBottom: '0.2rem',
                            boxShadow: '1px 1px 4px rgba(0, 0, 0, 0.15)'
                        }}
                    />
                    <OutboundCreatePickList
                        selectedRow={selectedRow}
                        setSelectedRow={setSelectedRow}
                        clearSelectionRef={clearSelectionRef}
                        showTooltip={Object.values(filters).some(value => {
                            if (Array.isArray(value)) return value.length > 0
                            if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0
                            return !!value
                        })}
                        dataHandler={dataHandler}
                        tableData={tableData}
                        filters={filters}
                        openSnackbar={openSnackbar}
                        createPickList={createPickList}
                        navigate={navigate}
                        dayjs={dayjs}
                    />
                </Grid>
            </Grid>
            {modalType === 'confirm_modal' && activeModal === 'updateFilters' && (
                <ConfirmModal
                    title='Update Filters'
                    message='Are you sure? all the selected orders will be lost'
                    icon='alert'
                    confirmText='Update Filters'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={() => {
                        executeFilterFetch()
                        dispatch(closeModal())
                    }}
                />
            )}
        </MainCard>
    )
}

export default Index
