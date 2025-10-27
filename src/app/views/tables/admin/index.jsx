import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FormControlLabel, Tooltip, Typography } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { AssignmentInd, FilterAltOff, PersonAddAlt } from '@mui/icons-material'

// ** import core components
import MainCard from '@core/components/extended/MainCard'
import { CSVExport } from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'
import ToggleColumns from '@core/components/ToggleColumns'
import ConfirmModal from '@core/components/modals/ConfirmModal'
import CustomSwitch from '@core/components/extended/CustomSwitch'
import DropdownMenu from '@core/components/DropdownMenu'
import CustomButton from '@/core/components/extended/CustomButton'
// ** import utils/hooks
import { getObjectKeys, toCapitalizedWords } from '@/utilities'

// ** import from redux
import { openModal } from '@app/store/slices/modalSlice'
import { useDispatch } from 'react-redux'

// ** import dummy data
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { locations } from './locations'

function AddAdminTable() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [columns, setColumns] = useState([])
    const [excelHandler, setExcelHandler] = useState(false)
    const [isShowClearButton, setIsShowClearButton] = useState(false)
    const [clearAllFilters, setClearAllFilters] = useState(false)

    const queryHandler = (key, value) => {
        // eslint-disable-next-line no-console
        console.log('key ', key, 'value ', value)
    }
    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }
    // this can be done by making headers and columns array
    useEffect(() => {
        let ObjectKeys = []

        // TODO: once api integrated remove this block completely

        // eslint-disable-next-line no-unused-vars
        const data = locations.map((user, index) => {
            if (index === 0) {
                ObjectKeys = getObjectKeys(user)
                setColumns(
                    ObjectKeys.map((key, keyIndex) => ({
                        id: keyIndex,
                        label: key === 'id' ? 'Sr.No.' : toCapitalizedWords(key),
                        align: key === 'id' || key === 'aadharCard' ? 'center' : undefined, // align items can be used specifically for a column too
                        search: true,
                        // eslint-disable-next-line no-nested-ternary
                        sort: key === 'id' ? false : Math.ceil(Math.random() * 10) >= 5,
                        key,
                        accessKey: key,
                        visible: true, // hide id column
                        minWidth: key === 'id' ? 3.1 : 8, // unit = rem (required)
                        maxWidth: key === 'id' ? 3.1 : 8 // unit = rem (required)
                    }))
                )
            }

            return ObjectKeys.map(key => user[key])
        })
    }, [])

    // eslint-disable-next-line no-unused-vars
    const handleUpdateStatus = id => {
        dispatch(
            openModal({
                type: 'confirm_modal'
            })
        )
    }

    const handleOptionClick = action => {
        if (action === 'admin') {
            navigate('/userManagement/admin/create')
        } else {
            navigate('/userManagement/admin/add')
        }
        // Add specific logic for each action
    }

    const dropdownOptions = [
        { label: 'Create New Admin', action: 'admin', icon: <PersonAddAlt /> },
        { label: 'Add Existing User', action: 'existingUser', icon: <AssignmentInd /> }
    ]

    return (
        <MainCard content={false}>
            <Box>
                {/* Add your dummy buttons here */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant='h3'>All Admins</Typography>
                    </Box>
                    <Stack direction='row' spacing={2} alignItems='center' paddingY='12px'>
                        {isShowClearButton && (
                            <CustomButton
                                variant='text'
                                customStyles={{
                                    color: 'error.main',
                                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                                }}
                                startIcon={<FilterAltOff />}
                                onClick={() => {
                                    setClearAllFilters(prev => !prev)
                                }}
                            >
                                Clear All Filters
                            </CustomButton>
                        )}
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} />
                        </UiAccessGuard>
                        <UiAccessGuard type='create'>
                            <DropdownMenu
                                buttonText='Add New'
                                options={dropdownOptions}
                                onOptionClick={handleOptionClick}
                            />
                        </UiAccessGuard>

                        {/* render action column can be made dynamic based on user authorization  */}
                        <ToggleColumns columns={[...columns.map(c => c.label), 'Action']} />
                    </Stack>
                </Box>
                <DataTable
                    data={locations} // TODO: remove dummy data once api integrated
                    columns={columns}
                    queryHandler={queryHandler}
                    isCheckbox={false}
                    addExcelQuery={excelHandler}
                    renderAction={row => (
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <UiAccessGuard type='edit'>
                                <Tooltip title='Update Status'>
                                    <FormControlLabel
                                        sx={{ margin: '0px' }}
                                        control={
                                            <CustomSwitch
                                                // isChecked={row?.status === 'Active'}
                                                isChecked={Math.ceil(Math.random() * 10) >= 5}
                                                handleChange={() => {
                                                    handleUpdateStatus(row.id)
                                                }}
                                            />
                                        }
                                    />
                                </Tooltip>
                            </UiAccessGuard>
                        </Box>
                    )}
                    setIsShowClearButton={setIsShowClearButton}
                    clearAllFilters={clearAllFilters}
                />
                {/* confirm before delete */}
                <ConfirmModal
                    title='Deactivate User'
                    message='Are you sure you want to deactivate and auto logout this user?'
                    icon='warning'
                    confirmText='Yes, Deactivate'
                    customStyle={{ width: { xs: '300px', sm: '456px' } }}
                />
            </Box>
        </MainCard>
    )
}

export default AddAdminTable
