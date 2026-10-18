import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, MenuItem } from '@mui/material'
import { useFormik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import FormPage from '@core/components/FormPage'
import FormField from '@core/components/FormField'
import FormSection, { formColumns } from '@core/components/FormSection'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useCreateAgentMutation, useUpdateAgentMutation, getAgentById } from '@/app/store/slices/api/agentSlice'
import { objectLength } from '@/utilities'
import { EMPTY_AGENT, agentFormProblems, agentPayload, agentToForm, stateOptions } from './agentFormFacts'

/**
 * Add a travel agent (another agency you work with), or change one.
 */
function AgentForm() {
    const { id: formId } = useParams()
    const editing = Boolean(formId)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { createAgentMasterLKey, updateAgentMasterLKey } = useSelector(state => state.loading)

    const [createAgent] = useCreateAgentMutation()
    const [updateAgent] = useUpdateAgentMutation()

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
        initialValues: EMPTY_AGENT,
        validate: agentFormProblems,
        onSubmit: async (values, { setErrors }) => {
            try {
                const payload = agentPayload(values)
                const response = editing
                    ? await updateAgent({ id: formId, ...payload }).unwrap()
                    : await createAgent(payload).unwrap()
                say(response?.message || (editing ? 'Agent saved' : 'Agent added'), false)
                navigate(-1)
            } catch (error) {
                const fieldErrors = error?.data?.data?.errors
                if (fieldErrors && typeof fieldErrors === 'object') {
                    // ? the server's field errors go on the fields they belong to
                    setErrors(
                        Object.fromEntries(
                            Object.entries(fieldErrors).map(([field, messages]) => [
                                field,
                                [].concat(messages).join(', ')
                            ])
                        )
                    )
                } else {
                    say(
                        error?.data?.message ||
                            error?.data?.data?.message ||
                            (editing
                                ? 'Couldn’t save the agent. Please try again.'
                                : 'Couldn’t add the agent. Please try again.'),
                        true
                    )
                }
            }
        }
    })

    // ? editing: load the agent into the form
    useEffect(() => {
        if (!editing) return undefined
        let cancelled = false
        dispatch(getAgentById.initiate(formId)).then(({ data, error }) => {
            if (cancelled) return
            if (error || !data?.data || !objectLength(data.data)) {
                say(error?.data?.message || 'Unable to find this agent', true)
                return
            }
            formik.setValues(agentToForm(data.data))
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId, editing, dispatch])

    return (
        <FormPage
            eyebrow={editing ? 'EDIT AGENT' : 'NEW AGENT'}
            title={editing ? 'Edit agent' : 'Add an agent'}
            subtitle={
                editing
                    ? 'Change the agent’s details, then save.'
                    : 'Add a travel agent you work with. Only the name is needed. You can pick them when you create a booking.'
            }
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate('/master/agent')}
            submitLabel={editing ? 'Save changes' : 'Add agent'}
            saving={formik.isSubmitting || Boolean(createAgentMasterLKey || updateAgentMasterLKey)}
        >
            <FormSection title='Who is the agent?' hint='The agency or person, and how to reach them.'>
                <Box sx={formColumns}>
                    <FormField formik={formik} name='name' label='Agent or agency name' required wide />
                    <FormField
                        formik={formik}
                        name='phone'
                        label='Phone number (optional)'
                        type='tel'
                        placeholder='98765 43210'
                    />
                    <FormField
                        formik={formik}
                        name='email'
                        label='Email (optional)'
                        type='email'
                        placeholder='name@agency.com'
                    />
                </Box>
            </FormSection>

            <FormSection
                title='Where are they based?'
                hint='Helps you find the right agent later, and filter the list.'
            >
                <Box sx={formColumns}>
                    <FormField formik={formik} name='city' label='City' />
                    <FormField formik={formik} name='state' label='State' select>
                        <MenuItem value=''>Not set</MenuItem>
                        {stateOptions(formik.values.state).map(state => (
                            <MenuItem key={state.value} value={state.value}>
                                {state.label}
                            </MenuItem>
                        ))}
                    </FormField>
                    <FormField formik={formik} name='address' label='Address' multiline wide />
                </Box>
            </FormSection>

            <FormSection
                title='Notes'
                hint='Anything worth remembering: commission, the destinations they send guests to.'
            >
                <Box sx={formColumns}>
                    <FormField formik={formik} name='remarks' label='Remarks' multiline wide />
                </Box>
            </FormSection>
        </FormPage>
    )
}

export default AgentForm
