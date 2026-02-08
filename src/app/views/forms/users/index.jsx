/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'
import IdentityCard from '@core/components/IdentityCard'
import {
    useGetDataForCreateQuery,
    useCreateUserMutation,
    getDataForUpdate,
    useGetUserRolesQuery
} from '@/app/store/slices/api/usersSlice'

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

// eslint-disable-next-line react/prop-types
function CustomTextFieldWrapper({ name, ...props }) {
    return (
        <Field name={name}>
            {({ field, form: { touched, errors } }) => (
                <CustomTextField
                    {...field}
                    {...props}
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
    { id: 'n3', text: 'Choose a Role from the dropdown options (eg: Admin, User, or Custom).' },
    { id: 'n4', text: 'Select relevant Accounts from the provided list.' },
    { id: 'n5', text: 'Enter and confirm a strong Password (use letters, numbers, and special characters).' },
    { id: 'n6', text: 'Verify all provided information for accuracy.' },
    { id: 'n7', text: 'Click the Submit button to save your information, or Cancel to discard changes.' }
]

export default function SetupUserForm() {
    usePrompt()
    const { id: editId } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const formikRef = useRef()
    const [createUser] = useCreateUserMutation()
    const { user } = useSelector(state => state.auth)

    // const { data: creationData } = useGetDataForCreateQuery()
    const { createUserLKey, getDataForCreateLKey } = useSelector(state => state.loading)

    const [roles, setRoles] = useState([])
    const [accounts, setAccounts] = useState([])
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // const [getUserRoles] = useGetUserRolesQuery()
    const { data, isFetching, refetch } = useGetUserRolesQuery(`?clientId=${user.clientId}`)

    // const [hidePassword, setHidePassword] = useState(false)

    const handleTogglePasswordVisibility = () => setShowPassword(!showPassword)
    const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

    const handleDeleteTag = (tag, values, setFieldValue) => {
        setFieldValue(
            'selectedAccounts',
            values.selectedAccounts.filter(account => account.value !== tag)
        )
    }
    useEffect(() => {
        if (data?.data) {
            setRoles(data.data)
        }
    }, [data])
    const initialValues = {
        firstName: '',

        phone: '',
        email: '',

        password: '',
        confirmPassword: '',
        role: null
    }

    const validationSchema = z.object({
        firstName: z.string().min(1, 'First Name is required'),

        phone: z.string().superRefine((val, ctx) => {
            const cleaned = val.replace(/-/g, '').trim()
            if (!cleaned) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Phone number is required'
                })
            } else if (!/^\d{10,15}$/.test(cleaned)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Must be a valid phone number'
                })
            }
        }),
        email: z.union([z.string().min(1, 'Email is required'), z.string().email('Invalid email format')]),

        password: z.string().optional(),
        confirmPassword: z.string().optional(),
        role: z
            .object({
                id: z.number().min(1, { message: 'Role is required' }),
                name: z.string()
            })
            .nullable()
            .refine(val => val !== null, {
                message: 'Role is required'
            }),
        selectedAccounts: z
            .array(
                z.preprocess(
                    val => (typeof val === 'object' && val !== null ? val : null),
                    z
                        .object({
                            value: z.number().min(1, { message: 'Account is required' }),
                            label: z.string()
                        })
                        .nullable()
                        .refine(val => val !== null, {
                            message: 'Account is required'
                        })
                )
            )
            // .min(1, 'Select at least one account')
            .optional()
    })
    // .superRefine((data, ctx) => {
    //     if (!data.emailVerified) {
    //         if (!data.password || data.password.length < 6) {
    //             ctx.addIssue({
    //                 code: z.ZodIssueCode.too_small,
    //                 minimum: 6,
    //                 type: 'string',
    //                 inclusive: true,
    //                 message: 'Password must be at least 6 characters',
    //                 path: ['password']
    //             })
    //         }

    //         if (!data.confirmPassword) {
    //             ctx.addIssue({
    //                 code: z.ZodIssueCode.custom,
    //                 message: 'Confirm password is required',
    //                 path: ['confirmPassword']
    //             })
    //         }

    //         if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    //             ctx.addIssue({
    //                 code: z.ZodIssueCode.custom,
    //                 message: 'Password and confirm password must match',
    //                 path: ['confirmPassword']
    //             })
    //         }
    //     }

    //     if (
    //         data?.role &&
    //         data.role?.value &&
    //         data.role.value !== 1 &&
    //         (!data.selectedAccounts || !data.selectedAccounts.length)
    //     ) {
    //         ctx.addIssue({
    //             code: z.ZodIssueCode.custom,
    //             message: 'Select at least one account refine',
    //             path: ['selectedAccounts']
    //         })
    //     }
    // })

    // Password schema that can be conditionally added or removed
    // const passwordSchema = z.object({
    //     password: z.string().min(6, 'Must be at least 6 characters'),
    //     confirmPassword: z.string().min(6, 'Must be at least 6 characters')
    // })

    // // TODO:: password and confirm password matching validation needs to be added

    // // Dynamically decide schema based on hidePassword state
    // const validationSchema = hidePassword ? baseSchema : baseSchema.merge(passwordSchema) // Add password validation schema if hidePassword is false

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

    // useEffect(() => {
    //     if (creationData?.data && Object.keys(creationData.data).length) {
    //         setRoles(
    //             Object.keys(creationData.data.roles).map(item => ({
    //                 label: `${item}`,
    //                 value: creationData.data.roles[`${item}`]
    //             }))
    //         )

    //         setAccounts(
    //             Object.keys(creationData.data.accounts).map(item => ({
    //                 label: `${item}`,
    //                 value: creationData.data.accounts[`${item}`]
    //             }))
    //         )
    //     }
    // }, [creationData])

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

    // useEffect(() => {
    //     const getUserData = async id => {
    //         const response = await dispatch(getDataForUpdate.initiate(id))
    //         console.log(response)
    //         if (response?.data?.success) {
    //             const { selectedUser, mappedAccounts, roles: rolesList } = response.data.data
    //             if (formikRef.current) {
    //                 const formData = {
    //                     firstName: selectedUser?.name || '',

    //                     phone: `91${selectedUser?.contact_no || ''}`,
    //                     email: selectedUser?.email || '',
    //                     password: selectedUser?.password || '',
    //                     confirmPassword: selectedUser?.password || '',
    //                     role: {
    //                         label: Object.keys(rolesList).filter(
    //                             key => rolesList[`${key}`] === selectedUser.role_id
    //                         )[0],
    //                         value: selectedUser.role_id
    //                     }
    //                 }
    //                 formikRef.current.setValues(formData) // to call formik setValues
    //             }
    //         }
    //     }
    //     if (editId && parseInt(editId, 10)) getUserData(editId)
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [editId])
    useEffect(() => {
        const getUserData = async id => {
            const response = await dispatch(getDataForUpdate.initiate(id))
            console.log(response, 'API Response')

            if (response?.data?.success) {
                // The API returns the user object directly in response.data.data
                const userData = response.data.data

                if (formikRef.current && userData) {
                    const formData = {
                        firstName: userData?.name || '',
                        // Note: Your response uses 'phoneNumber', not 'contact_no'
                        phone: userData?.phoneNumber || '',
                        email: userData?.email || '',
                        // password: userData?.password || '',
                        // confirmPassword: userData?.password || '',
                        // The label is directly available in userData.role.name
                        role: userData?.role
                    }
                    formikRef.current.setValues(formData)
                }
            }
        }

        if (editId && parseInt(editId, 10)) {
            getUserData(editId)
        }
    }, [editId, dispatch])

    return (
        <Box sx={{ py: 2 }}>
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validate={validate}
                onSubmit={async (values, { setFieldError, resetForm, setValues }) => {
                    // if (values.role === 'Custom') {
                    //     navigate('/userManagement/role/create', { state: { from: 'createUser' } })
                    //     return
                    // }
                    const payload = {
                        name: values.firstName,
                        role_id: values.role?.id?.toString(),
                        email: values.email,
                        contact_no: values.phone.slice(2).replace(/-/g, ''),
                        password: values.password,
                        client_id: user?.clientId
                    }
                    let isError = false
                    let message

                    if (editId && parseInt(editId, 10)) {
                        payload.id = editId
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
                        }
                    }
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
                                border: '1px solid',
                                borderColor: 'grey.borderLight',
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
                                                        ? `${values?.firstName || ''} ${values?.lastName ? values?.lastName : ''}`
                                                        : 'N/A'
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
                                            },
                                            {
                                                label: 'Role',
                                                value: values?.role?.name
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

                                <Grid item xs={6} md={3} container alignItems='center' alignContent='flex-start'>
                                    <Label sx={{ textAlign: 'left' }}>
                                        Name
                                        <Typography component='span'>*</Typography>
                                    </Label>
                                    <CustomTextFieldWrapper
                                        as={CustomTextField}
                                        name='firstName'
                                        variant='outlined'
                                        size='small'
                                        placeholder='e.g. John'
                                        fullWidth
                                        error={touched.firstName && !!errors.firstName}
                                        helperText={touched.firstName && errors.firstName}
                                    />
                                </Grid>

                                <Grid item xs={6} md={3} container alignItems='center' alignContent='flex-start'>
                                    <PhoneField
                                        name='phone'
                                        label='Phone Number'
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
                                <Grid item xs={6} md={6} container alignItems='center' alignContent='flex-start'>
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
                                            {values.emailVerified && <Verified color='secondary' fontSize='small' />}
                                            {/* <CustomSwitch
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
                                                /> */}
                                        </Box>
                                    </Box>

                                    <CustomTextFieldWrapper
                                        as={CustomTextField}
                                        name='email'
                                        variant='outlined'
                                        size='small'
                                        placeholder='e.g. johndoe@gmail.com'
                                        fullWidth
                                        error={touched.email && !!errors.email}
                                        helperText={touched.email && errors.email}
                                        autocomplete='off'
                                    />
                                </Grid>

                                {!values.emailVerified && (
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
                                                autocomplete='off'
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

                                {/* Setup Section */}
                                <Grid item xs={12}>
                                    <Box display='flex' alignItems='center' gap={1} mt={2}>
                                        <Typography variant='h5' fontWeight='bold'>
                                            Setup
                                        </Typography>
                                        <Build sx={{ fontSize: 20 }} />
                                        <Divider sx={{ flexGrow: 1, borderColor: '#d0d0d0' }} />
                                    </Box>
                                </Grid>
                                <Grid item xs={6} md={4.5}>
                                    <CustomAutocomplete
                                        name='role'
                                        label='Role*'
                                        options={roles}
                                        value={values.role}
                                        loading={!!getDataForCreateLKey}
                                        placeholder='Select a role'
                                        // eslint-disable-next-line no-unused-vars
                                        onChange={(_, value, label) => {
                                            console.log(value)
                                            setFieldValue('role', value || null)
                                        }}
                                        onBlur={() => setFieldTouched('role', true)}
                                        touched={touched.role}
                                        error={errors.role}
                                        setFieldValue={setFieldValue}
                                        setFieldTouched={setFieldTouched}
                                        showAdornment
                                        customInputSx={customInputSx}
                                        customTextSx={customTextSx}
                                        isOptionEqualToValue={(option, selectedValue) =>
                                            option.value === selectedValue.value
                                        }
                                        getOptionLabel={option => option.name}
                                        innerLabel={false}
                                    />
                                </Grid>

                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'end', width: '100%', mt: 2 }}>
                                    <CustomButton
                                        type='button'
                                        variant='outlined'
                                        onClick={() => {
                                            navigate('/userManagement/user')
                                        }}
                                    >
                                        Cancel
                                    </CustomButton>
                                    <CustomButton variant='clickable' type='submit' loading={createUserLKey}>
                                        Submit
                                    </CustomButton>
                                </Box>
                            </Grid>

                            {/* Notes Section */}
                            <Grid item xs={12} md={12}>
                                <Divider
                                    sx={{
                                        borderColor: 'grey.borderLight',
                                        marginBottom: '1rem',
                                        boxShadow: '1px 1px 4px #00000054'
                                    }}
                                />
                                <NotesInstructions notes={notes} />
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Box>
    )
}
