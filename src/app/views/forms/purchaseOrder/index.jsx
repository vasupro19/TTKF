/* eslint-disable no-nested-ternary */
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFormik } from 'formik'
import { Box, Grid, Divider, Tooltip } from '@mui/material'
import { debounce } from '@mui/material/utils'

// ** import core components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'

// ** import from redux
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { Description, DescriptionOutlined, Notes, NotesOutlined } from '@mui/icons-material'

import usePrompt from '@hooks/usePrompt'

// Importing formResources
import {
    // getVendorsAndProducts, // todo: remove from slice too
    getVendorAndProductById,
    useCreatePurchaseOrderMutation,
    useGetPOByIdMutation
} from '@/app/store/slices/api/purchaseOrderSlice'
import { getVendorsList } from '@/app/store/slices/api/commonSlice'
import { isEdit } from '@/constants'
import { getShakingSubmitButtonSx } from '@/utilities/styleUtils'
import { initialValues, validationSchema, customSx } from './formResources'
import ProductTable from '../../tables/purchaseOrder/productsTable'

const shakingSubmitButtonSx = getShakingSubmitButtonSx()

function PurchaseOrderForm() {
    usePrompt()
    const tabLabels = ['generalInformation', 'otherInfo']
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { id: editId } = useParams()
    const { getVendorsListLKey, createPurchaseOrderLKey } = useSelector(state => state.loading)

    const [createPurchaseOrder] = useCreatePurchaseOrderMutation()
    const [getPOByIdReq] = useGetPOByIdMutation()

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false, false])
    const [config, setConfig] = useState({
        submit: false, // item not scanned yet
        upload: false, // upload not started id false -- not required for now 2025/02/03
        rowAdd: false, // submit not started id false -- not required for now 2025/02/03
        poId: '',
        poClosed: false,
        canEdit: true
    })

    const [vendorCodes, setVendorCodes] = useState([])
    const [editVendorId, setEditVendorId] = useState(null)

    const [address, setAddress] = useState('')

    // to switch between blurred and un-blurred state
    const [isHovering, setIsHovering] = useState(false)
    const [isPODetailsFilled, setIsPODetailsFilled] = useState(false)

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

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

    const handleAutoCompleteSearch = search => {
        if (search.value.startsWith('VEND')) return
        getVendorsListReq(data => setVendorCodes(data), `?term=${search?.value || ''}&limit=40&page=1`)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const tabsFields = [
        {
            label: 'Basic Information',
            fields: [
                {
                    name: 'vendor_code',
                    label: 'Vendor Code',
                    placeholder: 'Select vendor code',
                    type: 'CustomAutocomplete',
                    required: true,
                    CustomFormInput: false,
                    options: vendorCodes,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    customSx,
                    onInputChange: handleAutoCompleteSearch,
                    showAdornment: config.canEdit,
                    isDisabled: !config.canEdit,
                    loading: !!getVendorsListLKey
                },
                {
                    name: 'vendor_name',
                    label: 'Vendor Name',
                    placeholder: 'eg: John Doe',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isOptionEqualToValue: (option, selectedValue) =>
                        (option?.value || option) === (selectedValue?.value || selectedValue),
                    isDisabled: !config.canEdit
                },
                {
                    name: 'ext_po_no',
                    label: 'Ext. PO No.',
                    placeholder: 'eg: PO/12345',
                    type: 'text',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: !config.canEdit
                },
                {
                    name: 'po_type',
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
                    name: 'total_qty',
                    label: 'Total Qty',
                    placeholder: 'eg: 100',
                    type: 'number',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: true
                },
                {
                    name: 'remaining_qty',
                    label: 'Remaining Qty',
                    placeholder: 'eg: 50',
                    type: 'number',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: true
                },
                {
                    name: 'received_qty',
                    label: 'Received Qty',
                    placeholder: 'eg: 50',
                    type: 'number',
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 3 },
                    size: 'small',
                    customSx,
                    isDisabled: true
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
                    grid: { xs: 12, sm: 6, md: 4 },
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
                    required: true,
                    CustomFormInput: false,
                    grid: { xs: 12, sm: 6, md: 4 },
                    size: 'small',
                    customSx: { ...customSx },
                    isDisabled: !config.canEdit,
                    inputProps: {
                        min: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
                    }
                }
            ],
            icon: {
                outlined: <NotesOutlined />, // extra shipment notes/details
                filled: <Notes />
            }
        }
    ]

    const validate = (values, customIndex) => {
        try {
            const schema = validationSchema[customIndex ?? activeTab]
            // Get schema for the active tab
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
                    Object.keys(formik.touched).forEach(field => {
                        formik.setFieldTouched(field, false)
                    })
                } else if (isPODetailsFilled && formik.isValid) {
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
                    await createPurchaseOrder({
                        po_detail_id: config.poId,
                        ...values,
                        po_type: values.po_type.value,
                        vendor_id: values.vendor_code.value,
                        vendor_code: values.code
                    }).unwrap()
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'PO Submitted Successfully',
                            variant: 'alert',
                            alert: { color: 'success', icon: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    formik.resetForm()
                    navigate('/inbound/purchaseOrder')
                } else {
                    setIsPODetailsFilled(true)
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'PO details saved successfully. You can now add items.',
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

    // Handle tab change, validate current tab before switching
    const handleTabChange = (event, newValue) => {
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
    }

    const getVendorData = async query => {
        try {
            const { data: response } = await dispatch(
                getVendorAndProductById.initiate(query, { meta: { disableLoader: true } })
            )
            setAddress(response?.data?.vendorDetails?.ship_address_1)
            formik.setFieldValue('vendor_name', response?.data?.vendorDetails?.name, true)
            // to remove error when setting vendor_name
            setTimeout(() => {
                formik.setFieldError('vendor_name', undefined)
                formik.setFieldTouched('vendor_name', false)
            }, 200)
            formik.setFieldValue('code', response?.data?.vendorDetails?.code)
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

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (name === 'vendor_code' && value && value?.value) {
            getVendorData(`?vendor_id=${value.value}`)
        }
        if (['total_qty', 'remaining_qty', 'received_qty'].includes(name)) {
            // ::note these value user can not change because these are disabled
            // Allow empty input, but prevent negative values
            if (value === '') {
                formik.setFieldValue(name, '') // Allow empty value for user input
            } else {
                let numericValue = parseFloat(value)

                if (Number.isNaN(numericValue) || numericValue < 0) {
                    numericValue = 0 // Reset to 0 if invalid or negative
                }

                formik.setFieldValue(name, numericValue)
            }
        } else {
            // For other fields, use normal formik.handleChange
            formik.handleChange(e)
        }
    }

    const handleConfigChange = arg => {
        if (typeof arg === 'string') setConfig({ ...config, [arg]: !config[arg] })
        else if (Object.keys(arg).length) setConfig({ ...config, ...arg })
    }

    const getPOById = async id => {
        try {
            const { data: response } = await getPOByIdReq(id).unwrap()
            if (!response) throw new Error('unable to get requested details')
            const { poDetails } = response
            getVendorData(`?vendor_id=${poDetails.vendor_id}`)
            setEditVendorId(poDetails.vendor_id)

            const isNewPO = editId === null
            const canEdit = isNewPO || poDetails.status === 7 // ? 7 created

            setConfig(prev => ({ ...prev, canEdit }))

            formik.setValues({
                ext_po_no: poDetails.ext_po_no,
                po_type: poDetails.po_type ? { label: 'Open', value: 'open' } : { label: 'Closed', value: 'closed' },
                total_qty: poDetails.total_quantity,
                remaining_qty: poDetails.remaining_quantity,
                received_qty: poDetails.received_quantity,
                edd: poDetails.edd,
                expiry_date: poDetails.expiry_date
            })
            formik.setFieldTouched('total_qty', true)
            formik.setFieldTouched('remaining_qty', true)
            formik.setFieldTouched('received_qty', true)
            setConfig(prev => ({ ...prev, poId: poDetails.id, poClosed: !!poDetails.status }))
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

    const handlePointerMove = useCallback(() => {
        setIsHovering(prev => prev || true)
    }, [])

    const handlePointerLeave = useCallback(() => {
        setIsHovering(prev => prev && false)
    }, [])

    const computedTabsFields = useMemo(
        () =>
            tabsFields.map((tab, index) => ({
                ...tab,
                icon: tab.icon
                    ? activeTab === index && typeof tab.icon === 'object' && tab.icon.filled
                        ? tab.icon.filled
                        : typeof tab.icon === 'object' && tab.icon.outlined
                          ? tab.icon.outlined
                          : tab.icon
                    : null
            })),
        [tabsFields, activeTab]
    )

    useEffect(() => {
        getVendorsListReq(data => setVendorCodes(data))
        if (isEdit(editId)) {
            getPOById(editId)
            setTabsEnabled([true, true, true, true])
            setConfig(prev => ({ ...prev, submit: true }))
            setIsPODetailsFilled(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId])

    useEffect(() => {
        if (vendorCodes && vendorCodes.length && editVendorId)
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
                                    value: formik.values?.vendor_name || ''
                                },
                                {
                                    label: 'Vendor Code',
                                    value: formik.values?.code || ''
                                },
                                {
                                    label: 'Address',
                                    value: address
                                },
                                {
                                    label: 'PO No',
                                    value: formik.values?.ext_po_no
                                },
                                {
                                    label: 'Status',
                                    value: formik.values?.po_type?.label || ''
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
                                submitting={createPurchaseOrderLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: '0.5rem',
                                    '& button': {
                                        ...(isHovering && !isPODetailsFilled ? shakingSubmitButtonSx : {})
                                    }
                                }}
                                showSeparaterBorder={false}
                                submitButtonText={
                                    !config.canEdit
                                        ? // eslint-disable-next-line no-unsafe-optional-chaining
                                          activeTab === tabLabels?.length - 1
                                            ? null
                                            : 'Next'
                                        : // eslint-disable-next-line no-unsafe-optional-chaining
                                          activeTab === tabLabels?.length - 1
                                          ? isPODetailsFilled
                                              ? 'Submit'
                                              : 'Save Details'
                                          : activeTab === 0
                                            ? 'Save & Next'
                                            : 'Next'
                                }
                                isHovering={isHovering && !isPODetailsFilled}
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
                        <ProductTable setConfig={handleConfigChange} config={config} poData={formik.values} />
                        {!isPODetailsFilled && !isEdit(editId) && (
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

export default PurchaseOrderForm
