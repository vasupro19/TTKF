import React, { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useFormik } from 'formik'
import { Box, Divider, Grid } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import IdentityCard from '@/core/components/IdentityCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useGetFacebookPagesQuery,
    useCreateFacebookPageMutation,
    useUpdateFacebookPageMutation
} from '@/app/store/slices/api/facebookSlice'
import { useGetUsersQuery } from '@/app/store/slices/api/usersSlice'

function FacebookIntegrationForm() {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.auth)
    const { createFacebookPageLKey, updateFacebookPageLKey } = useSelector(state => state.loading || {})

    const [createFacebookPage] = useCreateFacebookPageMutation()
    const [updateFacebookPage] = useUpdateFacebookPageMutation()
    const { data: users = [] } = useGetUsersQuery()
    const { data: facebookPagesResponse } = useGetFacebookPagesQuery(`?clientId=${user?.clientId}`, {
        skip: !user?.clientId
    })

    const existingConfig = useMemo(() => {
        const configList = facebookPagesResponse?.data
        return Array.isArray(configList) && configList.length ? configList[0] : null
    }, [facebookPagesResponse])

    const initialValues = {
        pageId: '',
        pageAccessToken: '',
        userAccessToken: '',
        formIds: '',
        defaultAssignedTo: '',
        isActive: true
    }

    const validationSchema = z.object({
        pageId: z.string().min(1, 'Page ID is required'),
        pageAccessToken: z.string().min(1, 'Page access token is required'),
        userAccessToken: z.string().min(1, 'User access token is required'),
        formIds: z.string().optional(),
        defaultAssignedTo: z.union([z.string().min(1, 'Assigned user is required'), z.number()]),
        isActive: z.boolean().optional()
    })

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

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validate,
        onSubmit: async values => {
            if (!user?.clientId) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Client context is missing for this login session',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
                return
            }

            try {
                const payload = {
                    ...values,
                    clientId: Number(user.clientId),
                    defaultAssignedTo: Number(values.defaultAssignedTo),
                    formIds: values.formIds?.trim() || null
                }

                const response = existingConfig?.id
                    ? await updateFacebookPage({ id: existingConfig.id, ...payload }).unwrap()
                    : await createFacebookPage(payload).unwrap()

                if (response.success || response.status_code === 200) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: response.message || 'Facebook integration saved successfully',
                            variant: 'alert',
                            alert: { color: 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error?.data?.data?.message || 'Unable to save Facebook integration',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'right' }
                    })
                )
            }
        }
    })
    const { setValues } = formik

    useEffect(() => {
        if (existingConfig) {
            setValues({
                pageId: existingConfig.pageId || '',
                pageAccessToken: existingConfig.pageAccessToken || '',
                userAccessToken: existingConfig.userAccessToken || '',
                formIds: existingConfig.formIds || '',
                defaultAssignedTo: existingConfig.defaultAssignedTo ? existingConfig.defaultAssignedTo.toString() : '',
                isActive: typeof existingConfig.isActive === 'boolean' ? existingConfig.isActive : true
            })
            return
        }
        setValues(initialValues)
    }, [existingConfig, setValues])

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '12px 8px'
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white'
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray'
        },
        flexGrow: 1
    }

    const userOptions =
        users?.data?.map(item => ({
            label: item.name,
            value: item.id.toString()
        })) ?? []

    const fields = [
        {
            name: 'pageId',
            label: 'Page ID',
            type: 'text',
            required: true,
            placeholder: 'Enter Facebook page id',
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx
        },
        {
            name: 'defaultAssignedTo',
            label: 'Default Assigned To',
            type: 'select',
            required: true,
            options: userOptions,
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx
        },
        {
            name: 'pageAccessToken',
            label: 'Page Access Token',
            type: 'password',
            required: true,
            placeholder: 'Enter page access token',
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx
        },
        {
            name: 'userAccessToken',
            label: 'User Access Token',
            type: 'password',
            required: true,
            placeholder: 'Enter user access token',
            grid: { xs: 12, sm: 6, md: 6 },
            size: 'small',
            customSx
        },
        {
            name: 'formIds',
            label: 'Form IDs',
            type: 'text',
            required: false,
            placeholder: 'Comma separated form ids',
            grid: { xs: 12, sm: 8, md: 8 },
            size: 'small',
            customSx
        },
        {
            name: 'isActive',
            label: 'Active',
            type: 'switch',
            grid: { xs: 12, sm: 4, md: 4 },
            size: 'small'
        }
    ]

    const identityCardData = [
        { label: 'Client ID', value: user?.clientId ?? 'N/A' },
        { label: 'Page ID', value: formik.values.pageId || 'N/A' },
        { label: 'Status', value: formik.values.isActive ? 'Active' : 'Inactive' },
        { label: 'Mode', value: existingConfig?.id ? 'Edit Existing' : 'Create New' }
    ]

    const handleCustomChange = e => {
        formik.handleChange(e)
    }

    return (
        <MainCard
            sx={{ py: '1px' }}
            contentSX={{ px: '2px', py: 1.5 }}
            title={existingConfig?.id ? 'Edit Facebook Integration' : 'Create Facebook Integration'}
        >
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdentityCard data={identityCardData} />
                    </Grid>
                </Grid>

                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                fields={fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                submitting={createFacebookPageLKey || updateFacebookPageLKey}
                                customStyle={{ backgroundColor: 'none' }}
                                submitButtonText={existingConfig?.id ? 'Update' : 'Create'}
                                submitButtonSx={{ textAlign: 'right', marginTop: 2 }}
                                showSeparaterBorder={false}
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default FacebookIntegrationForm
