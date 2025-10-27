/* eslint-disable */
import { Box, Typography, Tooltip } from '@mui/material'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const SLADisplay = ({ hours }) => {
    const getSLAStatus = hours => {
        if (hours <= 0) {
            return {
                color: 'error.main',
                backgroundColor: '#FFE6E6',
                label: 'Overdue',
                icon: <ErrorIcon color='error' sx={{ fontSize: '16px' }} />,
                severity: 'error'
            }
        } else if (hours < 2) {
            return {
                color: '#D32F2F',
                backgroundColor: '#FFEBEE',
                label: 'Very Critical',
                icon: <ErrorIcon color='error' sx={{ fontSize: '16px' }} />,
                severity: 'error'
            }
        } else if (hours < 4) {
            return {
                color: '#ED6C02',
                backgroundColor: '#FFF3E0',
                label: 'Critical',
                icon: <WarningIcon color='warning' sx={{ fontSize: '16px' }} />,
                severity: 'warning'
            }
        } else {
            return {
                color: '#2E7D32',
                backgroundColor: '#E8F5E9',
                label: 'Normal',
                icon: <AccessTimeIcon color='success' sx={{ fontSize: '16px' }} />,
                severity: 'success'
            }
        }
    }

    // Format hours for display
    const formatHours = hours => {
        if (!hours) return 'N/A'
        const absHours = Math.abs(hours)
        const hoursInt = Math.floor(absHours)
        const minutes = Math.round((absHours - hoursInt) * 60)

        if (hours <= 0) {
            return 'SLA Breached'
        }

        const timeStr = minutes === 0 ? `${hoursInt}hr` : `${hoursInt}hr ${minutes}m`
        return hoursInt === 1 ? timeStr.replace('hr', 'hr') : timeStr.replace('hr', 'hrs')
    }

    const status = getSLAStatus(hours)

    return (
        <Tooltip
            title={
                hours < 0
                    ? `Delayed by ${Math.abs(hours)} ${Math.abs(hours) === 1 ? 'hr' : 'hrs'}`
                    : `Status: ${status.label}`
            }
            arrow
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}
            >
                <Typography
                    variant='body1'
                    sx={{
                        color: status.color,
                        fontWeight: 'medium'
                    }}
                >
                    {formatHours(hours)}
                </Typography>
            </Box>
        </Tooltip>
    )
}

export default SLADisplay
