/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types'

// material-ui
import { Box, useMediaQuery } from '@mui/material'

// assets
import { FactCheck, TableView } from '@mui/icons-material'

// import components
import { UploadAnimIcon } from '@/assets/icons/UploadAnimIcon'
import CustomButton from './CustomButton'
import CustomDropdownMenu from '../CustomDropdownMenu'

/**
 * CSVExport Component
 *
 * This component renders a dropdown menu with options for exporting data as CSV files.
 * It supports exporting the current view and all data.
 *
 * @param {Object} props - Component props
 * @param {Function} props.handleExcelClick - Function to handle the current view export
 * @param {Function} props.exportAllFunc - Function to handle exporting all data
 */
export function CSVExport({ handleExcelClick, exportAllFunc, buttonSx = {} }) {
    const isMobile = useMediaQuery('(max-width:600px)')
    const menuItems = [
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TableView />
                    Current View
                </Box>
            ),
            onClick: () => {
                if (handleExcelClick) {
                    handleExcelClick()
                }
            }
        },
        {
            content: (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FactCheck />
                    Export All
                </Box>
            ),
            onClick: () => {
                if (exportAllFunc) {
                    exportAllFunc()
                }
            }
        }
    ]

    return (
        <CustomDropdownMenu
            triggerButton={
                isMobile ? (
                    <CustomButton
                        variant='outlined'
                        customStyles={{
                            border: '1px solid',
                            borderColor: 'primary.main',
                            minWidth: '2rem',
                            padding: '9px',
                            borderRadius: '10px'
                        }}
                    >
                        <UploadAnimIcon />
                    </CustomButton>
                ) : (
                    <CustomButton
                        variant='outlined'
                        shouldAnimate
                        endIcon={<UploadAnimIcon />}
                        customStyles={{ ...buttonSx }}
                    >
                        Export
                    </CustomButton>
                )
            }
            menuItems={menuItems}
        />
    )
}

CSVExport.propTypes = {
    handleExcelClick: PropTypes.func.isRequired, // Function to handle current view export
    buttonSx: PropTypes.object, // Custom styles for the button
    exportAllFunc: PropTypes.func.isRequired // Function to handle export all action
}

export default CSVExport
