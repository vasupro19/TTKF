import { useEffect } from 'react'
import { useFormik } from 'formik'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, MenuItem } from '@mui/material'
import { useDispatch } from 'react-redux'

import AiFormAssistant from '@core/components/forms/AiAssiastantForm'
import FormField from '@core/components/FormField'
import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import {
    useCreateItenaryClientMutation,
    useUpdateItenaryClientMutation,
    getItenaryClientById
} from '@/app/store/slices/api/itenarySlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import itenaryFormProblems from './itenaryFormFacts'

// ? what the AI helper may fill (the same shape as a form's field list)
const AI_FIELDS = [
    { name: 'title', label: 'Itinerary title', type: 'text' },
    { name: 'description', label: 'Itinerary description', type: 'textarea' }
]

const AI_CONTEXT =
    'Travel itinerary form. User is adding one day at a time for a travel campaign. Each entry has a day number, title (e.g. "Chandigarh to Shimla Via Cab"), description (arrival/transfer/hotel check-in details), and location (state/city name).'

const AI_SUGGESTIONS = [
    'Chandigarh to Shimla via Cab 120kms',
    'Delhi to Manali via Volvo overnight',
    'Arrival at Manali, hotel check-in',
    'Local sightseeing Hadimba Temple Mall Road',
    'Chandigarh to Manali via Cab 300kms',
    'Delhi to Amritsar via Cab 450kms',
    'Solang Valley and Rohtang Pass excursion',
    'Delhi to Dharamshala via Cab 500kms'
]

/**
 * Add one day-plan (itinerary) to a trip, or change one.
 */
function ItenaryClientsForm() {
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    // ? opened from a trip's own page: the trip is already chosen
    const campaignContextId = location.state?.campaignId

    const [createItenaryClient] = useCreateItenaryClientMutation()
    const [updateItenaryClient] = useUpdateItenaryClientMutation()
    // ? lists are paged at 25 by default: the 26th trip could not be chosen
    const { data: campaignsReply } = useGetCampaignsQuery('?length=200')
    const campaigns = Array.isArray(campaignsReply?.data) ? campaignsReply.data : []

    const say = (message, isError) =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color: isError ? 'error' : 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const formik = useFormik({
        initialValues: { title: '', description: '', campaignId: campaignContextId ? String(campaignContextId) : '' },
        validate: itenaryFormProblems,
        onSubmit: async values => {
            // ? only what the form edits: the server saves whatever it is sent
            const payload = {
                title: values.title.trim(),
                description: values.description.trim(),
                campaignId: parseInt(values.campaignId, 10)
            }
            try {
                const response = formId
                    ? await updateItenaryClient({ id: formId, ...payload }).unwrap()
                    : await createItenaryClient(payload).unwrap()
                if (response?.success || response?.status_code === 200) {
                    say(response.message || 'Itinerary saved', false)
                    navigate(-1)
                }
            } catch (error) {
                say(
                    error?.data?.data?.message ||
                        error?.data?.message ||
                        'Couldn’t save the itinerary. Please try again.',
                    true
                )
            }
        }
    })

    // ? editing: load the itinerary into the form
    useEffect(() => {
        if (!formId) return
        dispatch(getItenaryClientById.initiate(formId)).then(({ data, error }) => {
            const saved = data?.data
            if (error || !saved) return
            formik.setValues({
                title: saved.title || '',
                description: saved.description || '',
                campaignId: saved.campaignId ? String(saved.campaignId) : ''
            })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, dispatch])

    const tripChosen = Boolean(campaignContextId && !formId)

    return (
        <FormPage
            eyebrow={formId ? 'EDIT ITINERARY' : 'NEW ITINERARY'}
            title={formId ? 'Edit itinerary' : 'Add an itinerary'}
            subtitle='One day-plan of a trip, such as “Delhi to Shimla via cab”. Packages and quotes are built from these.'
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate(-1)}
            submitLabel={formId ? 'Save changes' : 'Add itinerary'}
            saving={formik.isSubmitting}
        >
            <Box sx={{ mb: 2.5 }}>
                <AiFormAssistant fields={AI_FIELDS} formik={formik} context={AI_CONTEXT} suggestions={AI_SUGGESTIONS} />
            </Box>
            <FormSection title='What happens on this day?' hint='A short title, and what the guest does.'>
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='title'
                        label='Title'
                        required
                        placeholder='e.g. Delhi to Shimla via cab (380 km)'
                    />
                    <FormField
                        formik={formik}
                        name='campaignId'
                        label='Trip'
                        select
                        required
                        disabled={tripChosen}
                        helperText={tripChosen ? 'Chosen from the trip you came from' : ''}
                    >
                        {campaigns.map(campaign => (
                            <MenuItem key={campaign.id} value={String(campaign.id)}>
                                {campaign.title}
                            </MenuItem>
                        ))}
                    </FormField>
                    <FormField
                        formik={formik}
                        name='description'
                        label='Description (optional)'
                        multiline
                        minRows={4}
                        wide
                        placeholder='Arrival, transfers, sightseeing and where the guest stays that night'
                        helperText='This text goes into the quotation the guest receives'
                    />
                </Box>
            </FormSection>
        </FormPage>
    )
}

export default ItenaryClientsForm
