/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Divider } from '@mui/material'
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import NotesInstructions from '@/core/components/NotesInstructions'
import IdentityCard from '@core/components/IdentityCard'
import CustomModal from '@/core/components/extended/CustomModal'

// ** import forms and validation
import { useFormik } from 'formik'

// ** import redux
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'
import { useCreateSkuMutation, useUpdateSkuMutation } from '@/app/store/slices/api/catalogueSlice'

// Importing formResources
import { notes } from './formResources'

function ChildForm({ tabsFields, validationSchema, initialValues, isEdit, editImages }) {
    usePrompt()
    const [createSku] = useCreateSkuMutation()
    const [updateSku] = useUpdateSkuMutation()
    const tabLabels = ['productInfo', 'pricing', 'inventory', 'hierarchy']
    const isOpen = useSelector(state => state.modal.open)
    const { createSkuLKey, updateSkuLKey } = useSelector(state => state.loading)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState(0)
    const [tabsEnabled, setTabsEnabled] = useState(isEdit ? [true, true, true, true] : [true, false, false, false])
    const [addedUrls, setAddedUrls] = useState(editImages || [])

    const enableTabsAfterValidation = upToIndex => {
        const updatedTabs = tabsEnabled.map((enabled, index) => index <= upToIndex)
        setTabsEnabled(updatedTabs)
    }

    const validate = values => {
        try {
            // Get schema for the active tab
            const schema = validationSchema[activeTab]
            // Parse only the active tab values
            // eslint-disable-next-line react/prop-types
            schema.parse(values)

            // Return an empty object if no validation errors
            return {}
        } catch (error) {
            const formikErrors = {}

            // Iterate through the validation errors and handle them
            error.errors.forEach(err => {
                const fieldName = err.path[0]

                // Check if the error field belongs to the active tab and handle it
                if (fieldName) {
                    formikErrors[fieldName] = err.message
                }
            })

            // Return the errors for the active tab's fields
            return formikErrors
        }
    }

    const formik = useFormik({
        validate,
        initialValues,
        onSubmit: async values => {
            let response
            let message
            let isError = false
            let submitted = false
            try {
                if (!values.description?.trim()) {
                    formik.setFieldError('description', 'Product Name is required')
                    return
                }
                if (activeTab < tabLabels.length - 1) {
                    const nextTab = activeTab + 1
                    formik.setFieldValue('tabId', tabLabels[nextTab])
                    enableTabsAfterValidation(nextTab)
                    setActiveTab(nextTab)
                    return
                }
                submitted = true
                const image = addedUrls.map(item => item.url)
                if (isEdit) {
                    response = await updateSku({
                        ...values,
                        image,
                        lot_reqd: values.lot_reqd === 'Yes' ? 1 : 0,
                        expiry_reqd: values.expiry_reqd === 'Yes' ? 1 : 0,
                        manufacturing_reqd: values.manufacturing_reqd === 'Yes' ? 1 : 0,
                        dual_mrp: values.dual_mrp === 'Yes' ? 1 : 0
                    }).unwrap()
                } else
                    response = await createSku({
                        ...values,
                        image,
                        lot_reqd: values.lot_reqd === 'Yes' ? 1 : 0,
                        expiry_reqd: values.expiry_reqd === 'Yes' ? 1 : 0,
                        manufacturing_reqd: values.manufacturing_reqd === 'Yes' ? 1 : 0,
                        dual_mrp: values.dual_mrp === 'Yes' ? 1 : 0
                    }).unwrap()

                message = response?.data?.message || response?.message || 'Item added successfully!'

                formik.resetForm()
            } catch (error) {
                isError = true
                message =
                    error.data?.message || error.data?.data?.message || error.data?.message || 'unable to submit item!'

                if (error.data?.data?.errors || error.data?.errors?.errors) {
                    const backendErrors = error.data.data.errors || error.data.errors.errors
                    const formikErrors = {}
                    Object.entries(backendErrors).forEach(([field, messages]) => {
                        formikErrors[field] = messages.join(', ') // Join multiple messages with a comma
                    })

                    formik.setErrors(formikErrors) // Update Formik's error state
                }
            } finally {
                if (submitted) {
                    dispatch(
                        openSnackbar({
                            open: true,
                            message,
                            variant: 'alert',
                            alert: { color: isError ? 'error' : 'success' },
                            anchorOrigin: { vertical: 'top', horizontal: 'center' }
                        })
                    )
                    if (!isError) navigate('/master/catalogue')
                }
            }
        },
        validateOnBlur: true,
        validateOnChange: true
    })

    // Handle tab change, validate current tab before switching
    const handleTabChange = (event, newValue) => {
        if (tabsEnabled[newValue]) {
            setActiveTab(newValue)
            formik.setFieldValue('tabId', tabLabels[newValue])
        }
    }
    // eslint-disable-next-line no-shadow
    const handleCustomChange = (e, formik) => {
        formik.handleChange(e) // For other fields, use normal formik.handleChange
    }

    const identityCardData = [
        { label: 'Product Name', value: formik.values.description || '' },
        { label: 'Product Code', value: formik.values.no || '' },
        { label: 'MRP', value: formik.values.mrp_price || '' }
    ]

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px' }}>
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
                        <IdentityCard data={identityCardData} showImageOnTop images={addedUrls} />
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs
                            activeTab={activeTab}
                            handleTabChange={handleTabChange}
                            tabsFields={tabsFields}
                            tabsEnabled={tabsEnabled}
                        />

                        <Box sx={{ padding: 2 }}>
                            <FormComponent
                                key={`tab-${activeTab}`}
                                fields={tabsFields[activeTab].fields}
                                formik={formik}
                                handleCustomChange={handleCustomChange}
                                customStyle={{
                                    backgroundColor: 'none'
                                }}
                                submitButtonSx={{
                                    textAlign: 'right',
                                    marginTop: 2
                                }}
                                showSeparaterBorder={false}
                                submitting={createSkuLKey || updateSkuLKey}
                                gridSpacing={2}
                                addedUrls={addedUrls}
                                setAddedUrls={setAddedUrls}
                                submitButtonText={activeTab < 3 ? 'Save & Next' : 'Submit'}
                            />
                        </Box>
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
            <CustomModal open={isOpen} />
        </MainCard>
    )
}
export default ChildForm
