import React, { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { Form, Formik } from 'formik'

// theme components
import { Box, Divider, Grid, Button } from '@mui/material'

// components
import MainCard from '@core/components/extended/MainCard'
import NotesInstructions from '@/core/components/NotesInstructions'
import MyTabs from '@/core/components/CapsuleTabs'
import ProductDetails from '@/core/components/ProductDetails'
import { TextFields, Upload } from '@mui/icons-material'
import CustomFormInput from '@/core/components/extended/CustomFormInput'
import ImportFileModal from '@/core/components/modals/ImportFileModal'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
// import ProductDetails from '@/core/components/productDetails/index'

// redux imports
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { openModal, closeModal } from '@/app/store/slices/modalSlice'
import {
    useValidateBoxIdMutation,
    useMapBoxIdsMutation,
    useGetMapBoxIdsTemplateMutation,
    usePostMapBoxIdsTemplateMutation
} from '@/app/store/slices/api/gateEntrySlice'
import { objectLength } from '@/utilities'

function MapBoxIds() {
    const dispatch = useDispatch()
    const modalType = useSelector(state => state.modal.type)

    const [activeTab, setActiveTab] = useState(0)
    // eslint-disable-next-line no-unused-vars
    const [tabsEnabled, setTabsEnabled] = useState([true, true])
    // eslint-disable-next-line no-unused-vars
    const [highlightWmsInput, setHighlightWmsInput] = useState(false)
    const [focusTarget, setFocusTarget] = useState(null)
    const [isUpdate, setIsUpdate] = useState(false)
    const [productDetailsData, setProductDetailsData] = useState([
        { key: 'vendor_name', label: 'Vendor Name', value: 'N/A' },
        { key: 'wms_box_id', label: 'WMS Box Id', value: 'N/A' },
        { key: 'ext_box_id', label: 'External Box ID', value: 'N/A' },
        { key: 'qc', label: 'Box QC Status', value: 'Okay/Hold' }
    ])
    const [isValidated, setIsValidated] = useState(false)

    const [validateBoxId] = useValidateBoxIdMutation()
    const [mapBoxId] = useMapBoxIdsMutation()
    const [getMapBoxIdsTemplate] = useGetMapBoxIdsTemplateMutation()
    const [postMapBoxIdsTemplate] = usePostMapBoxIdsTemplateMutation()

    // ! file handlers
    const getExcelTemplate = async () => getMapBoxIdsTemplate().unwrap()
    const handleExcelUpload = async file => {
        const formData = new FormData()
        formData.append('excel', file)

        let isError = false
        let message = ''
        try {
            const response = await postMapBoxIdsTemplate(formData).unwrap()
            message = response.message
            if (response && objectLength(response) === 1) isError = true
            else if (objectLength(response) > 1) dispatch(closeModal())
        } catch (error) {
            isError = true
            message = error?.data?.message || error?.message || 'unable to upload file.'
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
    }

    const tabsFields = [
        { label: 'Form', icon: <TextFields /> },
        { label: 'Upload', icon: <Upload /> }
    ]

    const updateProductDetails = (key, value, empty = false) => {
        setProductDetailsData(prev =>
            prev.map(item => {
                if (empty && item.key !== 'qc') item.value = 'N/A'
                else if (item.key === key) item.value = value
                return item
            })
        )
    }

    // Initial form values
    const initialValues = {
        id: '',
        wms_box_id: '',
        vendor_box_id: ''
    }

    // Validation schema
    const validationSchema = z.object({
        wms_box_id: z.string().nonempty('WMS Box ID is required'),
        vendor_box_id: z.string().nonempty('Vendor Box ID is required')
    })

    const validate = values => {
        try {
            validationSchema.parse(values)
            // //Set highlight state to true for the WMS input
            // //Remove highlight after a brief time
            // setHighlightWmsInput(true)
            // setTimeout(() => setHighlightWmsInput(false), 2000) // Adjust timeout duration as needed
            return {}
        } catch (error) {
            const formikErrors = {}
            error.errors.forEach(err => {
                formikErrors[err.path[0]] = err.message
            })
            return formikErrors
        }
    }

    // Refs for managing input focus
    const wmsInputRef = useRef(null)
    const vendorInputRef = useRef(null)

    // Ensure the first input is focused on page load
    useEffect(() => {
        if (wmsInputRef.current && activeTab === 0) {
            wmsInputRef.current.focus()
        }
    }, [activeTab])

    // Tab change handling
    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
        }
    }

    const notes = [
        {
            id: 'n1',
            text: 'Ensure the QR/Bar code scanner is properly connected and working before starting the scanning process.'
        },
        {
            id: 'n2',
            text: 'Scan the WMS Box ID first (required). The scanned value will automatically appear in the first input field.'
        },
        {
            id: 'n3',
            text: 'After scanning the WMS Box ID, proceed to scan the Vendor Box ID (required) in one step.'
        },
        {
            id: 'n4',
            text: 'After scanning the Vendor Box ID and pressing "Enter", the form will be automatically submitted if all required fields are filled correctly.'
        },
        {
            id: 'n5',
            text: 'Once the form is submitted successfully, the focus will return to the WMS Box ID input field, indicating readiness for the next scan.'
        },
        {
            id: 'n6',
            text: 'In case of any errors (e.g., missing or incorrect values), verify the scanned QR codes and try again.'
        }
    ]

    // handling setting focus using useEffect
    const handleConfirm = () => {
        setFocusTarget('vendor')
        dispatch(closeModal())
    }
    const handleCancel = formik => {
        dispatch(closeModal())
        formik.setFieldValue('wms_box_id', '')
        setIsUpdate(false)
        updateProductDetails('', '', true)
    }

    const validateBoxIdReq = async (id, formik) => {
        if (isValidated) return
        let isError = false
        let message = ''
        let isWarning = false
        try {
            const response = await validateBoxId(id).unwrap()
            message = response?.message || ''
            formik.setFieldValue('id', response?.data?.id)
            vendorInputRef.current?.focus()
            setIsUpdate(false)
            updateProductDetails('vendor_name', response?.data?.name)
            setIsValidated(true)
        } catch (exception) {
            isError = true
            message = exception?.data?.message || exception?.message || 'unable to validate !'

            // ! already mapped
            if (exception?.data?.errors?.ext_ge_box_id) {
                updateProductDetails('vendor_name', exception?.data?.errors?.name)
                isError = false
                isWarning = true
                setIsUpdate(true)
                dispatch(
                    openModal({
                        type: 'confirm_modal'
                    })
                )
            } else {
                formik.setFieldValue('wms_box_id', '')
            }
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    // eslint-disable-next-line no-nested-ternary
                    alert: { color: isError ? 'error' : isWarning ? 'info' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        if (focusTarget === 'vendor') {
            vendorInputRef.current.focus()
            setFocusTarget(null) // Reset after focusing
        }
    }, [focusTarget])

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid #d0d0d0',
                    px: 1.5,
                    py: 2,
                    borderRadius: '8px',
                    minHeight: '86vh'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <ProductDetails
                            data={productDetailsData}
                            productName='Gate Entry: GE01'
                            showNoData={activeTab === 1}
                        />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields}
                            tabsEnabled={tabsEnabled}
                        />
                        {activeTab === 0 ? (
                            <Box sx={{ padding: 2 }}>
                                <Formik
                                    initialValues={initialValues}
                                    validate={validate}
                                    onSubmit={async (values, { resetForm }) => {
                                        let isError = false
                                        let message
                                        try {
                                            const response = await mapBoxId({
                                                id: values.id,
                                                ge_box_id: values.wms_box_id,
                                                ext_ge_box_id: values.vendor_box_id
                                            }).unwrap()

                                            message = response?.message || 'Mapped Successfully'
                                            setIsUpdate(false)
                                            resetForm({ values: initialValues })
                                            wmsInputRef.current?.focus()
                                            updateProductDetails('', '', true)
                                            setIsValidated(false)
                                        } catch (exception) {
                                            isError = true
                                            message =
                                                exception?.data?.message || exception?.message || isUpdate
                                                    ? 'Updated Successfully'
                                                    : 'Mapped Successfully'
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
                                    validateOnBlur={false}
                                    validateOnChange={false}
                                >
                                    {formik => (
                                        <Form>
                                            <Grid container spacing={1} alignItems='center'>
                                                <Grid item xs={12} md={6}>
                                                    <CustomFormInput
                                                        name='wms_box_id'
                                                        label='WMS Box ID*'
                                                        placeholder='Enter WMS Box ID'
                                                        formik={formik}
                                                        inputProps={{
                                                            inputRef: wmsInputRef, // Pass the ref for focusing
                                                            onKeyPress: async e => {
                                                                // **
                                                                //  TODO:: Validate code with API if not ok refocus and clear the value use highlightBinInput to show success or error for the input
                                                                // await validateFunction(formik)
                                                                // also include below code (which is just example case: when mapping already exists) in validatePalletCode
                                                                // */
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    await validateBoxIdReq(e.target.value, formik)
                                                                    // TODO::needs to be remove hard code and use actual value
                                                                    // if (e.target.value === 'Q565340') {
                                                                    //     setIsUpdate(true)
                                                                    //     dispatch(
                                                                    //         openModal({
                                                                    //             type: 'confirm_modal'
                                                                    //         })
                                                                    //     )
                                                                    // } else {
                                                                    //     // Move focus to the second input when Enter is pressed
                                                                    //     vendorInputRef.current?.focus()
                                                                    //     setIsUpdate(false)
                                                                    // }
                                                                }
                                                            },
                                                            onChange: e => {
                                                                formik.setFieldValue('wms_box_id', e.target.value) // Update Formik value
                                                                updateProductDetails('wms_box_id', e.target.value)
                                                            },
                                                            onBlur: async e => {
                                                                // if (e.target.value === 'Q565340' && e.key === 'Enter') {
                                                                //     setIsUpdate(true)
                                                                //     dispatch(
                                                                //         openModal({
                                                                //             type: 'confirm_modal'
                                                                //         })
                                                                //     )
                                                                // }
                                                                if (!e.target.value) return
                                                                await validateBoxIdReq(e.target.value, formik)
                                                            }
                                                        }}
                                                        customSx={{
                                                            minHeight: '70px'
                                                        }}
                                                        color={highlightWmsInput ? 'success' : null}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <CustomFormInput
                                                        name='vendor_box_id'
                                                        label='Vendor Box ID*'
                                                        placeholder='Enter Vendor Box ID'
                                                        formik={formik}
                                                        inputProps={{
                                                            inputRef: vendorInputRef, // Pass the ref for focusing
                                                            onKeyPress: e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault()
                                                                    // First, update the Formik value with the current input
                                                                    const currentValue = e.target.value
                                                                    formik.setFieldValue('vendor_box_id', currentValue)

                                                                    setTimeout(() => {
                                                                        if (formik.values.wms_box_id) {
                                                                            formik.handleSubmit()
                                                                        } else {
                                                                            // Ensure focus goes back to the first input after submitting
                                                                            wmsInputRef.current.focus()
                                                                        }
                                                                    }, 700)
                                                                }
                                                            },
                                                            onChange: e => {
                                                                formik.setFieldValue('vendor_box_id', e.target.value) // Update Formik value
                                                                updateProductDetails('ext_box_id', e.target.value)
                                                            }
                                                        }}
                                                        customSx={{
                                                            minHeight: '70px'
                                                        }}
                                                        disabled={!formik?.values?.wms_box_id}
                                                    />
                                                </Grid>

                                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        type='submit'
                                                        variant='contained'
                                                        color='primary'
                                                        disabled={
                                                            !(formik.values.wms_box_id && formik.values.vendor_box_id)
                                                        }
                                                    >
                                                        {isUpdate ? 'Update' : 'Submit'}
                                                    </Button>
                                                </Grid>
                                                {modalType === 'confirm_modal' && (
                                                    <ConfirmModal
                                                        title='Mapping Already Exists'
                                                        message={`Are you sure you still want to map this Box-ID: ${formik.values.wms_box_id}`}
                                                        icon='info'
                                                        confirmText='Yes'
                                                        customStyle={{ width: { xs: '300px', sm: '456px' } }}
                                                        onConfirm={handleConfirm}
                                                        onCancel={() => handleCancel(formik)}
                                                    />
                                                )}
                                            </Grid>
                                        </Form>
                                    )}
                                </Formik>
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <ImportFileModal
                                    // sampleFilePath='/csv/inbound/mapBoxIds.csv'
                                    handleFileSubmission={file => handleExcelUpload(file)}
                                    isDownloadSample
                                    fileType={{
                                        'text/csv': ['.csv'],
                                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
                                    }}
                                    handleGetTemplate={getExcelTemplate}
                                />
                            </Box>
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <NotesInstructions notes={notes} customFontSize='14px' />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default MapBoxIds
