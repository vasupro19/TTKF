import React from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Stack } from '@mui/material'
import Add from '@mui/icons-material/Add'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import { FilterListOff } from '@mui/icons-material'
import { CSVExport } from './extended/CreateCSV'
import CustomButton from './extended/CustomButton'

function MobileTableToolbar({
    isShowClearButton,
    setClearAllFilters,
    handleCurrentView,
    handleExportAllExcel,
    handleAdd,
    title = '',
    rightColumnElement = null
}) {
    return (
        <Box
            sx={{ display: { xs: 'flex', sm: 'none' }, gap: 2, justifyContent: 'space-between', alignItems: 'center' }}
        >
            <Box>
                <Typography variant='h3'>{title}</Typography>
            </Box>
            <Stack direction='row' spacing={1} alignItems='center' paddingY='12px'>
                {/* Clear All Filters Button */}
                {isShowClearButton && (
                    <CustomButton
                        variant='outlined'
                        customStyles={{
                            border: '1px solid',
                            borderColor: 'error.main',
                            minWidth: '2rem',
                            padding: '5px',
                            borderRadius: '10px',
                            color: 'error.main',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)'
                        }}
                        onClick={() => {
                            setClearAllFilters(prev => !prev)
                        }}
                    >
                        <FilterListOff />
                    </CustomButton>
                )}

                {rightColumnElement && rightColumnElement}

                {/* CSV Export Button (using an icon for mobile) */}
                <UiAccessGuard>
                    <CSVExport handleExcelClick={handleCurrentView} exportAllFunc={handleExportAllExcel} />
                </UiAccessGuard>

                {/* Add New Button (using an icon for mobile) */}
                {handleAdd && (
                    <UiAccessGuard type='create'>
                        <CustomButton
                            color='primary'
                            customStyles={{ border: '1px', minWidth: '2rem', padding: '6px', borderRadius: '10px' }}
                            onClick={handleAdd}
                        >
                            <Add />
                        </CustomButton>
                    </UiAccessGuard>
                )}
            </Stack>
        </Box>
    )
}

MobileTableToolbar.propTypes = {
    isShowClearButton: PropTypes.bool,
    setClearAllFilters: PropTypes.func,
    handleCurrentView: PropTypes.func,
    handleExportAllExcel: PropTypes.func,
    handleAdd: PropTypes.func,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    rightColumnElement: PropTypes.node
}

export default MobileTableToolbar
