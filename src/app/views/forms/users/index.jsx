import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    Stack,
    Typography
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useFormik } from 'formik'
import { useDispatch, useSelector } from 'react-redux'

import FormPage from '@core/components/FormPage'
import FormSection, { formColumns } from '@core/components/FormSection'
import FormField from '@core/components/FormField'
import usePrompt from '@hooks/usePrompt'
import { openSnackbar } from '@app/store/slices/snackbar'
import { accessMeta } from '@views/permissions/menuAccess'
import { phoneForField, userPhoneToSave } from '@/utilities/phone'
import {
    useCreateUserMutation,
    useUpdateUserMutation,
    getDataForUpdate,
    useGetUserRolesQuery
} from '@/app/store/slices/api/usersSlice'
import { userFormProblems } from './userFormFacts'

const EMPTY = {
    firstName: '',
    phone: '',
    email: '',
    roleId: '',
    password: '',
    confirmPassword: '',
    emailPassword: ''
}

// ? the server's field names, as the form knows them
const BACKEND_FIELDS = {
    name: 'firstName',
    role_id: 'roleId',
    email: 'email',
    contact_no: 'phone',
    password: 'password'
}

/** @description under the role: what the chosen role may do; and, while there is only ADMIN, where to make roles */
function RoleHint({ roles, chosen }) {
    const role = roles.find(item => Number(item.id) === Number(chosen))
    const onlyAdmin = roles.length > 0 && roles.every(item => item.isSystem)
    const label = role?.accessLabel || (role?.access ? accessMeta(role.access).label : '')
    if (!label && !onlyAdmin) return null
    return (
        <Box sx={{ mt: -1.5, mb: 1.5 }}>
            {label ? (
                <Typography variant='caption' color='text.secondary' component='div'>
                    {label}
                </Typography>
            ) : null}
            {onlyAdmin ? (
                <Typography variant='caption' color='text.secondary' component='div' sx={{ mt: 0.5 }}>
                    Your agency has only the ADMIN role.{' '}
                    <Link component={RouterLink} to='/userManagement/role/create'>
                        Create a role
                    </Link>{' '}
                    such as SALES to give people fewer screens.
                </Typography>
            ) : null}
        </Box>
    )
}

RoleHint.propTypes = {
    roles: PropTypes.arrayOf(
        PropTypes.shape({ id: PropTypes.number, isSystem: PropTypes.bool, accessLabel: PropTypes.string })
    ).isRequired,
    chosen: PropTypes.string
}

const section = (title, hint, children) => (
    <FormSection title={title} hint={hint}>
        {children}
    </FormSection>
)

/**
 * Add a person to the agency, or change one: who they are, their role, how they sign in.
 */
export default function SetupUserForm() {
    usePrompt()
    const { id: editId } = useParams()
    const editing = Boolean(editId && parseInt(editId, 10))
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)

    const [createUser] = useCreateUserMutation()
    const [updateUser] = useUpdateUserMutation()
    const { data: rolesReply } = useGetUserRolesQuery(`?clientId=${user.clientId}`)
    const roles = Array.isArray(rolesReply?.data) ? rolesReply.data : []

    const [showPassword, setShowPassword] = useState(false)
    // ? the saved app password stays on the server; the form only knows whether there is one
    const [hasEmailPassword, setHasEmailPassword] = useState(false)

    const say = (message, isError) =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color: isError ? 'error' : 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )

    const formik = useFormik({
        initialValues: EMPTY,
        validate: values => userFormProblems(values, { editing }),
        onSubmit: async (values, { setFieldError }) => {
            const payload = {
                name: values.firstName.trim(),
                role_id: values.roleId,
                email: values.email.trim(),
                emailPassword: values.emailPassword,
                // ? 10 digits for India; a foreign number keeps its country code
                contact_no: userPhoneToSave(phoneForField(values.phone)),
                password: values.password,
                client_id: user?.clientId
            }
            try {
                if (editing) {
                    const response = await updateUser({ ...payload, id: editId }).unwrap()
                    say(response?.message || 'User saved', false)
                    navigate(-1)
                } else {
                    const response = await createUser(payload).unwrap()
                    say(response?.message || 'User added', false)
                    // ? next: choose what the new person can open
                    if (response?.data?.user_id) navigate(`/userManagement/user/menu/${response.data.user_id}`)
                    else navigate('/master/user')
                }
            } catch (error) {
                const fieldErrors = error?.data?.data?.errors
                if (fieldErrors && typeof fieldErrors === 'object') {
                    Object.entries(fieldErrors).forEach(([field, messages]) => {
                        if (BACKEND_FIELDS[field]) setFieldError(BACKEND_FIELDS[field], [].concat(messages).join('. '))
                    })
                }
                say(
                    error?.data?.message ||
                        error?.message ||
                        (editing ? 'Couldn’t save the user' : 'Couldn’t add the user'),
                    true
                )
            }
        }
    })

    // ? editing: load the person into the form
    useEffect(() => {
        if (!editing) return undefined
        let cancelled = false
        dispatch(getDataForUpdate.initiate(editId)).then(response => {
            const person = response?.data?.data
            if (cancelled || !response?.data?.success || !person) return
            formik.setValues({
                ...EMPTY,
                firstName: person.name || '',
                phone: person.phoneNumber || '',
                email: person.email || '',
                roleId: person.role?.id ? String(person.role.id) : ''
            })
            setHasEmailPassword(Boolean(person.hasEmailPassword))
        })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editId, editing, dispatch])

    const eye = (
        <InputAdornment position='end'>
            <IconButton
                size='small'
                aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                onClick={() => setShowPassword(shown => !shown)}
                edge='end'
            >
                {showPassword ? <Visibility fontSize='small' /> : <VisibilityOff fontSize='small' />}
            </IconButton>
        </InputAdornment>
    )

    return (
        <FormPage
            eyebrow={editing ? 'EDIT USER' : 'NEW USER'}
            title={editing ? 'Edit user' : 'Add a user'}
            subtitle={
                editing
                    ? 'Change their details or role. Leave the password blank to keep it.'
                    : 'Add a person to your agency, give them a role, and set how they sign in.'
            }
            onSubmit={formik.handleSubmit}
            onCancel={() => navigate('/master/user')}
            submitLabel={editing ? 'Save changes' : 'Add user'}
            saving={formik.isSubmitting}
        >
            {section(
                'Who is it?',
                'Their name and how to reach them. The email is what they sign in with.',
                <Box sx={formColumns}>
                    <FormField formik={formik} name='firstName' label='Full name' required />
                    <FormField
                        formik={formik}
                        name='phone'
                        label='Phone number'
                        type='tel'
                        required
                        placeholder='98765 43210 or +44 7911 123456'
                        helperText='10 digits for India, or the full number with country code'
                    />
                    <FormField formik={formik} name='email' label='Email' type='email' required wide />
                </Box>
            )}

            {section(
                'What can they do?',
                'The role decides which screens they can open. You can fine-tune it after saving.',
                <>
                    <Box sx={formColumns}>
                        <FormField formik={formik} name='roleId' label='Role' select required>
                            {roles.map(role => (
                                <MenuItem key={role.id} value={String(role.id)}>
                                    {role.name}
                                </MenuItem>
                            ))}
                        </FormField>
                    </Box>
                    <RoleHint roles={roles} chosen={formik.values.roleId} />
                </>
            )}

            {section(
                'How do they sign in?',
                editing ? 'Only fill these in to change the password.' : 'They can change it after signing in.',
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='password'
                        label={editing ? 'New password' : 'Password'}
                        type={showPassword ? 'text' : 'password'}
                        required={!editing}
                        helperText='At least 6 characters'
                        endAdornment={eye}
                    />
                    <FormField
                        formik={formik}
                        name='confirmPassword'
                        label='Confirm password'
                        type={showPassword ? 'text' : 'password'}
                        required={!editing}
                    />
                </Box>
            )}

            {section(
                'Send quotes from their own email (optional)',
                'With a Gmail app password, quotations this person sends come from their own mailbox.',
                <Box sx={formColumns}>
                    <FormField
                        formik={formik}
                        name='emailPassword'
                        label='Email app password'
                        type='password'
                        placeholder='abcd efgh ijkl mnop'
                        helperText={hasEmailPassword ? 'An app password is saved. Leave this blank to keep it.' : ''}
                        wide
                    />
                </Box>
            )}
        </FormPage>
    )
}
