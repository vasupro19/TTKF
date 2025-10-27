import { useRef, useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'
import { Formik } from 'formik'
import { styled, TableCell, TextField, useTheme } from '@mui/material'
import { debounce } from '@mui/material/utils'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import CustomAutocomplete from '@/core/components/extended/CustomAutocomplete'
import { useScanAsnItemMutation } from '@/app/store/slices/api/asnSlice'
import { getVendorAndProductById } from '@/app/store/slices/api/purchaseOrderSlice'
import { isEdit } from '@/constants'
import { getItemsList } from '@/app/store/slices/api/commonSlice'
import CustomButton from '@/core/components/extended/CustomButton'

const initialValues = {
    product_code: '',
    ean: '',
    quantity: '',
    mrp: '',
    unit_cost: '',
    lot_no: '',
    mfd_date: '',
    expiry_date: ''
}

function ProductTableForm({ setConfig, config, asnData, fetchASNItems }) {
    const { id: editId } = useParams()
    const theme = useTheme()
    const dispatch = useDispatch()
    const formikRef = useRef()
    const { scanAsnItemLKey } = useSelector(state => state.loading)

    const [scanAsnItem] = useScanAsnItemMutation()

    const [product, setProduct] = useState([])
    const [dualMrp, setDualMrp] = useState(true)
    // const [productData, setProductData] = useState(null)

    const globalCellStyles = {
        padding: '6px 8px',
        border: 'none',
        borderColor: 'primary.dark',
        backgroundColor: theme.palette.grey[200]
    }

    const getItemsListReq = useMemo(
        () =>
            debounce(async (callback, request = `?term=&limit=40&page=1`) => {
                try {
                    const { data: response } = await dispatch(
                        getItemsList.initiate(request, { meta: { disableLoader: true } })
                    )
                    callback(response?.items || [])
                } catch (error) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: error.data?.message || 'An error occurred, please try again',
                            variant: 'alert',
                            alert: { color: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                }
            }, 400),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const handleAutoCompleteSearch = search => {
        getItemsListReq(data => setProduct(data), `?term=${search?.value || ''}&limit=40&page=1`)
    }
    // dynamic fields for table header row
    const tabsFields = [
        {
            name: 'product_code',
            label: 'Product Code',
            placeholder: 'Select here',
            type: 'CustomAutocomplete',
            options: product || [],
            onInputChange: handleAutoCompleteSearch,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        },
        {
            name: 'ean',
            label: 'EAN/UPC',
            placeholder: 'EAN/UPC',
            type: 'text',
            isDisabled: true
        },
        {
            name: 'quantity',
            label: 'Quantity',
            placeholder: 'Quantity*',
            type: 'number',
            isDisabled: !config.canEdit
        },
        {
            name: 'mrp',
            label: 'MRP',
            placeholder: 'MRP',
            type: 'number',
            isDisabled: !dualMrp || !config.canEdit
        },
        {
            name: 'unit_cost',
            label: 'Unit Cost',
            placeholder: 'Unit cost',
            type: 'number',
            isDisabled: !config.canEdit
        },
        {
            name: 'lot_no',
            label: 'Lot No.',
            placeholder: 'Lot No.',
            type: 'text',
            isDisabled: !config.canEdit
        },
        {
            name: 'mfd_date',
            label: 'Mfg Date',
            placeholder: 'Mfg Date',
            type: 'date',
            isDisabled: !config.canEdit
        },
        {
            name: 'expiry_date',
            label: 'Expiry Date',
            placeholder: 'Expiry Date',
            type: 'date',
            isDisabled: !config.canEdit
        }
    ]

    // Custom styles
    const CustomTextField = styled(TextField)({
        '& input': {
            backgroundColor: '#fff',
            padding: '4px 8px',
            height: '10px', // Decrease input height
            boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
        },
        width: 'auto',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        }
    })
    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '4px 8px',
            height: '8px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        }
    }
    const customInputSx = {
        '&.MuiAutocomplete-hasPopupIcon .MuiOutlinedInput-root, &.MuiAutocomplete-hasClearIcon .MuiOutlinedInput-root':
            {
                paddingRight: '6px !important', // Set your desired padding here
                boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px'
            }
    }
    const bdStr = '2px solid !important'

    const validationSchema = z.object({
        // item_no: z.string().refine(value => value === null || /^[a-zA-Z0-9]+$/.test(value), {
        //     message: 'Product code must contain only alphanumeric characters'
        // })
        product_code: z.object({
            value: z.number().min(1, { message: 'Product Code is required' }),
            label: z.string()
        }),
        quantity: z.number().min(1, { message: 'product quantity is required!' })
    })
    // const initialValues = tabsFields?.reduce((acc, field) => {
    //     if (field.name === 'item_no') {
    //         acc[field.name] = null
    //     } else {
    //         acc[field.name] = ''
    //     }
    //     return acc
    // }, {})

    const validate = values => {
        try {
            validationSchema.parse(values)
            return {}
        } catch (error) {
            const formikErrors = error.formErrors.fieldErrors

            if (formikErrors.item_no) {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Please select a Product code',
                        variant: 'alert',
                        alert: { color: 'warning', icon: 'warning' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )
            }

            return formikErrors
        }
    }

    const getProductData = async query => {
        try {
            const { data: response } = await dispatch(
                getVendorAndProductById.initiate(query, { meta: { disableLoader: true } })
            )
            formikRef.current.setFieldValue('unit_cost', response?.data?.productDetails?.unit_price)
            formikRef.current.setFieldValue('mrp', response?.data?.productDetails?.mrp_price)
            formikRef.current.setFieldValue('ean', response?.data?.productDetails?.no_2)

            setDualMrp(!!response?.data?.productDetails?.dual_mrp)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error.data?.message || 'An error occurred, please try again',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        }
    }

    const handleCustomChange = (e, { setFieldValue, handleChange }) => {
        const { name, value } = e.target

        if (name === 'product_code' && value?.label) getProductData(`?item_id=${value.value}`)
        else if (name === 'product_code' && !value) formikRef.current.resetForm()
        if (['quantity'].includes(name)) {
            // Prevent negative values or allow empty input
            if (value === '') {
                setFieldValue(name, '') // Allow empty value
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0) {
                    numericValue = 0 // Reset to 0 if invalid
                }
                setFieldValue(name, numericValue)
            }
        } else if (['tax', 'discount'].includes(name)) {
            // Allow positive decimal values between 0 and 100
            if (value === '') {
                setFieldValue(name, '') // Allow empty value
            } else {
                let numericValue = parseFloat(value)
                if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
                    numericValue = Math.max(0, Math.min(100, numericValue || 0)) // Clamp between 0 and 100
                }
                setFieldValue(name, numericValue)
            }
        } else {
            // Default handler for other fields
            handleChange(e)
        }
    }

    useEffect(() => {
        getItemsListReq(data => setProduct(data))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            onSubmit={async (values, { resetForm }) => {
                try {
                    const { data: response } = await scanAsnItem({
                        items: [
                            { ...values, product_code: values.product_code.label, item_id: values.product_code.value }
                        ],
                        asn_detail_id: config.asnId,
                        ...asnData,
                        po_no: asnData?.po_no?.label || asnData?.po_no,
                        vendor_code: asnData?.vendor_code?.label || asnData?.vendor_code,
                        vendor_id: asnData?.vendor_code?.value || '',
                        asn_nature: asnData?.status?.value || '',
                        transporter_name: asnData?.transporter_name?.value || asnData.transporter_name
                    }).unwrap()
                    setConfig({ ...config, asnId: response?.asnDetail.id, submit: true })
                    if (!config.asnId) await fetchASNItems(`?id=${response.asnDetail.id}`)
                    // Reset the form after successful submission
                    resetForm()
                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'item scanned successfully!',
                            variant: 'alert',
                            alert: { color: 'success', icon: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                } catch (error) {
                    const backendErrors = error.data?.data?.errors || {
                        error: [error?.data?.message || error?.message || 'unable to scan']
                    }
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ') // Join multiple messages with a comma
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: messages.join(', '),
                                variant: 'alert',
                                alert: { color: 'error', icon: 'error' },
                                anchorOrigin: { vertical: 'top', horizontal: 'right' }
                            })
                        )
                    })
                }
            }}
            validate={validate}
            validateOnBlur={false} // Disable validation on blur
            validateOnChange // Disable validation on change
        >
            {({ values, handleChange, setFieldValue, setFieldTouched, handleSubmit, errors, touched }) => (
                <>
                    {tabsFields?.map(field => (
                        <TableCell
                            key={field.name}
                            sx={{
                                borderTop: bdStr,
                                borderBottom: bdStr,
                                ...globalCellStyles
                            }}
                        >
                            {field.type === 'CustomAutocomplete' ? (
                                <CustomAutocomplete
                                    name={field.name}
                                    options={field.options}
                                    placeholder={field.placeholder}
                                    value={values[field.name]}
                                    onChange={(event, value) => {
                                        setFieldValue(field.name, value)
                                        handleCustomChange(
                                            { target: { name: field.name, value: value || '' } },
                                            { setFieldValue, handleChange }
                                        )
                                    }}
                                    onInputChange={field?.onInputChange}
                                    customSx={field.customSx || customSx}
                                    customInputSx={field.customInputSx || customInputSx}
                                    showAdornment={false}
                                    customInputProp={{
                                        height: '30px'
                                    }}
                                    setFieldValue={setFieldValue}
                                    setFieldTouched={setFieldTouched}
                                    touched={touched[field.name]}
                                    error={errors[field.name]}
                                    showErrors={false}
                                    isOptionEqualToValue={(option, selectedValue) =>
                                        option.value === selectedValue.value
                                    }
                                    isDisabled={field.name === 'product_code' ? !config.canEdit : field.isDisabled}
                                />
                            ) : (
                                <CustomTextField
                                    variant='outlined'
                                    name={field.name}
                                    type={field.type}
                                    size='small'
                                    fullWidth
                                    placeholder={field.placeholder}
                                    disabled={field.isDisabled}
                                    value={values[field.name]}
                                    onChange={e => handleCustomChange(e, { setFieldValue, handleChange })}
                                    inputProps={
                                        // eslint-disable-next-line no-nested-ternary
                                        field.name === 'mfd_date'
                                            ? { max: new Date().toISOString().split('T')[0] }
                                            : field.name === 'expiry_date'
                                              ? {
                                                    min: new Date(new Date().setDate(new Date().getDate() + 1))
                                                        .toISOString()
                                                        .split('T')[0]
                                                }
                                              : {}
                                    }
                                    touched={touched[field.name]}
                                    error={errors[field.name]}
                                />
                            )}
                        </TableCell>
                    ))}
                    <TableCell
                        sx={{
                            borderRight: bdStr,
                            borderTop: bdStr,
                            borderBottom: bdStr,
                            borderBottomRightRadius: '8px',
                            borderTopRightRadius: '8px',
                            ...globalCellStyles
                        }}
                    >
                        <CustomButton
                            variant='clickable'
                            size='small'
                            sx={{
                                padding: '4px'
                            }}
                            onClick={handleSubmit}
                            disabled={isEdit(editId) && !config.canEdit}
                            type='submit'
                            loading={scanAsnItemLKey}
                        >
                            {!scanAsnItemLKey && '+ Add'}
                        </CustomButton>
                    </TableCell>
                </>
            )}
        </Formik>
    )
}

export default ProductTableForm
ProductTableForm.propTypes = {
    // initialValues: PropTypes.object,
    setConfig: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    config: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    asnData: PropTypes.object,
    fetchASNItems: PropTypes.func
}
