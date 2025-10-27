/* eslint-disable */
import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tabs, Tab, Box, Typography, Paper, Badge, useMediaQuery, IconButton, Tooltip } from '@mui/material'
import { styled } from '@mui/system'
import StorageWiseInventory from '@/app/views/tables/inventory/storageWiseInventory'
import { setCurrentSWITab } from '@/app/store/slices/inventoryStorageWiseSlice'
import { KeyboardArrowUp } from '@mui/icons-material'

// Define common colors using hex codes
const BORDER_COLOR = '#E0E0E0' // A light grey for borders
const SELECTED_TAB_BACKGROUND = '#eef2f6' // Very light grey, matches content background
const TEXT_COLOR_PRIMARY = '#212121' // Dark text for selected/important
const TEXT_COLOR_SECONDARY = '#757575' // Lighter text for unselected
const SELECTED_TAB_BOTTOM_LINE_COLOR = '#45484c' // A blue for the thick bottom line (example)
const SELECTED_TAB_BOTTOM_LINE_THICKNESS = '2px' // Thickness of the bottom line
const BADGE_COLOR = TEXT_COLOR_PRIMARY // Use primary text color for badges
const BADGE_COLOR_HIGH = TEXT_COLOR_SECONDARY // Use secondary text color for high count badges (99+)

// Custom Badge component for count display
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
    const { children, value, index, ...other } = props
    
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <StorageWiseInventory />}
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
    const currentTab = useSelector(state => state.inventoryStorageWise.currentSWITab)
    const isMobile = useMediaQuery('(max-width:600px)') // Adjust based on your theme breakpoints

    const scrollToTop = () => {
        window.scrollTo({
            top: 196,
            behavior: 'smooth'
        })
    }

    const tabsData = useSelector(state => state.inventoryFilterTabs)

    // Get current tab index based on the label from Redux
    const currentTabIndex = tabsData.findIndex(tab => tab.acc === currentTab)

    const handleChange = (event, newValue) => {
        const selectedTabLabel = tabsData[newValue]?.acc
        if (selectedTabLabel) {
            dispatch(setCurrentSWITab(selectedTabLabel))
        }
    }

    return (
        <Box sx={{ width: '100%', flexGrow: 1, flex: 1, display: 'flex',flexDirection:'column' }}>
            {/* Container for Tabs - crucial for positioning */}
            <Box
                sx={{
                    display: 'flex',
                    position: 'relative',
                    minHeight: '48px', // Enough height for tabs and proper alignment
                    ...(isMobile && {
                        overflowX: 'auto', // Enable horizontal scrolling on mobile
                        '&::-webkit-scrollbar': {
                            height: '4px'
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'transparent'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#C4C4C4',
                            borderRadius: '2px'
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#A0A0A0'
                        }
                    })
                }}
                id="custom-tabs-container"
            >
                <Tabs
                    value={currentTabIndex !== -1 ? currentTabIndex : 0}
                    onChange={handleChange}
                    aria-label='Tabs'
                    variant={isMobile ? 'scrollable' : 'standard'}
                    scrollButtons={isMobile ? 'auto' : false}
                    allowScrollButtonsMobile={isMobile}
                    TabIndicatorProps={{
                        style: { display: 'none' } // Hide the default indicator
                    }}
                    sx={{
                        minHeight: 'auto',
                        '& .MuiTabs-flexContainer': {
                            alignItems: 'flex-end', // Push tabs to the bottom'
                            borderBottom: '0px',
                            ...(isMobile && {
                                minWidth: 'max-content' // Ensure tabs don't shrink below content size
                            })
                        },
                        '& .MuiTabs-scrollButtons': {
                            '&.Mui-disabled': {
                                opacity: 0.3
                            }
                        },
                        padding: 0,
                        margin: 0,
                        flexGrow: 1 // Allow tabs to take up available space
                    }}
                >
                    {tabsData?.map((tab, index) => (
                        <CustomTab
                            key={index}
                            label={
                                <TabLabelWithBadge
                                    label={tab.label}
                                    count={tab.count}
                                    isSelected={currentTab === tab.acc}
                                />
                            }
                            {...a11yProps(index)}
                            sx={{
                                ...(isMobile && {
                                    minWidth: 'auto',
                                    whiteSpace: 'nowrap', // Prevent text wrapping on mobile
                                    padding: '10px 16px' // Slightly reduce padding on mobile for better fit
                                })
                            }}
                        />
                    ))}
                </Tabs>
                {/* Scroll to top button - only show on desktop */}
                {/* {!isMobile && (
                    <Tooltip title='Scroll to top' placement='left'>
                        <IconButton
                            onClick={scrollToTop}
                            sx={{
                                alignSelf: 'flex-end',
                                mb: 0.5, // Align with tabs
                                ml: 1
                            }}
                            size='small'
                        >
                            <KeyboardArrowUp />
                        </IconButton>
                    </Tooltip>
                )} */}
            </Box>

            {/* Content Area - this is the "joined" container */}
            <Paper
                elevation={0} // No shadow, as per image
                sx={{
                    borderTop: 'none', // Remove the Paper's top border directly
                    backgroundColor: SELECTED_TAB_BACKGROUND, // Matches selected tab background
                    borderTopLeftRadius: currentTab === 'storage' ? '0px' : '8px', // Keep consistent radius on content
                    borderTopRightRadius: '8px', // Keep consistent radius on content
                    borderBottomLeftRadius: '8px', // Bottom radii
                    borderBottomRightRadius: '8px', // Bottom radii
                    marginTop: `-${SELECTED_TAB_BOTTOM_LINE_THICKNESS}`, // Adjust margin to sink the Paper
                    position: 'relative', // Ensure it respects z-index with tabs
                    zIndex: 1, // Ensure content is below selected tab
                    ...(isMobile ? { minHeight: 'calc(100vh - 206px)' } : {}), // Adjust height to fit below header
                    flexGrow: 1, // Allow Paper to grow and fill available space
                    flex: 1
                }}
            >
                {tabsData?.map((tab, index) => (
                    <TabPanel key={index} value={currentTabIndex !== -1 ? currentTabIndex : 0} index={index} />
                ))}
            </Paper>
        </Box>
    )
}
