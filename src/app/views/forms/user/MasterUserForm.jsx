import React from 'react'
import { z } from 'zod'
import { Box, Grid, TextField } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import FormComponent from '@core/components/forms/FormComponent'
import { useFormik } from 'formik'

// Define the Zod schema for validation
const formSchema = z.object({
    firstName: z
        .string()
        .min(2, 'First Name must be at least 2 characters long')
        .max(50, 'First Name must be 50 characters or less')
        .regex(/^[A-Za-z\s]+$/, 'First Name must contain only alphabetic characters'),

    lastName: z
        .string()
        .min(2, 'Last Name must be at least 2 characters long')
        .max(50, 'Last Name must be 50 characters or less')
        .regex(/^[A-Za-z\s]+$/, 'Last Name must contain only alphabetic characters'),

    aadhaarNo: z.string().length(12, 'Aadhaar No. must be 12 digits').regex(/^\d+$/, 'Aadhaar No. must be numeric'),

    email: z.string().email('Invalid Email format'),

    emailVerified: z.boolean(),

    role: z.string().min(1, 'Role is required'),

    contactNo: z.string().regex(/^[0-9]{10}$/, 'Contact No. must be exactly 10 digits numeric'),

    contactNoSwitch: z.boolean(),
    addAccount: z.string().min(1, 'Add Account is required'),

    accountMapped: z.string().optional()
})

// Define fields for FormComponent
const formFields = [
    { name: 'firstName', label: 'First Name', type: 'text', grid: { xs: 12, sm: 6 }, size: 'small' }, // First two fields in the same row
    { name: 'lastName', label: 'Last Name', type: 'text', grid: { xs: 12, sm: 6 }, size: 'small' },
    { name: 'aadhaarNo', label: 'Aadhaar No.', type: 'text', grid: { xs: 12, sm: 6 }, size: 'small' }, // Next two fields in the same row
    { name: 'email', label: 'Email ID', type: 'text', grid: { xs: 12, sm: 6 }, size: 'small' },
    { name: 'emailVerified', label: 'Email Verified', type: 'switch', grid: { xs: 12, sm: 6 }, size: 'small' }, // Switch and role in the same row
    {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' }
        ],
        grid: { xs: 12, sm: 6 },
        size: 'small'
    },
    { name: 'contactNo', label: 'Contact No.', type: 'text', grid: { xs: 12, sm: 6 }, size: 'small' },
    { name: 'contactNoSwitch', label: 'Contact No', type: 'switch', grid: { xs: 12, sm: 6 }, size: 'small' },
    {
        name: 'addAccount',
        label: 'Add Account',
        type: 'select',
        options: [
            { value: 'account1', label: 'Account 1' },
            { value: 'account2', label: 'Account 2' }
        ],
        grid: { xs: 12, sm: 6 },
        size: 'small'
    },
    {
        name: 'accountMapped',
        label: 'Account Mapped',
        type: 'select',
        options: [
            { value: 'account1', label: 'Account 1' },
            { value: 'account2', label: 'Account 2' }
        ],
        grid: { xs: 12, sm: 6 },
        size: 'small'
    }
]

function MasterUserForm() {
    const initialValues = {
        firstName: '',
        lastName: '',
        aadhaarNo: '',
        email: '',
        emailVerified: false,
        role: '',
        contactNo: '',
        contactNoSwitch: false,
        addAccount: '',
        accountMapped: ''
    }

    const formik = useFormik({
        initialValues,
        validationSchema: formSchema,
        // eslint-disable-next-line no-unused-vars
        onSubmit: values => {
            // TODO: do your form submission here
        }
    })

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                justifyContent: 'space-between',
                p: 1
            }}
        >
            {/* Left Side Section - Basic Information */}
            <MainCard
            // sx={{
            //     width: { xs: '100%', md: '30%' },
            //     mb: { xs: 3, md: 0 },
            //     mr: { md: 2 },
            //     boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
            //     backgroundColor: '#f9f9f9',
            //     padding: 2
            // }}
            >
                <Box component='form'>
                    <Grid container direction='column' spacing={2}>
                        <Grid item>
                            <TextField fullWidth label='First Name' value={initialValues.firstName} disabled />
                        </Grid>
                        <Grid item>
                            <TextField fullWidth label='Last Name' value={initialValues.lastName} disabled />
                        </Grid>
                        <Grid item>
                            <TextField fullWidth label='Aadhaar No.' value={initialValues.aadhaarNo} disabled />
                        </Grid>
                    </Grid>
                </Box>
            </MainCard>

            {/* Right Side Section - Dynamic Form */}
            <MainCard
            // sx={{
            //     width: { xs: '100%', md: '65%' },
            //     boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
            //     backgroundColor: '#f9f9f9',
            //     padding: 2
            // }}
            >
                <FormComponent fields={formFields} formik={formik} />
            </MainCard>
        </Box>
    )
}

export default MasterUserForm
