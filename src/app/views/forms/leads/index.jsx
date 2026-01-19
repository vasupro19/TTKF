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
import MyTabs from '@/core/components/CapsuleTabs'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { useCreateLeadMutation, getLeadById, useUpdateLeadMutation } from '@/app/store/slices/api/leadSlice'
import { useGetUsersQuery } from '@/app/store/slices/api/usersSlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'

function LeadsForm() {
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { data: users = [] } = useGetUsersQuery()
    const { data: campaignsData = [] } = useGetCampaignsQuery()
    const [editData, setEditData] = useState({})
    const { createLeadLKey, updateLeadLKey } = useSelector(state => state.loading)

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState([true, false])
    const [leadId, setLeadId] = useState(null)

    const [createLead] = useCreateLeadMutation()
    const [updateLead] = useUpdateLeadMutation()

    const tabLabels = ['leadInfo', 'followUpDetails']
    const userOptions =
        users?.data?.map(user => ({
            label: user.name, // change field accordingly
            value: user.id
        })) ?? []

    const campaignOptions =
        campaignsData?.data?.map(camp => ({
            label: camp.title, // change field accordingly
            value: camp.id
        })) ?? []

    // Initial Values
    const initialValues = {
        fullName: '',
        phone: '',
        senderEmail: '',
        leadSource: '',
        leadStatus: '',
        remarks: '',
        assignedTo: '',
        campaignName: ''
    }

    // Validation schema per tab
    const validationSchema = [
        z.object({
            fullName: z.string().nonempty('Full name is required').min(3, 'Must be at least 3 characters'),
            phone: z.number().min(10, 'Must be 10 digits'),
            senderEmail: z.string().email('Invalid email').optional()
        }),
        z.object({
            followupdate: z.string().optional(),
            followupremarks: z.string().optional()
        })
    ]

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

    const enableTabsAfterValidation = upToIndex => {
        const updated = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updated)
    }

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async values => {
            try {
                let response
                if (!formId) {
                    response = await createLead(values).unwrap()
                    setLeadId(response.data.id)
                    navigate(-1)

                    setActiveTab(0)
                    enableTabsAfterValidation(1)
                } else {
                    response = await updateLead({ id: leadId, ...values }).unwrap()
                    formik.resetForm()
                    setActiveTab(0)
                    setTabsEnabled([true, false])
                    navigate(-1)
                }

                if (response.success && response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Lead saved successfully!',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.data?.message || 'Something went wrong',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true,
        validate
    })

    const handleTabChange = (event, newVal) => {
        if (tabsEnabled[newVal]) setActiveTab(newVal)
    }

    const getLead = async id => {
        const { data, error } = await dispatch(getLeadById.initiate(id))
        if (error) return
        if (!data?.data || !objectLength(data.data)) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Unable to find lead details',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            navigate(-1)
        }
        setEditData(data.data)
    }

    const editHandler = (id, row) => {
        setLeadId(row.id)
        const formatted = {}
        Object.keys(row).forEach(key => {
            formatted[key] = row[key] ? row[key].toString() : ''
        })
        formik.setValues({ ...formatted })
        enableTabsAfterValidation(1)
    }

    useEffect(() => {
        if (formId) getLead(formId)
    }, [formId])

    useEffect(() => {
        if (editData && objectLength(editData)) editHandler(formId, editData)
    }, [editData])

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px'
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray'
        },
        flexGrow: 1
    }

    const tabsFields = [
        {
            label: 'Lead Information',
            fields: [
                {
                    name: 'fullName',
                    label: 'Full Name',
                    type: 'text',
                    placeholder: 'Enter full name',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'phone',
                    label: 'Phone Number',
                    type: 'number',
                    placeholder: 'Enter phone number',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'senderEmail',
                    label: 'Email',
                    type: 'email',
                    placeholder: 'Enter email',
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'assignedTo',
                    label: 'Assigned To',
                    type: 'select',
                    options: userOptions || [],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'leadSource',
                    label: 'Lead Source',
                    type: 'select',
                    options: [
                        { label: 'Select Source', value: '' },
                        { label: 'Website', value: 'Website' },
                        { label: 'Facebook', value: 'Facebook' },
                        { label: 'Referral', value: 'Referral' },
                        { label: 'Call', value: 'Call' },
                        { label: 'Other', value: 'Other' }
                    ],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'leadStatus',
                    label: 'Status',
                    type: 'select',
                    options: [{ label: 'pending', value: 'Pending' }],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'campaignId',
                    label: 'Campaign Name',
                    type: 'select',
                    options: campaignOptions || [],
                    grid: { xs: 12, sm: 4 },
                    size: 'small',
                    customSx
                },
                {
                    name: 'remarks',
                    label: 'Remarks',
                    type: 'text',
                    placeholder: 'Write remarks',
                    grid: { xs: 12 },
                    size: 'small',
                    customSx
                }
            ]
        }
        // {
        //     label: 'Follow-Up Details',
        //     fields: [
        //         {
        //             name: 'followupdate',
        //             label: 'Follow-Up Date',
        //             type: 'date',
        //             grid: { xs: 12, sm: 4 },
        //             size: 'small',
        //             customSx
        //         },
        //         {
        //             name: 'followupremarks',
        //             label: 'Follow-Up Remarks',
        //             type: 'text',
        //             placeholder: 'Enter remarks',
        //             grid: { xs: 12 },
        //             size: 'small',
        //             customSx
        //         }
        //     ]
        // }
    ]
    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target

        formik.handleChange(e)
    }
    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid container gap={4} sx={{ border: '1px solid #d0d0d0', px: 1.5, py: 2, borderRadius: '8px' }}>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                                submitting={createLeadLKey || updateLeadLKey}
                                submitButtonText={formId ? 'Update Lead' : 'Create Lead'}
                                submitButtonSx={{ textAlign: 'right', marginTop: 2 }}
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
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default LeadsForm
