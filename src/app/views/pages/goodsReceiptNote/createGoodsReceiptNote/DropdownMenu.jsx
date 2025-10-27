import { useState } from 'react'
import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Typography,
    Paper,
    Popover,
    Divider,
    styled,
    Checkbox
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'
import {
    setCurrentBaseDoc,
    setCurrentProcessConfig,
    toggleCurrentAdditionalConfig,
    saveOptions,
    revertChanges,
    currentOptions
} from '@store/slices/grnSetupOption'
import CustomButton from '@/core/components/extended/CustomButton'
import { SettingsGearAnimIcon } from '@/assets/icons/SettingsGearAnimIcon'
import { usePostGrnSetupMutation } from '@/app/store/slices/api/grnSlice'
import { setShouldRemoveGrn } from '@/app/store/slices/grn'

function DropdownMenu() {
    const dispatch = useDispatch()

    const StyledRadio = styled(Radio)(() => ({
        paddingTop: '2px',
        paddingBottom: '2px'
    }))

    const StyledCheckbox = styled(Checkbox)(() => ({
        paddingTop: '2px',
        paddingBottom: '2px'
    }))

    const [postGrnSetup] = usePostGrnSetupMutation()

    const { postGrnSetupLKey } = useSelector(state => state.loading)
    const { baseDoc, processConfig, additionalConfig } = useSelector(currentOptions)

    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const id = open ? 'dropdown-popover' : undefined

    const toggleDropdown = event => {
        setAnchorEl(prev => (prev ? null : event.currentTarget))
    }

    const handleBaseDocChange = event => {
        dispatch(setCurrentBaseDoc(event.target.value))
    }

    const handleProcessConfigChange = event => {
        if (event.target.value !== 'normalConfig' && additionalConfig?.includes('bulkOperation')) {
            dispatch(toggleCurrentAdditionalConfig('bulkOperation'))
        }
        dispatch(setCurrentProcessConfig(event.target.value))
    }

    const handleAdditionalConfigChange = event => {
        dispatch(toggleCurrentAdditionalConfig(event.target.value))
    }

    const handleSave = async () => {
        try {
            await postGrnSetup({ baseDoc, processConfig, additionalConfig }).unwrap()
            dispatch(setShouldRemoveGrn(true))
            dispatch(saveOptions())
            setAnchorEl(null)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('grn save error 🥶 💀 ', error)
        }
    }

    const handleCloseDropdown = () => {
        dispatch(revertChanges())
        setAnchorEl(null)
    }

    return (
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <CustomButton
                variant='clickable'
                onClick={toggleDropdown}
                type='button'
                shouldAnimate
                endIcon={<SettingsGearAnimIcon />}
            >
                Setup
            </CustomButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleCloseDropdown}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                }}
                sx={{
                    mt: 1,
                    p: 2
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        minWidth: 380,
                        // backgroundColor: '#f0f8ff',
                        borderRadius: 2,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                        p: 2
                    }}
                >
                    <FormControl component='fieldset' sx={{ width: '100%' }}>
                        <FormLabel component='legend' sx={{ fontWeight: 'bold' }}>
                            Base Doc:
                        </FormLabel>
                        <Divider sx={{ borderColor: 'primary.main', marginBottom: 0.5 }} />
                        <RadioGroup row name='baseDoc' value={baseDoc} onChange={handleBaseDocChange}>
                            <FormControlLabel value='boxId' control={<StyledRadio size='small' />} label='Box id' />
                            <FormControlLabel
                                value='gateEntry'
                                control={<StyledRadio size='small' />}
                                label='Gate entry'
                            />
                        </RadioGroup>
                        <Divider />
                        <Typography sx={{ fontWeight: 'bold', mt: 2 }}>Process Configuration:</Typography>
                        <Divider sx={{ borderColor: 'primary.main', marginBottom: 0.5 }} />

                        <RadioGroup name='processConfig' value={processConfig} onChange={handleProcessConfigChange}>
                            <FormControlLabel
                                value='normalConfig'
                                control={<StyledRadio size='small' />}
                                label='Normal Config (Label will be printed)'
                            />
                            <FormControlLabel
                                value='uidOnly'
                                control={<StyledRadio size='small' />}
                                label='UID Only (Label will not be printed)'
                            />
                            <FormControlLabel
                                value='preGeneratedUID'
                                control={<StyledRadio size='small' />}
                                label='Pre-Generated UID (Label will not be printed)'
                            />
                            <FormControlLabel
                                value='vendorSerial'
                                control={<StyledRadio size='small' />}
                                label='Vendor Serial Operation (Label will not be printed)'
                            />
                        </RadioGroup>
                        <Divider />
                        <Typography sx={{ fontWeight: 'bold', mt: 2 }}>Additional Configuration:</Typography>
                        <Divider sx={{ borderColor: 'primary.main', marginBottom: 0.5 }} />
                        <FormControl component='fieldset'>
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={additionalConfig.includes('bulkOperation')}
                                        onChange={handleAdditionalConfigChange}
                                        disabled={processConfig !== 'normalConfig'}
                                    />
                                }
                                label='Bulk Operation'
                                value='bulkOperation'
                            />
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={additionalConfig.includes('defaultQC')}
                                        onChange={handleAdditionalConfigChange}
                                    />
                                }
                                label='Default QC'
                                value='defaultQC'
                            />
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={additionalConfig.includes('RFID')}
                                        onChange={handleAdditionalConfigChange}
                                    />
                                }
                                label='RFID'
                                value='RFID'
                            />
                            <FormControlLabel
                                control={
                                    <StyledCheckbox
                                        checked={additionalConfig.includes('excessItems')}
                                        onChange={handleAdditionalConfigChange}
                                    />
                                }
                                label='Excess Items'
                                value='excessItems'
                            />
                        </FormControl>

                        <CustomButton
                            variant='clickable'
                            sx={{
                                mt: 2
                            }}
                            onClick={handleSave}
                            type='submit'
                            loading={postGrnSetupLKey}
                        >
                            Save
                        </CustomButton>
                    </FormControl>
                </Paper>
            </Popover>
        </Box>
    )
}

export default DropdownMenu
