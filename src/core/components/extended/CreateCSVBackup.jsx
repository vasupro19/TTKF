/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types'

// material-ui
import { Box, ButtonBase, Typography } from '@mui/material'

// third-party
import { CSVLink } from 'react-csv'

// assets
import { FactCheck, IosShare, TableView } from '@mui/icons-material'
import CustomButton from './CustomButton'
import CustomDropdownMenu from '../CustomDropdownMenu'

// ==============================|| CSV Export ||============================== //

// Usage: <CSVExport data={csvData} filename={`pincodes ${new Date()}.csv`} headers={csvHeaders} />

export function CSVExport({ data, filename, headers, exportAllFunc }) {
    const menuItems = [
        {
            content: (
                <CSVLink
                    data={data}
                    headers={headers}
                    filename={filename}
                    target='_blank'
                    style={{
                        textDecoration: 'none',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <ButtonBase>
                        <TableView sx={{ color: 'text.paper' }} aria-label='Export CSV File' />
                    </ButtonBase>
                    <Typography sx={{ textDecoration: 'none', color: 'text.paper' }}>Current View</Typography>
                </CSVLink>
            )
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
                alert('Custom Option 2 clicked')
            }
        }
    ]
    return (
        <CustomDropdownMenu
            triggerButton={
                <CustomButton variant='outlined' endIcon={<IosShare />}>
                    Export
                </CustomButton>
            }
            menuItems={menuItems}
        />
    )
}
CSVExport.propTypes = {
    data: PropTypes.array.isRequired,
    filename: PropTypes.string.isRequired,
    headers: PropTypes.array.isRequired
}
export default CSVExport
