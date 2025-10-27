/* eslint-disable */
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
    Grid,
    TextField,
    IconButton,
    InputAdornment,
    Paper,
    Typography,
    Chip,
    Divider,
    Box,
    styled,
    Tooltip
} from '@mui/material'
import { Formik, Form, Field } from 'formik'
import { Badge, Build, Verified, Visibility, VisibilityOff } from '@mui/icons-material'
import { z } from 'zod'
import CustomAutocomplete from '@core/components/extended/CustomAutocomplete'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import CustomButton from '@core/components/extended/CustomButton'
import PhoneField from '@core/components/PhoneInput'
import NotesInstructions from '@core/components/NotesInstructions'

// redux imports
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'
import IdentityCard from '@core/components/IdentityCard'
import { useGetDataForCreateQuery, useCreateUserMutation, getDataForUpdate } from '@/app/store/slices/api/usersSlice'

// Styled components
const CustomTextField = styled(TextField)({
    '& input': {
        backgroundColor: '#fff',
        padding: '4px 8px',
        height: '16px' // Decrease input height
    },
    '& .MuiInputBase-root.MuiOutlinedInput-root': {
        backgroundColor: 'white' // Apply the white background to the root element
    },
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'gray' // Optional: change border color if needed
    },
    flexGrow: 1,
    width: 'auto'
})

const customInputSx = {
    '& .MuiAutocomplete-option': {
        backgroundColor: 'white',
        '&[aria-selected="true"]': {
            backgroundColor: 'white' // Selected option
        },
        '&:hover': {
            backgroundColor: '#f5f5f5' // Optional: hover effect
        }
    }
}
const customTextSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'white' // Ensures white background for the input
    },
    '& .MuiOutlinedInput-input': {
        backgroundColor: 'white' // Ensures white background for the text area
    }
}

function CustomTextFieldWrapper({ name, ...props }) {
    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }) => (
                <CustomTextField
                    /* eslint-disable */
                    {...field}
                    {...props}
                    /* eslint-enable */
                    error={touched[name] && !!errors[name]}
                    helperText={touched[name] && errors[name]}
                />
            )}
        </Field>
    )
}

const Label = styled(Typography)({
    width: '180px',
    marginRight: '8px',
    whiteSpace: 'nowrap',
    fontWeight: '500',
    marginBottom: '6px'
})

const notes = [
    { id: 'n1', text: 'Fill in your personal details including First Name, Last Name, Aadhar Card, and Phone.' },
    { id: 'n2', text: 'Enter your Email address and ensure its correctness.' },
    { id: 'n5', text: 'Enter and confirm a strong Password (use letters, numbers, and special characters).' },
    { id: 'n6', text: 'Verify all provided information for accuracy.' },
    { id: 'n7', text: 'Click the Submit button to save your information, or Cancel to discard changes.' }
]

const notesForExistingUser = [
    { id: 'n1', text: 'Select Either email or Aadhar Card of existing user, all other details are disabled' },
    { id: 'n2', text: 'All other details will show up once Aadhar Card or email is selected' },
    { id: 'n3', text: 'Click the Submit button to save your information, or Cancel to discard changes.' }
]

export default function AddAdmin() {
    usePrompt()
    const { id: editId } = useParams()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const createNewAdmin = Boolean(pathname === '/userManagement/admin/create')
    const dispatch = useDispatch()
    const formikRef = useRef()
    const [createUser] = useCreateUserMutation()

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const handleTogglePasswordVisibility = () => setShowPassword(!showPassword)
    const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

    const baseInitialValues = {
        firstName: '',
        lastName: '',
        aadharCard: '',
        phone: '',
        email: ''
    }

    // Extra fields for new users only
    const newUserExtraFields = {
        emailVerified: false,
        password: '',
        confirmPassword: ''
    }

    // Conditionally create the initial values
    const initialValues = createNewAdmin ? { ...baseInitialValues, ...newUserExtraFields } : { ...baseInitialValues }

    const validationSchemaNewUser = z
        .object({
            firstName: z.string().min(1, 'First Name is required'),
            lastName: z.string().min(1, 'Last Name is required'),
            aadharCard: z.string().min(12, 'Must be 12 characters'),
            phone: z.string().regex(/^\d{10,15}$/, 'Must be a valid phone number'),
            email: z.string().email('Invalid email'),
            emailVerified: z.boolean(),
            password: z.string().optional(),
            confirmPassword: z.string().optional()
        })
        .superRefine((data, ctx) => {
            if (!data.emailVerified) {
                if (!data.password || data.password.length < 6) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.too_small,
                        minimum: 6,
                        type: 'string',
                        inclusive: true,
                        message: 'Password must be at least 6 characters',
                        path: ['password']
                    })
                }

                if (!data.confirmPassword) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Confirm password is required',
                        path: ['confirmPassword']
                    })
                }

                if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Password and confirm password must match',
                        path: ['confirmPassword']
                    })
                }
            }
        })

    const validationSchemaExistingUser = z.object({
        firstName: z.string().min(1, 'First Name is required'),
        lastName: z.string().min(1, 'Last Name is required'),
        phone: z.string().regex(/^\d{10,15}$/, 'Must be a valid phone number'),
        email: z
            .string()
            .min(1, 'Select at least one email')
            .nullable()
            .refine(value => value !== null, { message: 'Select at least one email' }),
        aadharCard: z
            .string()
            .min(1, 'Select at least one Aadhar Card')
            .nullable()
            .refine(value => value !== null, { message: 'Select at least one Aadhar Card' })
    })

    const validationSchema = createNewAdmin ? validationSchemaNewUser : validationSchemaExistingUser
    // Function to validate values using zod
    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    const handleSwitchChange = useCallback((event, setFieldTouched, setFieldValue, values, errors, touched) => {
        const { email } = values
        if (!email || errors.email || !touched.email) {
            setFieldTouched('email', true)
            setFieldValue('email', email || '') // Ensure validation runs
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please enter a valid email first',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }
        setFieldValue('emailVerified', !values.emailVerified)
        // setHidePassword(!hidePassword)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleBackendErrors = (backendErrors, setFieldError) => {
        const backendKeys = {
            name: 'firstName',
            last_name: 'lastName',
            aadhar_no: 'aadharCard',
            client_ids: 'selectedAccounts',
            role_id: 'role',
            email: 'email',
            contact_no: 'phone',
            password: 'password'
        }
        // Iterate over the errors object from the backend
        Object.entries(backendErrors).forEach(([field, messages]) => {
            // Concatenate all error messages for a field into a single string
            setFieldError(backendKeys[field], messages.join('. '))
        })
    }

    return (
        <Box sx={{ py: 2 }}>
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validate={validate}
                onSubmit={async (values, { setFieldError, resetForm, setValues }) => {
                    const payload = {
                        name: values.firstName,
                        last_name: values.lastName,
                        aadhar_no: values.aadharCard.replace(/-/g, ''),
                        client_ids: values.selectedAccounts.map(item => item.value),
                        role_id: values.role.value.toString(),
                        email: values.email,
                        contact_no: values.phone.slice(2).replace(/-/g, ''),
                        password: values.password
                    }
                    let isError = false
                    let message

                    if (editId && parseInt(editId, 10)) payload.id = editId
                    try {
                        const response = await createUser(payload).unwrap()
                        message = response?.message || response?.data?.message || 'user created successfully!'
                        if (response?.data?.user_id && !parseInt(editId, 10)) {
                            navigate(`/userManagement/user/menu/${response?.data?.user_id}`)
                        } else {
                            setValues({ ...initialValues })
                            resetForm()
                            navigate(-1)
                        }
                    } catch (error) {
                        isError = true
                        if (error?.data?.data?.errors && Object.keys(error?.data?.data?.errors).length)
                            handleBackendErrors(error.data.data.errors, setFieldError)
                        message =
                            error?.response?.message ||
                            error?.response?.data?.message ||
                            error?.data?.message ||
                            error?.message ||
                            'unable to create user!'
                    } finally {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message,
                                variant: 'alert',
                                alert: { color: isError ? 'error' : 'success' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                    }
                }}
            >
                {({ errors, touched, values, setFieldTouched, setFieldValue, setFieldError }) => (
                    <Form>
                        <Grid
                            container
                            gap={2}
                            sx={{
                                border: '1px solid #d0d0d0',
                                px: 1.5,
                                py: 2,
                                borderRadius: '8px'
                            }}
                        >
                            <Grid container xs={12} md={3.6} spacing={2}>
                                <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                                    <IdentityCard
                                        data={[
                                            {
                                                label: 'Name',
                                                value:
                                                    values?.firstName || values?.lastName
                                                        ? /* eslint-disable */
                                                          `${values?.firstName || ''} ${values?.lastName ? values?.lastName : ''}`
                                                        : 'N/A'
                                                /* eslint-enable */
                                            },
                                            {
                                                label: 'Email',
                                                value: values.email
                                            },
                                            {
                                                label: 'Aadhar Card',
                                                value: values.aadharCard
                                            },
                                            {
                                                label: 'Phone Number',
                                                value: values.phone
                                            }
                                        ]}
                                    />
                                </Grid>
                            </Grid>
                            <Grid md={8.3} container spacing={1}>
                                {/* Personal Details Section */}

                                <Grid item xs={12}>
                                    <Box display='flex' alignItems='center' gap={1}>
                                        <Typography variant='h5' fontWeight='bold'>
                                            Personal Details
                                        </Typography>
                                        <Badge sx={{ fontSize: 20 }} />
                                        <Divider sx={{ flexGrow: 1, borderColor: '#d0d0d0' }} />
                                    </Box>
                                </Grid>

                                <Grid
                                    item
                                    xs={6}
                                    md={createNewAdmin ? 3 : 4}
                                    container
                                    alignItems='center'
                                    alignContent='flex-start'
                                >
                                    <Label
                                        sx={{ textAlign: 'left', color: !createNewAdmin ? 'text.secondary' : 'unset' }}
                                    >
                                        First Name
                                        <Typography component='span'>*</Typography>
                                    </Label>
                                    <CustomTextFieldWrapper
                                        as={CustomTextField}
                                        name='firstName'
                                        variant='outlined'
                                        size='small'
                                        placeholder='e.g. John'
                                        fullWidth
                                        disabled={!createNewAdmin}
                                        error={touched.firstName && !!errors.firstName}
                                        helperText={touched.firstName && errors.firstName}
                                    />
                                </Grid>

                                <Grid
                                    item
                                    xs={6}
                                    md={createNewAdmin ? 3 : 4}
                                    container
                                    alignItems='center'
                                    alignContent='flex-start'
                                >
                                    <Label
                                        sx={{ textAlign: 'left', color: !createNewAdmin ? 'text.secondary' : 'unset' }}
                                    >
                                        Last Name
                                        <Typography component='span'>*</Typography>
                                    </Label>
                                    <CustomTextFieldWrapper
                                        as={CustomTextField}
                                        name='lastName'
                                        variant='outlined'
                                        size='small'
                                        placeholder='e.g. Doe'
                                        fullWidth
                                        disabled={!createNewAdmin}
                                        error={touched.lastName && !!errors.lastName}
                                        helperText={touched.lastName && errors.lastName}
                                    />
                                </Grid>

                                {createNewAdmin && (
                                    <Grid item xs={6} md={3} container alignItems='center' alignContent='flex-start'>
                                        <Label sx={{ textAlign: 'left' }}>
                                            Aadhar Card
                                            <Typography component='span'>*</Typography>
                                        </Label>
                                        <CustomTextFieldWrapper
                                            as={CustomTextField}
                                            name='aadharCard'
                                            variant='outlined'
                                            size='small'
                                            placeholder='XXXX-XXXX-XXXX'
                                            fullWidth
                                            error={touched.aadharCard && !!errors.aadharCard}
                                            helperText={touched.aadharCard && errors.aadharCard}
                                            value={values.aadharCard}
                                            onChange={e => {
                                                // Remove non-digit characters
                                                const rawValue = e.target.value.replace(/\D/g, '').slice(0, 12)
                                                // Format into groups of 4 digits separated by hyphens
                                                const formattedValue = rawValue.match(/.{1,4}/g)?.join('-') || ''
                                                setFieldValue('aadharCard', formattedValue)
                                            }}
                                        />
                                    </Grid>
                                )}

                                <Grid
                                    item
                                    xs={6}
                                    md={createNewAdmin ? 3 : 4}
                                    container
                                    alignItems='center'
                                    alignContent='flex-start'
                                >
                                    <PhoneField
                                        name='phone'
                                        label='Phone Number'
                                        disabled={!createNewAdmin}
                                        defaultCountry='in' // Default country code for India
                                        labelSx={{
                                            width: '180px',
                                            marginRight: '8px',
                                            whiteSpace: 'nowrap',
                                            fontWeight: '500',
                                            marginBottom: '6px'
                                        }}
                                    />
                                </Grid>
                                {createNewAdmin ? (
                                    <Grid item xs={6} md={6} container alignItems='center' alignContent='flex-start'>
                                        <Tooltip
                                            title="After you create an account, you'll receive a magic link in your email to verify your address. With this link, you won’t need to enter a password or confirm it — simply click the link to complete your verification."
                                            placement='right-start'
                                        >
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Label sx={{ textAlign: 'left', width: '100%' }}>
                                                    Email
                                                    <Typography component='span'>*</Typography>
                                                </Label>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}
                                                >
                                                    <Typography component='span'>
                                                        {values.emailVerified ? 'Verified' : 'Verify'}
                                                    </Typography>
                                                    {values.emailVerified && (
                                                        <Verified color='secondary' fontSize='small' />
                                                    )}
                                                    <CustomSwitch
                                                        isChecked={values.emailVerified}
                                                        handleChange={event =>
                                                            handleSwitchChange(
                                                                event,
                                                                setFieldTouched,
                                                                setFieldValue,
                                                                values,
                                                                errors,
                                                                touched,
                                                                setFieldError
                                                            )
                                                        }
                                                    />
                                                </Box>
                                            </Box>
                                        </Tooltip>
                                        <CustomTextFieldWrapper
                                            as={CustomTextField}
                                            name='email'
                                            variant='outlined'
                                            size='small'
                                            placeholder='e.g. johndoe@gmail.com'
                                            fullWidth
                                            error={touched.email && !!errors.email}
                                            helperText={touched.email && errors.email}
                                        />
                                    </Grid>
                                ) : (
                                    <Grid item xs={6} md={6}>
                                        <CustomAutocomplete
                                            name='email'
                                            label='Email*'
                                            options={[
                                                { value: 'email1@example.com', label: 'email1@example.com' },
                                                { value: 'email2@example.com', label: 'email2@example.com' },
                                                { value: 'email3@example.com', label: 'email3@example.com' }
                                            ]}
                                            value={values.email}
                                            placeholder='Select an email'
                                            onChange={(_, value) => {
                                                setFieldValue('email', value || '')
                                            }}
                                            onBlur={() => setFieldTouched('email', true)}
                                            touched={touched.email}
                                            error={errors.email}
                                            setFieldValue={setFieldValue}
                                            setFieldTouched={setFieldTouched}
                                            showAdornment
                                            customInputSx={customInputSx}
                                            customTextSx={customTextSx}
                                            isOptionEqualToValue={(option, selectedValue) =>
                                                (option?.value || option) === (selectedValue?.value || selectedValue)
                                            }
                                            tempUi
                                            innerLabel={false}
                                        />
                                    </Grid>
                                )}

                                {!createNewAdmin && (
                                    <Grid item xs={6} md={6}>
                                        <CustomAutocomplete
                                            name='aadharCard'
                                            label='Aadhar Card*'
                                            options={[
                                                { value: '1234-5678-9101', label: '1234-5678-9101' },
                                                { value: '2345-6789-0123', label: '2345-6789-0123' },
                                                { value: '3456-7890-1234', label: '3456-7890-1234' }
                                            ]}
                                            value={values.aadharCard}
                                            placeholder='Select an Aadhar card no.'
                                            onChange={(_, value) => {
                                                setFieldValue('aadharCard', value || '')
                                            }}
                                            onBlur={() => setFieldTouched('aadharCard', true)}
                                            touched={touched.aadharCard}
                                            error={errors.aadharCard}
                                            setFieldValue={setFieldValue}
                                            setFieldTouched={setFieldTouched}
                                            showAdornment
                                            customInputSx={customInputSx}
                                            customTextSx={customTextSx}
                                            isOptionEqualToValue={(option, selectedValue) =>
                                                (option?.value || option) === (selectedValue?.value || selectedValue)
                                            }
                                            tempUi
                                            innerLabel={false}
                                        />
                                    </Grid>
                                )}

                                {!values.emailVerified && createNewAdmin && (
                                    <>
                                        <Grid
                                            item
                                            xs={6}
                                            md={3}
                                            container
                                            alignItems='center'
                                            alignContent='flex-start'
                                        >
                                            <Label sx={{ textAlign: 'left' }}>Password</Label>
                                            <CustomTextFieldWrapper
                                                as={CustomTextField}
                                                name='password'
                                                type={showPassword ? 'text' : 'password'}
                                                variant='outlined'
                                                size='small'
                                                fullWidth
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position='end'>
                                                            <IconButton
                                                                onClick={handleTogglePasswordVisibility}
                                                                edge='end'
                                                            >
                                                                {showPassword ? (
                                                                    <Visibility fontSize='small' />
                                                                ) : (
                                                                    <VisibilityOff fontSize='small' />
                                                                )}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                                error={touched.password && !!errors.password}
                                                helperText={touched.password && errors.password}
                                            />
                                        </Grid>

                                        <Grid
                                            item
                                            xs={6}
                                            md={3}
                                            container
                                            alignItems='center'
                                            alignContent='flex-start'
                                        >
                                            <Label sx={{ textAlign: 'left' }}>Confirm Password</Label>
                                            <CustomTextFieldWrapper
                                                as={CustomTextField}
                                                name='confirmPassword'
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                variant='outlined'
                                                size='small'
                                                fullWidth
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position='end'>
                                                            <IconButton
                                                                onClick={handleToggleConfirmPasswordVisibility}
                                                                edge='end'
                                                            >
                                                                {showConfirmPassword ? (
                                                                    <Visibility fontSize='small' />
                                                                ) : (
                                                                    <VisibilityOff fontSize='small' />
                                                                )}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    )
                                                }}
                                                error={touched.confirmPassword && !!errors.confirmPassword}
                                                helperText={touched.confirmPassword && errors.confirmPassword}
                                            />
                                        </Grid>
                                    </>
                                )}
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'end', width: '100%', mt: 2 }}>
                                    <CustomButton
                                        type='button'
                                        variant='outlined'
                                        onClick={() => {
                                            navigate('/userManagement/admin')
                                        }}
                                    >
                                        Cancel
                                    </CustomButton>
                                    <CustomButton variant='clickable' type='submit'>
                                        Submit
                                    </CustomButton>
                                </Box>
                            </Grid>
                            {/* Notes Section */}
                            <Grid item xs={12} md={12}>
                                <Divider
                                    sx={{
                                        borderColor: '#BCC1CA',
                                        marginBottom: '1rem',
                                        boxShadow: '1px 1px 4px #00000054'
                                    }}
                                />
                                <NotesInstructions notes={createNewAdmin ? notes : notesForExistingUser} />
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}
