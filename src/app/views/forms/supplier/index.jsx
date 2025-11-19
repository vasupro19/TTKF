import React, { useState, useCallback, useEffect } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Box, Divider, Grid } from '@mui/material'

// components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
// import DynamicLayout from '@core/components/forms/DynamicLayout'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    useCreateCampaignMutation,
    useUpdateLocationMasterMutation,
    getLocationMasterById
} from '@/app/store/slices/api/campaignSlice'
import { useFetchPincodeDetailsMutation } from '@app/store/slices/api/clientSlice'
import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'

import { expressions } from '@/constants'
import IdentityCard from '@/core/components/IdentityCard'
import NotesInstructions from '@/core/components/NotesInstructions'
import MyTabs from '@/core/components/CapsuleTabs'

// constants

function SupplierForm() {
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const [editData, setEditData] = useState({})
    const { createLocationMasterLKey, updateLocationMasterLKey } = useSelector(state => state.loading)

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false, false])
    const [clientId, setClientId] = useState(null)
    const [createCampaignMaster] = useCreateCampaignMutation()
    const [updateLocationMaster] = useUpdateLocationMasterMutation()
    const [fetchPincodeDetails] = useFetchPincodeDetailsMutation()
    const dispatch = useDispatch()
    const tabLabels = ['basicInformation', 'addressInformation', 'otherDetails']

    // Initial form values
    const initialValues = {
        tabId: 'basicInformation',
        title: '',
        description: ''
    }

    // Validation schema
    const validationSchema = [
        z.object({
            title: z.string().superRefine((val, ctx) => {
                const input = val.trim()
                if (!input) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Name is required'
                    })
                } else if (input.length < 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Must be at least 3 characters'
                    })
                }
            }),
            description: z.string().superRefine((val, ctx) => {
                const input = val.trim()
                if (!input) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Code is required'
                    })
                } else if (input.length < 3) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Must be at least 3 characters'
                    })
                }
            })
        })
    ]

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

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
                    response = await createCampaignMaster(values).unwrap()
                    setClientId(response.data.id)
                    formik.setFieldValue('tabId', tabLabels[1])
                    enableTabsAfterValidation(1)
                    setActiveTab(1)
                } else if (clientId) {
                    if (activeTab < tabLabels.length - 1) {
                        response = await updateLocationMaster({ id: clientId, ...values }).unwrap()
                        const nextTab = activeTab + 1
                        formik.setFieldValue('tabId', tabLabels[nextTab])
                        enableTabsAfterValidation(nextTab)
                        setActiveTab(nextTab)
                    } else {
                        response = await updateLocationMaster({ id: clientId, ...values, action: 'submit' }).unwrap()
                        formik.resetForm()
                        setActiveTab(0)
                        setTabsEnabled([true, false, false])
                        navigate('/setup/location')
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

                    // Map backend errors to Formik's error structure
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ') // Join multiple messages with a comma
                    })

                    formik.setErrors(formikErrors) // Update Formik's error state
                } else {
                    // Display general error in Snackbar if no specific validation errors
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.data?.message || 'An error occurred, please try again',
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

    const getLocation = async id => {
        const { data, error } = await dispatch(getLocationMasterById.initiate(id))
        if (error) return true
        if (!data || !data?.data || !objectLength(data.data)) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.data?.message || 'Unable to find location data for given id',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            // navigate(-1)
        }
        setEditData(data.data)
        return true
    }

    const handlePincodeChange = useCallback(
        // eslint-disable-next-line no-shadow
        async (pincode, formik) => {
            formik.setFieldValue('postcode', pincode)

            if (pincode.length >= 6) {
                try {
                    const response = await fetchPincodeDetails(pincode).unwrap()

                    if (response?.data) {
                        const { country, state, city } = response.data

                        formik.setValues({
                            ...formik.values,
                            postcode: pincode,
                            country: country || '',
                            state: state || '',
                            city: city || ''
                        })

                        formik.setTouched(
                            {
                                ...formik.touched,
                                country: true,
                                state: true,
                                city: true
                            },
                            false
                        )

                        setTimeout(() => {
                            formik.setFieldValue('postcode', pincode)
                            formik.validateForm()
                        }, 100)
                    } else {
                        formik.setFieldValue('country', '')
                        formik.setFieldValue('state', '')
                        formik.setFieldValue('city', '')
                    }
                } catch (error) {
                    formik.setFieldValue('country', '')
                    formik.setFieldValue('state', '')
                    formik.setFieldValue('city', '')
                }
            }
        },
        [fetchPincodeDetails]
    )

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (name === 'postcode') {
            handlePincodeChange(value, formik)
        } else {
            formik.handleChange(e)
        }
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
    const tabsFields = [
        {
            label: 'Create new service provider',
            fields: [
                {
                    name: 'businessname',
                    label: 'Business Name',
                    type: 'text',
                    placeholder: 'Enter Business Name',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'constactperson',
                    label: 'Contact Person',
                    type: 'text',
                    placeholder: 'Enter Contact Person',

                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'type',
                    label: 'Select',
                    type: 'select',
                    options: [
                        { label: 'Select Type', value: '' },
                        { label: 'Hotel', value: 'Hotel' },
                        { label: 'Taxi', value: 'Taxi' },
                        { label: 'Volvo', value: 'Volvo' },
                        { label: 'Other', value: 'Other' }
                    ],
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'address',
                    label: 'Address',
                    type: 'text',
                    placeholder: 'Enter Address',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'city',
                    label: 'City',
                    type: 'text',
                    placeholder: 'Enter City',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },

                {
                    name: 'remarks',
                    label: 'Remarks',
                    type: 'text',
                    placeholder: 'Enter Remarks',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx: {
                        textAlign: 'right'
                    }
                },
                {
                    name: 'email',
                    label: 'Enter email',
                    type: 'email',
                    placeholder: 'Enter email',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'phone',
                    label: 'Enter phone number',
                    type: 'number',
                    placeholder: 'Enter phone number',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'website',
                    label: 'Website',
                    type: 'url',
                    placeholder: 'Enter Website',
                    grid: { xs: 12, sm: 4, md: 4 },
                    size: 'small',
                    customSx
                }

                // {
                //     name: 'cost_center',
                //     label: 'Cost Center',
                //     type: 'text',
                //     required: false,
                //     grid: { xs: 12, sm: 4, md: 4 },
                //     size: 'small',
                //     customSx
                // },
                // {
                //     name: 'Wh_manager_name',
                //     label: 'WH Manager Name',
                //     type: 'text',
                //     required: false,
                //     grid: { xs: 12, sm: 4, md: 4 },
                //     size: 'small',
                //     customSx
                // }
            ]
        }
        // {
        //     label: 'Address Information',
        //     fields: [
        //         {
        //             name: 'address',
        //             label: 'Address',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'postcode',
        //             label: 'Postcode',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'country',
        //             label: 'Country',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'zone',
        //             label: 'Zone',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'state',
        //             label: 'State',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'city',
        //             label: 'City',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'phone',
        //             label: 'Phone',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'email',
        //             label: 'Email',
        //             type: 'email',
        //             required: false,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         }
        //     ]
        // },
        // {
        //     label: 'Other Details',
        //     fields: [
        //         {
        //             name: 'latitude',
        //             label: 'Latitude',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'longitude',
        //             label: 'Longitude',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'gst_no',
        //             label: 'GST No',
        //             type: 'text',
        //             required: true,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'tin_no',
        //             label: 'TIN No',
        //             type: 'text',
        //             required: false,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'cin_no',
        //             label: 'CIN No',
        //             type: 'text',
        //             required: false,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'pan_no',
        //             label: 'PAN No',
        //             type: 'text',
        //             required: false,
        //             grid: { xs: 12, sm: 4, md: 4 },
        //             size: 'small',
        //             customSx
        //         }
        //     ]
        // }
    ]

    const editHandler = async (id, row) => {
        const newRow = {}
        if ('id' in row) setClientId(row.id)
        if ('postcode' in row && row.postcode) await handlePincodeChange(row.postcode.toString(), formik, 'b')
        // if ('spostcode' in row) await handlePincodeChange(row.spostcode.toString(), formik, 's')

        Object.keys(row).map(rowKey => {
            if (row[rowKey]) {
                newRow[rowKey] = row[rowKey].toString()
            } else newRow[rowKey] = row[rowKey] || ''
            return rowKey
        })
        formik.setValues({ ...newRow, tabId: 'basicInformation' })

        // TODO:
        // ? scroll the page to top

        const updatedTabs = tabsFields.map(field => {
            const tabArrays = field.fields.filter(fieldItem => fieldItem?.required && row[fieldItem.name])
            return !!tabArrays.length
        })
        setTabsEnabled(updatedTabs)
    }

    // this useEffect handles edit data
    // useEffect(() => {
    //     const path = window.location.pathname
    //     if (editData && objectLength(editData)) editHandler(formId, editData)
    //     if (!formId && !path.includes('create') && !objectLength(editData)) navigate(-1) // never happening
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [editData])

    // useEffect(() => {
    //     if (formId) getLocation(formId)
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [formId])

    const identityCardData = [
        { label: 'Location Name', value: formik.values?.name ?? 'N/A' },
        { label: 'Code', value: formik.values?.code ?? 'N/A' },
        { label: 'Cost Center', value: formik.values?.cost_center || 'N/A' },
        { label: 'WH Manager Name', value: formik.values?.Wh_manager_name || 'N/A' },
        { label: 'Address', value: formik.values?.address || 'N/A' }
    ]

    const notes = [
        { id: 'n1', text: 'Enter the Location Name (minimum 3 characters required).' },
        { id: 'n2', text: 'Enter the Code (minimum 3 characters required).' },
        { id: 'n3', text: 'Optionally, provide the Cost Center and WH Manager Name.' },
        { id: 'n4', text: 'Enter the Address (minimum 5 characters required).' },
        { id: 'n5', text: 'Country, Zone, State, City, and Postcode are required fields.' },
        { id: 'n6', text: 'Enter a valid Phone number (required).' },
        { id: 'n7', text: 'Optionally, provide an Email Address (if provided, it must be in a valid format).' },
        { id: 'n8', text: 'Enter the Latitude and Longitude in valid formats (e.g., 37.7749, -122.4194).' },
        { id: 'n9', text: 'Enter a valid GST Number (e.g., 22ABCDE1234F1Z5).' },
        { id: 'n10', text: 'Enter a valid TIN Number (e.g., 12345678901234).' },
        { id: 'n11', text: 'Enter a valid CIN Number (e.g., L12345MH1990PLC123456).' },
        { id: 'n12', text: 'Enter a valid PAN Number (e.g., ABCDE1234F).' }
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
                {/* <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} />
                    </Grid>
                </Grid> */}
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {/* <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            indicatorColor='primary'
                            textColor='primary'
                            variant='fullWidth'
                        >
                            {tabsFields.map(tab => (
                                <Tab key={tab.label} label={tab.label} />
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
                                submitting={createLocationMasterLKey || updateLocationMasterLKey}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonText={activeTab < 2 ? 'Save & Next' : 'Submit'}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: 2
                                }}
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
                    {/* <NotesInstructions notes={notes} customFontSize='14px' /> */}
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default SupplierForm
