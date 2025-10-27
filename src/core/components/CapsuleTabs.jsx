/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { Tabs, Tab, Popper, Paper, Typography, useTheme, useMediaQuery } from '@mui/material'
import WarningCircleIcon from '@/assets/icons/WarningCircleIcon'

function MyTabs({ activeTab, handleTabChange, tabsFields, customSx = {}, tabsEnabled }) {
    const theme = useTheme()
    const isMobile = useMediaQuery('(max-width:768px)') // Adjust the breakpoint as needed

    // hoveredTab stores an object { index, anchorEl } or null
    const [hoveredTab, setHoveredTab] = useState(null)

    // Decide tooltip text based on the tab index.
    const getTooltipText = index => {
        if (index === 1) return 'Please complete the previous tab first.'
        return 'Please complete the previous tabs first.'
    }

    const handleMouseEnter = (event, index, isEnabled) => {
        // Only set our hoveredTab if this tab is NOT enabled.
        if (!isEnabled) {
            setHoveredTab({ index, anchorEl: event.currentTarget })
        }
    }

    const handleMouseLeave = (event, index, isEnabled) => {
        if (!isEnabled) {
            setHoveredTab(null)
        }
    }

    // Instead of disabling the tab via the "disabled" prop, we simulate a disabled look and prevent click actions.
    const handleTabClick = (event, index, isEnabled) => {
        if (!isEnabled) {
            // Prevent the Tab from being selected
            event.preventDefault()
            event.stopPropagation()
        }
    }

    return (
        <>
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant='fullWidth'
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                    position: 'relative',
                    '& .MuiTabs-scroller': {
                        backgroundColor: theme.palette.grey[200], // Background for inactive areas
                        border: '1px solid #d0d0d0',
                        borderRadius: '24px'
                    },
                    '& .MuiTabs-flexContainer': {
                        border: 'none'
                    },
                    ...customSx
                }}
            >
                {tabsFields?.map((tab, index) => {
                    // If tabsEnabled is not provided or empty we default to enabled (true)
                    const isEnabled = Array.isArray(tabsEnabled) && tabsEnabled.length > 0 ? tabsEnabled[index] : true

                    return (
                        <Tab
                            key={tab.label}
                            label={tab.label}
                            // Notice: we are NOT setting the disabled prop,
                            // so that the element still receives pointer events.
                            onClick={e => handleTabClick(e, index, isEnabled)}
                            onMouseEnter={e => handleMouseEnter(e, index, isEnabled)}
                            onMouseLeave={e => handleMouseLeave(e, index, isEnabled)}
                            sx={{
                                textTransform: 'none',
                                minHeight: '36px',
                                maxHeight: '36px',
                                height: '100%',
                                flex: 1,
                                padding: { xs: 1, sm: 0 },
                                margin: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontWeight: 600,
                                fontSize: { xs: '9px', sm: 'unset' },
                                color: `${
                                    activeTab === index
                                        ? `${theme.palette.primary.contrastText} !important`
                                        : theme.palette.text.primary
                                }`,
                                background: `${
                                    activeTab === index
                                        ? theme.palette.primary.main
                                        : 'linear-gradient(90deg, #d0d0d0, #e5e7eb)'
                                }`,
                                clipPath:
                                    // eslint-disable-next-line no-nested-ternary
                                    index === 0
                                        ? 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%)'
                                        : index === tabsFields.length - 1
                                          ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 10% 50%)'
                                          : 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%, 10% 50%)',
                                transition: 'background-color 0.3s, color 0.3s',
                                zIndex: index === activeTab ? 2 : 1,
                                '&:hover': {
                                    background: activeTab !== index && 'linear-gradient(90deg, #a4a4a4, #e5e7eb)',
                                    '& .MuiTab-iconWrapper': {
                                        transform: tab.icon && !isMobile && isEnabled ? 'scale(1.1)' : 'none'
                                    }
                                },
                                // Add transition for the icon wrapper
                                '& .MuiTab-iconWrapper': {
                                    transition: 'transform 0.2s ease-in-out'
                                },

                                // Style disabled-look for non-enabled tabs.
                                ...(!isEnabled && {
                                    cursor: 'default'
                                })
                            }}
                            icon={tab.icon && !isMobile ? tab.icon : null}
                            iconPosition='end'
                        />
                    )
                })}
            </Tabs>

            {/* Render the Popper tooltip independently so it won't affect the layout.
          Only show the tooltip if tabsEnabled is provided and non-empty.
      */}
            {hoveredTab && Array.isArray(tabsEnabled) && tabsEnabled.length > 0 && (
                <Popper
                    open={Boolean(hoveredTab)}
                    anchorEl={hoveredTab.anchorEl}
                    placement='bottom-end'
                    modifiers={[
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 4] // [horizontal, vertical]
                            }
                        }
                    ]}
                    style={{ zIndex: 9999 }}
                >
                    <Paper elevation={3} sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <WarningCircleIcon />
                        <Typography variant='caption'>{getTooltipText(hoveredTab.index)}</Typography>
                    </Paper>
                </Popper>
            )}
        </>
    )
}

export default MyTabs
