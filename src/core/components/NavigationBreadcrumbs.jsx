/* eslint-disable react/no-array-index-key */
import React, { useMemo } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { Breadcrumbs, Link, Typography, useMediaQuery, useTheme, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import House from '@mui/icons-material/House'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

// Helper: convert route segments into a more readable format
const formatLabel = str => {
    if (!str) return ''
    const spaced = str.replace(/(?<!\d)([A-Z])/g, ' $1').trim()
    return spaced
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function NavigationBreadcrumbs({ breadcrumbData }) {
    const theme = useTheme()
    const { pathname } = useLocation()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Utility: get the last segment's label from a path.
    // modified to show only "edit" or "view" if the path contains an ID after them
    const getLastSegmentLabel = path => {
        const segments = path.split('/').filter(Boolean)

        // Check if path contains edit, view, zones, picking followed by IDs
        const keywordIndex = segments.findIndex(seg => ['edit', 'view', 'zones', 'picking'].includes(seg))

        // If we found a keyword like 'edit', always return that formatted label
        // regardless of how many segments follow it
        if (keywordIndex !== -1) {
            return formatLabel(segments[keywordIndex])
        }

        // Otherwise return the last segment as before
        const lastSegment = segments.length ? segments[segments.length - 1] : ''
        return formatLabel(lastSegment)
    }

    // Use useMemo to prevent unnecessary recalculations
    const combinedCrumbs = useMemo(() => {
        // If no data, return empty array
        if (!breadcrumbData || Object.keys(breadcrumbData).length === 0) {
            return []
        }

        // Convert breadcrumbData object into an array and sort by depth (number of segments)
        const routesArray = Object.values(breadcrumbData).sort(
            (a, b) => a.path.split('/').filter(Boolean).length - b.path.split('/').filter(Boolean).length
        )

        // Build combined breadcrumb items
        const crumbs = []
        let pendingLabels = []

        routesArray.forEach((route, index) => {
            const currentLabel = getLastSegmentLabel(route.path)
            if (route.isAvailable) {
                // If we already have pending labels from an unavailable route,
                // merge them with this available route's label.
                if (pendingLabels.length > 0) {
                    pendingLabels.push(currentLabel)
                    crumbs.push({
                        path: route.path,
                        label: pendingLabels.join(' / '),
                        available: true
                    })
                    pendingLabels = []
                } else {
                    crumbs.push({
                        path: route.path,
                        label: currentLabel,
                        available: true
                    })
                }
            } else {
                // Not available: add the label to the "pending" group.

                // Avoid consecutive duplicate labels
                if (pendingLabels[pendingLabels.length - 1] !== currentLabel) {
                    pendingLabels.push(currentLabel)
                }

                // If this happens to be the last route, then create a crumb for these combined labels.
                if (index === routesArray.length - 1) {
                    crumbs.push({
                        path: route.path,
                        label: pendingLabels.join(' / '),
                        available: false
                    })
                    pendingLabels = []
                }
            }
        })

        // If for some reason pendingLabels remains (no available descendant was found),
        // append them as a plain text crumb.
        if (pendingLabels.length > 0) {
            crumbs.push({
                path: null,
                label: pendingLabels.join(' / '),
                available: false
            })
        }

        return crumbs
    }, [breadcrumbData])

    if (combinedCrumbs.length === 0 || pathname === '/' || pathname === '/dashboard') {
        return null
    }

    // Clean minimal styles matching the image
    const clickableStyle = {
        cursor: 'pointer',
        color: '#cdd5df', // Lighter gray for better readability
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: 300,
        transition: 'color 0.2s ease',
        '&:hover': {
            color: '#FFFFFF',
            textDecoration: 'underline',
            fontWeight: 400
        }
    }

    const currentPageStyle = {
        color: '#FFFFFF', // White for current page
        fontSize: '0.92rem',
        fontWeight: 500
    }

    const homeIconStyle = {
        color: '#ffffff',
        padding: theme.spacing(0.6),
        borderRadius: '8px',
        background: alpha('#ffffff', 0.1),
        border: `1px solid ${alpha('#ffffff', 0.15)}`,
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
            background: alpha('#ffffff', 0.18),
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px ${alpha('#000000', 0.15)}`
        }
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                padding: theme.spacing(1, 0),
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                paddingLeft: 0.5,
                '&::-webkit-scrollbar': {
                    display: 'none'
                },
                scrollbarWidth: 'none'
            }}
        >
            <Breadcrumbs
                aria-label='breadcrumb'
                separator={
                    <NavigateNextIcon
                        fontSize='small'
                        sx={{
                            color: '#6B7280', // Slightly darker gray for separators
                            mx: 0.25
                        }}
                    />
                }
                sx={{
                    color: '#9CA3AF',
                    '& .MuiBreadcrumbs-ol': {
                        alignItems: 'center'
                    }
                }}
            >
                {/* Home icon */}
                <Link key='home' component={RouterLink} to='/dashboard' underline='none' sx={homeIconStyle}>
                    <House fontSize='medium' />
                </Link>

                {/* Breadcrumb items */}
                {(isMobile ? combinedCrumbs.slice(-1) : combinedCrumbs).map((crumb, idx, array) => {
                    const isLast = idx === array.length - 1
                    const mobileLabel = crumb.label.split(' / ').pop()
                    const displayLabel = isMobile ? mobileLabel : crumb.label

                    const mobileStyle = isMobile
                        ? {
                              maxWidth: '90px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                          }
                        : {}

                    if (!isLast && crumb.available && crumb.path) {
                        return (
                            <Link
                                key={idx}
                                component={RouterLink}
                                to={crumb.path}
                                underline='none'
                                sx={{ ...clickableStyle, ...mobileStyle }}
                            >
                                {displayLabel}
                            </Link>
                        )
                    }
                    return (
                        <Typography key={idx} sx={{ ...currentPageStyle, ...mobileStyle }}>
                            {displayLabel}
                        </Typography>
                    )
                })}
            </Breadcrumbs>
        </Box>
    )
}

export default NavigationBreadcrumbs
