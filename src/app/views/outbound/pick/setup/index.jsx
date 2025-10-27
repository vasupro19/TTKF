/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react'
import MainCard from '@/core/components/extended/MainCard'
import { Help } from '@mui/icons-material'
import {
    Box,
    Divider,
    Typography,
    Grid,
    Paper,
    Tab,
    Tabs,
    IconButton,
    Tooltip,
    useMediaQuery,
    useTheme,
    FormControlLabel,
    Checkbox,
    FormGroup,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material'

import ToggleSwitchWithLabels from '@/core/components/toggleSwitchWithLabels'
import CustomButton from '@/core/components/extended/CustomButton'
import { motion, AnimatePresence } from 'framer-motion'
import usePrompt from '@/hooks/usePrompt'
import useDocumentTitle from '@/hooks/useDocumentTitle'
import ConfirmModal from '@/core/components/modals/ConfirmModal'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from '@/app/store/slices/modalSlice'
import { useNavigate } from 'react-router-dom'
import { openSnackbar } from '@/app/store/slices/snackbar'
import { useCreateConfigMutation, getConfig } from '@/app/store/slices/api/pickConfigurationSlice'
import SettingRow from '@/core/components/SettingRow'
import StatusBadge from '@/core/components/StatusBadge'

const defaultLogic = [
    {
        id: 'logic1',
        name: 'QC - OK and Reject',
        description: 'Prioritizes items based on quality control status',
        applicable: true,
        priority: 1,
        key: 'qc_reject_ok'
    },
    {
        id: 'logic2',
        name: 'Expiry/MFG',
        description: 'Prioritizes items based on expiration or manufacturing date',
        applicable: true,
        priority: 2,
        key: 'expiry_mfg'
    },
    {
        id: 'logic3',
        name: 'Lowest Pick Path',
        description: 'Optimizes for the shortest picking route path',
        applicable: true,
        priority: 3,
        key: 'lowest_pick_path'
    },
    {
        id: 'logic4',
        name: 'Dual MRP case',
        description: 'Handles items with multiple material requirement planning considerations',
        applicable: true,
        priority: 4,
        key: 'mrp'
    },
    {
        id: 'logic5',
        name: 'Batch/ Lot',
        description: 'Prioritizes items based on batch or lot number for better tracking',
        applicable: true,
        priority: 5,
        key: 'lot_no'
    },
    {
        id: 'logic6',
        name: 'Stock Rotation (Pick Criteria)',
        description: 'Uses stock rotation methods to determine picking order',
        applicable: true,
        priority: 6,
        key: 'stock_rotation'
    },
    {
        id: 'logic7',
        name: 'Pickline/ Bulk Line',
        description: 'Differentiates between pick line and bulk line items',
        applicable: true,
        priority: 7,
        key: 'pickLine/bulkLine'
    },
    {
        id: 'logic8',
        name: 'Shelf Life',
        description: 'Prioritizes items based on remaining shelf life',
        applicable: true,
        priority: 8,
        key: 'shelf_life'
    },
    {
        id: 'logic9',
        name: 'Lowest number of Bins',
        description: 'Optimizes picking to minimize bin locations visited',
        applicable: true,
        priority: 9,
        key: 'lowest_bin_number'
    },
    {
        id: 'logic10',
        name: 'Unit (Case/pieces)',
        description: 'Considers unit type in picking prioritization',
        applicable: true,
        priority: 10,
        key: 'units'
    },
    {
        id: 'logic11',
        name: 'Equivalent & Lowest',
        description: 'Balances equivalent items with lowest effort picking',
        applicable: true,
        priority: 11,
        key: 'equivalent_lowest'
    },
    {
        id: 'logic12',
        name: 'Priority Bins/Location',
        description: 'Prioritizes specific bin locations over others',
        applicable: true,
        priority: 12,
        key: 'priority_bins'
    },
    {
        id: 'logic13',
        name: 'Allocate B2C order from pickline',
        description: 'Always pick B2C orders from storages of priority 1(PICKLINE)',
        applicable: true,
        priority: 13,
        key: 'allocate_b2c_orders_from_pickline'
    }
]

const dbKeys = {
    'QC - OK and Reject': 'qc_reject_ok',
    'Expiry/MFG': 'expiry_mfg',
    'Dual MRP case': 'mrp',
    'Batch/ Lot': 'lot_no',
    'Stock Rotation (Pick Criteria)': 'stock_rotation',
    'Pickline/ Bulk Line': 'pickLine/bulkLine',
    'Shelf Life': 'shelf_life',
    'Lowest number of Bins': 'lowest_bin_number',
    'Unit (Case/pieces)': 'units',
    'Lowest Pick Path': 'lowest_pick_path',
    'Pre-Defined': 'pre_defined',
    'Priority Bins/Location': 'priority_bins',
    'Equivalent & Lowest': 'equivalent_lowest',
    'Allocate B2C order from pickline': 'allocate_b2c_orders_from_pickline',
    // other setting keys
    allowSelfAssignment: 'allowSelfAssignment',
    preventPickPartAllocated: 'preventPickPartAllocated',
    scanStorageBin: 'scanStorageBin',
    skipLocationScan: 'skipLocationScan'
}

const defaultOtherSettings = {
    skipLocationScan: true, // Checked off by default
    scanStorageBin: true, // Checked off by default
    allowSelfAssignment: true, // Checked off by default
    preventPickPartAllocated: false,
    allowManualAllocation: false // New setting for manual allocation
}

export default function PickingConfiguration() {
    usePrompt()
    const theme = useTheme()
    const dispatch = useDispatch()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const navigate = useNavigate()
    const [createConfig] = useCreateConfigMutation()
    const { createConfigLKey } = useSelector(state => state.loading)

    const [activeTab, setActiveTab] = useState(0)
    const [activeModal, setActiveModal] = useState(null)
    const [isDirty, setIsDirty] = useState(false)
    const [specialLogicValue, setSpecialLogicValue] = useState('none') // or 'equivalentLowest'

    const [logics, setLogics] = useState(defaultLogic)

    // Helper texts for settings descriptions
    const settingsDescriptions = {
        skipLocationScan: 'Skip scanning location codes during the picking process for faster operations',
        scanStorageBin: 'Require scanning of storage bin barcodes for improved inventory accuracy',
        allowSelfAssignment: 'Allow operators to self-assign picking tasks without supervisor approval',
        preventPickPartAllocated: 'Prevent picking operations for orders that are only partially allocated'
    }

    // Add state for other tab options
    const [otherSettings, setOtherSettings] = useState(defaultOtherSettings)

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    // Handle other settings changes
    const handleOtherSettingsChange = event => {
        const { name, checked } = event.target
        setOtherSettings(prev => ({
            ...prev,
            [name]: checked
        }))
        setIsDirty(true) // manually set dirty state to true
    }

    // Handle Save & Apply button click - logs all configurations
    const handleSaveApply = async () => {
        const config = {
            logics: logics.map(({ id, name, applicable, priority }) => ({
                id,
                name,
                applicable,
                priority
            })),
            otherSettings
        }
        let message
        let isError = false
        try {
            // TODO: change config keys
            let data = {}
            // eslint-disable-next-line no-return-assign
            config.logics.forEach(item => (data[dbKeys[item.name]] = item.applicable))
            data = { ...data, ...otherSettings, spl_allocation_logic: specialLogicValue }

            await createConfig(data).unwrap()
            message = 'Applied Successfully!'
        } catch (error) {
            isError = true
            message = error?.message || error?.data?.message || 'unable to apply config'
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
            if (!isError) navigate('/outbound/pickList')
        }
    }

    // Modified criteria change handler with improved animation handling
    const handleCriteriaChange = event => {
        const { name } = event.target
        setLogics(prevLogics => {
            // Update the applicable status
            const updatedLogics = prevLogics.map(logic =>
                logic.id === name ? { ...logic, applicable: !logic.applicable } : logic
            )

            // Separate enabled and disabled logics
            const enabledLogics = updatedLogics.filter(logic => logic.applicable)
            const disabledLogics = updatedLogics.filter(logic => !logic.applicable)

            // Return enabled logics first, then disabled logics
            return [...enabledLogics, ...disabledLogics]
        })
        setIsDirty(true) // manually set dirty state to true
    }

    const handleSpecialLogicChange = (event, newValue) => {
        if (newValue !== null) {
            setSpecialLogicValue(newValue)
            setIsDirty(true) // manually set dirty state to true
        }
    }

    // Helper for common ToggleButtonGroup props
    const toggleGroupProps = (name, value, onChange) => ({
        color: 'primary',
        value,
        exclusive: true,
        onChange,
        'aria-label': name, // Improve accessibility
        size: 'small',
        sx: { flexWrap: 'wrap' } // Allow wrapping on small screens if needed
    })

    const toggleButtonProps = (minWidth = '70px') => ({
        sx: {
            px: { xs: 0, sm: 1.5 },
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

    useEffect(() => {
        ;(async () => {
            try {
                const { data } = await dispatch(getConfig.initiate())

                if (data?.data) {
                    const foundConfig = {}
                    // eslint-disable-next-line no-return-assign
                    data.data.map(item => (foundConfig[item.key] = item.value))
                    setLogics(
                        defaultLogic.map(item => ({ ...item, applicable: !!parseInt(foundConfig[item.key], 10) }))
                    )
                    const others = {}

                    Object.keys(defaultOtherSettings).map(
                        // eslint-disable-next-line no-return-assign
                        key => (others[key] = !!parseInt(foundConfig[key], 10) || false)
                    )
                    setOtherSettings(others)
                    if (foundConfig.spl_allocation_logic) {
                        setSpecialLogicValue(foundConfig.spl_allocation_logic)
                    }
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.log('error ', error)
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useDocumentTitle('Configure | Pick List')

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: { xs: '0px', sm: '2px' }, py: 1 }}>
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
                        Set Picking Configuration
                        <Tooltip title='Configure allocation logics and their priorities'>
                            <IconButton size='small'>
                                <Help fontSize='small' color='primary' />
                            </IconButton>
                        </Tooltip>
                    </Typography>
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
                            clickable
                            onClick={() => {
                                setActiveModal('defaultSettings')
                                dispatch(openModal({ type: 'confirm_modal' }))
                            }}
                        >
                            Go Back To Default Setting
                        </CustomButton>
                        <CustomButton
                            variant='clickable'
                            size='small'
                            fullWidth={{ xs: true, sm: false }}
                            customStyles={{
                                height: '30px',
                                minWidth: { sm: '120px' }
                            }}
                            clickable
                            onClick={handleSaveApply}
                            loading={createConfigLKey}
                            disabled={!isDirty} // Disable if not dirty
                        >
                            Save & Apply
                        </CustomButton>
                    </Box>
                </Box>
                <Divider
                    sx={{
                        marginTop: '0.2rem',
                        borderColor: '#BCC1CA',
                        borderWidth: '1px'
                    }}
                />
            </Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant={isMobile ? 'fullWidth' : 'standard'}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minWidth: 'auto',
                            px: { xs: 1, sm: 2 },
                            py: 0
                        },
                        '& .Mui-selected': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            borderTopLeftRadius: 4,
                            borderTopRightRadius: 4
                        }
                    }}
                >
                    <Tab label='Allocation Logic & Priority' />
                    <Tab label='Others' />
                </Tabs>
            </Box>
            {activeTab === 0 && (
                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                        <Grid
                            item
                            xs={isMobile ? 8 : 9.7}
                            sx={{
                                display: 'flex',
                                alignItems: 'baseline',
                                justifyContent: 'flex-start',
                                gap: 1
                            }}
                        >
                            <Typography variant='subtitle1' fontWeight='bold'>
                                Allocation Logic
                            </Typography>
                            {!isMobile && (
                                <Typography variant='caption' color='text.secondary'>
                                    You can enable/disable allocation criteria.
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={isMobile ? 4 : 2.3} sx={{ textAlign: 'center' }}>
                            <Typography variant='subtitle1' fontWeight='bold'>
                                Status
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* New SettingRow for Special Logic Selection */}
                    <SettingRow
                        title='Special Allocation Logic'
                        description='Choose between "Lowest number of Bins" or "Equivalent & Lowest" allocation methods.'
                        control={
                            <ToggleButtonGroup
                                {...toggleGroupProps(
                                    'specialAllocationLogic',
                                    specialLogicValue,
                                    handleSpecialLogicChange
                                )}
                            >
                                <ToggleButton value='none' {...toggleButtonProps('60px')}>
                                    None
                                </ToggleButton>
                                <ToggleButton value='lowestBins' {...toggleButtonProps('140px')}>
                                    Lowest no of Bins
                                </ToggleButton>
                                <ToggleButton value='equivalentLowest' {...toggleButtonProps('140px')}>
                                    Equivalent & Lowest
                                </ToggleButton>
                            </ToggleButtonGroup>
                        }
                    />

                    {/* All logics with motion animations */}
                    <AnimatePresence mode='wait'>
                        {logics.map(logic => {
                            const isFixedLogic = ['logic1', 'logic2', 'logic3'].includes(logic.id)
                            const isSpecialLogic =
                                logic.name === 'Lowest number of Bins' || logic.name === 'Equivalent & Lowest'

                            // Skip rendering special logics since they're now handled by SettingRow above
                            if (isSpecialLogic) {
                                return null
                            }

                            return (
                                <motion.div
                                    key={logic.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            duration: 0.3,
                                            ease: 'easeOut'
                                        }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: -20,
                                        transition: {
                                            duration: 0.2,
                                            ease: 'easeIn'
                                        }
                                    }}
                                    transition={{
                                        layout: {
                                            duration: 0.4,
                                            ease: 'easeInOut'
                                        }
                                    }}
                                    style={{ marginBottom: '4px' }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 0.75, sm: 1 },
                                            borderRadius: 1,
                                            // Styling for fixed logics (Always Active)
                                            bgcolor: isFixedLogic
                                                ? 'grey.bgLighter'
                                                : logic.applicable
                                                  ? 'white'
                                                  : 'grey.100',
                                            border: isFixedLogic
                                                ? '1px solid'
                                                : logic.applicable
                                                  ? '2px solid'
                                                  : '1px solid',
                                            borderColor: 'grey.300',
                                            opacity: logic.applicable || isFixedLogic ? 1 : 0.7,
                                            transition: 'background-color 0.3s, border-color 0.3s, opacity 0.3s'
                                        }}
                                    >
                                        <Grid container alignItems='center' spacing={1}>
                                            <Grid item xs={isMobile ? 8 : 9.7}>
                                                <Typography
                                                    variant={isMobile ? 'body2' : 'subtitle1'}
                                                    color='text.primary'
                                                >
                                                    {logic.name}
                                                    {isFixedLogic && (
                                                        <StatusBadge
                                                            label='Always Active'
                                                            type='success'
                                                            customSx={{
                                                                fontSize: '0.75rem',
                                                                ml: 1,
                                                                height: '1.1rem'
                                                            }}
                                                        />
                                                    )}
                                                </Typography>
                                                {!isMobile && (
                                                    <Typography
                                                        variant='body2'
                                                        color='text.secondary'
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {logic.description}
                                                    </Typography>
                                                )}
                                            </Grid>
                                            <Grid
                                                item
                                                xs={isMobile ? 4 : 2.3}
                                                sx={{ display: 'flex', justifyContent: 'center' }}
                                            >
                                                <>
                                                    {isFixedLogic ? (
                                                        <Typography variant='body2' color='text.main'>
                                                            Enabled
                                                        </Typography>
                                                    ) : (
                                                        <ToggleSwitchWithLabels
                                                            name={logic.id}
                                                            checked={logic.applicable}
                                                            onChange={handleCriteriaChange}
                                                            noText='Disable'
                                                            yesText='Enable'
                                                        />
                                                    )}
                                                </>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </Box>
            )}
            {activeTab === 1 && (
                <Box sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                        Picking Configuration
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        Configure how picking operations are handled in the warehouse management system
                    </Typography>

                    <FormGroup>
                        {Object.entries(otherSettings).map(([key, value]) => (
                            <Box key={key} sx={{ mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox name={key} checked={value} onChange={handleOtherSettingsChange} />
                                    }
                                    label={
                                        key === 'skipLocationScan'
                                            ? 'Skip Location Scan for Picking'
                                            : key === 'scanStorageBin'
                                              ? 'Scan Storage Bin for Picking'
                                              : key === 'allowSelfAssignment'
                                                ? 'Allow Self Assignment for Picking'
                                                : key === 'preventPickPartAllocated'
                                                  ? 'Prevent Pick for Part-Allocated Orders'
                                                  : 'Allow Manual Allocation'
                                    }
                                />
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 4 }}>
                                    {settingsDescriptions[key]}
                                </Typography>
                            </Box>
                        ))}
                    </FormGroup>
                </Box>
            )}
            {activeModal === 'defaultSettings' && (
                <ConfirmModal
                    title='Reset Confirmation'
                    message='Are you sure you want to go back to the default setting?'
                    icon='alert'
                    confirmText='Yes'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                    onConfirm={() => {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: 'Set to default config successfully!',
                                variant: 'alert',
                                alert: { color: 'success', icon: 'success' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                        navigate('/outbound/pickList')
                    }}
                />
            )}
        </MainCard>
    )
}
