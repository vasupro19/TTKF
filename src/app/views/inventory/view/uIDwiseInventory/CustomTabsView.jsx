import React, { useState } from 'react'
import { Tabs, Tab, Box, Paper } from '@mui/material'
import { styled } from '@mui/system'
import UIDWiseInventory from '@/app/views/tables/inventory/uIDWiseInventory'
import { useSelector, useDispatch } from 'react-redux'
import { setCurrentSWITab } from '@/app/store/slices/inventoryStorageWiseSlice'

// Define common colors using hex codes
const SELECTED_TAB_BACKGROUND = '#eef2f6' // Very light grey, matches content background
const TEXT_COLOR_PRIMARY = '#212121' // Dark text for selected/important
const TEXT_COLOR_SECONDARY = '#757575' // Lighter text for unselected
const SELECTED_TAB_BOTTOM_LINE_COLOR = '#45484c' // A blue for the thick bottom line (example)
const SELECTED_TAB_BOTTOM_LINE_THICKNESS = '2px' // Thickness of the bottom line
const BADGE_COLOR = TEXT_COLOR_PRIMARY // Use primary text color for badges

// Custom Badge component for count display
// eslint-disable-next-line no-unused-vars
const CountBadge = styled('span')(({ theme, count, isSelected }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 6px',
    marginLeft: '8px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: isSelected ? BADGE_COLOR : '#697586',
    borderRadius: '10px',
    lineHeight: 1,
    transition: 'all 0.10s ease-in-out',

    // Enhance visibility for selected tab
    ...(isSelected && {
        backgroundColor: BADGE_COLOR,
        transform: 'scale(1.05)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
    })
}))

// Custom styled Tab component
// eslint-disable-next-line no-unused-vars
const CustomTab = styled(Tab)(({ theme, ownerState }) => ({
    textTransform: 'none',
    minWidth: 0,
    padding: '10px 20px', // Adjust padding as needed
    marginRight: '8px', // Space between tabs
    fontSize: '1rem', // Increase general font size for all tabs (e.g., 16px)

    // Default styling for ALL tabs (mostly for unselected state)
    color: TEXT_COLOR_SECONDARY, // Text color for unselected tabs
    fontWeight: 500, // Semi-bold for text
    backgroundColor: 'transparent', // No background for unselected tabs
    border: 'none', // No border for unselected tabs

    // Styling for the SELECTED tab only
    '&.Mui-selected': {
        color: TEXT_COLOR_PRIMARY, // Darker text for selected tab
        fontWeight: 700, // Higher font weight for selected tab
        backgroundColor: SELECTED_TAB_BACKGROUND, // Matches the Paper background
        borderBottom: `3px solid ${SELECTED_TAB_BOTTOM_LINE_COLOR}`, // Thick bottom border
        borderTopLeftRadius: '12px', // Apply radius to selected tab's top corners
        borderTopRightRadius: '12px',
        position: 'relative', // Helps with z-index positioning
        zIndex: 3, // Ensure selected tab is on top of everything
        // Pull the selected tab down by the thickness of its own bottom border
        // so it sits slightly over the Paper's top edge
        marginBottom: `-${SELECTED_TAB_BOTTOM_LINE_THICKNESS}` // Adjust margin to sink the tab
    },

    // Focus visible (keyboard navigation)
    '&.Mui-focusVisible': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)' // A subtle focus background
    },
    '&:hover': {
        color: TEXT_COLOR_PRIMARY // No hover effect
    }
}))

// Tab Panel component to render content
function TabPanel(props) {
    // eslint-disable-next-line react/prop-types
    const { children, value, index, tabValue, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...other}
        >
            {value === index && <UIDWiseInventory tabValue={tabValue} />}
        </div>
    )
}

// Accessibility props helper
function a11yProps(index) {
    return {
        id: `tab-${index}`,
        'aria-controls': `tabpanel-${index}`
    }
}

// Custom Tab Label with Badge component
function TabLabelWithBadge({ label, count, isSelected }) {
    const displayCount = count > 99 ? '99+' : count.toString()

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>{label}</span>
            {count > 0 && (
                <CountBadge count={count} isSelected={isSelected}>
                    {displayCount}
                </CountBadge>
            )}
        </Box>
    )
}

export default function CustomTabsView() {
    const dispatch = useDispatch()
    const [value, setValue] = useState(0)

    // Array of tab labels and their corresponding counts
    // You can replace these with actual data counts from your API or state
    // const tabData = [
    //     { label: 'Storage', count: 10 },
    //     { label: 'Receiving', count: 29 },
    //     { label: 'Picked', count: 156 }, // This will show as 99+
    //     { label: 'Kit Picked', count: 0 },
    //     { label: 'Cancel', count: 3 },
    //     { label: 'Return', count: 0 }, // No badge will show
    //     { label: 'Missing', count: 12 }
    // ]
    const tabsData = useSelector(state => state.inventoryFilterTabs)
    const handleChange = (event, newValue) => {
        // const selectedTabLabel = tabsData[newValue]?.acc
        // if (selectedTabLabel) {
        //     dispatch(setCurrentSWITab(selectedTabLabel))
        // }
        console.log('newValue newValue newValue ', newValue)
        setValue(newValue)
    }

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            {/* Container for Tabs - crucial for positioning */}
            <Box
                sx={{
                    display: 'flex',
                    position: 'relative',
                    minHeight: '48px' // Enough height for tabs and proper alignment
                }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label='custom tabs example'
                    TabIndicatorProps={{
                        style: { display: 'none' } // Hide the default indicator
                    }}
                    sx={{
                        minHeight: 'auto',
                        '& .MuiTabs-flexContainer': {
                            alignItems: 'flex-end', // Push tabs to the bottom'
                            borderBottom: '0px'
                        },
                        padding: 0,
                        margin: 0,
                        flexGrow: 1 // Allow tabs to take up available space
                    }}
                >
                    {tabsData?.map((tab, index) => (
                        <CustomTab
                            key={tab.acc}
                            label={
                                <TabLabelWithBadge label={tab.label} count={tab.count} isSelected={value === index} />
                            }
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...a11yProps(index)}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Content Area - this is the "joined" container */}
            <Paper
                elevation={0} // No shadow, as per image
                sx={{
                    borderTop: 'none', // Remove the Paper's top border directly
                    backgroundColor: SELECTED_TAB_BACKGROUND, // Matches selected tab background
                    borderTopLeftRadius: value === 0 ? '0px' : '8px', // Keep consistent radius on content
                    borderTopRightRadius: '8px', // Keep consistent radius on content
                    borderBottomLeftRadius: '8px', // Bottom radii
                    borderBottomRightRadius: '8px', // Bottom radii
                    marginTop: `-${SELECTED_TAB_BOTTOM_LINE_THICKNESS}`, // Adjust margin to sink the Paper
                    position: 'relative', // Ensure it respects z-index with tabs
                    zIndex: 1 // Ensure content is below selected tab
                }}
            >
                {tabsData?.map((tab, index) => (
                    <TabPanel key={tab.acc} value={value} index={index} tabValue={tab.acc} />
                ))}
            </Paper>
        </Box>
    )
}
