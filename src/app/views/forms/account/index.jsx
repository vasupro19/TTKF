/* eslint-disable no-alert */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from 'react'
import { Box, Tabs, Tab, Typography, Grid, Button, TextField, IconButton, Divider } from '@mui/material'
import { z } from 'zod'
import { useFormik } from 'formik'
import { useParams, useNavigate } from 'react-router-dom'

import CloseIcon from '@mui/icons-material/Close'

import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import DynamicLayout from '@core/components/forms/DynamicLayout'

import {
    useCreateMasterClientMutation,
    useUpdateMasterClientMutation,
    getMasterClientById
} from '@app/store/slices/api/accountSlice'
import { fetchFileAsBlob } from '@app/store/slices/api/commonSlice'
import { useFetchPincodeDetailsMutation } from '@app/store/slices/api/clientSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setRouteLabel } from '@app/store/slices/routeLabel'

import { objectLength } from '@/utilities'
import { expressions } from '@/constants'
import NotesInstructions from '@/core/components/NotesInstructions'
import IdentityCard from '@/core/components/IdentityCard'
import MyTabs from '@/core/components/CapsuleTabs'

function MasterAccountSetupForm() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { createMasterClientLKey, updateMasterClientLKey } = useSelector(state => state.loading)
    const { id: formId } = useParams()
    const [editData, setEditData] = useState({})
    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false, false])
    const [keyValuePairs, setKeyValuePairs] = useState([{ key: '', value: '' }])
    const [clientId, setClientId] = useState(null)
    const [storedFiles, setStoredFiles] = useState({
        logo: null,
        signature: null,
        agreement: ''
    })
    const [bavailableCities, setBAvailableCities] = useState([])
    const [bavailableStates, setBAvailableStates] = useState([])
    const [createMasterClient] = useCreateMasterClientMutation()
    const [updateMasterClient] = useUpdateMasterClientMutation()
    const [fetchPincodeDetails] = useFetchPincodeDetailsMutation()

    const tabLabels = ['basicInformation', 'hoAddress', 'otherDetails', 'commercials']

    // Initial form values based on the provided fields
    const initialValues = {
        tabId: 'basicInformation',
        name: '',
        bd_name: '',
        bd_contact_number: '',
        bd_email: '',
        industry: '',
        logo: null,
        signature: null,
        bContactPerson: '',
        baddress: '',
        bcity: '',
        bpostcode: '',
        bcountry: '',
        bstate: '',
        bemail: '',
        bphone: '',
        gst_no: '',
        tin_no: '',
        tat_no: '',
        cin_no: '',
        pan_no: '',
        fssai_no: '',
        agreement: null,
        currency_code: 'INR',
        // fields: keyValuePairs,
        action: ''
    }

    // Validation schema for all fields
    const validationSchema = [
        z.object({
            name: z.string().min(2, 'Company Name is required'),
            bd_name: z.string().min(2, 'BD Name is required'),
            bd_contact_number: z.string().min(10, 'BD Contact Number must be 10 digits'),
            bd_email: z
                .string()
                .optional()
                .refine(val => !val || expressions.email.test(val), {
                    message: 'Invalid email format'
                }),
            industry: z.string().min(1, 'Industry is required'),
            logo: z.instanceof(File, { message: 'Company Logo is required' }),
            signature: z.instanceof(File, { message: 'Digital Signature is required' })
        }),
        z.object({
            bContactPerson: z.string().min(2, 'Contact Person is required'),
            baddress: z.string().superRefine((val, ctx) => {
                const input = val.trim()
                if (!input) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Address is required'
                    })
                } else if (input.length < 5) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Must be at least 5 characters'
                    })
                }
            }),
            bcountry: z.string().min(2, 'Country is required'),
            bcity: z.string().min(2, 'City is required'),
            bpostcode: z.string().min(5, 'Pincode is required'),
            bstate: z.string().min(2, 'State is required'),
            bemail: z
                .string()
                .optional()
                .refine(val => !val || expressions.email.test(val), {
                    message: 'Invalid email format'
                }),
            bphone: z.string().optional()
        }),
        z.object({
            gst_no: z.string().superRefine((val, ctx) => {
                if (!val.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'GST No. is required'
                    })
                } else if (!expressions.gst.test(val)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Invalid GST no.'
                    })
                }
            }),
            fssai_no: z.string().superRefine((val, ctx) => {
                if (!val.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'FSSAI No. is required'
                    })
                } else if (!expressions.fssai.test(val)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Invalid FSSAI no.'
                    })
                }
            }),
            tat_no: z.string().optional(),
            tin_no: z
                .string()
                .optional()
                .refine(val => !val || expressions.tin.test(val), {
                    message: 'Invalid TIN no'
                }),
            cin_no: z
                .string()
                .optional()
                .refine(val => !val || expressions.cin.test(val), {
                    message: 'Invalid CIN no'
                }),
            pan_no: z
                .string()
                .optional()
                .refine(val => !val || expressions.pan.test(val), {
                    message: 'Invalid PAN no'
                })
        }),
        z.object({
            agreement: z.instanceof(File, { message: 'Agreement file is required' }),
            currency_code: z.string().min(1, 'Currency Code is required'),
            fields: z.array(z.object({ key: z.string(), value: z.string() })).optional()
        })
    ]

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }
    // Tabs

    const validate = values => {
        try {
            validationSchema[activeTab].parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const formik = useFormik({
        initialValues,
        validate,
        onSubmit: async values => {
            try {
                const formData = new FormData()

                // Append text fields
                Object.keys(values).forEach(key => {
                    if (key !== 'logo' && key !== 'signature' && key !== 'agreement') {
                        formData.append(key, values[key])
                    }
                })

                // Append files and additional fields
                formData.append('logo', storedFiles.logo)
                formData.append('signature', storedFiles.signature)
                formData.append('agreement', storedFiles.agreement)
                formData.append('fields', JSON.stringify(keyValuePairs))

                let response

                if (activeTab === 0 && !clientId) {
                    // Create master client on the first tab
                    response = await createMasterClient(formData).unwrap()
                    setClientId(response.data.id)
                    formik.setFieldValue('tabId', tabLabels[1])
                    enableTabsAfterValidation(1)
                    setActiveTab(1)
                } else if (clientId) {
                    // Update the client on subsequent tabs
                    if (activeTab === 3) {
                        formData.append('action', 'submit')
                        formik.resetForm()
                    }
                    response = await updateMasterClient({ id: clientId, formData }).unwrap()
                    if (activeTab < tabLabels.length - 1) {
                        const nextTab = activeTab + 1
                        formik.setFieldValue('tabId', tabLabels[nextTab])
                        enableTabsAfterValidation(nextTab)
                        setActiveTab(nextTab)
                    } else {
                        formik.resetForm()
                        setActiveTab(0)
                        setTabsEnabled([true, false, false, false])
                        navigate('/setup/company')
                    }
                }

                if (response.success && response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Operation successful!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            } catch (error) {
                if (error.data?.data?.errors) {
                    const backendErrors = error.data.data.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ')
                    })

                    formik.setErrors(formikErrors)
                } else {
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
        validateOnBlur: true,
        validateOnChange: true
    })

    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
        }
    }
    const handleFileChange = (event, fieldName) => {
        const file = event.currentTarget.files[0]
        if (file) {
            formik.setFieldValue(fieldName, file)
        }
        setStoredFiles(prevFiles => ({
            ...prevFiles,
            [fieldName]: file
        }))
    }

    // Handle key-value change
    const handleAddKeyValuePair = () => {
        const updatedPairs = [...keyValuePairs, { key: '', value: '' }]
        setKeyValuePairs(updatedPairs)
        // formik.setFieldValue('fields', updatedPairs)
    }

    // Handle removing a key-value pair
    const handleRemoveKeyValuePair = index => {
        const updatedPairs = keyValuePairs.filter((_, i) => i !== index)
        setKeyValuePairs(updatedPairs)
        // formik.setFieldValue('fields', updatedPairs) // Update Formik with updated key-value pairs
    }

    // Handle changing key or value of a pair
    const handleKeyValueChange = (index, keyOrValue, newValue) => {
        const updatedPairs = [...keyValuePairs]
        updatedPairs[index][keyOrValue] = newValue
        setKeyValuePairs(updatedPairs)
        // formik.setFieldValue('fields', updatedPairs) // Update Formik with updated key-value pairs
    }

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px',
            height: '18px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        },
        flexGrow: 1
    }
    // Tabs and fields based on the structure provided
    const tabsFields = [
        {
            label: 'Basic Information',
            fields: [
                {
                    name: 'name',
                    label: 'Company Name',
                    size: 'small',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    customSx
                },
                {
                    name: 'bd_name',
                    label: 'BD Name',
                    size: 'small',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    customSx
                },
                {
                    name: 'bd_contact_number',
                    label: 'BD Contact Number',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bd_email',
                    label: 'BD Email',
                    type: 'email',
                    required: false,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'industry',
                    label: 'Industry*',
                    type: 'select',
                    options: [
                        { value: 'bpc', label: 'BPC (Beauty & Personal Care)' },
                        { value: 'fls', label: 'FLS (Fashion & Lifestyle)' },
                        { value: 'automobiles', label: 'Automobiles' },
                        { value: 'fmcg', label: 'FMCG' },
                        { value: 'fmcd', label: 'FMCD' }
                    ],
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'logo',
                    label: 'Company Logo*',
                    type: 'file',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    // onChange: event => handleFileChange(event, 'logo'),
                    size: 'small',
                    customSx
                },
                {
                    name: 'signature',
                    label: 'Digital Signature*',
                    type: 'file',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx

                    // onChange: event => handleFileChange(event, 'signature')
                }
            ]
        },
        {
            label: 'HO Address',
            fields: [
                {
                    name: 'bContactPerson',
                    label: 'Contact Person',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bpostcode',
                    label: 'Pincode',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'baddress',
                    label: 'Address',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bcountry',
                    label: 'Country',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bcity',
                    label: 'City',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    options: bavailableCities,
                    customSx
                },
                {
                    name: 'bstate',
                    label: 'State',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    options: bavailableStates,
                    customSx
                },
                {
                    name: 'bemail',
                    label: 'Email ID',
                    type: 'email',
                    required: false,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'bphone',
                    label: 'Phone',
                    type: 'text',
                    required: false,
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                }
            ]
        },
        {
            label: 'Other Details',
            fields: [
                {
                    name: 'gst_no',
                    label: 'GST No.',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small'
                },
                { name: 'tin_no', label: 'TIN No.', type: 'text', grid: { xs: 12, sm: 4 }, size: 'small' },
                { name: 'tat_no', label: 'TAT', type: 'text', grid: { xs: 12, sm: 4 }, size: 'small' },
                { name: 'cin_no', label: 'CIN No.', type: 'text', grid: { xs: 12, sm: 4 }, size: 'small' },
                { name: 'pan_no', label: 'PAN No.', type: 'text', grid: { xs: 12, sm: 4 }, size: 'small' },
                {
                    name: 'fssai_no',
                    label: 'FSSAI No.',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4 },
                    size: 'small'
                }
            ]
        },
        {
            label: 'Commercials',
            fields: [
                {
                    name: 'agreement',
                    label: 'Upload Agreement',
                    type: 'file',
                    required: true,
                    grid: { xs: 12, sm: 3, size: 'small' }
                    // onChange: event => handleFileChange(event, 'agreement')
                },
                {
                    name: 'currency_code',
                    label: 'Currency Code',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 3 },
                    size: 'small'
                },
                {
                    name: 'add_commercials',
                    label: 'Add Commercials (Custom Fields)',
                    component: (
                        <>
                            {keyValuePairs.map((pair, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Grid container spacing={2} key={index} alignItems='center' sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={6} sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                                        {/* Field Name Input */}
                                        <TextField
                                            label={`Field ${index + 1} Name`}
                                            value={pair.key}
                                            onChange={e => handleKeyValueChange(index, 'key', e.target.value)}
                                            fullWidth
                                            size='small'
                                            variant='outlined'
                                        />
                                        {/* Field Value Input with IconButton inside */}
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ position: 'relative', flexGrow: 1 }}>
                                            <TextField
                                                label={`Field ${index + 1} Value`}
                                                value={pair.value}
                                                onChange={e => handleKeyValueChange(index, 'value', e.target.value)}
                                                fullWidth
                                                size='small'
                                                variant='outlined'
                                            />
                                            <IconButton
                                                sx={{
                                                    position: 'absolute',
                                                    top: '5%',
                                                    right: '-10px',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 1,
                                                    padding: 0,
                                                    backgroundColor: 'red'
                                                }}
                                                onClick={() => handleRemoveKeyValuePair(index)}
                                                size='small'
                                            >
                                                <CloseIcon size={1} sx={{ fontSize: 'large' }} />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ))}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                                    <Button
                                        onClick={handleAddKeyValuePair}
                                        variant='contained'
                                        color='primary'
                                        size='small'
                                    >
                                        Add Field
                                    </Button>
                                </Grid>
                            </Grid>
                        </>
                    ),
                    grid: { xs: 12, sm: 6 },
                    size: 'small'
                }
            ]
        }
    ]

    const handlePincodeChange = useCallback(
        // eslint-disable-next-line no-shadow
        async (pincode, formik, prefix = '') => {
            const pincodeField = prefix ? `${prefix}postcode` : 'postcode'
            formik.setFieldValue(pincodeField, pincode)

            if (pincode.length >= 6) {
                try {
                    const response = await fetchPincodeDetails(pincode).unwrap()

                    if (response?.data) {
                        const { country, state, city } = response.data

                        const countryField = prefix ? `${prefix}country` : 'country'
                        const stateField = prefix ? `${prefix}state` : 'state'
                        const cityField = prefix ? `${prefix}city` : 'city'

                        const updatedValues = {
                            ...formik.values,
                            [pincodeField]: pincode,
                            [countryField]: country || '',
                            [stateField]: state || '',
                            [cityField]: city || ''
                        }
                        formik.setValues(updatedValues)

                        const touchedFields = {
                            ...formik.touched,
                            [countryField]: true,
                            [stateField]: true,
                            [cityField]: true
                        }
                        formik.setTouched(touchedFields, false)

                        if (prefix === 'b') {
                            setBAvailableCities([{ value: city, label: city }])
                            setBAvailableStates([{ value: state, label: state }])
                        }

                        setTimeout(() => {
                            formik.setFieldValue(pincodeField, pincode)
                            formik.validateForm()
                        }, 100)
                    } else {
                        formik.setFieldValue(prefix ? `${prefix}country` : 'country', '')
                        formik.setFieldValue(prefix ? `${prefix}state` : 'state', '')
                        formik.setFieldValue(prefix ? `${prefix}city` : 'city', '')
                    }
                } catch (error) {
                    formik.setFieldValue(prefix ? `${prefix}country` : 'country', '')
                    formik.setFieldValue(prefix ? `${prefix}state` : 'state', '')
                    formik.setFieldValue(prefix ? `${prefix}city` : 'city', '')
                }
            }
        },
        [fetchPincodeDetails, setBAvailableCities, setBAvailableStates]
    )

    const getMasterClient = async id => {
        const { data, error } = await dispatch(getMasterClientById.initiate(id, { meta: { disableLoader: false } }))
        if (error) return true
        if (!data || !data?.data || !objectLength(data.data)) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.data?.message || 'Unable to find client data for given id',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            navigate(-1)
        }
        setEditData(data.data)
        return true
    }

    // const isTabDisabled = tabIndex => !tabsEnabled[tabIndex]

    // set route label when page load initially
    useEffect(() => {
        const initialData = [
            { label: 'Account', path: '/' },
            { label: 'Master', path: '/master-account' }
        ]

        // Dispatch the setRouteLabel action with the initial data
        dispatch(setRouteLabel(initialData))
    }, [dispatch])

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (e.target.type === 'file') {
            handleFileChange(e, name)
        } else if (name === 'bpostcode') {
            handlePincodeChange(value, formik, 'b')
        } else {
            formik.handleChange(e) // For other fields, use normal formik.handleChange
        }
    }

    const editHandler = async (id, row) => {
        const newRow = {}
        if ('id' in row) setClientId(row.id)
        if ('bpostcode' in row && row.bpostcode) await handlePincodeChange(row.bpostcode.toString(), formik, 'b')

        Object.keys(row).map(rowKey => {
            if (rowKey === 'fields' && row[rowKey]) {
                if (row[rowKey].startsWith('[')) setKeyValuePairs(JSON.parse(row[rowKey]))
                else setKeyValuePairs([JSON.parse(row[rowKey])])
            } else if (row[rowKey]) {
                newRow[rowKey] = row[rowKey].toString()
            } else newRow[rowKey] = ''

            return rowKey
        })

        formik.setValues({ ...newRow, tabId: 'basicInformation' })
        if ('logo' in row && row.logo && typeof row.logo.trim() === 'string') {
            try {
                const { data, error, isLoading } = await dispatch(
                    fetchFileAsBlob.initiate({ endpoint: row.logo, name: row.logo }, { meta: { disableLoader: true } })
                )
                formik.setFieldValue('logo', data)
                setStoredFiles(prev => ({ ...prev, logo: data }))
            } catch (error) {
                alert('unable to fetch file from server! ☹️')
            }
        }

        if ('signature' in row && row.signature && typeof row.signature.trim() === 'string') {
            try {
                const { data, error, isLoading } = await dispatch(
                    fetchFileAsBlob.initiate(
                        { endpoint: row.signature, name: row.signature },
                        { meta: { disableLoader: true } }
                    )
                )
                formik.setFieldValue('signature', data)
                setStoredFiles(prev => ({ ...prev, signature: data }))
            } catch (error) {
                alert('unable to fetch file from server! ☹️')
            }
        }

        if ('agreement' in row && row.agreement && typeof row.agreement.trim() === 'string') {
            try {
                const { data, error, isLoading } = await dispatch(
                    fetchFileAsBlob.initiate(
                        { endpoint: row.agreement, name: row.agreement },
                        { meta: { disableLoader: true } }
                    )
                )
                formik.setFieldValue('agreement', data)
                setStoredFiles(prev => ({ ...prev, agreement: data }))
            } catch (error) {
                alert('unable to fetch file from server! ☹️')
            }
        }

        // TODO:
        // ? scroll the page to top

        const updatedTabs = tabsFields.map((field, tabIndex) => {
            const tabArrays = field.fields.filter(fieldItem => fieldItem?.required && row[fieldItem.name])
            return !!tabArrays.length
        })
        setTabsEnabled(updatedTabs)
    }

    // this useEffect handles edit data
    useEffect(() => {
        const path = window.location.pathname
        if (editData && objectLength(editData)) editHandler(formId, editData)
        if (!formId && !path.includes('create') && !objectLength(editData)) navigate(-1) // never happening
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editData])

    useEffect(() => {
        if (formId) getMasterClient(formId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId])

    const notes = [
        {
            id: 'n1',
            text: 'Enter the Company Name (minimum 2 characters required).'
        },
        {
            id: 'n2',
            text: 'Enter the BD Name (minimum 2 characters required).'
        },
        {
            id: 'n3',
            text: 'Provide a valid 10-digit BD Contact Number.'
        },
        {
            id: 'n4',
            text: 'Enter a valid BD Email Address (e.g., example@domain.com).'
        },
        {
            id: 'n5',
            text: 'Select the Industry (this field is required).'
        },
        {
            id: 'n6',
            text: 'Optionally, upload a Logo file.'
        },
        {
            id: 'n7',
            text: 'Optionally, upload a Signature file.'
        },
        {
            id: 'n8',
            text: 'Enter the Contact Person Name (minimum 2 characters required).'
        },
        {
            id: 'n9',
            text: 'Enter the Business Address (minimum 3 characters required).'
        },
        {
            id: 'n10',
            text: 'Enter the Business Country, State, City, and Pincode (required fields).'
        },
        {
            id: 'n11',
            text: 'Enter a valid Email Address for the Business (required, e.g., business@domain.com).'
        },
        {
            id: 'n12',
            text: 'Provide a valid 10-digit Business Phone number.'
        },
        {
            id: 'n13',
            text: 'Enter a valid GST Number (e.g., 22ABCDE1234F1Z5).'
        },
        {
            id: 'n14',
            text: 'Optionally, provide a valid TIN Number (e.g., 12345678901234).'
        },
        {
            id: 'n15',
            text: 'Optionally, enter a valid CIN Number (e.g., L12345MH1990PLC123456).'
        },
        {
            id: 'n16',
            text: 'Optionally, provide a valid PAN Number (e.g., ABCDE1234F).'
        },
        {
            id: 'n17',
            text: 'Optionally, provide a valid FSSAI Number.'
        },
        {
            id: 'n18',
            text: 'Optionally, upload an Agreement file.'
        },
        {
            id: 'n19',
            text: 'Enter the Currency Code (required, e.g., INR, USD).'
        },
        {
            id: 'n20',
            text: 'Optionally, provide additional fields in the format of key-value pairs.'
        }
    ]

    const identityCardData = [
        { label: 'Company Name', value: formik.values?.name ?? 'N/A' },
        { label: 'BD Name', value: formik.values?.bd_name ?? 'N/A' },
        { label: 'BD Contact Number', value: formik.values?.bd_contact_number ?? 'N/A' },
        { label: 'Business Address', value: formik.values?.baddress ?? 'N/A' },
        { label: 'GST Number', value: formik.values?.gst_no ?? 'N/A' }
    ]

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {/* <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            indicatorColor='primary'
                            textColor='primary'
                            variant='fullWidth'
                        >
                            {tabsFields.map((tab, index) => (
                                <Tab key={tab.label} label={tab.label} />
                            ))}
                        </Tabs> */}
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields}
                            tabsEnabled={tabsEnabled}
                        />
                        <Box>
                            <FormComponent
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createMasterClientLKey || updateMasterClientLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right'
                                }}
                                submitButtonText={activeTab === tabLabels.length - 1 ? 'Submit' : 'Save & Next'}
                                showSeparaterBorder={false}
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
                    <NotesInstructions notes={notes} customFontSize='14px' />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default MasterAccountSetupForm
