/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable object-shorthand */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useFormik } from 'formik'
import { Box, Grid, Divider, FormControlLabel, Checkbox, Tooltip, debounce } from '@mui/material'

// ** import core components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdCardContainer from '@/core/components/IdCardContainer'
import LMDStatus from '@/core/components/LMDStatus'

// ** import from redux
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getOrderData,
    getPincodeInfo,
    getCustomerDropDown,
    useSubmitOrderMutation,
    useGetOrderByIdMutation
} from '@/app/store/slices/api/orderSlice'
import { useFetchPincodeDetailsMutation } from '@/app/store/slices/api/clientSlice'
import { getChannels } from '@/app/store/slices/api/commonSlice'

import usePrompt from '@hooks/usePrompt'

import { isEdit } from '@/constants'

// ** import hooks
import { useGeoData } from '@/hooks/useGeoData'

// ** import sub components
import { getTransporterDropDown } from '@/app/store/slices/api/gateEntrySlice'
import { setOrderDetails } from '@/app/store/slices/orderData'
import { getShakingSubmitButtonSx } from '@/utilities/styleUtils'
import ProductTable from '../../tables/orders/productsTable'
import JobWorkProductTable from '../../tables/orders/jobWorkProductTable'

// Importing formResources
import { validationSchema, initialValues, getTabsFields } from './formResources'
import OrderDetailCard from '../../outbound/orders/OrderDetailCard'

// ** customer details for id card start **//
const getCustomerDetails = values => {
    const addressFields = [values.ship_add1, values.ship_pincode ? `-${values.ship_pincode}` : '']
        .filter(Boolean)
        .join(' ')

    return {
        businessName:
            values?.order_type === 'PurchaseReturn' || values?.order_type?.value === 'PurchaseReturn'
                ? (typeof values?.vendor_name === 'object' ? values?.vendor_name?.value : values?.vendor_name) || ''
                : (typeof values?.customer_name === 'object' ? values?.customer_name?.value : values?.customer_name) ||
                  '',
        name: values.ship_to_name || '',
        gst_no: values.gst_no || '',
        phoneNumber: values.ship_phone1 || '',
        address: addressFields || 'N/A',
        isVendor: ['PurchaseReturn', 'PurchaseReturn'].includes(values.order_type?.value || values.order_type),
        orderType: values?.order_type?.label ?? values?.order_type
    }
}

// get submit Button Text
// eslint-disable-next-line no-unused-vars
const getSubmitButtonText = {
    Exchange: 'Create Exchange Order'
}

// eslint-disable-next-line react/prop-types
function CustomerDetailsSection({ formik }) {
    // eslint-disable-next-line react/prop-types
    const details = getCustomerDetails(formik.values)

    return (
        <Grid container xs={12} md={3.6} spacing={2}>
            <Grid item xs={12} md={6} lg={12} sx={{ mb: 2 }}>
                <IdCardContainer>
                    <OrderDetailCard
                        name={details.name}
                        address={details.address}
                        gst={details.gst_no}
                        phone={details.phoneNumber}
                        title={details.isVendor ? 'Vendor Details' : 'Customer Details'}
                        businessName={details?.businessName}
                        orderType={details?.orderType}
                    />
                </IdCardContainer>
            </Grid>
        </Grid>
    )
}
// ** customer details for id card end **//

const shakingSubmitButtonSx = getShakingSubmitButtonSx()

function OrderForm() {
    usePrompt()
    const tabLabels = ['orderInfo', 'billToAddress', 'shipToAddress', 'invoiceOther']
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { selectedOrderType } = location.state || {}
    const { id: editId } = useParams()
    const [createdAt, setCreatedAt] = useState()
    const orderId = useSelector(state => state.orderData.id)
    const {
        getOrderDataLKey,
        getPincodeInfoLKey,
        getTransporterDropDownLKey,
        getCustomerDropDownLKey,
        submitOrderLKey,
        getChannelsLKey
    } = useSelector(state => state.loading)

    const [responseErrors, setResponseErrors] = useState({})
    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false, false])
    const [config, setConfig] = useState({
        submit: false,
        upload: false,
        rowAdd: false,
        orderId: '',
        poClosed: false,
        canScanItems: true
    })

    // eslint-disable-next-line no-unused-vars
    const [products, setProducts] = useState([])

    // Initialize geo hook
    const { countries, billingGeo, shippingGeo } = useGeoData()

    const [isOrderFilled, setIsOrderFilled] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isSameAddress, setIsSameAddress] = useState(false)
    const [orderTypeOptions, setOrderTypeOptions] = useState([])
    const [paymentMethods, setPaymentMethods] = useState({})
    const [shipmentMethods, setShipmentMethods] = useState({})
    const [pincodeOptions, setPincodeOptions] = useState([])
    const [channelOptions, setChannelOptions] = useState([])
    const [transporterOptions, setTransporterOptions] = useState([])
    const [customerOptions, setCustomerOptions] = useState([])
    const [fetchPincodeDetails] = useFetchPincodeDetailsMutation()
    const [submitOrder] = useSubmitOrderMutation()
    const [getOrderByIdReq] = useGetOrderByIdMutation()

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const response = await dispatch(getOrderData.initiate())
                if (response.isSuccess) {
                    const orderTypes = response.data.data.orderTypes.map(type => ({
                        value: type.replace(/\s+/g, ''),
                        label: type
                    }))
                    setOrderTypeOptions(orderTypes)

                    if (selectedOrderType && orderTypes.length > 0) {
                        const matchedType = orderTypes.find(orderType => orderType.value === selectedOrderType)
                        if (matchedType) {
                            // eslint-disable-next-line no-use-before-define
                            formik.setFieldValue('order_type', matchedType)
                        }
                    }
                    const formattedPaymentMethods = Object.entries(response.data.data.paymentMethods).map(
                        ([label]) => ({
                            value: label.toLowerCase().replace(/\s+/g, '_'),
                            label: label
                        })
                    )
                    setPaymentMethods(formattedPaymentMethods)

                    const formattedShipmentMethods = Object.entries(response.data.data.shipmentMethods).map(
                        ([label]) => ({
                            value: label.toLowerCase().replace(/\s+/g, '_'),
                            label: label
                        })
                    )
                    setShipmentMethods(formattedShipmentMethods)

                    const formattedChannels = Object.entries(response.data.data.channelOptions).map(([label]) => ({
                        value: label.toLowerCase().replace(/\s+/g, '_'),
                        label: label
                    }))
                    setChannelOptions(formattedChannels)
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error fetching order data:', error)
            }
        }
        fetchOrderData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    const validate = (values, customIndex) => {
        try {
            const schema = validationSchema[customIndex ?? activeTab]

            schema.parse(values)

            return {}
        } catch (error) {
            const formikErrors = {}

            error.errors.forEach(err => {
                const fieldName = err.path[0]

                if (fieldName) {
                    formikErrors[fieldName] = err.message
                }
            })

            return formikErrors
        }
    }

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            dispatch(setOrderDetails(values))
            try {
                if (activeTab < tabLabels.length - 1) {
                    const nextTab = activeTab + 1
                    formik.setFieldValue('tabId', tabLabels[nextTab])
                    enableTabsAfterValidation(nextTab)
                    setActiveTab(nextTab)
                } else if (isOrderFilled && formik.isValid) {
                    const orderData = {
                        id: config.orderId || orderId || null,
                        ...values,
                        order_type: values.order_type?.label || values.order_type,
                        payment_mode: values.payment_mode?.label || values.payment_mode,
                        shipment_mode: values.shipment_mode?.label || values.shipment_mode,
                        currency: values.currency?.label || values.currency,
                        carrier_name: values.carrier_name?.label || values.carrier_name,
                        bill_country_id: values.bill_country_id?.label || values.bill_country_id,
                        bill_state_id: values.bill_state_id?.label || values.bill_state_id,
                        bill_city_id: values.bill_city_id?.label || values.bill_city_id,
                        ship_country_id: values.ship_country_id?.label || values.ship_country_id,
                        ship_state_id: values.ship_state_id?.label || values.ship_state_id,
                        ship_city_id: values.ship_city_id?.label || values.ship_city_id,
                        channel_code: values.channel_code?.label || values.channel_code || '',
                        transport_method: values?.transport_mode?.split('(')[1]?.replace(/\)$/, '')?.trim(),
                        priority: values.priority?.label || values.priority,
                        discount_code: values.discount_code || '',
                        total_price: Number(values?.total_amount) || '',
                        gst_no: values.gst_no || '',
                        original_order_no: values.original_order_no || '',
                        courier_code: values?.carrier_name?.label || values.carrier_name,
                        awb_no: values?.tracking_no?.label || values.tracking_no,
                        total_discounts: Number(values?.total_discount) || ''
                    }

                    const response = await submitOrder(orderData).unwrap()

                    if (response.success) {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: editId ? 'Order updated successfully' : 'Order created successfully',
                                variant: 'alert',
                                alert: { color: 'success', icon: 'check_circle' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )

                        navigate('/outbound/order')
                    } else {
                        throw new Error(response.message || 'Failed to submit order')
                    }
                } else {
                    setIsOrderFilled(true)
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'Order details saved successfully. You can now add items.',
                            variant: 'alert',
                            alert: { color: 'success', icon: 'check_circle' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    })
                    Object.keys(formik.touched).forEach(field => {
                        formik.setFieldTouched(field, false)
                    })
                }
            } catch (error) {
                if (error.data?.data?.errors) {
                    const backendErrors = error.data.data.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                    setResponseErrors(formikErrors)
                } else {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.message || error.message || 'An error occurred, please try again',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    const getTransporterOptions = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getTransporterDropDown.initiate(request, { meta: { disableLoader: true } })
                )

                callback(response?.items || [])
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleTransporterSearch = search => {
        getTransporterOptions(
            data => {
                const items = data?.items || []
                setTransporterOptions(items.length ? items : transporterOptions)
            },
            `?term=${search?.value || ''}&limit=40&page=1`
        )
    }

    const getCustomerOptions = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                const { data: response } = await dispatch(
                    getCustomerDropDown.initiate(request, { meta: { disableLoader: true } })
                )

                callback(response?.items || [])
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const getChannelOptions = async callback => {
        const { data: response } = await dispatch(getChannels.initiate(null, { meta: { disableLoader: false } }))

        callback(response?.data || [])
    }

    const handleCustomerSearch = search => {
        getCustomerOptions(
            data => {
                const items = data?.items || []
                setCustomerOptions(items.length ? items : customerOptions)
            },
            `?term=${search?.value || ''}&limit=40&page=1`
        )
    }

    // eslint-disable-next-line no-shadow
    const handlePincodeChange = async (pincode, prefix, formik) => {
        if (pincode.toString().length === 6) {
            try {
                const response = await fetchPincodeDetails(pincode).unwrap()
                if (response.success && response.data) {
                    formik.setValues({
                        ...formik.values,
                        [`${prefix}_pincode`]: response.data.pincode,
                        [`${prefix}_city_id`]: response.data.city,
                        [`${prefix}_state_id`]: response.data.state,
                        [`${prefix}_country_id`]: response.data.country
                    })
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Failed to fetch pincode details',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                formik.setValues({
                    ...formik.values,
                    [`${prefix}_country_id`]: '',
                    [`${prefix}_state_id`]: '',
                    [`${prefix}_city_id`]: ''
                })
            }
        }
    }

    // eslint-disable-next-line no-shadow
    const handleCustomChange = async (e, formik) => {
        const { name, value } = e.target

        if (name.includes('_pincode')) {
            const pincodeValue = typeof value === 'object' ? value.label || value.text : value

            formik.setFieldValue(name, pincodeValue)

            const prefix = name.startsWith('bill_') ? 'bill' : 'ship'
            await handlePincodeChange(pincodeValue, prefix, formik)
            return
        }

        if (name === 'transport_mode') {
            formik.setFieldValue(name, value?.label || '')
            return
        }

        if (name === 'customer_name') {
            formik.setFieldValue(name, value?.label || '')
            return
        }

        if (name === 'invoice_no') {
            const formatted = value.replace(/[^A-Za-z0-9/-]/g, '').toUpperCase()
            formik.setFieldValue(name, formatted)
            return
        }
        if (['total_amount', 'total_discount', 'shipping_charges', 'other_charges'].includes(name)) {
            if (value === '') {
                formik.setFieldValue(name, '')
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0) {
                    numericValue = 0
                }
                formik.setFieldValue(name, numericValue)
            }
            return
        }

        formik.handleChange(e)
    }

    const getPincodesOptions = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=10&page=1`) => {
                const { data: response } = await dispatch(
                    getPincodeInfo.initiate(request, { meta: { disableLoader: true } })
                )

                callback(response?.items || [])
            }, 200),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handlePincodeSearch = search => {
        const searchTerm = search?.value || search || ''

        if (search?.value) {
            const fieldName = formik.values.ship_pincode ? 'ship_pincode' : 'bill_pincode'

            const e = {
                target: {
                    name: fieldName,
                    value: search.value
                }
            }
            handlePincodeChange(e, formik)
        }

        getPincodesOptions(data => {
            if (data) {
                setPincodeOptions(data)
            }
        }, `?term=${searchTerm}&limit=10&page=1`)
    }

    useEffect(() => {
        getPincodesOptions(data => setPincodeOptions(data))
        getChannelOptions(data => setChannelOptions(data || []))
        getTransporterOptions(data => setTransporterOptions(data))
        getCustomerOptions(data => setCustomerOptions(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const tabsFields = getTabsFields({
        formik,
        billingStates: billingGeo.states,
        billingCities: billingGeo.cities,
        shippingStates: shippingGeo.states,
        shippingCities: shippingGeo.cities,
        countries,
        editId,
        orderTypeOptions,
        paymentMethods,
        shipmentMethods,
        pincodeOptions,
        channelOptions,
        handlePincodeSearch,
        handleTransporterSearch,
        transporterOptions,
        handleCustomerSearch,
        customerOptions,
        getOrderDataLKey,
        getPincodeInfoLKey,
        getTransporterDropDownLKey,
        getCustomerDropDownLKey,
        getChannelsLKey
    })

    const checkIfErrors = () => {
        let isError = false
        const currentTabKeys = tabsFields[activeTab].fields.map(item => item.name)
        Object.keys(responseErrors).map(key => {
            if (currentTabKeys.includes(key)) {
                isError = true
            }
            return key
        })
        if (isError) formik.setErrors({ ...responseErrors })
    }

    const handleConfigChange = arg => {
        if (typeof arg === 'string') setConfig({ ...config, [arg]: !config[arg] })
        else if (Object.keys(arg).length) setConfig({ ...config, ...arg })
    }

    // Handle tab change, validate current tab before switching
    const handleTabChange = (event, newValue) => {
        if (isEdit(editId)) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
            return
        }
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
        }
        checkIfErrors()
    }

    // save bill to address values to ship to address values
    const handleCheckboxChange = async event => {
        const { checked } = event.target
        const { values, errors } = formik

        if (checked) {
            // Validate required fields first
            if (
                !values.bill_add1 ||
                !values.bill_pincode ||
                !values?.bill_phone1 ||
                !values?.bill_to_name ||
                errors.bill_add1 ||
                errors.bill_pincode ||
                errors?.bill_phone1 ||
                errors?.bill_to_name
            ) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Please fill the required details first',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                return
            }

            // Clone billing address to shipping
            const shippingUpdates = Object.keys(values)
                .filter(key => key.startsWith('bill_'))
                .reduce(
                    (acc, key) => ({
                        ...acc,
                        [`ship_${key.slice(5)}`]: values[key]
                    }),
                    {}
                )

            formik.setValues({
                ...values,
                ...shippingUpdates
            })
        } else {
            // Clear shipping fields
            const shippingFields = Object.keys(values)
                .filter(key => key.startsWith('ship_'))
                .reduce((acc, key) => ({ ...acc, [key]: '' }), {})

            formik.setValues({
                ...values,
                ...shippingFields
            })
        }

        setIsSameAddress(checked)
    }

    const handlePointerMove = useCallback(() => {
        setIsHovering(prev => prev || true)
    }, [])

    const handlePointerLeave = useCallback(() => {
        setIsHovering(prev => prev && false)
    }, [])

    const getOrderById = async id => {
        try {
            const response = await getOrderByIdReq(id)
            setCreatedAt(response.data.data.created_at)

            const rawOrder = response?.data?.data || {}
            const mappedOrder = {
                ...rawOrder,
                bill_city_id: rawOrder.bill_city,
                bill_state_id: rawOrder.bill_state,
                bill_country_id: rawOrder.bill_country,
                ship_city_id: rawOrder.ship_city,
                ship_state_id: rawOrder.ship_state,
                ship_country_id: rawOrder.ship_country,
                shipment_method: rawOrder.shipment_mode,
                channel_code: rawOrder.channel_code,
                transport_method: rawOrder.transport_mode,
                customer_name: rawOrder.customer_no
            }
            dispatch(setOrderDetails(mappedOrder))

            if (!response) {
                throw new Error('Unable to get requested details')
            }

            let orderDetails
            if (response.data && response.data.data) {
                orderDetails = response.data.data
            } else if (response.data) {
                orderDetails = response.data
            } else {
                orderDetails = response
            }

            if (!orderDetails || !orderDetails.id) {
                throw new Error('Invalid order data structure')
            }

            setIsSameAddress(orderDetails.bill_same_ship === 1)

            const formatValue = value => (value ? { value, label: value } : null)

            formik.setValues({
                order_no: orderDetails.order_no,
                original_order_no: orderDetails.original_order_no || '',
                external_order_id: orderDetails.external_order_id,
                shipment_mode: formatValue(orderDetails.shipment_method),
                order_type: formatValue(orderDetails.order_type),
                payment_mode: formatValue(orderDetails.payment_mode),
                order_date: orderDetails.order_date || '',
                priority: orderDetails.priority,
                channel_code: formatValue(orderDetails.channel_code),
                fulfilled_by: orderDetails.fulfilled_by,

                bill_add1: orderDetails.bill_add1,
                bill_add2: orderDetails.bill_add2,
                bill_to_name: orderDetails.bill_to_name,
                bill_phone1: orderDetails.bill_phone1,
                bill_phone2: orderDetails.bill_phone2,
                bill_email: orderDetails.bill_email,
                bill_pincode: orderDetails.bill_pincode,
                bill_lat:
                    orderDetails.bill_lat && orderDetails.bill_long
                        ? `${orderDetails.bill_lat},${orderDetails.bill_long}`
                        : '',
                bill_city_id: orderDetails.bill_city || '',
                bill_state_id: orderDetails.bill_state || '',
                bill_country_id: orderDetails.bill_country || '',

                ship_add1: orderDetails.ship_add1,
                ship_add2: orderDetails.ship_add2,
                ship_to_name: orderDetails.ship_to_name,
                ship_phone1: orderDetails.ship_phone1,
                ship_phone2: orderDetails.ship_phone2,
                ship_email: orderDetails.ship_email,
                ship_pincode: orderDetails.ship_pincode,
                ship_lat:
                    orderDetails.ship_lat && orderDetails.ship_long
                        ? `${orderDetails.ship_lat},${orderDetails.ship_long}`
                        : '',
                ship_city_id: orderDetails.ship_city || '',
                ship_state_id: orderDetails.ship_state || '',
                ship_country_id: orderDetails.ship_country || '',

                gst_no: orderDetails.gst_no || '',
                bill_same_ship: orderDetails.bill_same_ship,
                customer_name: orderDetails.customer_no || '',
                tracking_no: orderDetails.tracking_no || '',
                currency: orderDetails.currency || 'INR (₹)',
                total_amount: orderDetails.total_price || '',
                carrier_name: orderDetails.courier_code || '',
                isGift: orderDetails.is_gift === 0,
                gift_message: orderDetails.gift_message || '',
                discount_code: orderDetails.discount_code,
                remarks: orderDetails.remarks || '',
                invoice_no: orderDetails.inv_no || '',
                total_discount: orderDetails.total_discounts || '',
                transport_mode: orderDetails.transport_method || '',
                shipping_charges: orderDetails.shipping_charges || '',
                other_charges: orderDetails.other_charges || '',
                status: orderDetails.status
            })
            setIsOrderFilled(true)
            setConfig(prev => ({
                ...prev,
                orderId: orderDetails.id,
                submit: true,
                canScanItems: orderDetails.status === 1
            }))
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.data?.message || 'Failed to load order details',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    useEffect(() => {
        if (isEdit(editId)) {
            getOrderById(editId)
            setTabsEnabled([true, true, true, true])
            setConfig(prev => ({ ...prev, submit: true }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    useEffect(() => {
        if (responseErrors) checkIfErrors()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    useEffect(() => {
        const { order_type, customer_name, order_no } = formik.values || {}
        const orderTypeValue = order_type?.value || order_type

        const resetCustomerName = newVal => {
            formik.setFieldValue('customer_name', newVal)
            formik.setFieldError('customer_name', undefined)
            formik.setFieldTouched('customer_name', false)
        }

        if (orderTypeValue === 'B2C') {
            resetCustomerName('')
        } else if (typeof customer_name === 'object' && customer_name?.value) {
            resetCustomerName(null)
        }

        const orderTypeMapping = {
            B2C: 'SO',
            B2B: 'SO',
            STO: 'STN',
            ReturnableChallan: 'RT',
            NonReturnableChallan: 'NRT',
            JobWork: 'JW',
            PurchaseReturn: 'PR',
            Exchange: 'EXH',
            Sample: 'SM',
            Promotion: 'PR'
        }
        if (orderTypeValue && order_no) {
            const newPrefix = orderTypeMapping[orderTypeValue] ?? ''

            if (newPrefix) {
                formik.setFieldValue(
                    'order_no',
                    order_no
                        ? order_no.replace(/^[^-]+/, newPrefix) // Replace only the prefix before "-"
                        : `${newPrefix}-${formik?.values?.external_order_id}`
                )
            } else {
                formik.setFieldValue(
                    'order_no',
                    order_no ? order_no.replace(/^[^-]+/, newPrefix) : `SO-${formik?.values?.external_order_id}`
                )
            }
        } else if (orderTypeValue) {
            const newPrefix = orderTypeMapping[orderTypeValue]
            formik.setFieldValue('order_no', `${newPrefix}-${formik?.values?.external_order_id}`)
        }
        if (orderTypeValue === 'Exchange') {
            formik.setFieldValue('payment_mode', { label: 'Paid', value: 'paid' })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values?.order_type])

    useEffect(() => {
        formik.setFieldValue('gift_message', '')
        formik.setFieldError('gift_message', undefined)
        formik.setFieldTouched('gift_message', false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values?.isGift])

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <CustomerDetailsSection formik={formik} />
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields.map((tab, index) => ({
                                ...tab,
                                icon: tab.icon
                                    ? activeTab === index && typeof tab.icon === 'object' && tab.icon.filled
                                        ? tab.icon.filled
                                        : typeof tab.icon === 'object' && tab.icon.outlined
                                          ? tab.icon.outlined
                                          : tab.icon
                                    : null
                            }))}
                            tabsEnabled={tabsEnabled}
                        />

                        <Box sx={{ padding: 1, paddingTop: 0.5, position: 'relative' }}>
                            <FormComponent
                                fields={tabsFields?.[activeTab]?.fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={submitOrderLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: '0.5rem',
                                    '& button': {
                                        ...(isHovering && !isOrderFilled ? shakingSubmitButtonSx : {})
                                    }
                                }}
                                showSeparaterBorder={false}
                                /* eslint-disable no-nested-ternary */
                                submitButtonText={
                                    activeTab < tabLabels.length - 1
                                        ? 'Save & Next'
                                        : isOrderFilled && isEdit(editId)
                                          ? 'Update'
                                          : isOrderFilled
                                            ? 'Submit'
                                            : 'Save Details'
                                }
                                isHovering={isHovering && !isOrderFilled}
                                disabledTabImplementation
                            />
                            {activeTab === 1 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        position: { xs: 'relative', sm: 'absolute' },
                                        width: { xs: '100%', sm: '22rem' },
                                        height: 'max-content',
                                        left: { xs: '0px', sm: '1rem' },
                                        top: { xs: 'unset', sm: '80%' }
                                    }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                onChange={handleCheckboxChange}
                                                color='primary'
                                                checked={isSameAddress}
                                            />
                                        }
                                        label='Copy Billing Address to Shipping Address'
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Grid>
                {isEdit(editId) && (
                    <Grid
                        item
                        xs={12}
                        md={6}
                        lg={12}
                        sx={{
                            marginTop: '-3rem'
                        }}
                    >
                        <LMDStatus createdAt={createdAt} />
                    </Grid>
                )}
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <Box sx={{ position: 'relative' }}>
                        {formik.values?.order_type === 'JobWork' || formik.values?.order_type?.value === 'JobWork' ? (
                            <JobWorkProductTable setConfig={handleConfigChange} config={config} />
                        ) : (
                            <ProductTable
                                products={products}
                                setConfig={handleConfigChange}
                                config={config}
                                poData={formik.values}
                            />
                        )}
                        {!isOrderFilled && !isEdit(editId) && (
                            <Tooltip title='Please Fill & Save Order Details First' placement='top' arrow>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(255, 255, 255, 0.21)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        transition: 'opacity 0.5s ease-in-out',
                                        opacity: 1,
                                        backdropFilter: 'blur(1px)'
                                    }}
                                    // onMouseEnter={() => setIsHovering(true)}
                                    // onMouseLeave={() => setIsHovering(false)}
                                    // using to remove flickering
                                    // TODO:: using this way it rerenders table multiple time optimize!!
                                    onPointerMove={handlePointerMove}
                                    onPointerLeave={handlePointerLeave}
                                />
                            </Tooltip>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default OrderForm
