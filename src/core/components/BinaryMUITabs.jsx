/* eslint-disable react/forbid-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import { Box, Tabs, Tab } from '@mui/material'

/**
 * A binary tab component using MUI Tabs.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.labels - Array of tab labels.
 * @param {number} props.tabIndex - Index of the active tab.
 * @param {function} props.onTabChange - Callback function triggered on tab change.
 * @param {Object} [props.customSx={}] - Custom styles applied to both tabs.
 * @param {Object} [props.customSxTab1={}] - Custom styles specifically for the first tab.
 * @param {Object} [props.customSxTab2={}] - Custom styles specifically for the second tab.
 * @returns {JSX.Element} The rendered BinaryMUITabs component.
 */
export default function BinaryMUITabs({
    labels,
    tabIndex,
    onTabChange,
    customSx = {},
    customSxTab1 = {},
    customSxTab2 = {}
}) {
    return (
        <Box>
            {/* Tabs header */}
            <Tabs
                value={tabIndex}
                onChange={onTabChange}
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{
                    minHeight: '30px !important',
                    padding: '0px',
                    alignItems: 'center',
                    '& .MuiTabs-flexContainer': {
                        borderBottom: '0px'
                    }
                }}
            >
                {labels.map((label, index) => (
                    <Tab
                        key={index} // eslint-disable-line react/no-array-index-key
                        label={label}
                        sx={{
                            backgroundColor: tabIndex === index ? 'primary.main' : '#fff',
                            color: tabIndex === index ? '#fff !important' : 'text.primary',
                            fontWeight: 'bold',
                            border: '1px solid #ccc',
                            borderRadius: index === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                            padding: '6px 20px',
                            minHeight: '36px !important',
                            marginRight: index === 0 ? '-1px' : '0px',
                            '&:hover': {
                                backgroundColor: tabIndex === index ? 'primary.dark' : '#f5f5f5',
                                color: tabIndex !== index && 'primary.dark'
                            },
                            ...customSx,
                            ...(index === 0 ? customSxTab1 : customSxTab2)
                        }}
                    />
                ))}
            </Tabs>
        </Box>
    )
}

BinaryMUITabs.propTypes = {
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    tabIndex: PropTypes.number.isRequired,
    onTabChange: PropTypes.func.isRequired,
    customSx: PropTypes.object,
    customSxTab1: PropTypes.object,
    customSxTab2: PropTypes.object
}
