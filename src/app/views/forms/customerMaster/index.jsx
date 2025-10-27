/* eslint-disable no-nested-ternary */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Grid, FormControlLabel, Checkbox, Divider } from '@mui/material'
import { useFormik } from 'formik'
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'
import NotesInstructions from '@core/components/NotesInstructions'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'

// import icons
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import Info from '@mui/icons-material/Info'
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined'
import LocationOn from '@mui/icons-material/LocationOn'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import LocalShipping from '@mui/icons-material/LocalShipping'
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined'
import Description from '@mui/icons-material/Description'

// rtk import
import { getDataFromPinCode } from '@/app/store/slices/api/vendorSlice'
import { getCountry, getStatesByCountry } from '@/app/store/slices/api/geoSlice'
import { useCreateCustomerMutation, useUpdateCustomerMutation, getCustomer } from '@/app/store/slices/api/customerSlice'

// Importing formResources
import {
    initialValues,
    notes,
    validationSchema,
    customInputSx,
    customSx,
    customTextSx,
    currencies,
    customerGroups,
    customerTypes,
    shippingTerms,
    keysToSetForEdit
} from './formResources'

function CustomerMasterForm() {
    usePrompt()
    const navigate = useNavigate()
    const { id: editId } = useParams()
    const tabLabels = ['generalInformation', 'billFromAddress', 'shipFromAddress', 'otherDetails']
    const dispatch = useDispatch()

    const [createCustomer] = useCreateCustomerMutation()
    const [updateCustomer] = useUpdateCustomerMutation()
    const { updateCustomerLKey, createCustomerLKey } = useSelector(state => state.loading)

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false, false])
    const [isSameAddress, setIsSameAddress] = useState(false)

    const [responseErrors, setResponseErrors] = useState({})
    const [countries, setCountries] = useState([])
    const [billingStates, setBillingStates] = useState([])
    const [billingCities, setBillingCities] = useState([])
    const [shippingStates, setShippingStates] = useState([])
    const [shippingCities, setShippingCities] = useState([])
    const [pinId, setPinId] = useState({
        bill: '',
        ship: ''
    })

    const tabFirstFields = ['name', 'bill_address_1', 'ship_address_1', 'customer_type']
    const tabsFields = [
        {
            label: 'General Information',
            fields: [
                {
                    name: 'name',
                    label: 'Customer Name',
                    placeholder: 'eg: John Doe',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'code',
                    label: 'Customer Code',
                    placeholder: 'eg: CUT12345',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'brand_name',
                    label: 'Brand Name',
                    placeholder: 'eg: BrandX',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'gst_in',
                    label: 'GSTIN',
                    placeholder: 'eg: 22ABCDE1234FZ1',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'pan_no',
                    label: 'PAN',
                    placeholder: 'eg: ABCDE1234F',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'fssai_no',
                    label: 'FSSAI No',
                    placeholder: 'eg: 12345678912345',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'tin_no',
                    label: 'Tax Identification Number',
                    placeholder: 'eg: 1234567890',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'cin_no',
                    label: 'CIN',
                    placeholder: 'eg: U12345MH2000PTC123456',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                }
            ],
            icon: {
                outlined: <InfoOutlined />,
                filled: <Info />
            }
        },
        {
            label: 'Bill To Address',
            fields: [
                {
                    name: 'bill_address_1',
                    label: 'Address Line 1',
                    placeholder: 'eg: 123 Street Name',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bill_address_2',
                    label: 'Address Line 2',
                    placeholder: 'eg: Apt 456',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bill_pincode',
                    label: 'Post Code',
                    placeholder: 'eg: 400001',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bill_city_id',
                    label: 'City',
                    placeholder: 'Select a city',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: billingCities,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'bill_state_id',
                    label: 'State',
                    placeholder: 'Select a state',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: billingStates,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'bill_country_id',
                    label: 'Country',
                    placeholder: 'Select a country',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: countries,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'bill_contact_name',
                    label: 'Contact name',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    placeholder: 'eg: Michael Scott'
                },
                {
                    name: 'bill_contact_no',
                    label: 'Contact Number',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bill_contact_email',
                    label: 'Contact Email',
                    placeholder: 'eg: johndoe@gmail.com',
                    type: 'email',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bill_lat_long',
                    label: 'Latitude, Longitude',
                    placeholder: 'eg: 12.3456,78.9101',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                }
            ],
            icon: {
                outlined: <LocationOnOutlined />,
                filled: <LocationOn />
            }
        },
        {
            label: 'Ship To Address',
            fields: [
                {
                    name: 'ship_address_1',
                    label: 'Address Line 1',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx,
                    placeholder: '123 Main Street'
                },
                {
                    name: 'ship_address_2',
                    label: 'Address Line 2',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx,
                    placeholder: 'Apartment 4B'
                },
                {
                    name: 'ship_pincode',
                    label: 'Post Code',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    placeholder: '400001'
                },
                {
                    name: 'ship_city_id',
                    label: 'City',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: shippingCities,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    placeholder: 'Select a city',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'ship_state_id',
                    label: 'State',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: shippingStates,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    placeholder: 'Select a state',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'ship_country_id',
                    label: 'Country',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: countries,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    placeholder: 'Select a country',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'ship_contact_name',
                    label: 'Contact name',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx,
                    placeholder: 'eg: Michael Scott'
                },
                {
                    name: 'ship_contact_no',
                    label: 'Contact Number',
                    placeholder: 'eg: +91 98765-43210',
                    type: 'phone',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'ship_contact_email',
                    label: 'Contact Email',
                    placeholder: 'eg: johndoe@gmail.com',
                    type: 'email',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'ship_lat_long',
                    label: 'Latitude, Longitude',
                    placeholder: 'eg: 12.3456,78.9101',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx
                }
            ],
            icon: {
                outlined: <LocalShippingOutlined />,
                filled: <LocalShipping />
            }
        },
        {
            label: 'Other Details',
            fields: [
                {
                    name: 'customer_type',
                    label: 'Customer Type',
                    placeholder: 'Select a customer type',
                    type: 'CustomAutocomplete',
                    required: false,
                    CustomFormInput: false,
                    options: customerTypes,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx: { ...customSx, marginBottom: 1 },
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'customer_group',
                    label: 'Customer Group',
                    placeholder: 'Select a customer group',
                    type: 'CustomAutocomplete',
                    required: false,
                    CustomFormInput: false,
                    options: customerGroups,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx: { ...customSx, marginBottom: 1 },
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'shipping_term',
                    label: 'Shipping Terms',
                    placeholder: 'Select a shipping term',
                    type: 'CustomAutocomplete',
                    required: false,
                    CustomFormInput: false,
                    options: shippingTerms,
                    grid: { xs: 12, sm: 6, md: 6 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'currency',
                    label: 'Currency',
                    placeholder: 'Select a currency',
                    type: 'CustomAutocomplete',
                    required: false,
                    CustomFormInput: false,
                    options: currencies,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'credit_period_day',
                    label: 'Credit Period (days)',
                    placeholder: 'Enter Credit Period',
                    type: 'number',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    customInputSx,
                    customTextSx,
                    rightAddon: 'days'
                }
            ],
            icon: {
                outlined: <DescriptionOutlined />,
                filled: <Description />
            }
        }
    ]

    const validate = values => {
        try {
            // Get schema for the active tab
            const schema = validationSchema[activeTab]

            // Parse only the active tab values
            schema.parse(values)

            // Return an empty object if no validation errors
            return {}
        } catch (error) {
            const formikErrors = {}

            // Iterate through the validation errors and handle them
            error.errors.forEach(err => {
                const fieldName = err.path[0]

                // Check if the error field belongs to the active tab and handle it
                if (fieldName) {
                    formikErrors[fieldName] = err.message
                }
            })

            // Return the errors for the active tab's fields
            return formikErrors
        }
    }

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }
    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            if (activeTab < tabLabels.length - 1) {
                let nextTab = activeTab + 1
                if (isSameAddress && activeTab === 1 && !Object.keys(responseErrors).length) {
                    nextTab = 3
                }
                // formik.setFieldValue('tabId', tabLabels[nextTab])
                enableTabsAfterValidation(nextTab)
                setActiveTab(nextTab)
            } else {
                let isError = false
                let message
                try {
                    const tempValues = { ...values }
                    tempValues.bill_country_id = values.bill_country_id.value
                        ? values.bill_country_id.value.toString()
                        : ''
                    tempValues.bill_state_id = values.bill_state_id.value ? values.bill_state_id.value.toString() : ''
                    tempValues.bill_city_id = values.bill_city_id.value ? values.bill_city_id.value.toString() : ''

                    tempValues.ship_country_id = values.ship_country_id.value
                        ? values.ship_country_id.value.toString()
                        : ''
                    tempValues.ship_state_id = values.ship_state_id.value ? values.ship_state_id.value.toString() : ''
                    tempValues.ship_city_id = values.ship_city_id.value ? values.ship_city_id.value.toString() : ''

                    tempValues.currency = values.currency.value
                    tempValues.shipping_term = values.shipping_term.value
                    tempValues.bill_contact_no = values.bill_contact_no.slice(2)
                    tempValues.ship_contact_no = values.ship_contact_no.slice(2)
                    tempValues.bill_pincode_id = pinId.bill
                    tempValues.ship_pincode_id = pinId.ship
                    tempValues.customer_group = values.customer_group.value || ''
                    tempValues.customer_type = values.customer_type.value || ''

                    let response
                    if (editId && parseInt(editId, 10)) {
                        response = await updateCustomer({
                            id: editId,
                            ...tempValues,
                            same_as_billing_address: isSameAddress ? '1' : '0'
                        })
                    } else
                        response = await createCustomer({
                            ...tempValues,
                            same_as_billing_address: isSameAddress ? '1' : '0'
                        }).unwrap()

                    message =
                        response?.data?.message ||
                        response?.message ||
                        `customer ${editId && parseInt(editId, 10) ? 'updated' : 'created'} successfully !`
                } catch (error) {
                    if (error.data?.data?.errors) {
                        const backendErrors = error.data.data.errors
                        const formikErrors = {}
                        Object.entries(backendErrors).forEach(([field, messages]) => {
                            formikErrors[field] = messages.join(', ')
                        })
                        setResponseErrors({ ...formikErrors })
                        setActiveTab(0)
                    }
                    isError = true
                    message =
                        error?.message ||
                        error?.data?.data?.message ||
                        error?.data?.message ||
                        'unable to create customer'
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

                    if (!isError) {
                        formik.resetForm()
                        navigate('/master/customer')
                    }
                }
            }
        },
        validateOnBlur: true,
        validateOnChange: true
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

    const getCountries = async () => {
        const { data } = await dispatch(getCountry.initiate('?start=0&length=300'))
        if (!data?.data) return {}
        setCountries(data.data.map(item => ({ label: item.country_name, value: item.id })))
        return data.data
    }

    const getStates = async (id, type) => {
        const { data } = await dispatch(getStatesByCountry.initiate(id))
        if (!data?.data) return
        if (type) setBillingStates(data.data)
        else setShippingStates(data.data)
    }

    // TODO: getCities for the selected pin state
    // const getCities = async (id, type) => {
    //     const { data } = await dispatch(getCityByStateId.initiate(id))
    //     if (!data?.data) return
    //     if (type) setBillingCities(data.data)
    //     else setShippingCities(data.data)
    // }

    const getData = async (pinCode, type) => {
        if (!pinCode || pinCode.length !== 6) return
        const { data } = await dispatch(getDataFromPinCode.initiate(pinCode))
        if (!data?.data) return
        if (type) {
            formik.setFieldValue('bill_country_id', {
                label: data.data[0].country_name,
                value: data.data[0].country_id
            })
            setPinId(prev => ({ ...prev, bill: data.data[0].pincode_id.toString() }))

            setBillingStates([{ label: data.data[0].state_name, value: data.data[0].state_id }])
            formik.setFieldValue('bill_state_id', { label: data.data[0].state_name, value: data.data[0].state_id })

            setBillingCities([{ label: data.data[0].city_name, value: data.data[0].city_id }])
            formik.setFieldValue('bill_city_id', { label: data.data[0].city_name, value: data.data[0].city_id })
        } else {
            formik.setFieldValue('ship_country_id', {
                label: data.data[0].country_name,
                value: data.data[0].country_id
            })
            setPinId(prev => ({ ...prev, ship: data.data[0].pincode_id.toString() }))
            setShippingStates([{ label: data.data[0].state_name, value: data.data[0].state_id }])
            formik.setFieldValue('ship_state_id', { label: data.data[0].state_name, value: data.data[0].state_id })

            setShippingCities([{ label: data.data[0].city_name, value: data.data[0].city_id }])
            formik.setFieldValue('ship_city_id', { label: data.data[0].city_name, value: data.data[0].city_id })
        }
    }

    const getCustomerData = async id => {
        const { data } = await dispatch(getCustomer.initiate(id))
        if (!data?.data) return

        const keys = Object.keys(keysToSetForEdit)
        const editState = {}
        const phoneKeys = ['ship_contact_no', 'bill_contact_no']
        keys.map(key => {
            if (phoneKeys.includes(key)) editState[key] = `91${data.data[key]}`
            else editState[key] = data.data[key] || ''
            return key
        })

        let currency
        if (data.data?.currency) {
            currency = {
                label:
                    currencies.filter(item => item.value === data.data.currency)[0]?.label || data.data?.currency || '',
                value: data.data?.currency || ''
            }
        }

        let customerType
        if (data.data?.customer_type) {
            customerType = {
                label:
                    customerTypes.filter(item => item.value === data.data.customer_type)[0]?.label ||
                    data.data?.customer_type ||
                    '',
                value: data.data?.customer_type || ''
            }
        }
        let shippingTerm
        if (data.data?.shipping_term) {
            shippingTerm = {
                label:
                    shippingTerms.filter(item => item.value === data.data.shipping_term)[0]?.label ||
                    data.data?.shipping_term ||
                    '',
                value: data.data?.shipping_term || ''
            }
        }

        let customerGroup
        if (data.data?.customer_group) {
            customerGroup = {
                label: customerGroups.filter(item => item.value === data.data.customer_group)[0]?.label,
                value: data.data.customer_group
            }
        }

        formik.setValues({
            ...initialValues,
            ...editState,
            bill_address_2: data.data.bill_address_2 ? data.data.bill_address_2 : '',
            ship_address_2: data.data.ship_address_2 ? data.data.ship_address_2 : '',
            customer_type: customerType || '',
            customer_group: customerGroup || '',
            shipping_term: shippingTerm || '',
            currency: currency || '',
            credit_period_day: parseInt(data.data.credit_period_day, 10) || null
        })

        setIsSameAddress(data.data?.same_as_billing_address === '1')
        await getData(data.data.ship_pincode)
        await getData(data.data.bill_pincode, true)

        // enabling tabs
        const enable = []
        const formKeys = Object.keys(data.data)
        tabFirstFields.map(key => {
            enable.push(formKeys.includes(key))
            return key
        })
        setTabsEnabled(enable)
    }
    // Handle tab change, validate current tab before switching
    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            // formik.setFieldValue('tabId', tabLabels[newValue])
        }
        checkIfErrors()
    }

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (name.includes('_pincode')) getData(value, name === 'bill_pincode')
        if (name.includes('_country_id')) getStates(value, name === 'bill_country_id')
        if (
            [
                'name',
                'code',
                'brand_name',
                'fssai_no',
                'tin_no',
                'cin_no',
                'bill_address_1',
                'bill_address_2',
                'bill_contact_name',
                'bill_contact_email',
                'bill_lat_long',
                'ship_contact_no',
                'ship_address_1',
                'ship_address_2',
                'ship_lat_long',
                'bill_pincode',
                'ship_pincode',
                'gst_in',
                'pan_no',
                'ship_contact_email'
            ]?.includes(name)
        )
            if (name === 'pan_no') {
                // Remove invalid characters and ensure length is no more than 10
                const formattedPan = value
                    .replace(/[^A-Za-z0-9]/g, '')
                    .toUpperCase()
                    .slice(0, 10)
                formik.setFieldValue('pan_no', formattedPan) // Update formik valu
            } else {
                formik.handleChange(e) // For other fields, use normal formik.handleChange
            }
    }

    const identityCardData = [
        { label: 'Customer Name', value: formik.values.name },
        { label: 'GSTIN', value: formik.values.gst_in },
        { label: 'PAN', value: formik.values.pan_no },
        { label: 'Email', value: formik.values.ship_contact_email },
        { label: 'Phone Number', value: formik.values.ship_contact_no },
        {
            label: 'Shipping Address',
            value:
                formik.values?.ship_address_1 || formik.values?.ship_pincode
                    ? `${formik.values?.ship_address_1 || ''}${formik.values?.ship_pincode ? `-${formik.values?.ship_pincode}` : ''}`
                    : 'N/A'
        }
    ]

    const handleCheckboxChange = event => {
        if (event.target.checked) {
            const billingAddress = formik.values // Get all billing address values
            formik.setValues({
                ...formik.values,
                ship_address_1: billingAddress.bill_address_1,
                ship_address_2: billingAddress.bill_address_2,
                ship_pincode: billingAddress.bill_pincode,
                ship_country_id: billingAddress.bill_country_id,
                ship_state_id: billingAddress.bill_state_id,
                ship_city_id: billingAddress.bill_city_id,
                ship_contact_email: billingAddress.bill_contact_email,
                ship_contact_name: billingAddress.bill_contact_name,
                ship_contact_no: billingAddress.bill_contact_no,
                ship_lat_long: billingAddress.bill_lat_long
            })
            if (
                billingAddress.bill_address_1 &&
                billingAddress.bill_pincode &&
                !formik.errors.bill_address_1 &&
                !formik.errors.bill_pincode
            ) {
                setIsSameAddress(true)
            } else {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Please fill te required details first',
                        variant: 'alert',
                        alert: { color: 'error', icon: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        } else {
            formik.setValues({
                ...formik.values,
                ship_address_1: '',
                ship_address_2: '',
                ship_pincode: '',
                ship_country_id: '',
                ship_state_id: '',
                ship_city_id: '',
                ship_contact_email: '',
                ship_contact_no: '',
                ship_contact_name: '',
                ship_lat_long: ''
            })
            setIsSameAddress(false)
        }
    }

    useEffect(() => {
        getCountries()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (responseErrors) checkIfErrors()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab])

    useEffect(() => {
        if (editId && parseInt(editId, 10)) getCustomerData(editId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px' }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsEnabled={tabsEnabled}
                            // tabsFields={tabsFields}
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
                        />

                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createCustomerLKey || updateCustomerLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right'
                                }}
                                submitButtonText={activeTab === tabLabels.length - 1 ? 'Submit' : 'Save & Next'}
                                showSeparaterBorder={false}
                            />

                            {activeTab === 1 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        position: 'relative',
                                        bottom: '40px',
                                        width: '300px',
                                        left: '10px',
                                        top: { xs: '10px', sm: 'unset' }
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
                                        label='Same as Shipping Address'
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
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
export default CustomerMasterForm
