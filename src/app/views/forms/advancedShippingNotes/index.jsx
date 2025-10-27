/* eslint-disable no-nested-ternary */
import { useEffect, useState, useMemo, useCallback } from 'react'
import { Box, Grid, Divider, Tooltip } from '@mui/material'
import { debounce } from '@mui/material/utils'
import { Description, DescriptionOutlined, Notes, NotesOutlined } from '@mui/icons-material'
import { useFormik } from 'formik'
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'
import { useNavigate, useParams } from 'react-router-dom'
// Importing formResources
import ProductTable from '@views/tables/advancedShippingNotes/productsTable'
import {
    getDropDownData,
    useGetPOByNoMutation,
    useCreateAsnMutation,
    useGetAsnByIdMutation
} from '@/app/store/slices/api/asnSlice'
import { getVendorsList } from '@/app/store/slices/api/commonSlice'
import { getShakingSubmitButtonSx } from '@/utilities/styleUtils'
import { getTransporterDropDown } from '@/app/store/slices/api/gateEntrySlice'
import { isEdit, ASN_TYPE } from '@/constants'
import { initialValues, validationSchema, customSx } from './formResources'

const shakingSubmitButtonSx = getShakingSubmitButtonSx()

function ASNForm() {
    usePrompt()
    const tabLabels = ['generalInformation', 'otherInfo']
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { id: formId } = useParams()

    const [getPOByNo] = useGetPOByNoMutation()
    const [createAsn] = useCreateAsnMutation()
    const [getAsnByIdReq] = useGetAsnByIdMutation()
    const { getVendorsListLKey, createAsnLKey, getDropDownDataLKey, getTransporterDropDownLKey } = useSelector(
        state => state.loading
    )

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false])

    const [poList, setPoList] = useState([])
    const [config, setConfig] = useState({
        submit: false, // item not scanned yet
        asnId: '',
        canEdit: true
    })
    const [transporterOptions, setTransporterOptions] = useState([])
    const [vendorCodes, setVendorCodes] = useState([])
    const [editVendorId, setEditVendorId] = useState(null)
    // eslint-disable-next-line no-unused-vars
    const [editTransportId, setEditTransportId] = useState(null)
    const [transportMode, setTransportMode] = useState([])
    const [asnPoData, setAsnPoData] = useState({
        address: '',
        vendor_name: '',
        po_no: ''
    })

    // to switch between blurred and un-blurred state
    const [isHovering, setIsHovering] = useState(false)
    const [isAsnDetailsFilled, setIsAsnDetailsFilled] = useState(false)

    const getVendorsListReq = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                try {
                    const { data: response } = await dispatch(
                        getVendorsList.initiate(request, { meta: { disableLoader: true } })
                    )
                    callback(response?.items || [])
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

    const handleAutoCompleteSearch = search => {
        if (search.value.startsWith('VEND')) return
        getVendorsListReq(data => setVendorCodes(data), `?term=${search?.value || ''}&limit=40&page=1`)
    }

    const tabsFields = formik => [
        {
            label: 'Basic Information',
            fields: [
                {
                    name: 'asn_type',
                    label: 'ASN Type',
                    placeholder: 'Select ASN Type',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: [
                        { label: 'Fresh', value: 'Fresh' },
                        { label: 'STI', value: 'STI' },
                        { label: 'Returnable Challan', value: 'Returnable Challan' },
                        { label: 'PO', value: 'PO' }
                    ],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    isDisabled: !config.canEdit
                },
                {
                    name: 'invoice_no',
                    label: 'Invoice No.',
                    placeholder: 'eg: INV12345',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'invoice_value',
                    label: 'Invoice Value*',
                    type: 'currency',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'invoice_date',
                    label: 'Invoice Date*',
                    type: 'date',
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: { ...customSx },
                    isDisabled: !config.canEdit
                },
                {
                    name: 'po_no',
                    label: 'PO No.',
                    placeholder: 'eg: PO12345',
                    type: formik.values?.asn_type === ASN_TYPE.po ? 'CustomAutocomplete' : 'text',
                    required: true,
                    CustomFormInput: false,
                    options: poList,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isDisabled: !config.canEdit,
                    loading: !!getDropDownDataLKey,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue)
                },
                {
                    name: 'vendor_code',
                    label: 'Vendor Code',
                    placeholder: 'Select vendor code',
                    type: formik.values?.asn_type === ASN_TYPE.po ? 'text' : 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: vendorCodes || [],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx,
                    isDisabled: !formik.values?.asn_type || formik.values?.asn_type === ASN_TYPE.po || !config.canEdit,
                    onInputChange: handleAutoCompleteSearch,
                    showAdornment: config.canEdit,
                    loading: !!getVendorsListLKey
                },
                {
                    name: 'challan_no',
                    label: 'Challan No.',
                    placeholder: 'eg: CH12345',
                    type: 'text',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'ext_asn_no',
                    label: 'Ext ASN No.',
                    placeholder: 'eg: ASN12345',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'status',
                    label: 'Status',
                    placeholder: 'Select Status',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: [
                        { label: 'Open', value: 'open' },
                        { label: 'Closed', value: 'closed' }
                    ],
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    showAdornment: false,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'manifest_no',
                    label: 'Manifest No.',
                    placeholder: 'eg: MFT-0456',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'seal_no',
                    label: 'Seal No.',
                    placeholder: 'eg: S987654',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                }
            ],
            icon: {
                outlined: <DescriptionOutlined />, // document, shipment form
                filled: <Description />
            }
        },
        {
            label: 'Other Details',
            fields: [
                {
                    name: 'edd',
                    label: 'EDD (Expected Delivery Date)',
                    placeholder: 'Select EDD',
                    type: 'date',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: { ...customSx },
                    isDisabled: !config.canEdit,
                    inputProps: {
                        min: new Date(new Date().setDate(new Date().getDate())).toISOString().split('T')[0]
                    }
                },
                {
                    name: 'expiry_date',
                    label: 'Expiry Date',
                    placeholder: 'Select Expiry Date',
                    type: 'date',
                    required: false,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx: { ...customSx },
                    isDisabled: !config.canEdit,
                    inputProps: {
                        min: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
                    }
                },
                {
                    name: 'no_of_cases',
                    label: 'No. of Cases',
                    placeholder: 'eg: 2',
                    type: 'number',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'docket_no',
                    label: 'Docket No.',
                    placeholder: 'eg: 01 Civ. 2345 (CM)',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'transporter_name',
                    label: 'Transporter Name',
                    type: !config.canEdit ? 'text' : 'CustomAutocomplete',
                    options: transporterOptions || [],
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    isDisabled: !config.canEdit,
                    showAdornment: config.canEdit,
                    onInputChange: handleTransporterSearch,
                    loading: !!getTransporterDropDownLKey
                },
                {
                    name: 'transport_method',
                    label: 'Mode of Transport',
                    type: 'CustomAutocomplete',
                    options: transportMode,
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    showAdornment: false,
                    isDisabled: !config.canEdit,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    loading: !!getDropDownDataLKey
                },
                {
                    name: 'driver_name',
                    label: 'Driver Name',
                    type: 'text',
                    grid: { xs: 12, sm: 6, md: 3 },
                    required: true,
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'driver_mobile_no',
                    label: 'Driver Mobile No.',
                    type: 'phone',
                    placeholder: '+91 83374-92382',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'freight_amount',
                    label: 'Freight Amount',
                    type: 'number',
                    placeholder: 'eg: 1000',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'vehicle_no',
                    label: 'Vehicle No.',
                    placeholder: 'eg: ABC1234',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                }
            ],
            icon: {
                outlined: <NotesOutlined />, // extra shipment notes/details
                filled: <Notes />
            }
        }
    ]

    const handleConfigChange = useCallback(arg => {
        if (typeof arg === 'string') {
            setConfig(prevConfig => ({ ...prevConfig, [arg]: !prevConfig[arg] }))
        } else if (Object.keys(arg).length) {
            setConfig(prevConfig => ({ ...prevConfig, ...arg }))
        }
    }, [])

    const getData = async () => {
        try {
            const { data: response } = await dispatch(getDropDownData.initiate('', { meta: { disableLoader: true } }))
            setTransportMode(response?.data?.transporterMethods || [])
            setPoList(response?.data?.poList || [])
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
    }

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    const validate = values => {
        try {
            const schema = validationSchema[activeTab]
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

            // Return the errors for the active tab's fields
            return formikErrors
        }
    }

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            try {
                if (activeTab < tabLabels.length - 1) {
                    const nextTab = activeTab + 1
                    formik.setFieldValue('tabId', tabLabels[nextTab])
                    enableTabsAfterValidation(nextTab)
                    setActiveTab(nextTab)
                    // Make all fields untouched
                    Object.keys(formik.touched).forEach(field => {
                        formik.setFieldTouched(field, false) // Reset touched state for all fields
                    })
                } else if (isAsnDetailsFilled && formik.isValid) {
                    if (!config.submit) {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: 'Please scan at least one item first!',
                                variant: 'alert',
                                alert: { color: 'error', icon: 'error' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                        return
                    }
                    const payload = { ...values }
                    // delete payload.po_no
                    // delete payload.ext_asn_no
                    // delete payload.asn_type
                    delete payload.status
                    delete payload.tabId

                    await createAsn({
                        asn_detail_id: config.asnId,
                        ...payload,
                        vendor_code: values?.vendor_code.label || values?.vendor_code,
                        asn_nature: values.status.value || values.status,
                        po_no: values.po_no?.label || values.po_no || ''
                    }).unwrap()
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'Submitted Successfully',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    formik.resetForm()
                    navigate('/inbound/asn')
                } else {
                    setIsAsnDetailsFilled(true)
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'ASN details saved successfully. You can now add items.',
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
                        formikErrors[field] = messages.join(', ') // Join multiple messages with a comma
                    })

                    formik.setErrors(formikErrors) // Update Formik's error state
                } else {
                    // Display general error in Snackbar if no specific validation errors
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
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    const tabsFieldsArray = tabsFields(formik)

    const getPoData = useMemo(
        () =>
            debounce(async (id, type) => {
                try {
                    if (isEdit(formId) || type !== ASN_TYPE.po) return
                    const { data: response } = await getPOByNo(id).unwrap()
                    if (!Object.keys(response?.asnPo).length) throw new Error('data not found for given po number !')
                    const { asnPo } = response
                    formik.setFieldValue('vendor_code', asnPo?.vendor_code)
                    formik.setFieldTouched('vendor_code', true)
                    setAsnPoData({
                        address: asnPo?.ship_address_1,
                        vendor_name: asnPo?.vendor_name,
                        po_no: asnPo?.po_no
                    })
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.message || error?.message || 'An error occurred, please try again',
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
    const getAsnById = async id => {
        try {
            const { data: response } = await getAsnByIdReq(id).unwrap()
            if (!response) throw new Error('unable to get requested details')
            const { asnDetails } = response
            getPoData(asnDetails?.po_no, asnDetails.asn_type)
            setEditVendorId(asnDetails.vendor_id)
            // setConfig({ ...config, canEdit: asnDetails.status === 7 }) // ? 7 created
            const isNewPO = formId === null
            const canEdit = isNewPO || asnDetails.status === 7 // ? 7 created

            setConfig(prev => ({ ...prev, canEdit }))
            setEditTransportId(asnDetails.transport_method)
            formik.setValues({
                asn_type: asnDetails.asn_type,
                invoice_no: asnDetails.invoice_no,
                invoice_value: asnDetails.invoice_value,
                invoice_date: asnDetails.invoice_date,
                po_no: asnDetails.po_no,
                vendor_code:
                    asnDetails.asn_type === ASN_TYPE.po
                        ? asnDetails.vendor_code
                        : {
                              label: asnDetails.vendor_code,
                              value: asnDetails.vendor_id
                          },
                challan_no: asnDetails.challan_no || '',
                ext_asn_no: asnDetails.ext_asn_no || '',
                status: {
                    label: asnDetails.po_type ? 'Open' : 'Closed',
                    value: asnDetails.po_type ? 'open' : 'closed'
                },
                manifest_no: asnDetails.manifest_no,
                seal_no: asnDetails.seal_no,
                edd: asnDetails.edd,
                no_of_cases: asnDetails.no_of_cases,
                expiry_date: asnDetails.expiry_date,
                docket_no: asnDetails.docket_no,
                transporter_name: asnDetails.transporter_name,
                transport_method: asnDetails.transport_method,
                driver_name: asnDetails.driver_name,
                driver_mobile_no: asnDetails.driver_mobile_no,
                freight_amount: asnDetails.freight_amount,
                vehicle_no: asnDetails.vehicle_no
            })

            setAsnPoData({
                address: asnDetails?.ship_address_1 || asnDetails?.address || 'N/A',
                vendor_name: asnDetails?.vendor_name || 'N/A',
                po_no: asnDetails?.po_no || 'N/A'
            })

            setConfig(prev => ({ ...prev, asnId: asnDetails.id, asnClosed: !!asnDetails.status }))
        } catch (error) {
            dispatch(
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.message || 'An error occurred, please try again',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            )
        }
    }

    // Handle tab change, validate current tab before switching
    const handleTabChange = useCallback(
        (event, newValue) => {
            if ((newValue === 1 || newValue === 2) && tabsEnabled[0]) {
                const isEnabled = validate(formik.values, 0)
                if (Object.keys(isEnabled).length === 0) {
                    setActiveTab(newValue)
                    formik.setFieldValue('tabId', tabLabels[newValue])
                    enableTabsAfterValidation(newValue + 1)
                }
            } else if (newValue === 3) {
                const isEnabled = validate(formik.values, 0)
                if (Object.keys(isEnabled).length === 0) {
                    setActiveTab(newValue)
                    formik.setFieldValue('tabId', tabLabels[newValue])
                }
            } else if (tabsEnabled[newValue]) {
                setActiveTab(newValue)
                formik.setFieldValue('tabId', tabLabels[newValue])
            }
        },
        [tabsEnabled, formik.values, formik.setFieldValue, tabLabels, enableTabsAfterValidation]
    )

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (name === 'asn_type') {
            // Reset values and errors for dependent fields (po_no and vendor_code)
            formik.setFieldValue('po_no', '', false)
            formik.setFieldValue('vendor_code', null)
            formik.setFieldError('po_no', undefined)
            formik.setFieldError('vendor_code', undefined)
            formik.setFieldTouched('po_no', false)
            formik.setFieldTouched('vendor_code', false)
        }

        if (name === 'po_no') {
            const poNumberVal = value?.value || value
            // Reset vendor_name value if po_no is empty and document_type is not Non-ASN
            if (formik.values?.po_no !== ASN_TYPE.po && !poNumberVal) {
                formik.setFieldValue('vendor_code', null) // Reset vendor_name value
                formik.setFieldError('vendor_code', undefined) // Clear vendor_name error
            }
            // this is where we need to fetch the vendor name based on the document number from api
            if (poNumberVal) {
                getPoData(typeof value === 'object' ? value.label : value, formik.values.asn_type)
                // formik.setFieldValue('vendor_code', null)
            } else formik.setFieldValue('vendor_code', null)
        }

        if (name === 'asn_type') {
            formik.setFieldValue(name, value?.value || '')
            return
        }

        if (name === 'transporter_name') {
            formik.setFieldValue(name, value?.label || '')
            return
        }
        if (e.target.name === 'invoice_no') {
            // Allow alphanumeric values and special characters "/" and "-"
            let formattedInvoiceNo = e.target.value.replace(/[^A-Za-z0-9/-]/g, '') // Remove unwanted characters

            // Convert the entire string to uppercase
            formattedInvoiceNo = formattedInvoiceNo.toUpperCase()

            // Set the formatted invoice number in Formik
            formik.setFieldValue(e.target.name, formattedInvoiceNo)
            return
        }

        // For other fields, use normal formik.handleChange
        formik.handleChange(e)
    }

    const handlePointerMove = useCallback(() => {
        setIsHovering(prev => prev || true)
    }, [])

    const handlePointerLeave = useCallback(() => {
        setIsHovering(prev => prev && false)
    }, [])

    const computedTabsFields = useMemo(
        () =>
            tabsFieldsArray.map((tab, index) => ({
                ...tab,
                icon: tab.icon
                    ? activeTab === index && typeof tab.icon === 'object' && tab.icon.filled
                        ? tab.icon.filled
                        : typeof tab.icon === 'object' && tab.icon.outlined
                          ? tab.icon.outlined
                          : tab.icon
                    : null
            })),
        [tabsFieldsArray, activeTab]
    )

    useEffect(() => {
        getVendorsListReq(data => setVendorCodes(data))
        getTransporterOptions(data => setTransporterOptions(data))
        getData()
        if (isEdit(formId)) {
            getAsnById(formId)
            setTabsEnabled([true, true, true, true])
            setConfig(prev => ({ ...prev, submit: true }))
            setIsAsnDetailsFilled(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId])

    useEffect(() => {
        if (vendorCodes && vendorCodes.length && editVendorId && formik.values.asn_type !== ASN_TYPE.po)
            formik.setFieldValue(
                'vendor_code',
                vendorCodes.filter(item => parseInt(item.value, 10) === parseInt(editVendorId, 10))[0] || null
            )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values])

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
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard
                            data={[
                                {
                                    label: 'Vendor Name',
                                    value: asnPoData.vendor_name
                                },
                                {
                                    label: 'Vendor Code',
                                    value:
                                        formik.values?.vendor_code?.label?.split('|')[0] ||
                                        formik.values?.vendor_code ||
                                        ''
                                },
                                {
                                    label: 'Address',
                                    value: asnPoData.address
                                },
                                {
                                    label: 'PO No',
                                    value: formik?.values?.ext_po_no || asnPoData.po_no || ''
                                },
                                {
                                    // while editing ASN / Invoice No should show
                                    label: formId ? 'ASN / Invoice No' : 'Invoice No',
                                    value: formik.values.invoice_no
                                },
                                {
                                    label: 'Status',
                                    value: formik.values.status?.label || ''
                                }
                            ]}
                        />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={computedTabsFields}
                            tabsEnabled={tabsEnabled}
                        />

                        <Box sx={{ padding: 1, paddingTop: 0.5 }}>
                            <FormComponent
                                fields={computedTabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createAsnLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: '0.5rem',
                                    '& button': {
                                        ...(isHovering && !isAsnDetailsFilled ? shakingSubmitButtonSx : {})
                                    }
                                }}
                                showSeparaterBorder={false}
                                submitButtonText={
                                    // eslint-disable-next-line no-nested-ternary
                                    !config.canEdit
                                        ? // eslint-disable-next-line no-unsafe-optional-chaining
                                          activeTab === tabLabels?.length - 1
                                            ? null
                                            : 'Next'
                                        : // eslint-disable-next-line no-unsafe-optional-chaining, no-nested-ternary
                                          activeTab === tabLabels?.length - 1
                                          ? isAsnDetailsFilled
                                              ? 'Submit'
                                              : 'Save Details'
                                          : activeTab === 0
                                            ? 'Save & Next'
                                            : 'Next'
                                }
                                isHovering={isHovering && !isAsnDetailsFilled}
                                disabledTabImplementation
                            />
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
                    <Box sx={{ position: 'relative' }}>
                        <ProductTable setConfig={handleConfigChange} config={config} asnData={formik.values} />
                        {!isAsnDetailsFilled && !isEdit(formId) && (
                            <Tooltip title='Please fill & save all the details in above form' placement='top' arrow>
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

export default ASNForm
