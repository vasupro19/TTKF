import { useEffect } from 'react'
import { useFormik } from 'formik'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, MenuItem } from '@mui/material'
import { useDispatch } from 'react-redux'

import FormField from '@core/components/FormField'
import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import {
    useCreatePackageClientMutation,
    useUpdatePackageClientMutation,
    getPackageClientById
} from '@/app/store/slices/api/packageSlice'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import packageFormProblems from './packageFormFacts'

/**
 * Add a package (a ready-made itinerary a guest's quote can start from) to a trip, or rename one.
 */
function PackagesClientForm() {
    const { id: formId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    // ? opened from a trip's own page: the trip is already chosen
    const campaignContextId = location.state?.campaignId

    const [createPackageClient] = useCreatePackageClientMutation()
    const [updatePackageClient] = useUpdatePackageClientMutation()
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
        initialValues: { name: '', campaignId: campaignContextId ? String(campaignContextId) : '' },
        validate: packageFormProblems,
        onSubmit: async values => {
            // ? only the two fields: the server keeps the rest (including whether the package is active)
            const payload = { name: values.name.trim(), campaignId: parseInt(values.campaignId, 10) }
            try {
                const response = formId
                    ? await updatePackageClient({ id: formId, ...payload }).unwrap()
                    : await createPackageClient(payload).unwrap()
                if (response?.success || response?.status_code === 200) {
                    say(response.message || 'Package saved', false)
                    navigate(-1)
                }
            } catch (error) {
                const fieldErrors = error?.data?.data?.errors
                if (fieldErrors && typeof fieldErrors === 'object') {
                    formik.setErrors(
                        Object.fromEntries(
                            Object.entries(fieldErrors).map(([field, messages]) => [
                                field,
                                [].concat(messages).join(', ')
                            ])
                        )
                    )
                } else {
                    say(
                        error?.data?.data?.message ||
                            error?.data?.message ||
                            'Couldn’t save the package. Please try again.',
                        true
                    )
                }
            }
        }
    })

    // ? editing: load the package into the form
    useEffect(() => {
        if (!formId) return
        dispatch(getPackageClientById.initiate(formId)).then(({ data, error }) => {
            const saved = data?.data
            if (error || !saved) return
            formik.setValues({ name: saved.name || '', campaignId: saved.campaignId ? String(saved.campaignId) : '' })
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, dispatch])

    return (
        <FormPage
            eyebrow={formId ? 'EDIT PACKAGE' : 'NEW PACKAGE'}
            title={formId ? 'Edit package' : 'Add a package'}
            subtitle='A package is a ready-made itinerary for a trip. After saving, add its days from the packages list.'
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate(-1)}
            submitLabel={formId ? 'Save changes' : 'Add package'}
            saving={formik.isSubmitting}
        >
            <FormSection title='Which package is it?' hint='Its name, and the trip it belongs to.'>
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='name'
                        label='Package name'
                        required
                        placeholder='e.g. Shimla – Manali 6D/5N'
                        helperText='Guests see this name when you pick the package for a quote'
                    />
                    <FormField
                        formik={formik}
                        name='campaignId'
                        label='Trip'
                        select
                        required
                        disabled={Boolean(campaignContextId && !formId)}
                        helperText={campaignContextId && !formId ? 'Chosen from the trip you came from' : ''}
                    >
                        {campaigns.map(campaign => (
                            <MenuItem key={campaign.id} value={String(campaign.id)}>
                                {campaign.title}
                            </MenuItem>
                        ))}
                    </FormField>
                </Box>
            </FormSection>
        </FormPage>
    )
}

export default PackagesClientForm
