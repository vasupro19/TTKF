/* eslint-disable */
import * as React from 'react'
import { styled } from '@mui/material/styles'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

const AntTabs = styled(Tabs)({
    '& .MuiTabs-indicator': {
        backgroundColor: 'transparent'
    },
    '& .MuiTabs-flexContainer': {
        border: '1px solid',
        borderColor: 'grey.borderLight',
        width: 'fit-content',
        padding: '4px',
        borderRadius: 20,
        backgroundColor: '#ececec'
    }
})

const AntTab = styled(props => <Tab disableRipple {...props} />)(({ theme }) => ({
    textTransform: 'none',
    minHeight: 32,
    borderRadius: 20,
    padding: 0,
    [theme.breakpoints.up('xs')]: {
        minWidth: 0,
        width: '130px'
    },
    [theme.breakpoints.up('sm')]: {
        minWidth: 0,
        width: '180px',
    },
    fontWeight: theme.typography.fontWeightRegular,
    color: theme.palette.text.primary,
    '&:hover': {
        color: theme.palette.primary.dark,
        opacity: 1,
        backgroundColor: theme.palette.grey[300],
    },
    '&.Mui-selected': {
        color: 'white',
        backgroundColor: theme.palette.primary.main,
        fontWeight: theme.typography.fontWeightMedium
    },
    '&.Mui-focusVisible': {
        backgroundColor: theme.palette.primary.dark
    }
}))

export default function CustomTabsGroupedBtns({ labels = ['Tab 1', 'Tab 2'], onChange, tabValue }) {
    const [value, setValue] = React.useState(0)

    const handleChange = (event, newValue) => {
        // setValue(newValue)
        if (onChange) onChange(newValue)
    }

    return (
        <Box sx={{ bgcolor: '#fff' }}>
            <AntTabs value={tabValue} onChange={handleChange} aria-label='custom tabs'>
                {labels.map((label, index) => (
                    <AntTab key={index} label={label} />
                ))}
            </AntTabs>
        </Box>
    )
}
