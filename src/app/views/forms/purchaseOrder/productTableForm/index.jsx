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
import { useScanPOItemMutation, getVendorAndProductById } from '@/app/store/slices/api/purchaseOrderSlice'
import { getItemsList } from '@/app/store/slices/api/commonSlice'
import { isEdit } from '@/constants'
import CustomButton from '@/core/components/extended/CustomButton'

const initialValues = {
    item_no: '',
    EAN_UPC: '',
    quantity: '',
    mrp: '',
    unitCost: '',
    discount: '',
    tax: ''
}

function ProductTableForm({ setConfig, config, poData, fetchPOItems }) {
    const { id: editId } = useParams()
    const theme = useTheme()
    const dispatch = useDispatch()
    const formikRef = useRef()
    const { scanPOItemLKey } = useSelector(state => state.loading)

    const [scanPOItem] = useScanPOItemMutation()

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
                        getItemsList.initiate(request, { meta: { disableLoader: false } })
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
            name: 'item_no',
            label: 'Product Code',
            placeholder: 'Select here',
            type: 'CustomAutocomplete',
            options: product || [],
            onInputChange: handleAutoCompleteSearch,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue)
        },
        {
            name: 'EAN_UPC',
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
            name: 'unitCost',
            label: 'Unit Cost',
            placeholder: 'Unit cost',
            type: 'number',
            isDisabled: !config.canEdit
        },
        {
            name: 'discount',
            label: 'Discount',
            placeholder: 'Discount %',
            type: 'number',
            isDisabled: !config.canEdit
        },
        {
            name: 'tax',
            label: 'Tax Percentage',
            placeholder: 'Tax %',
            type: 'number',
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
        item_no: z.preprocess(
            val => (typeof val === 'object' && val !== null ? val : null),
            z
                .object({
                    value: z.number().min(1, { message: 'product code is required!' }),
                    label: z.string(),
                    text: z.string()
                })
                .nullable()
                .refine(val => val !== null, {
                    message: 'product code is required!'
                })
        ),
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
            const { data: response } = await dispatch(getVendorAndProductById.initiate(query))
            formikRef.current.setFieldValue('mrp', response?.data?.productDetails?.mrp_price)
            formikRef.current.setFieldValue('EAN_UPC', response?.data?.productDetails?.no_2)
            formikRef.current.setFieldValue('unitCost', response?.data?.productDetails?.unit_price)
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

        if (name === 'item_no' && value && value?.value) getProductData(`?item_id=${value.value}`)
        else if (name === 'item_no' && !value) formikRef.current.resetForm()
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
                    const { data: response } = await scanPOItem({
                        items: [{ ...values, item_id: values.item_no.value, item_no: values.item_no.value }],
                        po_detail_id: config.poId,
                        edd: poData.edd,
                        expiry_date: poData.expiry_date,
                        ext_po_no: poData.ext_po_no,
                        received_qty: poData.received_qty,
                        remaining_qty: poData.remaining_qty,
                        total_qty: poData.total_qty,
                        po_type: poData?.status?.value || '',
                        vendor_id:
                            typeof poData?.vendor_code === 'object'
                                ? poData.vendor_code?.value
                                : poData.vendor_code?.value,
                        vendor_code: poData?.code
                    }).unwrap()
                    setConfig({ ...config, poId: response.poDetail.id, submit: true })
                    if (!config.poId) await fetchPOItems(`?id=${response.poDetail.id}`)

                    dispatch(
                        openSnackbar({
                            open: true,
                            message: 'item scanned successfully!',
                            variant: 'alert',
                            alert: { color: 'success', icon: 'error' },
                            anchorOrigin: { vertical: 'top', horizontal: 'right' }
                        })
                    )
                    // Reset the form after successful submission
                    resetForm()
                } catch (error) {
                    const backendErrors = error?.data?.data?.errors || {}
                    if (!Object.keys(backendErrors).length) {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: error?.data?.message || error?.message || 'unable to scan item!',
                                variant: 'alert',
                                alert: { color: 'error', icon: 'error' },
                                anchorOrigin: { vertical: 'top', horizontal: 'right' }
                            })
                        )
                    } else {
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
                                    isDisabled={field.name === 'item_no' ? !config.canEdit : field.isDisabled}
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
                            loading={scanPOItemLKey}
                        >
                            {!scanPOItemLKey && '+ Add'}
                        </CustomButton>
                    </TableCell>
                </>
            )}
        </Formik>
    )
}

export default ProductTableForm
ProductTableForm.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    // tabsFields: PropTypes.object,
    // onSubmit: PropTypes.func,
    // // eslint-disable-next-line react/forbid-prop-types
    // initialValues: PropTypes.object,
    setConfig: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    config: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    poData: PropTypes.object,
    fetchPOItems: PropTypes.func
}
