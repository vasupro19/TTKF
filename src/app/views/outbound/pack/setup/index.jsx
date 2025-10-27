/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'

// MUI Components
import { useTheme, alpha } from '@mui/material/styles'
import {
    Box,
    Divider,
    IconButton,
    Tooltip,
    Typography,
    useMediaQuery,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    CircularProgress
} from '@mui/material'

// Icons
import {
    Inventory2Outlined,
    AllInboxOutlined,
    MonitorWeightOutlined,
    RemoveCircleOutlineOutlined,
    LocalShippingOutlined,
    Help,
    Scale
} from '@mui/icons-material'

// Your Custom Components (Ensure paths are correct)
import { openModal } from '@/app/store/slices/modalSlice'
import CustomButton from '@/core/components/extended/CustomButton'
import MainCard from '@/core/components/extended/MainCard'
import ConfirmModal from '@/core/components/modals/ConfirmModal'

// (You might have this elsewhere or import directly from @mui/material)
import ToggleSwitchWithLabels from '@/core/components/toggleSwitchWithLabels'
import { openSnackbar } from '@/app/store/slices/snackbar'
import SettingRow from '@/core/components/SettingRow'
import CustomMultiSelect from '@/core/components/CustomMultiSelect'
import { getCustomSx } from '@/utilities'
import DimensionLBHInput from '@/core/components/DimensionLBHInput'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { motion, AnimatePresence } from 'framer-motion'
import PartialPackIcon from '@/assets/icons/PartialPackIcon'
import { getConfig, useStoreConfigMutation } from '@store/slices/api/packSlice'

// Default custom styles if none are provided externally
const customSx = getCustomSx()
const defaultValues = {
    allowBulkPacking: false,
    askPackagingMaterialFor: 'b2b',
    selectedChannels: [],
    askForWeight: true,
    useWeighingMachineFor: 'never',
    autoWeightMode: 'itemOnly',
    allowRemoveItems: false,
    courierMandatoryForB2B: true,
    askBoxSpecificationsB2B: true,
    packageDimensions: { length: '', breadth: '', height: '', unit: 'cm' },
    allowPartialPacking: false
}
// Available channels for dropdown
const availableChannels = ['Amazon', 'Flipkart', 'Shopify', 'Myntra']

export default function PackingConfig() {
    const theme = useTheme()
    const dispatch = useDispatch()

    const { packConfigLKey, getPackConfigLKey } = useSelector(state => state.loading)
    const [storeConfig] = useStoreConfigMutation()
    const [activeModal, setActiveModal] = useState(null)
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const navigate = useNavigate() // navigate is used here for the reset button
    const [configValues, setConfigValues] = useState(structuredClone(defaultValues))

    // Main schema for the dimensions object
    const dimensionsValidationSchema = z
        .object({
            length: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Length must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Length must be a positive number')
                ])
                .optional(),
            breadth: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Breadth must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Breadth must be a positive number')
                ])
                .optional(),
            height: z
                .union([
                    z
                        .string()
                        .trim()
                        .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                            message: 'Height must be a positive number with up to 2 decimal places'
                        }),
                    z.number().positive('Height must be a positive number')
                ])
                .optional(),
            unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm')
        })
        .optional()
        .nullable()
        .refine(
            dimensions => {
                if (!dimensions) return true
                const hasValues = {
                    length: dimensions.length !== undefined && dimensions.length !== '',
                    breadth: dimensions.breadth !== undefined && dimensions.breadth !== '',
                    height: dimensions.height !== undefined && dimensions.height !== ''
                }
                const providedCount = Object.values(hasValues).filter(Boolean).length
                return providedCount === 0 || providedCount === 3
            },
            {
                message: 'Please provide all 3 dimensions (LxBxH) or leave them all empty'
            }
        )

    // Full validation schema
    const validationSchema = toFormikValidationSchema(
        z
            .object({
                packageDimensions: z.any().optional(),
                selectedChannels: z.array(z.string()).optional(),
                allowBulkPacking: z.boolean(),
                askPackagingMaterialFor: z.string(),
                askForWeight: z.boolean(),
                useWeighingMachineFor: z.string(),
                autoWeightMode: z.string(),
                allowRemoveItems: z.boolean(),
                courierMandatoryForB2B: z.boolean(),
                askBoxSpecificationsB2B: z.boolean(),
                allowPartialPacking: z.boolean()
            })
            .superRefine((data, ctx) => {
                // Only validate dimensions if askBoxSpecificationsB2B is true
                if (data.askBoxSpecificationsB2B) {
                    const result = dimensionsValidationSchema.safeParse(data.packageDimensions)
                    if (!result.success) {
                        result.error.issues.forEach(issue => {
                            ctx.addIssue({
                                code: issue.code,
                                message: issue.message,
                                path: ['packageDimensions', ...issue.path]
                            })
                        })
                    }
                }
            })
    )

    const submitConfig = async (values, { setSubmitting }) => {
        // Reset conditional values to defaults when their conditions aren't met
        const finalValues = { ...values }

        // Reset channel selection if packaging material is 'never'
        if (finalValues.askPackagingMaterialFor === 'never') {
            finalValues.selectedChannels = []
        }

        // Reset weight-related settings if askForWeight is false
        if (!finalValues.askForWeight) {
            finalValues.useWeighingMachineFor = 'never'
            finalValues.autoWeightMode = 'itemOnly'
        }

        // Reset package dimensions if askBoxSpecificationsB2B is false
        if (!finalValues.askBoxSpecificationsB2B) {
            finalValues.packageDimensions = { length: '', breadth: '', height: '', unit: 'cm' }
        }

        let isError = false
        let message
        // Add actual save logic (API call, etc.)
        const data = {
            ...finalValues,
            selectedChannels: finalValues.selectedChannels.join(', '),
            ...finalValues.packageDimensions
        }
        delete data.packageDimensions

        try {
            await storeConfig(data).unwrap()
            message = 'Config applied successfully!'
        } catch (error) {
            isError = true
            message =
                error?.data?.data?.message ||
                error?.data?.message ||
                error?.message ||
                'unable to apply config, please try again!'
        } finally {
            dispatch(
                openSnackbar({
                    open: true,
                    message,
                    variant: 'alert',
                    alert: { color: isError ? 'error' : 'success', icon: isError ? 'error' : 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            if (setSubmitting) setSubmitting(false)
        }
    }

    const formik = useFormik({
        initialValues: { ...configValues },
        enableReinitialize: true,
        validationSchema,

        onSubmit: submitConfig
    })

    // --- Updated Handlers - DO NOT reset dependent values when parent conditions change ---
    const handleCriteriaChange = event => {
        const { name, checked } = event.target
        formik.setFieldValue(name, checked)

        // REMOVED: No longer reset dependent values when parent conditions change
        // This preserves user selections when they toggle conditions on/off
    }

    const handleToggleGroupChange = name => (event, newValue) => {
        if (newValue !== null) {
            formik.setFieldValue(name, newValue)

            // REMOVED: No longer reset dependent values when parent conditions change
            // This preserves user selections when they switch between options
        }
    }

    const handleChannelChange = (event, value) => {
        formik.setFieldValue('selectedChannels', typeof value === 'string' ? value.split(',') : value)
    }

    // Check if current values match default values
    const isCurrentlyDefault = () => {
        const current = formik.values
        return JSON.stringify(current) === JSON.stringify(defaultValues)
    }

    const handleResetToDefault = async () => {
        // Use a fresh copy of defaultValues
        formik.setValues(structuredClone(defaultValues))
        await submitConfig(defaultValues, {})
        dispatch(
            openSnackbar({
                open: true,
                message: 'Set to default config successfully!',
                variant: 'alert',
                alert: { color: 'success', icon: 'success' },
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            })
        )
        // Optional: Redirect after reset if that's the desired flow
        setActiveModal(null)
        navigate('/outbound/pack', true)
    }

    const promptResetToDefault = () => {
        setActiveModal('defaultSettings')
        // Keep if your modal logic relies on Redux
        dispatch(openModal({ type: 'confirm_modal' }))
    }

    const closeModal = () => {
        setActiveModal(null)
    }

    // Helper for common ToggleButtonGroup props
    const toggleGroupProps = name => ({
        color: 'primary',
        value: formik.values[name],
        exclusive: true,
        onChange: handleToggleGroupChange(name),
        'aria-label': name, // Improve accessibility
        size: 'small',
        sx: { flexWrap: 'wrap' } // Allow wrapping on small screens if needed
    })

    // Helper for common ToggleButton props with selected state styling
    const toggleButtonProps = (minWidth = '70px') => ({
        sx: {
            px: 1.5,
            py: 0.5,
            minWidth,
            flexGrow: { xs: 1, sm: 0 }, // Allow buttons to grow on extra small screens
            '&.Mui-selected': {
                backgroundColor: theme.palette.primary[800], // Use primary color for background
                color: theme.palette.primary.contrastText, // Use contrast text color for readability
                '&:hover': {
                    backgroundColor: theme.palette.primary.dark // Darken on hover
                }
            }
        }
    })

    // Check if packaging material option other than never is selected
    const showChannelSelect = formik.values.askPackagingMaterialFor !== 'never'

    // Check if Ask for Weight is enabled to show weight-related settings
    const showWeightSettings = formik.values.askForWeight

    // --- Animation Variants for Framer Motion ---
    const sectionAnimation = {
        initial: { opacity: 0, height: 0, y: -10 },
        animate: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
        exit: { opacity: 0, height: 0, y: -10, transition: { duration: 0.2, ease: 'easeInOut' } }
    }

    const fetchConfig = async () => {
        try {
            const { data } = await dispatch(getConfig.initiate())

            const values = structuredClone(defaultValues)
            if (data?.data) {
                data.data.map(item => {
                    if (['length', 'breadth', 'height', 'unit'].includes(item.key))
                        values.packageDimensions[item.key] = item.value
                    else if (item.key === 'selectedChannels')
                        values[item.key] = item.value
                            ? item.value
                                  .split(', ')
                                  .map(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase())
                            : []
                    else values[item.key] = typeof values[item.key] === 'boolean' ? !!item.value : item.value
                    return item.key
                })
            }

            setConfigValues({ ...values })
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message:
                        error.data?.data?.message ||
                        error?.data?.message ||
                        error?.message ||
                        'unable to fetch config, please try again!',
                    variant: 'alert',
                    alert: { color: 'error', icon: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        fetchConfig()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    useEffect(() => {
        if (Object.keys(configValues).length) formik.setValues({ ...configValues })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configValues])

    return (
        <form onSubmit={formik.handleSubmit}>
            <MainCard sx={{ py: '1px' }} contentSX={{ px: { xs: '0px', sm: '2px' }, py: 1 }}>
                {/* --- Header Section --- */}
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            width: '100%',
                            flexDirection: { xs: 'column', md: 'row' },
                            justifyContent: { xs: 'center', md: 'space-between' },
                            alignItems: { xs: 'flex-start', md: 'center' },
                            gap: { xs: 2, md: 0 }
                        }}
                    >
                        <Typography
                            variant={isMobile ? 'h4' : 'h3'}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: { xs: 1, sm: 2 },
                                py: 1,
                                width: { xs: '100%', md: 'auto' }
                            }}
                        >
                            Set Packing Configuration
                            <Tooltip title='Configure allocation logics and their priorities'>
                                <IconButton size='small'>
                                    <Help fontSize='small' color='primary' />
                                </IconButton>
                            </Tooltip>
                        </Typography>
                        {/* Action Buttons */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                width: { xs: '100%', md: 'auto' },
                                px: { xs: 1, sm: 2, md: 0 },
                                mb: { xs: 1, sm: 0 }
                            }}
                        >
                            <CustomButton
                                variant='outlined'
                                size='small'
                                fullWidth={{ xs: true, sm: false }}
                                customStyles={{
                                    height: '30px',
                                    width: 'max-content'
                                }}
                                onClick={promptResetToDefault}
                                disabled={isCurrentlyDefault()} // Disable if already at default
                            >
                                Restore Defaults
                            </CustomButton>
                            <CustomButton
                                variant='clickable'
                                size='small'
                                type='submit'
                                fullWidth={{ xs: true, sm: false }}
                                customStyles={{
                                    height: '30px',
                                    minWidth: { sm: '120px' }
                                }}
                                clickable
                                disabled={formik.isSubmitting || !formik.dirty || packConfigLKey} // Disable if not changed or submitting
                            >
                                {formik.isSubmitting ? 'Saving...' : 'Save & Apply'}
                            </CustomButton>
                        </Box>
                    </Box>
                    {/* Subtle Divider */}
                    <Divider
                        sx={{
                            marginTop: '0.2rem',
                            borderColor: '#BCC1CA',
                            borderWidth: '1px'
                        }}
                    />
                </Box>

                {/* --- Configuration Settings --- */}
                <Stack spacing={1.5}>
                    {/* Non-Weight related settings */}
                    <SettingRow
                        icon={<Inventory2Outlined />}
                        title='Allow Bulk Packing'
                        description='Unload all items from pick bin at once.'
                        control={
                            <ToggleSwitchWithLabels
                                name='allowBulkPacking'
                                checked={formik.values.allowBulkPacking}
                                onChange={handleCriteriaChange}
                            />
                        }
                        loading={getPackConfigLKey}
                    />
                    <Box
                        sx={
                            showChannelSelect
                                ? {
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 2
                                  }
                                : {}
                        }
                    >
                        <SettingRow
                            icon={<AllInboxOutlined />}
                            title='Ask for Packaging Material'
                            description='Select when to prompt packer for packaging used.'
                            control={
                                <ToggleButtonGroup {...toggleGroupProps('askPackagingMaterialFor')}>
                                    <ToggleButton value='never' {...toggleButtonProps()}>
                                        Never
                                    </ToggleButton>
                                    <ToggleButton value='b2b' {...toggleButtonProps()}>
                                        B2B
                                    </ToggleButton>
                                    <ToggleButton value='b2c' {...toggleButtonProps()}>
                                        B2C
                                    </ToggleButton>
                                    <ToggleButton value='both' {...toggleButtonProps()}>
                                        Both
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            }
                            loading={getPackConfigLKey}
                        />

                        {/* Channel Selection - Only show when packaging material is not 'never' */}
                        {/* --- ANIMATED: Channel Selection - Values are preserved when toggling --- */}
                        <AnimatePresence>
                            {showChannelSelect && (
                                <motion.div
                                    variants={sectionAnimation}
                                    initial='initial'
                                    animate='animate'
                                    exit='exit'
                                    style={{ overflow: 'hidden' }}
                                >
                                    <Box sx={{ paddingRight: { xs: 0, sm: 2 }, paddingLeft: { xs: 0, sm: 5 } }}>
                                        <Divider sx={{ borderColor: 'grey.200' }} />

                                        <SettingRow
                                            title='Select Channels'
                                            description='Choose which channels to apply packaging material requirements.'
                                            control={
                                                <Box sx={{ minWidth: '300px', marginRight: { xs: 0, sm: -2 } }}>
                                                    <CustomMultiSelect
                                                        name='selectedChannels'
                                                        label='Select channels'
                                                        placeholder='Search'
                                                        options={availableChannels}
                                                        value={formik.values.selectedChannels}
                                                        onChange={handleChannelChange}
                                                        touched={formik.touched.selectedChannels}
                                                        error={formik.errors.selectedChannels}
                                                        setFieldValue={formik.setFieldValue}
                                                        setFieldTouched={formik.setFieldTouched}
                                                        showAdornment={false}
                                                        customSx={customSx}
                                                        maxTagsToShow={2}
                                                    />
                                                </Box>
                                            }
                                            loading={getPackConfigLKey}
                                        />
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>

                    {/* --- Manage Weight Section with Background --- */}
                    <Paper
                        elevation={0}
                        sx={{
                            my: 1.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.03),
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`, // Use theme divider color
                            overflow: 'hidden'
                        }}
                    >
                        {/* Section Header inside Paper */}
                        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Typography
                                variant='h6'
                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                fontWeight='medium'
                            >
                                <MonitorWeightOutlined fontSize='small' /> Manage Weight
                            </Typography>
                        </Box>

                        {/* Settings within the Paper */}
                        <Stack spacing={0}>
                            {/* Ask For Weight - Replaces Applicable Operations */}
                            <SettingRow
                                title='Ask For Weight'
                                description='Ask user to enter weight.'
                                control={
                                    <ToggleSwitchWithLabels
                                        name='askForWeight'
                                        checked={formik.values.askForWeight}
                                        onChange={handleCriteriaChange}
                                    />
                                }
                                loading={getPackConfigLKey}
                            />

                            {/* Weight-related settings - Values are preserved when toggling */}
                            <AnimatePresence>
                                {showWeightSettings && (
                                    <motion.div
                                        variants={sectionAnimation}
                                        initial='initial'
                                        animate='animate'
                                        exit='exit'
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <SettingRow
                                            title='Use Smart Weighing Machine'
                                            description='Select when to use scale for accurate weight during outbound packing.'
                                            control={
                                                <ToggleButtonGroup {...toggleGroupProps('useWeighingMachineFor')}>
                                                    <ToggleButton value='never' {...toggleButtonProps()}>
                                                        Never
                                                    </ToggleButton>
                                                    <ToggleButton value='b2b' {...toggleButtonProps()}>
                                                        B2B
                                                    </ToggleButton>
                                                    <ToggleButton value='b2c' {...toggleButtonProps()}>
                                                        B2C
                                                    </ToggleButton>
                                                    <ToggleButton value='both' {...toggleButtonProps()}>
                                                        Both
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            }
                                            loading={getPackConfigLKey}
                                        />
                                        <SettingRow
                                            title='Auto Calculate Weight'
                                            description='Method when scale is not used (applicable for selected operations).'
                                            control={
                                                <ToggleButtonGroup {...toggleGroupProps('autoWeightMode')}>
                                                    <ToggleButton value='itemOnly' {...toggleButtonProps('100px')}>
                                                        Item Only
                                                    </ToggleButton>
                                                    <ToggleButton
                                                        value='packageAndItem'
                                                        {...toggleButtonProps('100px')}
                                                    >
                                                        Package + Item
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            }
                                            loading={getPackConfigLKey}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Stack>
                    </Paper>

                    {/* Other non-weight related settings */}
                    <SettingRow
                        icon={<RemoveCircleOutlineOutlined />}
                        title='Allow Item Removal In B2B Packing'
                        description='Enable packers to remove scanned items.'
                        control={
                            <React.Suspense fallback={<div>Loading...</div>}>
                                <ToggleSwitchWithLabels
                                    name='allowRemoveItems'
                                    checked={formik.values.allowRemoveItems}
                                    onChange={handleCriteriaChange}
                                />
                            </React.Suspense>
                        }
                        loading={getPackConfigLKey}
                    />

                    {/* Courier Mandatory For B2B - Changed to toggle switch */}
                    <SettingRow
                        icon={<LocalShippingOutlined />}
                        title='Courier Mandatory For B2B'
                        description='Require courier selection for orders with B2B packaging.'
                        control={
                            <ToggleSwitchWithLabels
                                name='courierMandatoryForB2B'
                                checked={formik.values.courierMandatoryForB2B}
                                onChange={handleCriteriaChange}
                            />
                        }
                        loading={getPackConfigLKey}
                    />

                    <Box
                        sx={
                            formik.values.askBoxSpecificationsB2B
                                ? {
                                      border: `1px solid ${theme.palette.divider}`,
                                      borderRadius: 2
                                  }
                                : {}
                        }
                    >
                        {/* Ask for Box Specifications For B2B */}
                        <SettingRow
                            icon={<Scale />}
                            title='Ask for Box Specifications For B2B'
                            description='Ask user to fill box specifications while closing box.'
                            control={
                                <ToggleSwitchWithLabels
                                    name='askBoxSpecificationsB2B'
                                    checked={formik.values.askBoxSpecificationsB2B}
                                    onChange={handleCriteriaChange}
                                />
                            }
                            loading={getPackConfigLKey}
                        />

                        <AnimatePresence>
                            {/* Default Box Dimensions - Values are preserved when toggling */}
                            {formik.values.askBoxSpecificationsB2B && (
                                <motion.div
                                    variants={sectionAnimation}
                                    initial='initial'
                                    animate='animate'
                                    exit='exit'
                                    style={{ overflow: 'hidden' }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            ml: { xs: 0, sm: 2 },
                                            mt: 1,
                                            p: 0.5,
                                            px: 1
                                        }}
                                    >
                                        <Divider sx={{ borderColor: 'grey.200', mb: 1 }} />

                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                                mb: 1,
                                                width: '100%'
                                            }}
                                        >
                                            <Box sx={{ pl: 4 }}>
                                                <Typography
                                                    variant='body1'
                                                    fontWeight={500}
                                                    sx={{
                                                        mb: 0.5,
                                                        fontWeight: 'medium',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}
                                                >
                                                    Default Box Dimensions (L × B × H)
                                                </Typography>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Set default dimensions for standard warehouse boxes
                                                </Typography>
                                            </Box>
                                            {getPackConfigLKey ? (
                                                <CircularProgress size='18px' color='success' />
                                            ) : (
                                                <DimensionLBHInput
                                                    // label="Package Dimensions"
                                                    name='packageDimensions'
                                                    value={formik.values.packageDimensions}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    // Check for touched and error states correctly
                                                    touched={formik.touched.packageDimensions}
                                                    error={
                                                        formik.touched.packageDimensions &&
                                                        Boolean(formik.errors.packageDimensions)
                                                    }
                                                    // Display the error message from Formik
                                                    helperText={
                                                        formik.touched.packageDimensions &&
                                                        formik.errors.packageDimensions
                                                    }
                                                />
                                            )}
                                        </Box>
                                    </Paper>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>

                    <SettingRow
                        icon={<PartialPackIcon style={{ marginRight: 8 }} />}
                        title='Allow Partial Packing'
                        description='Allow users to pack items partially, even if not all items are scanned.'
                        control={
                            <ToggleSwitchWithLabels
                                name='allowPartialPacking'
                                checked={formik.values.allowPartialPacking}
                                onChange={handleCriteriaChange}
                            />
                        }
                        loading={getPackConfigLKey}
                    />
                </Stack>

                {/* --- Confirmation Modal --- */}
                {activeModal === 'defaultSettings' && (
                    <ConfirmModal
                        title='Reset Confirmation'
                        message='Are you sure you want to reset all packing settings to their default values? This action cannot be undone.'
                        icon='alert'
                        confirmText={packConfigLKey ? 'Saving...' : 'Yes, Reset'}
                        cancelText='Cancel'
                        customStyle={{ width: { xs: '90%', sm: '456px' } }}
                        onConfirm={handleResetToDefault}
                        onCancel={closeModal} // Use the closeModal handler
                        isLoading={packConfigLKey}
                    />
                )}
            </MainCard>
        </form>
    )
}
