import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { z } from 'zod'
import { leadPhoneToSave, phoneProblem } from '@/utilities/phone'
import { useFormik } from 'formik'

// router
import { useParams, useNavigate } from 'react-router-dom'

// theme components
import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'

// components
import MainCard from '@core/components/extended/MainCard'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import {
    useCreateLeadMutation,
    getLeadById,
    useGetAssigneesQuery,
    useGetLeadAccessQuery,
    useUpdateLeadMutation,
    useUpdateLeadPlacesMutation
} from '@/app/store/slices/api/leadSlice'
import { useGetUsersQuery } from '@/app/store/slices/api/usersSlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { useAssistAiMutation } from '@/app/store/slices/api/aiSlice'
import { useCreateGuestDetailMutation } from '@/app/store/slices/api/guestSlice'
import { useGetDestinationClientsQuery } from '@/app/store/slices/api/destinationSlice'
import useVehicles from '@/app/views/vehicles/useVehicles'

import { openSnackbar } from '@app/store/slices/snackbar'

import { objectLength } from '@/utilities'
import FormField from '@core/components/FormField'
import FormSection, { formColumns } from '@core/components/FormSection'
import { buildEnquiryRequest, hasTripDetails, readEnquiry } from './enquiryReader'
import { toGuestPayload, tripSummary } from '../guestDetailsForm/tripDetails'
import { parseAiReply } from '../guestDetailsForm/aiPackage'
import PlacesField from './PlacesField'
import { cleanPlaces, placeOptions, samePlaces } from './places'

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
    const { data: access } = useGetLeadAccessQuery()
    // ? who this person may give a lead to: anyone for admins and managers, only themselves for staff
    const { data: assignees } = useGetAssigneesQuery()
    const { names: vehicleNames } = useVehicles()
    const [assistAi] = useAssistAiMutation()
    const [createGuest] = useCreateGuestDetailMutation()
    // ? "Paste the enquiry": the text, and the trip read from it (saved as the new lead's trip details)
    const [enquiry, setEnquiry] = useState('')
    const [readingEnquiry, setReadingEnquiry] = useState(false)
    const [enquiryTrip, setEnquiryTrip] = useState(null)
    const [enquiryNote, setEnquiryNote] = useState(null)
    const [editData, setEditData] = useState({})
    // ? the places the guest wants ("Shimla 2N, Manali 3N"): the route "Create package with AI" plans
    const [places, setPlaces] = useState([])
    const { data: destinations } = useGetDestinationClientsQuery('?length=500')
    const [updateLeadPlaces] = useUpdateLeadPlacesMutation()
    const { createLeadLKey, updateLeadLKey } = useSelector(state => state.loading)
    const { user } = useSelector(state => state.auth)

    const [leadId, setLeadId] = useState(null)

    const [createLead] = useCreateLeadMutation()
    const [updateLead] = useUpdateLeadMutation()

    // ? the team member row for this login, matched by email — the login's own id belongs to another table; with no match the server works it out
    const clientUserId = users?.data?.find(teamUser => teamUser.email === user?.email)?.id

    const userOptions = (Array.isArray(assignees?.data) ? assignees.data : []).map(teamUser => ({
        label: teamUser.name,
        value: teamUser.id
    }))

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

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    // ? the trip read from the pasted enquiry becomes the new lead's trip details; the lead is kept if this fails
    const saveEnquiryTrip = async newLeadId => {
        if (!newLeadId || !enquiryTrip || !hasTripDetails(enquiryTrip)) return true
        try {
            await createGuest(toGuestPayload(enquiryTrip, Number(newLeadId))).unwrap()
            return true
        } catch (error) {
            return false
        }
    }

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        onSubmit: async values => {
            try {
                if (!formId) {
                    const created = await createLead({
                        ...values,
                        fullName: values.fullName.trim(),
                        phone: leadPhoneToSave(values.phone),
                        // ? the guest's own words, kept on the lead (the quote's AI reads them too)
                        ...(enquiry.trim() ? { message: enquiry.trim() } : {}),
                        places: cleanPlaces(places),
                        updatedBy: clientUserId
                    }).unwrap()
                    if (!(await saveEnquiryTrip(created?.data?.id))) {
                        notify(
                            'Lead created, but its trip details could not be saved. Add them in the quote.',
                            'warning'
                        )
                        navigate(-1)
                        return
                    }
                } else {
                    // ? saved as "+919876543210" however it was typed: one format for search and WhatsApp links
                    await updateLead({
                        id: leadId,
                        ...values,
                        phone: leadPhoneToSave(values.phone),
                        updatedBy: clientUserId
                    }).unwrap()
                    if (!samePlaces(places, editData?.places)) {
                        await updateLeadPlaces({ id: leadId, places: cleanPlaces(places) }).unwrap()
                    }
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

    // ? fills only what is still empty, so nothing the agent typed is replaced
    const readPastedEnquiry = async () => {
        if (!enquiry.trim()) return
        setReadingEnquiry(true)
        setEnquiryNote(null)
        let raw = {}
        let reached = true
        try {
            raw = parseAiReply(
                await assistAi(
                    buildEnquiryRequest({
                        text: enquiry,
                        campaigns: campaignOptions.map(o => ({ id: o.value, title: o.label }))
                    })
                ).unwrap()
            )
        } catch (error) {
            reached = false
        }
        const {
            lead,
            trip,
            places: named,
            found
        } = readEnquiry(raw, {
            text: enquiry,
            campaigns: campaignOptions.map(option => ({ id: option.value, title: option.label })),
            vehicles: vehicleNames
        })
        const next = { ...formik.values }
        Object.entries(lead).forEach(([field, value]) => {
            if (value && !String(next[field] || '').trim()) next[field] = value
        })
        formik.setValues(next, true)
        if (named.length && !cleanPlaces(places).length) setPlaces(named)
        Object.keys(lead).forEach(field => formik.setFieldTouched(field, true, false))
        setEnquiryTrip(hasTripDetails(trip) ? trip : null)
        setReadingEnquiry(false)
        if (!reached) {
            setEnquiryNote({
                color: 'warning',
                text: found.length
                    ? `The AI couldn’t be reached just now, so only the ${found.join(' and ')} were read. Fill in the rest, or try again.`
                    : 'The AI couldn’t be reached just now. Try again in a minute, or fill in the lead yourself.'
            })
        } else {
            setEnquiryNote(
                found.length
                    ? {
                          color: 'success',
                          text: `Read the ${found.join(', ')}. Check them below, then create the lead.`
                      }
                    : { color: 'info', text: 'Nothing to fill in was found in this text. Fill in the lead yourself.' }
            )
        }
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
        setPlaces(Array.isArray(data.data?.places) ? data.data.places : [])
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
        <FormSection title={title} hint={hint}>
            {children}
        </FormSection>
    )

    const columns = formColumns

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
                    {!formId &&
                        section(
                            'Paste the enquiry',
                            'Optional: paste what the guest sent and AI fills in the lead and the trip for you.',
                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={10}
                                    label='WhatsApp message, email or call notes'
                                    placeholder='e.g. Hi, we are 4 adults, Manali 5 nights from 15 Dec, 3 star hotels. Rohit, 98765 43210'
                                    value={enquiry}
                                    onChange={event => setEnquiry(event.target.value)}
                                    disabled={readingEnquiry}
                                />
                                <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 1.5 }}>
                                    <Button
                                        variant='outlined'
                                        startIcon={
                                            readingEnquiry ? (
                                                <CircularProgress size={16} color='inherit' />
                                            ) : (
                                                <AutoAwesome />
                                            )
                                        }
                                        onClick={readPastedEnquiry}
                                        disabled={readingEnquiry || !enquiry.trim()}
                                    >
                                        {readingEnquiry ? 'Reading…' : 'Fill in with AI'}
                                    </Button>
                                </Stack>
                                {enquiryNote ? (
                                    <Alert severity={enquiryNote.color} sx={{ mt: 1.5 }}>
                                        {enquiryNote.text}
                                    </Alert>
                                ) : null}
                                {enquiryTrip ? (
                                    <Alert
                                        severity='info'
                                        icon={false}
                                        sx={{ mt: 1.5 }}
                                        action={
                                            <Button color='inherit' size='small' onClick={() => setEnquiryTrip(null)}>
                                                Don’t save
                                            </Button>
                                        }
                                    >
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                            Trip details saved with the lead
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.875rem' }}>
                                            {[
                                                tripSummary(enquiryTrip),
                                                enquiryTrip.pickupLocation && `from ${enquiryTrip.pickupLocation}`
                                            ]
                                                .filter(Boolean)
                                                .join(' · ') || 'Read from the enquiry'}
                                        </Typography>
                                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                            You can change them in the quote.
                                        </Typography>
                                    </Alert>
                                ) : null}
                            </Box>
                        )}

                    {section(
                        'Who is it?',
                        'The guest who enquired.',
                        <Box sx={columns}>
                            <FormField formik={formik} name='fullName' label='Full name' required />
                            <FormField
                                formik={formik}
                                name='phone'
                                label='Phone number'
                                type='tel'
                                required
                                placeholder='98765 43210 or +44 7911 123456'
                                helperText='10 digits for India, or the full number with country code'
                            />
                            <FormField
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
                            <FormField formik={formik} name='campaignId' label='Campaign' select>
                                <MenuItem value=''>None</MenuItem>
                                {campaignOptions.map(option => (
                                    <MenuItem key={option.value} value={String(option.value)}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FormField>
                            {access?.canSeeLeadSource && (
                                <FormField formik={formik} name='leadSource' label='How did they reach you?' select>
                                    {LEAD_SOURCES.map(source => (
                                        <MenuItem key={source.value} value={source.value}>
                                            {source.label}
                                        </MenuItem>
                                    ))}
                                </FormField>
                            )}
                            <Box sx={{ gridColumn: '1 / -1', mb: 1.5 }}>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                                    Places & nights
                                </Typography>
                                <PlacesField
                                    value={places}
                                    onChange={setPlaces}
                                    options={placeOptions(destinations?.data, formik.values.campaignId)}
                                    helperText='Where the guest wants to go. The AI plans the package from these.'
                                />
                            </Box>
                            <FormField
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
                            <FormField
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
                            </FormField>
                            <FormField
                                formik={formik}
                                name='followupdate'
                                label='Schedule a call (optional)'
                                type='datetime-local'
                            />
                            <FormField
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
