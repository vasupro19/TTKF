import { useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { useDispatch } from 'react-redux'

import FormField from '@core/components/FormField'
import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useCreateCampaignMutation,
    useUpdateCampaignMutation,
    getCampaignById
} from '@/app/store/slices/api/campaignSlice'
import ListEditor from './ListEditor'
import { BANK_FIELDS, campaignPayload, campaignProblems, emptyBank, formFromCampaign } from './campaignFormFacts'

const LIST_PLACEHOLDER = 'e.g. Breakfast and dinner at the hotel'

/**
 * Add a campaign (a trip you sell), or change one. Its inclusions, notes and bank details are what every quotation
 * for it carries, so they are kept in the exact text formats the quotation reads (campaignFormFacts.js).
 */
function CampaignsForm() {
    const { id: formId } = useParams()
    const editing = Boolean(formId)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [createCampaign] = useCreateCampaignMutation()
    const [updateCampaign] = useUpdateCampaignMutation()

    // ? the lists and bank details are kept as lines and fields here, and become text only when sent
    const [inclusions, setInclusions] = useState([''])
    const [exclusions, setExclusions] = useState([''])
    const [notes, setNotes] = useState([''])
    const [bank, setBank] = useState(emptyBank())
    // ? bank details saved in another layout stay as they are unless the fields below replace them
    const [legacyBank, setLegacyBank] = useState('')

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
        initialValues: { title: '', description: '' },
        validate: campaignProblems,
        onSubmit: async values => {
            const payload = campaignPayload({ values, inclusions, exclusions, notes, bank, legacyBank })
            try {
                const response = editing
                    ? await updateCampaign({ id: formId, ...payload }).unwrap()
                    : await createCampaign(payload).unwrap()
                say(response?.message || 'Operation successful!', false)
                navigate('/master/campaigns')
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
                        error?.data?.data?.message || error?.data?.message || 'An error occurred, please try again',
                        true
                    )
                }
            }
        }
    })

    // ? editing: load the campaign into the form
    useEffect(() => {
        if (!editing) return undefined
        let cancelled = false
        dispatch(getCampaignById.initiate(formId)).then(({ data, error }) => {
            if (cancelled) return
            const row = data?.data
            if (error || !row || !Object.keys(row).length) {
                say(error?.data?.data?.message || 'Unable to find this campaign', true)
                return
            }
            const loaded = formFromCampaign(row)
            formik.setValues(loaded.values)
            setInclusions(loaded.inclusions)
            setExclusions(loaded.exclusions)
            setNotes(loaded.notes)
            setBank(loaded.bank)
            setLegacyBank(loaded.legacyBank)
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, editing, dispatch])

    // ? the bank fields look and behave like every other field; this hands them the same shape a form gives
    const bankForm = useMemo(
        () => ({
            values: bank,
            errors: {},
            touched: {},
            handleChange: event => {
                setBank(current => ({ ...current, [event.target.name]: event.target.value }))
                setLegacyBank('')
            },
            handleBlur: () => {}
        }),
        [bank]
    )

    return (
        <FormPage
            eyebrow={editing ? 'EDIT CAMPAIGN' : 'NEW CAMPAIGN'}
            title={editing ? 'Edit campaign' : 'Add a campaign'}
            subtitle='A campaign is a trip you sell, such as Himachal or Kashmir. What you enter here appears on every quotation for it.'
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate('/master/campaigns')}
            submitLabel={editing ? 'Save changes' : 'Create campaign'}
            saving={formik.isSubmitting}
        >
            <FormSection title='Trip basics' hint='The name your team and your guests will see.'>
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='title'
                        label='Title'
                        required
                        placeholder='e.g. Shimla and Manali'
                        helperText='At least 3 characters'
                    />
                    <FormField
                        formik={formik}
                        name='description'
                        label='Description'
                        required
                        placeholder='e.g. Honeymoon special'
                        helperText='A short line about the trip'
                    />
                </Box>
            </FormSection>

            <FormSection
                title='What the price covers'
                hint='Shown on the quotation under "What the price covers". Add one thing per line.'
            >
                <Box sx={formColumns}>
                    <Box>
                        <ListEditor
                            label='Inclusions'
                            hint='What the guest gets for the price'
                            items={inclusions}
                            onChange={setInclusions}
                            placeholder={LIST_PLACEHOLDER}
                        />
                    </Box>
                    <Box>
                        <ListEditor
                            label='Exclusions'
                            hint='What they pay for themselves'
                            items={exclusions}
                            onChange={setExclusions}
                            placeholder='e.g. Airfare and train fare'
                            showKeys={false}
                        />
                    </Box>
                </Box>
            </FormSection>

            <FormSection
                title='Good to know'
                hint='Notes and policies the guest should read, such as cancellation terms.'
            >
                <ListEditor
                    label='Important notes'
                    items={notes}
                    onChange={setNotes}
                    placeholder='e.g. Check-in is at 12:00 noon'
                />
            </FormSection>

            <FormSection
                title='Payment details'
                hint='Printed on the quotation so the guest knows where to send the advance. Leave it empty to leave it out.'
            >
                {legacyBank ? (
                    <Typography
                        color='text.secondary'
                        sx={{
                            fontSize: '0.8125rem',
                            mb: 2,
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: 'action.hover',
                            whiteSpace: 'pre-line'
                        }}
                    >
                        {`Saved as: ${legacyBank}\nThis is kept as it is. Fill in the fields below to replace it.`}
                    </Typography>
                ) : null}
                <Box sx={formColumns}>
                    {BANK_FIELDS.map(field => (
                        <FormField
                            key={field.key}
                            formik={bankForm}
                            name={field.key}
                            label={field.label}
                            placeholder={field.placeholder || ''}
                        />
                    ))}
                </Box>
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                    The quotation adds: &ldquo;Please deposit 50% advance in our company&apos;s account to confirm your
                    trip.&rdquo;
                </Typography>
            </FormSection>
        </FormPage>
    )
}

export default CampaignsForm
