import { useEffect } from 'react'
import { useFormik } from 'formik'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, MenuItem } from '@mui/material'
import { useDispatch } from 'react-redux'

import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import FormField from '@core/components/FormField'
import {
    useCreateSuppliersMutation,
    getSupplierById,
    useUpdateSupplierMutation
} from '@/app/store/slices/api/supplierSlice'
import { openSnackbar } from '@app/store/slices/snackbar'
import { objectLength } from '@/utilities'
import { EMPTY_SUPPLIER, SUPPLIER_TYPES, supplierPayload, supplierProblems, supplierToForm } from './supplierFormFacts'

/**
 * Add a hotel, taxi or bus supplier, or change one: who it is, how to reach it, where it is.
 */
function SupplierForm() {
    const { id: formId } = useParams()
    const editing = Boolean(formId)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [createSupplier] = useCreateSuppliersMutation()
    const [updateSupplier] = useUpdateSupplierMutation()

    const say = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const formik = useFormik({
        initialValues: EMPTY_SUPPLIER,
        validate: supplierProblems,
        onSubmit: async values => {
            const payload = supplierPayload(values)
            try {
                const response = editing
                    ? await updateSupplier({ id: formId, ...payload }).unwrap()
                    : await createSupplier(payload).unwrap()
                if (response?.success && response?.status_code === 200) {
                    say(response.message || (editing ? 'Supplier saved' : 'Supplier added'))
                }
                navigate(-1)
            } catch (error) {
                const fieldErrors = error?.data?.data?.errors
                if (fieldErrors && typeof fieldErrors === 'object') {
                    formik.setErrors(
                        Object.fromEntries(
                            Object.entries(fieldErrors).map(([field, list]) => [field, [].concat(list).join(', ')])
                        )
                    )
                } else {
                    say(
                        error?.data?.data?.message ||
                            error?.data?.message ||
                            'Couldn’t save the supplier. Please try again.',
                        'error'
                    )
                }
            }
        }
    })

    // ? editing: load the supplier into the form; one that can't be found sends you back
    useEffect(() => {
        if (!editing) return undefined
        let cancelled = false
        dispatch(getSupplierById.initiate(formId, { forceRefetch: true })).then(({ data, error }) => {
            if (cancelled) return
            if (error || !data?.data || !objectLength(data.data)) {
                say(error?.data?.data?.message || 'Unable to find the supplier for this link', 'error')
                navigate(-1)
                return
            }
            formik.setValues(supplierToForm(data.data))
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId])

    return (
        <FormPage
            eyebrow={editing ? 'EDIT SUPPLIER' : 'NEW SUPPLIER'}
            title={editing ? 'Edit supplier' : 'Add a supplier'}
            subtitle='The hotels, taxis and buses you book with. Pick them when you add a service to a booking.'
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate('/master/supplier')}
            submitLabel={editing ? 'Save changes' : 'Add supplier'}
            saving={formik.isSubmitting}
        >
            <FormSection title='Who is it?' hint='The business, and what it provides.'>
                <Box sx={formColumns}>
                    <FormField formik={formik} name='businessname' label='Business name' required />
                    <FormField formik={formik} name='type' label='Type' select required>
                        {SUPPLIER_TYPES.map(type => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </FormField>
                    <FormField
                        formik={formik}
                        name='constactperson'
                        label='Contact person'
                        helperText='Who you speak to when you book'
                        wide
                    />
                </Box>
            </FormSection>

            <FormSection title='How do you reach them?' hint='Booking requests go to this email.'>
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='phone'
                        label='Phone number'
                        type='tel'
                        required
                        helperText='With the country code if they are outside India'
                    />
                    <FormField formik={formik} name='email' label='Email' type='email' />
                </Box>
            </FormSection>

            <FormSection title='Where are they?' hint='And anything worth remembering about working with them.'>
                <Box sx={formColumns}>
                    <FormField formik={formik} name='address' label='Address' wide />
                    <FormField formik={formik} name='city' label='City' />
                    <FormField
                        formik={formik}
                        name='remarks'
                        label='Notes'
                        placeholder='Rates, best contact time, anything else'
                        multiline
                        wide
                    />
                </Box>
            </FormSection>
        </FormPage>
    )
}

export default SupplierForm
