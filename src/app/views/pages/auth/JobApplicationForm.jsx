import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    CircularProgress
} from '@mui/material'
import { X, CheckCircle } from 'lucide-react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useSubmitJobApplicationMutation } from '@/app/store/slices/api/jobSlice'

const applicationSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Enter a valid email address').min(1, 'Email is required'),
    phone: z.string().min(1, 'Phone number is required'),
    coverLetter: z.string().optional()
})

export default function JobApplicationForm({ open, onClose }) {
    const [success, setSuccess] = useState(false)
    const [submitJobApplication] = useSubmitJobApplicationMutation()

    const validate = values => {
        try {
            applicationSchema.parse(values)
            return {}
        } catch (error) {
            const errors = {}
            error.errors.forEach(err => {
                errors[err.path[0]] = err.message
            })
            return errors
        }
    }

    const formik = useFormik({
        initialValues: { fullName: '', email: '', phone: '', coverLetter: '' },
        validate,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                await submitJobApplication(values).unwrap()

                setSuccess(true)
                resetForm()
            } catch (err) {
                console.error('Job application failed', err)
            } finally {
                setSubmitting(false)
            }
        }
    })

    const handleClose = () => {
        setSuccess(false)
        formik.resetForm()
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth='sm'
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
        >
            {/* Header */}
            <Box
                sx={{
                    bgcolor: '#1c2d45',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.2rem' }}>
                    Travelytics Job Portal
                </Typography>
                <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    <X size={20} />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 4 }}>
                {success ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CheckCircle size={64} color='#39B54A' style={{ margin: '0 auto 16px' }} />
                        <Typography variant='h5' sx={{ fontWeight: 700, color: '#1a2535', mb: 1 }}>
                            Application Sent!
                        </Typography>
                        <Typography sx={{ color: '#64748b' }}>
                            Your profile has been shared with all our registered travel companies. They will contact you
                            if your profile matches their open roles.
                        </Typography>
                        <Button
                            variant='contained'
                            onClick={handleClose}
                            sx={{
                                mt: 4,
                                bgcolor: '#39B54A',
                                borderRadius: '8px',
                                px: 4,
                                '&:hover': { bgcolor: '#2ea040' }
                            }}
                        >
                            Close
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ fontWeight: 800, color: '#1a2535', fontSize: '1.3rem', mb: 0.5 }}>
                                Submit Your Profile
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Looking for a job in the travel industry? Submit your details here to get noticed by top
                                agencies.
                            </Typography>
                        </Box>

                        <Box component='form' onSubmit={formik.handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth
                                    id='fullName'
                                    name='fullName'
                                    label='Full Name'
                                    variant='outlined'
                                    value={formik.values.fullName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                                    helperText={formik.touched.fullName && formik.errors.fullName}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    fullWidth
                                    id='email'
                                    name='email'
                                    label='Email Address'
                                    variant='outlined'
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    fullWidth
                                    id='phone'
                                    name='phone'
                                    label='Phone Number'
                                    variant='outlined'
                                    value={formik.values.phone}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                                    helperText={formik.touched.phone && formik.errors.phone}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    fullWidth
                                    id='coverLetter'
                                    name='coverLetter'
                                    label='Cover Letter & Job Preferences'
                                    variant='outlined'
                                    multiline
                                    rows={4}
                                    value={formik.values.coverLetter}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    placeholder='Tell us briefly about your experience and the type of role you are looking for...'
                                    InputLabelProps={{ shrink: true }}
                                />

                                <Button
                                    fullWidth
                                    type='submit'
                                    variant='contained'
                                    disabled={formik.isSubmitting}
                                    sx={{
                                        mt: 1,
                                        bgcolor: '#39B54A',
                                        color: 'white',
                                        py: 1.5,
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        boxShadow: '0 4px 14px rgba(57,181,74,0.3)',
                                        '&:hover': { bgcolor: '#2ea040' }
                                    }}
                                >
                                    {formik.isSubmitting ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        'Submit Application'
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
