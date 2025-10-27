/* eslint-disable */
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Grid, Divider, TextField, Button, Box } from '@mui/material'
import { Edit as EditIcon, Visibility as ViewIcon } from '@mui/icons-material'

import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@/core/components/extended/CustomButton'
import { useDispatch } from 'react-redux'
import { getReadOnlyInputSx } from '@/utilities'
import ViewB2BPackTable from '@/app/views/tables/pack/ViewB2BPackTable'
import FormComponent from '@/core/components/forms/FormComponent'
import { useFormik } from 'formik'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { fields, validationSchema } from './formResources'
import { useShowPackDataMutation, useClosePackMutation } from '@/app/store/slices/api/packSlice'

const customSx = getReadOnlyInputSx()

const initialDetailsData = [
    { label: 'Order ID', key: 'orderNo', value: '' },
    { label: 'Pack ID', key: 'no', value: '' },
    { label: 'Total Quantity', key: 'total_quantity', value: '' },
    { label: 'Pending Quantity', key: 'pending_quantity', value: '' },
    { label: 'Total Boxes', key: 'box_count', value: '' },
    { label: 'Invoice No.', key: 'invoice_no', value: '' },
    { label: 'Total Weight', key: 'actual_weight', value: '' },
    { label: 'LxBxH', key: 'dimensions', value: '' },
    { label: 'AWB No.', key: 'awb_no', value: '' },
    { label: 'Courier', key: 'courier_code', value: '' }
]

function Index() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { id: packId } = useParams() // Extract packId from URL parameters to fetch details
    const [showPackData] = useShowPackDataMutation()
    const location = useLocation()
    const path = location.pathname
    const packStatus = location.state
    const isEditPage = path.includes('/edit/')
    const isViewPage = path.includes('/view/')

    // Memoize the fields array based on the status
    const memoizedFields = useMemo(() => fields(packStatus?.status), [packStatus?.status, path])
    const [detailsData, setDetailsData] = useState(structuredClone(initialDetailsData))
    const [formInitialValues, setFormInitialValues] = useState({})
    const [closePack] = useClosePackMutation()

    useEffect(() => {
        if (!parseInt(packId, 10)) return
        ;(async () => {
            const { data: response } = await showPackData(packId).unwrap()
            if (response) {
                setDetailsData(
                    detailsData.map(item => {
                        if (item.key === 'channel')
                            item.value = (
                                <Box display='flex' alignItems='center' gap={1} justifyContent='center'>
                                    <>
                                        {getChannelIcon[item?.channel] || '-'}{' '}
                                        <Typography
                                            variant='body2'
                                            fontWeight={500}
                                            sx={{
                                                maxWidth: '100px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {item?.channel || '-'}
                                        </Typography>
                                    </>
                                </Box>
                            )
                        else if (item.key === 'actual_weight' && response[item.key])
                            item.value = `${response[item.key]} Kg`
                        else if (item.key === 'courier_code') {
                            const courier = fields(packStatus)
                                .find(f => f.name === 'courier_code')
                                ?.options.find(opt => opt.value === response.courier_code)

                            item.value = courier ? courier.label : response.courier_code || '-'
                        } else if (item.key === 'dimensions') {
                            item.value =
                                response.length && response.breadth && response.height
                                    ? `${response.length || ''}x${response.breadth || ''}x${response.height || ''} ${response.unit || ''}`
                                    : ''
                        } else item.value = response[item.key] || ''
                        return item
                    })
                )
                const formValues = {
                    order_id: response.orderNo || '',
                    pack_id: response.no || '',
                    total_quantity: response.total_quantity || '',
                    pending_quantity: response.pending_quantity || '',
                    total_boxes: response.box_count || '',
                    invoice_no: response.invoice_no || '',
                    actual_weight: response.actual_weight || '',
                    dimensions: {
                        length: response.length,
                        breadth: response.breadth,
                        height: response.height,
                        unit: response.unit
                    },
                    awb_no: response.awb_no || '',
                    courier_code:
                        fields(packStatus)
                            .find(f => f.name === 'courier_code')
                            ?.options.find(opt => opt.value === response.courier_code) || '',
                    unit: response.unit || ''
                }
                setFormInitialValues(formValues)

                if (isEditPage) {
                    formik.setValues(formValues)
                }
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [packId, path])

    // Navigation functions
    const handleNavigateToEdit = () => {
        navigate(`/outbound/pack/B2B/edit/${packId}`, {
            state: packStatus,
            replace: false
        })
    }

    const handleNavigateToView = () => {
        navigate(`/outbound/pack/B2B/view/${packId}`, {
            state: packStatus,
            replace: false
        })
    }

    const handleCancelEdit = () => {
        // Navigate back to without saving changes
        navigate(-1)
    }

    // Convert the schema to a Formik-compatible validation function
    const validate = values => {
        const result = validationSchema.safeParse(values)
        let errors = {}

        if (!result.success) {
            errors = result.error.issues.reduce((acc, issue) => {
                acc[issue.path[0]] = issue.message
                return acc
            }, {})
        }
        return errors
    }

    const formik = useFormik({
        initialValues: formInitialValues,
        validate,
        onSubmit: async values => {
            try {
                const payload = {
                    pack_id: parseInt(packId, 10),
                    awb_no: values.awb_no,
                    courier_code: values.courier_code?.value || values.courier_code,
                    weight: values.actual_weight,
                    length: parseInt(values?.dimensions?.length),
                    breadth: parseInt(values?.dimensions?.breadth),
                    height: parseInt(values?.dimensions?.height),
                    unit: values?.dimensions?.unit
                }

                const result = await closePack(payload).unwrap()

                dispatch(
                    openSnackbar({
                        open: true,
                        message: result.message || 'Updated Successfully',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
                handleNavigateToView()
            } catch (error) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: error.data?.message || 'Update failed. Please try again.',
                        variant: 'alert',
                        alert: { color: 'error' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        const { name, value } = e.target
        if (['actual_weight'].includes(name)) {
            // Allow empty input
            if (value === '') {
                formik.setFieldValue(name, '')
                return
            }

            // Allow typing decimal point
            if (value === '.' || value === '0.') {
                formik.setFieldValue(name, value)
                return
            }

            // For decimal input with up to two decimal places
            if (/^(\d+(\.\d{0,2})?)$/.test(value)) {
                // Convert to number before setting
                const numericValue = parseFloat(value)
                formik.setFieldValue(name, numericValue)
            } else if (value.endsWith('.') || /^(\d+\.\d{0,1})$/.test(value)) {
                // Still typing a decimal - allow temporarily as string
                formik.setFieldValue(name, value)
            } else {
                // If more than two decimal places, format to two decimal places
                const numericValue = parseFloat(value)
                if (!Number.isNaN(numericValue) && numericValue >= 0) {
                    formik.setFieldValue(name, Math.max(0, parseFloat(numericValue.toFixed(2))))
                }
            }
            return
        }
        formik.handleChange(e)
    }

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <Grid container sx={{ px: '4px' }}>
                    {isViewPage ? (
                        <Grid
                            container
                            spacing={1.5}
                            sx={{
                                p: 1,
                                pt: 2,
                                position: 'relative'
                            }}
                        >
                            {detailsData.map((field, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <Grid item xs={12} sm={2.4} key={index}>
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        value={field.value}
                                        InputProps={{ readOnly: true }}
                                        InputLabelProps={{ shrink: true }} // Forces label to stay on top
                                        sx={
                                            field.label === 'Pending Quantity'
                                                ? {
                                                      ...customSx,
                                                      '& input': {
                                                          ...customSx['& input'],
                                                          color: 'error.main'
                                                      }
                                                  }
                                                : customSx
                                        }
                                    />
                                </Grid>
                            ))}
                            {/* Action Button */}
                            {isViewPage && packStatus?.status === 'Packed' && (
                                <Box display='flex' justifyContent='flex-end' sx={{ width: '100%', mt: 1 }}>
                                    <CustomButton
                                        variant='contained'
                                        color='primary'
                                        startIcon={<EditIcon />}
                                        onClick={handleNavigateToEdit}
                                    >
                                        Update Pack
                                    </CustomButton>
                                </Box>
                            )}
                        </Grid>
                    ) : (
                        <FormComponent
                            fields={memoizedFields}
                            formik={formik}
                            handleCustomChange={handleCustomChange}
                            customStyle={{
                                backgroundColor: 'none'
                            }}
                            submitButtonSx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                width: '100%',
                                gap: 1,
                                pt: 1.5
                            }}
                            showSeparaterBorder={false}
                            submitButtonText='Update'
                            disableSubmitButton={!formik.dirty}
                            showCancelButton
                            onClickCancel={handleCancelEdit}
                        />
                    )}
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            mt: '-2rem',
                            borderColor: '#BCC1CA',
                            mb: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <ViewB2BPackTable isEditPage={isEditPage} packId={packId} />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
