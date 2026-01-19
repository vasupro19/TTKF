import { useEffect, useState, useCallback } from 'react'
import { Box, Grid, Divider, Checkbox, FormControlLabel } from '@mui/material'
import { z } from 'zod'
import { useFormik } from 'formik'
import { useParams, useNavigate } from 'react-router-dom'
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import {
    useCreateClientMutation,
    useUpdateClientMutation,
    useFetchClientsMutation,
    getClientById
} from '@app/store/slices/api/clientSlice'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setRouteLabel } from '@app/store/slices/routeLabel'
import { objectLength } from '@/utilities'
import { expressions } from '@/constants'
import NotesInstructions from '@/core/components/NotesInstructions'
import IdentityCard from '@/core/components/IdentityCard'
import MyTabs from '@/core/components/CapsuleTabs'

// import { useCsrfMutation } from '@app/store/slices/api/csrfSlice'

function ClientMasterForm() {
    const navigate = useNavigate()
    const { id: formId } = useParams()
    const dispatch = useDispatch()
    const { updateClientLKey, createClientLKey } = useSelector(state => state.loading)
    const [editData, setEditData] = useState({})
    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false, false])
    const [clientsData, setClientsData] = useState([])
    const [isSameAddress, setIsSameAddress] = useState(false)
    const [locations, setLocations] = useState([])
    const [clientId, setClientId] = useState(null)
    const [createClient] = useCreateClientMutation()
    const [updateClient] = useUpdateClientMutation()
    const [fetchClient] = useFetchClientsMutation()
    // const [csrf] = useCsrfMutation()

    const tabLabels = ['businessInformation']

    const initialValues = {
        // tabId: 'businessInformation',
        name: '',
        email: '',
        phoneNumber: '',
        address: ''
        // role_id: '2'
    }

    const validationSchema = [
        z.object({
            name: z.string().superRefine((val, ctx) => {
                const input = val.trim()
                if (!input) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Business Name is required'
                    })
                } else if (input.length < 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Must be at least 3 characters'
                    })
                }
            }),
            email: z.string().min(1, 'Ext. Client Code is required'),
            phoneNumber: z.string().min(1, 'Master Client is required'),
            address: z.string().optional()
        })
        // z.object({
        //     bContactPerson: z.string().min(2, 'Contact Person is required'),
        //     bphone: z
        //         .string()
        //         .min(10, 'Phone No must be at least 10 digits')
        //         .max(15, 'Phone No must be less than 15 digits'),
        //     baddress: z.string().min(3, 'Address is required'),
        //     bpostcode: z.string().min(5, 'Pincode must be at least 5 digits'),
        //     bcountry: z.string().min(2, 'Country is required'),
        //     bcity: z.string().min(2, 'City is required'),
        //     bstate: z.string().min(2, 'State is required'),
        //     bemail: z
        //         .string()
        //         .optional()
        //         .refine(val => !val || expressions.email.test(val), {
        //             message: 'Invalid email format'
        //         })
        // }),
        // z.object({
        //     sContactPerson: z.string().min(2, 'Contact Person is required'),
        //     sphone: z
        //         .string()
        //         .min(10, 'Phone No must be at least 10 digits')
        //         .max(15, 'Phone No must be less than 15 digits'),
        //     saddress: z.string().min(4, 'Address is required'),
        //     spostcode: z.string().min(5, 'Pincode must be at least 5 digits'),
        //     scountry: z.string().min(2, 'Country is required'),
        //     scity: z.string().min(2, 'City is required'),
        //     sstate: z.string().min(2, 'State is required'),
        //     semail: z
        //         .string()
        //         .optional()
        //         .refine(val => !val || expressions.email.test(val), {
        //             message: 'Invalid email format'
        //         })
        // }),
        // z.object({
        //     partner: z.string().superRefine((val, ctx) => {
        //         const input = val.trim()

        //         if (input && input.length < 5) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'Must at least be 5 characters'
        //             })
        //         }
        //     }),
        //     gst_no: z.string().superRefine((val, ctx) => {
        //         if (!val.trim()) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'GST No. is required'
        //             })
        //         } else if (!expressions.gst.test(val)) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'Invalid GST no.'
        //             })
        //         }
        //     }),
        //     fssai_no: z.string().superRefine((val, ctx) => {
        //         if (!val.trim()) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'FSSAI No. is required'
        //             })
        //         } else if (!expressions.fssai.test(val)) {
        //             ctx.addIssue({
        //                 code: z.ZodIssueCode.custom,
        //                 message: 'Invalid FSSAI no.'
        //             })
        //         }
        //     }),
        //     tin_no: z
        //         .string()
        //         .optional()
        //         .refine(val => !val || expressions.tin.test(val), {
        //             message: 'Invalid TIN no'
        //         }),
        //     cin_no: z
        //         .string()
        //         .optional()
        //         .refine(val => !val || expressions.cin.test(val), {
        //             message: 'Invalid CIN no'
        //         }),
        //     pan_no: z
        //         .string()
        //         .optional()
        //         .refine(val => !val || expressions.pan.test(val), {
        //             message: 'Invalid PAN no'
        //         })
        // })
    ]

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    // Pre-fetch countries and locations
    // useEffect(() => {
    //     const fetchInitialData = async () => {
    //         try {
    //             const clients = await fetchClient().unwrap()
    //             setClientsData(clients.data.masterClients)

    //             // const locationData = await fetchLocation().unwrap()
    //             // setLocations(locationData.data)
    //         } catch (error) {
    //             // eslint-disable-next-line no-console
    //             console.error('Failed to fetch initial data:', error)
    //         }
    //     }

    //     fetchInitialData()
    // }, [fetchClient])

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
                let response
                if (activeTab === 0 && !clientId) {
                    response = await createClient(values).unwrap()
                    const newClientId = response.data.id
                    setClientId(newClientId)
                    formik.setFieldValue('tabId', tabLabels[1])
                    enableTabsAfterValidation(1)
                    setActiveTab(1)
                } else if (clientId) {
                    if (activeTab < tabLabels.length - 1) {
                        response = await updateClient({ id: clientId, ...values }).unwrap()
                        const nextTab = activeTab + 1
                        formik.setFieldValue('tabId', tabLabels[nextTab])
                        enableTabsAfterValidation(nextTab)
                        setActiveTab(nextTab)
                    } else {
                        response = await updateClient({ id: clientId, ...values, action: 'submit' }).unwrap()
                        formik.resetForm()
                        setActiveTab(0)
                        setTabsEnabled([true, false, false, false])
                        navigate(-1)
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
        validateOnBlur: true,
        validateOnChange: true
    })

    // Handle tab change, validate current tab before switching
    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
        }
    }

    // const isTabDisabled = tabIndex => !tabsEnabled[tabIndex]

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
    const tabsFields = [
        {
            label: 'Client Information',
            fields: [
                {
                    name: 'name',
                    label: 'Client Name',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'email',
                    label: 'Email',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'phoneNumber',
                    label: 'Phone Number',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'address',
                    label: 'Address',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'password',
                    label: 'Password',
                    type: 'text',
                    required: true,
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                }
            ]
        }
    ]
    const getClient = async id => {
        const { data, error } = await dispatch(getClientById.initiate(id))
        console.log(data)
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
    const editHandler = async (id, row) => {
        const newRow = {}
        if ('id' in row) setClientId(row.id)

        Object.keys(row).map(rowKey => {
            if (row[rowKey]) {
                newRow[rowKey] = row[rowKey].toString()
            } else newRow[rowKey] = ''

            return rowKey
        })
        formik.setValues({ ...newRow, tabId: 'businessInformation' })

        // TODO:
        // ? scroll the page to top

        const updatedTabs = tabsFields.map(field => {
            const tabArrays = field.fields.filter(fieldItem => fieldItem?.required && row[fieldItem.name])
            return !!tabArrays.length
        })
        setTabsEnabled(updatedTabs)
    }

    // set route label when page load initially
    useEffect(() => {
        const initialData = [
            { label: 'Account', path: '/' },
            { label: 'Client', path: '/master-client' }
        ]

        // Dispatch the setRouteLabel action with the initial data
        dispatch(setRouteLabel(initialData))
    }, [dispatch])
    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        // Trigger handlePincodeChange only for pincode fields

        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }

    // this useEffect handles edit data
    useEffect(() => {
        const path = window.location.pathname
        if (editData && objectLength(editData)) editHandler(formId, editData)
        if (!formId && !path.includes('create') && !objectLength(editData)) navigate(-1) // never happening
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editData])

    useEffect(() => {
        if (formId) getClient(formId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId])

    const identityCardData = [
        { label: 'Client Name', value: formik.values?.name || 'N/A' },
        { label: 'Email', value: formik.values?.email ?? 'N/A' },
        { label: 'Phone No', value: formik.values?.phone_no || 'N/A' },
        { label: 'Address', value: formik.values?.address || 'N/A' }
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        {/* <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            indicatorColor='primary'
                            textColor='primary'
                            variant='fullWidth'
                        >
                            {tabsFields.map((tab, index) => (
                                <Tab key={tab.label} label={tab.label} disabled={isTabDisabled(index)} />
                            ))}
                        </Tabs> */}
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields}
                            tabsEnabled={tabsEnabled}
                        />

                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createClientLKey || updateClientLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonText='Submit'
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: 2
                                }}
                                showSeparaterBorder={false}
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
                                                checked={isSameAddress}
                                                onChange={e => {
                                                    setIsSameAddress(e.target.checked)
                                                    if (e.target.checked) {
                                                        // Copy billing to shipping when checked
                                                        formik.setValues({
                                                            ...formik.values,
                                                            sContactPerson: formik.values.bContactPerson,
                                                            sphone: formik.values.bphone,
                                                            saddress: formik.values.baddress,
                                                            spostcode: formik.values.bpostcode,
                                                            scountry: formik.values.bcountry,
                                                            sstate: formik.values.bstate,
                                                            scity: formik.values.bcity,
                                                            semail: formik.values.bemail
                                                        })
                                                    }
                                                }}
                                                color='primary'
                                            />
                                        }
                                        label='Copy Billing Address to Shipping Address'
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
                    {/* <NotesInstructions notes={notes} customFontSize='14px' /> */}
                </Grid>
            </Grid>
        </MainCard>
    )
}
export default ClientMasterForm
