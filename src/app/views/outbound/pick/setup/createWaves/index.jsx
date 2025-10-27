/* eslint-disable no-nested-ternary */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Grid, Divider, Typography, Button } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { debounce } from '@mui/material/utils'

import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import CustomTimePicker from '@/core/components/CutomTimePicker'
import { getCustomSx } from '@/utilities'
import { AccessAlarm, FilterAltOff, FilterAltOutlined } from '@mui/icons-material'
import CustomButton from '@/core/components/extended/CustomButton'
import NotesInstructions from '@/core/components/NotesInstructions'
import usePrompt from '@/hooks/usePrompt'
import CustomMultiSelect from '@/core/components/CustomMultiSelect'
import CustomTextField from '@/core/components/extended/CustomTextField'
import {
    useCreatePickWaveMutation,
    useUpdatePickWaveMutation,
    getData,
    getPickWave
} from '@/app/store/slices/api/pickWaveSlice'
import { getCouriers, getChannels, getCustomers } from '@/app/store/slices/api/commonSlice'
import { IST_STRING_TIME_TO_DATE, IST_TIME_STRING } from '@/constants'

// Default custom styles if none are provided externally
const customSx = getCustomSx()

const notes = [
    {
        id: 'n1',
        text: 'Select the required filters such as Order Type, Order Mode, Pick Type, Customer, SLA, Channels, and more.'
    },
    {
        id: 'n2',
        text: 'You can clear all selected filters by clicking the "Clear All Filters" button, which will reset the form.'
    },
    { id: 'n3', text: 'Ensure all necessary filters are selected before proceeding to scheduling.' },
    {
        id: 'n4',
        text: 'Set the "Scheduled Time" using the time picker. This is a mandatory field and must be provided before scheduling.'
    },
    { id: 'n5', text: 'Click the "Schedule" button to finalize the pick list. Make sure the scheduled time is set.' },
    {
        id: 'n6',
        text: 'If the scheduled time is missing, an alert will notify you to enter a valid time before proceeding.'
    },
    { id: 'n7', text: 'After scheduling, a confirmation message will be displayed, indicating a successful schedule.' }
]

/**
 * Index component renders the pick list view with multiple filters, summary card and modals
 *
 * @component
 * @returns {JSX.Element} The rendered component
 */
function Index() {
    usePrompt()
    const { id: editId } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { getDataLKey, getCouriersLKey, getChannelsLKey, getCustomersLKey, createPickWaveLKey, updatePickWaveLKey } =
        useSelector(state => state.loading)
    const [createPickWave] = useCreatePickWaveMutation()
    const [updatePickWave] = useUpdatePickWaveMutation()
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
        sellerId: null,
        cutOffTime: null,
        // dateRange: null,
        customSLA: null,
        orderDate: null
    })
    const [touched, setTouched] = useState({})
    const [scheduledTime, setScheduledTime] = useState(null)

    // State controls for dynamic filters
    const [includeCustomSLA, setIncludeCustomSLA] = useState(false)
    const [includeVendor, setIncludeVendor] = useState(false)
    const [customSLAError, setCustomSLAError] = useState(false)
    const [customSLAErrorText, setCustomSLAErrorText] = useState('please enter a valid value')
    const [isBatchTypeDisabled, setIsBatchTypeDisabled] = useState(true)
    const [wave, setWave] = useState(null)

    const [isAnimate, setIsAnimate] = useState(false)

    const [dropDownData, setDropDownData] = useState({
        couriers: [],
        channels: [],
        orderTypes: [],
        shipmentMethod: [],
        sla: [],
        customers: [],
        sellerId: [
            { label: 'Seller 1 (DAI879879)', value: 'Seller 1 (DAI879879)' },
            { label: 'Seller 2 (CSJD98792)', value: 'Seller 2 (CSJD98792)' },
            { label: 'Seller 3 (NSI889883)', value: 'Seller 3 (NSI889883)' }
        ],
        pickType: [
            { label: 'Order', value: 'Order' },
            { label: 'Batch', value: 'Batch' }
        ]
    })

    const baseFilterConfig = ({
        couriers = [],
        channels = [],
        orderTypes = [],
        sla = [],
        shipmentMethod = [],
        customers = [],
        sellerId = [],
        pickType = []
    }) => [
        {
            name: 'orderType',
            label: 'Order Type',
            options: orderTypes || [],
            loading: !!getDataLKey
        },
        {
            name: 'shipmentMode',
            label: 'Shipment Mode',
            options: shipmentMethod || [],
            loading: !!getDataLKey
        },
        {
            name: 'pickType',
            label: 'Pick Type',
            options: pickType
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
            options: customers || [],
            loading: !!getCustomersLKey
        },
        {
            name: 'channels',
            label: 'Channels',
            options: channels || [],
            loading: !!getChannelsLKey
        },
        {
            name: 'courier',
            label: 'Courier',
            options: couriers || [],
            loading: !!getCouriersLKey
        },
        {
            name: 'sla',
            label: 'SLA',
            options: sla || [],
            loading: !!getDataLKey
        },
        {
            name: 'sellerId',
            label: 'Seller',
            options: sellerId
        },
        {
            name: 'orderDate',
            label: 'Order Date',
            options: [
                { label: 'Current Day', value: 'currentDay' },
                { label: 'One Day Before', value: 'oneDayBefore' }
            ]
        }
    ]

    const multiSelectFilters = [
        'channels',
        'courier',
        'sla',
        'customer',
        'vendor',
        'shipmentMode',
        'orderType',
        'sellerId'
    ]

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
                    sla: newValue.filter(item => item.value !== 'Custom')
                }))
            }
        } else if (name === 'customSLA') {
            // Convert value to a string to avoid unexpected type issues
            const sanitizedValue = newValue.toString().replace(/^0+/, '') // Remove leading zeros

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

    // eslint-disable-next-line no-unused-vars
    const handleInputChange = (name, newInputVal) => {
        // Optional: Handle input change if needed for searchable dropdowns
    }

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
            sellerId: null,
            cutOffTime: null,
            // dateRange: null,
            customSLA: null,
            orderDate: null
        })
        setScheduledTime(null)
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
        const updatedFilters = [...baseFilterConfig({ ...dropDownData })]
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
    }, [includeCustomSLA, includeVendor, dropDownData])

    // Check if Customer (and Vendor) should be disabled based on orderType
    // Conditions:
    // 1. Only B2C Type is selected
    // 2. Only PurchaseReturn is selected
    // 3. Both B2C and PurchaseReturn are selected
    // 4. No orderType is selected
    // Memoize the disable condition for customer (and vendor) based on orderType
    const isCustomerDisabled = useMemo(() => {
        const orderTypes = filters.orderType
        if (!orderTypes || orderTypes.length === 0) return true
        const allowedTypes = ['B2C', 'PurchaseReturn', 'Exchange', 'Sample', 'Promotion']
        const onlyAllowed = orderTypes.every(item => allowedTypes.includes(item.value.trim()))
        return onlyAllowed
    }, [filters?.orderType])

    const throwWarning = () => {
        const warning = new Error('warning')
        warning.type = 'warning'
        throw warning
    }
    // eslint-disable-next-line no-nested-ternary
    const isErrorOrWarning = (error, warning) => (error ? 'error' : warning ? 'warning' : 'success')

    const changeKeys = keys => {
        const replacement = {
            orderType: 'order_type',
            shipmentMode: 'shipment_mode',
            pickType: 'pick_method',
            batchType: 'batch_type',
            customer: 'customer_no',
            vendor: 'vendor',
            sla: 'sla',
            channels: 'channel_code',
            courier: 'courier_code',
            sellerId: 'seller',
            cutOffTime: 'cut_off_time',
            customSLA: 'custom_sla',
            orderDate: 'order_date'
        }
        const newData = {}

        Object.keys(keys).map(key => {
            if (['cutOffTime'].includes(key)) {
                newData[replacement[key]] = keys[key] ? IST_TIME_STRING(keys[key]) : ''
                return key
            }
            if (Array.isArray(keys[key])) {
                if (keys[key] && typeof keys[key] === 'object' && !Array.isArray(keys[key]))
                    newData[replacement[key]] = keys[key].label || ''
                else newData[replacement[key]] = keys[key].map(item => item.label).join(', ')
            } else if (keys[key] && typeof keys[key] === 'object') newData[replacement[key]] = keys[key].label || ''
            else newData[replacement[key]] = keys[key] || ''
            return key
        })
        newData.scheduled_time = IST_TIME_STRING(scheduledTime)

        return newData
    }

    // eslint-disable-next-line no-console
    useEffect(() => console.log('newFilters ', filters), [filters])

    // handle Schedule
    const handleSchedule = async () => {
        let isError = false
        let isWarning = false
        let message
        try {
            if (!scheduledTime || !(filters.orderType && filters.orderType.length)) {
                setIsAnimate(true)
                isWarning = true
                message = scheduledTime ? 'Please select order type' : 'Please add scheduled time'
                throwWarning()
            } else if (editId && parseInt(editId, 10)) {
                await updatePickWave({ id: editId, payload: { ...changeKeys(filters) } })

                message = `Schedule Updated successfully!`
                navigate('/outbound/pickList/setup/manageWaves')
            } else {
                // handleGenerate?.()
                const { data, message: resMessage } = await createPickWave({
                    ...changeKeys(filters)
                }).unwrap()

                message = resMessage || data?.message || 'created wave !'
                navigate('/outbound/pickList/setup/manageWaves')
            }
        } catch (error) {
            if (error?.type !== 'warning') {
                isError = true
                message = error?.message || error?.data?.message || 'something went wrong'
            }
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isErrorOrWarning(isError, isWarning), icon: isErrorOrWarning(isError, isWarning) },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    const getCustomersReq = useMemo(
        () =>
            debounce(async (request = '') => {
                try {
                    const { data: response } = await dispatch(
                        getCustomers.initiate(`?term=${request || ''}&limit=40&page=1`, {
                            meta: { disableLoader: false }
                        })
                    )
                    setDropDownData(prev => ({
                        ...prev,
                        customers: response?.items || []
                    }))
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.message || 'An error occurred, please try again',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    // ? Data fetch effect
    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await dispatch(getData.initiate())
                setDropDownData(prev => ({
                    ...prev,
                    orderTypes: data?.data?.orderTypes
                        ? data.data.orderTypes.map(item => ({ label: item, value: item }))
                        : [],
                    shipmentMethod: data?.data?.shipmentMethods
                        ? Object.keys(data?.data?.shipmentMethods).map(key => ({
                              label: key,
                              value: data?.data?.shipmentMethods[key]
                          }))
                        : [],
                    sla: data.data?.sla ? data.data.sla.map(item => ({ label: item, value: item })) : []
                }))
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error getXData ', error)
            }
        })()
        ;(async () => {
            try {
                const { data } = await dispatch(getCouriers.initiate())
                setDropDownData(prev => ({
                    ...prev,
                    couriers: data?.data || []
                }))
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error courier ', error)
            }
        })()
        ;(async () => {
            try {
                const { data } = await dispatch(getChannels.initiate())
                setDropDownData(prev => ({
                    ...prev,
                    channels: data?.data || []
                }))
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error courier ', error)
            }
        })()
        getCustomersReq()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.orderType, isCustomerDisabled])

    useEffect(() => {
        if (filters?.pickType?.value !== 'Batch' || !filters?.pickType?.value) {
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
        if (
            editId &&
            parseInt(editId, 10) &&
            dropDownData?.channels?.length &&
            dropDownData?.couriers?.length &&
            dropDownData?.customers?.length &&
            dropDownData?.orderTypes?.length &&
            dropDownData?.shipmentMethod?.length &&
            dropDownData?.sla.length &&
            wave
        ) {
            const getMapData = (array, label) =>
                array.filter(
                    item =>
                        item &&
                        label &&
                        (item?.label?.toLowerCase() === label?.toLowerCase() ||
                            (!item.label && item?.toLowerCase() === label?.toLowerCase()))
                )
            // console.log('wave data ', wave)
            // eslint-disable-next-line no-unused-vars
            setFilters(prev => ({
                //     ...prev,
                orderType: wave.order_type.length
                    ? wave.order_type.split(', ').flatMap(item => getMapData(dropDownData.orderTypes, item))
                    : [],
                shipmentMode: wave.shipment_mode?.length
                    ? wave.shipment_mode.split(', ').flatMap(item => getMapData(dropDownData.shipmentMethod, item))
                    : [],

                pickType: wave.pick_type?.length
                    ? wave.pick_type.split(', ').flatMap(item => getMapData(dropDownData.pickType, item))[0]
                    : [],
                batchType: wave.batch_type,
                customer: wave.customer_no?.length
                    ? wave.customer_no.split(', ').flatMap(item => getMapData(dropDownData.customers, item))
                    : [],
                //     vendor: wave.vendor,
                sla: wave.sla?.length ? wave.sla.split(', ').flatMap(item => getMapData(dropDownData.sla, item)) : [],
                channels: wave.channel_code?.length
                    ? wave.channel_code.split(', ').flatMap(item => getMapData(dropDownData.channels, item))
                    : [],
                courier: wave.courier_code?.length
                    ? wave.courier_code.split(', ').flatMap(item => getMapData(dropDownData.couriers, item))
                    : [],
                sellerId: getMapData(dropDownData.sellerId, wave.seller) || '',
                cutOffTime: IST_STRING_TIME_TO_DATE(wave.cut_off_time)
                // customSLA: Array.isArray(wave.sla) ? '' : wave.sla
                //     orderDate: wave.order_date
            }))
            setScheduledTime(IST_STRING_TIME_TO_DATE(wave.scheduled_time))
        }
    }, [dropDownData, editId, wave])

    useEffect(() => {
        if (editId && parseInt(editId, 10))
            (async () => {
                try {
                    const { data } = await dispatch(getPickWave.initiate(parseInt(editId, 10)))
                    if (!data.data) throw new Error('no data found for this wave id')
                    setWave({ ...data.data })
                    // TODO: setData in state
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error?.message || error?.data?.message || 'unable to get selected pick wave data',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

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
                        onClick={resetFilters}
                    >
                        Clear All Filters
                    </Button>
                )}
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
                        <Grid container item md={12} spacing={2} sx={{ px: '4px', py: 1.5 }}>
                            {filterConfig.map(filter => (
                                <Grid item xs={12} sm={6} md={2} key={filter.name}>
                                    {multiSelectFilters.includes(filter.name) ? (
                                        <CustomMultiSelect
                                            label={filter.label}
                                            name={filter.name}
                                            options={filter.options}
                                            value={filters?.[filter.name] || []}
                                            loading={filter.loading}
                                            onChange={(event, newValue) => handleFilterChange(filter.name, newValue)}
                                            getOptionLabel={option => option.label} // Update this according to your option structure
                                            isOptionEqualToValue={(option, value) => option.value === value.value}
                                            showAdornment={false}
                                            // Optional props:
                                            innerLabel
                                            customSx={customSx}
                                            placeholder='Search...'
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
                                            onInputChange={({ name, value }) => handleInputChange(name, value)}
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
                                <CustomTimePicker
                                    label='Cut Off Time'
                                    value={filters.cutOffTime}
                                    onChange={newValue => handleFilterChange('cutOffTime', newValue)}
                                    ampm={false}
                                    format='hh:mm'
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

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            alignItems: 'center',
                            marginTop: 1.5
                        }}
                    >
                        <CustomTimePicker
                            label='Scheduled Time*'
                            value={scheduledTime}
                            onChange={newValue => setScheduledTime(newValue)}
                            animateGlow={isAnimate}
                            ampm={false}
                            format='hh:mm'
                        />
                        <CustomButton
                            variant='clickable'
                            shouldAnimate
                            endIcon={<AccessAlarm />}
                            onClick={handleSchedule}
                            loading={createPickWaveLKey || updatePickWaveLKey}
                            disabled={
                                !Object.values(filters).some(value => {
                                    if (Array.isArray(value)) return value.length > 0 // Check if array is not empty
                                    if (typeof value === 'object' && value !== null)
                                        return Object.keys(value).length > 0 // Check if object is not empty
                                    return !!value // Check for non-null/undefined/falsy values
                                })
                            }
                            tooltip='Select a filter first'
                            showTooltip={
                                !Object.values(filters).some(value => {
                                    if (Array.isArray(value)) return value.length > 0 // Check if array is not empty
                                    if (typeof value === 'object' && value !== null)
                                        return Object.keys(value).length > 0 // Check if object is not empty
                                    return !!value // Check for non-null/undefined/falsy values
                                })
                            }
                        >
                            {editId ? 'Update & Schedule' : 'Schedule'}
                        </CustomButton>
                    </Box>
                </Grid>

                <Grid item xs={12} md={12}>
                    <Divider
                        sx={{
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <NotesInstructions notes={notes} customFontSize='14px' />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
