import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { z } from 'zod'
import { leadPhoneToSave, phoneProblem } from '@/utilities/phone'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Box, Button, CircularProgress, MenuItem, Stack, Typography } from '@mui/material'

// components
import MainCard from '@core/components/extended/MainCard'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { useCreateLeadMutation, getLeadById, useUpdateLeadMutation } from '@/app/store/slices/api/leadSlice'
import { useGetUsersQuery } from '@/app/store/slices/api/usersSlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import LeadField from './LeadField'

const LEAD_SOURCES = [
    { label: 'Added by hand', value: 'Manual' },
    { label: 'Phone call', value: 'Call' },
    { label: 'Walk-in', value: 'Walk-in' },
    { label: 'Referral', value: 'Referral' },
    { label: 'Website', value: 'Website' },
    { label: 'Facebook', value: 'Facebook' },
    { label: 'Instagram', value: 'Instagram' },
    { label: 'Other', value: 'Other' }
]

function LeadsForm() {
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // ? lists are paged at 25 by default: the 26th user or campaign could not be chosen
    const { data: users = [] } = useGetUsersQuery('?length=200')
    const { data: campaignsData = [] } = useGetCampaignsQuery('?length=200')
    const [editData, setEditData] = useState({})
    const { createLeadLKey, updateLeadLKey } = useSelector(state => state.loading)
    const { user } = useSelector(state => state.auth)

    const [leadId, setLeadId] = useState(null)

    const [createLead] = useCreateLeadMutation()
    const [updateLead] = useUpdateLeadMutation()

    // ? the team member row for this login, matched by email — the login's own id belongs to another table; with no match the server works it out
    const clientUserId = users?.data?.find(teamUser => teamUser.email === user?.email)?.id

    const userOptions =
        users?.data?.map(teamUser => ({
            label: teamUser.name, // change field accordingly
            value: teamUser.id
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
        leadSource: 'Manual',
        leadStatus: '',
        remarks: '',
        assignedTo: '',
        campaignId: '',
        followupdate: '',
        followupremarks: ''
    }

    // ? only a name and a phone number are needed; the email is checked only when one is typed
    const schema = z.object({
        fullName: z.string().trim().min(1, 'Enter the guest’s name'),
        // ? one rule for every phone in the app (utilities/phone.js): 10 digits for India, or a foreign number
        phone: z
            .string()
            .trim()
            .min(1, 'Enter a phone number')
            .superRefine((val, ctx) => {
                const problem = phoneProblem(val)
                if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem })
            }),
        senderEmail: z.union([z.literal(''), z.string().trim().email('Enter a valid email, or leave it empty')])
    })

    const validate = values => {
        const parsed = schema.safeParse(values)
        if (parsed.success) return {}
        const formikErrors = {}
        parsed.error.errors.forEach(err => {
            if (!formikErrors[err.path[0]]) formikErrors[err.path[0]] = err.message
        })
        // ? an older lead's number, left as it was, doesn't stop the rest of the lead being saved
        if (formikErrors.phone && editData?.phone && values.phone === String(editData.phone)) delete formikErrors.phone
        return formikErrors
    }

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async values => {
            try {
                if (!formId) {
                    await createLead({
                        ...values,
                        fullName: values.fullName.trim(),
                        phone: leadPhoneToSave(values.phone),
                        updatedBy: clientUserId
                    }).unwrap()
                } else {
                    // ? saved as "+919876543210" however it was typed: one format for search and WhatsApp links
                    await updateLead({
                        id: leadId,
                        ...values,
                        phone: leadPhoneToSave(values.phone),
                        updatedBy: clientUserId
                    }).unwrap()
                    formik.resetForm()
                }
                dispatch(
                    openSnackbar({
                        open: true,
                        message: formId ? 'Lead updated' : 'Lead created',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                navigate(-1)
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.message || error.data?.data?.message || 'Something went wrong',
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
        Object.keys(initialValues).forEach(key => {
            formatted[key] = row[key] ? row[key].toString() : ''
        })
        if (row?.upcomingCall?.scheduledFor) {
            // ? local time for the datetime field (toISOString gave UTC, 5:30 behind)
            formatted.followupdate = dayjs(row.upcomingCall.scheduledFor).format('YYYY-MM-DDTHH:mm')
            formatted.followupremarks = row.upcomingCall.description || ''
        }
        formik.setValues({ ...formatted })
    }

    useEffect(() => {
        if (formId) getLead(formId)
    }, [formId])

    useEffect(() => {
        if (editData && objectLength(editData)) editHandler(formId, editData)
    }, [editData])

    // ? a new lead goes to the person adding it unless they choose someone else
    useEffect(() => {
        if (!formId && clientUserId && !formik.values.assignedTo)
            formik.setFieldValue('assignedTo', String(clientUserId))
    }, [formId, clientUserId])

    const saving = Boolean(createLeadLKey || updateLeadLKey)

    const section = (title, hint, children) => (
        <Box
            component='section'
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 2.5 }}
        >
            <Typography component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                {title}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                {hint}
            </Typography>
            {children}
        </Box>
    )

    const columns = { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ maxWidth: 780, '& .MuiButton-root': { textTransform: 'none' } }}>
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.8125rem', letterSpacing: '0.08em', fontWeight: 600 }}
                >
                    {formId ? 'EDIT LEAD' : 'NEW LEAD'}
                </Typography>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, mt: 0.5 }}>
                    {formId ? 'Edit lead' : 'Add a lead'}
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5, mb: 3 }}>
                    Only a name and a phone number are needed. Add the rest now, or later.
                </Typography>

                <Box component='form' noValidate onSubmit={formik.handleSubmit}>
                    {section(
                        'Who is it?',
                        'The guest who enquired.',
                        <Box sx={columns}>
                            <LeadField formik={formik} name='fullName' label='Full name' required />
                            <LeadField
                                formik={formik}
                                name='phone'
                                label='Phone number'
                                type='tel'
                                required
                                placeholder='98765 43210 or +44 7911 123456'
                                helperText='10 digits for India, or the full number with country code'
                            />
                            <LeadField
                                formik={formik}
                                name='senderEmail'
                                label='Email (optional)'
                                type='email'
                                helperText='Needed later to email the quotation'
                                wide
                            />
                        </Box>
                    )}

                    {section(
                        'What are they asking about?',
                        'All optional — it helps the quotation later.',
                        <Box sx={columns}>
                            <LeadField formik={formik} name='campaignId' label='Campaign' select>
                                <MenuItem value=''>None</MenuItem>
                                {campaignOptions.map(option => (
                                    <MenuItem key={option.value} value={String(option.value)}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </LeadField>
                            <LeadField formik={formik} name='leadSource' label='How did they reach you?' select>
                                {LEAD_SOURCES.map(source => (
                                    <MenuItem key={source.value} value={source.value}>
                                        {source.label}
                                    </MenuItem>
                                ))}
                            </LeadField>
                            <LeadField
                                formik={formik}
                                name='remarks'
                                label='Notes'
                                placeholder='Anything the guest said'
                                multiline
                                wide
                            />
                        </Box>
                    )}

                    {section(
                        'Who follows up?',
                        'The lead goes to the person you choose, and can have a call reminder.',
                        <Box sx={columns}>
                            <LeadField
                                formik={formik}
                                name='assignedTo'
                                label='Assigned to'
                                helperText='Yourself, unless you choose someone else'
                                select
                            >
                                <MenuItem value=''>Me</MenuItem>
                                {userOptions.map(option => (
                                    <MenuItem key={option.value} value={String(option.value)}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </LeadField>
                            <LeadField
                                formik={formik}
                                name='followupdate'
                                label='Schedule a call (optional)'
                                type='datetime-local'
                            />
                            <LeadField
                                formik={formik}
                                name='followupremarks'
                                label='What to discuss on the call'
                                placeholder='Optional'
                                wide
                            />
                        </Box>
                    )}

                    <Stack direction='row' spacing={1.5} justifyContent='flex-end'>
                        <Button onClick={() => navigate(-1)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            variant='contained'
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                        >
                            {formId ? 'Save changes' : 'Create lead'}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </MainCard>
    )
}

export default LeadsForm
