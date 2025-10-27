import React, { useState } from 'react'

// ** import from mui
import { Box, Typography, List, ListItem, ListItemText, Tooltip } from '@mui/material'

import PropTypes from 'prop-types'

// ** import icons
import ExpandMore from '@mui/icons-material/ExpandMore'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { ArrowCircleLeftOutlined } from '@mui/icons-material'
import LockIcon from '@mui/icons-material/Lock'

// ** import third party libs
import { motion } from 'framer-motion'

// ** import from redux
import { useDispatch, useSelector } from 'react-redux'
import { toggleNavBar } from '@app/store/slices/navBarSlice'

// ** import custom components
import { ROLES } from '@/constants'
import { useNavigate } from 'react-router-dom'
import DisabledWrapper from '../DisabledWrapper'

function MenuListView({ title, isVisible, setIsVisible, mainListItems }) {
    console.log(mainListItems)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { menuAccess, user, selectedLocation, masterAdminAllowedRoutes } = useSelector(state => state.auth)
    // const [activeItem, setActiveItem] = useState(
    //     mainListItems?.children?.[0]?.id &&
    //         !mainListItems?.children?.[0]?.isDisabled &&
    //         mainListItems?.children?.[0]?.type === 'collapse'
    //         ? mainListItems?.children?.[0]?.id
    //         : null
    // )

    // Module menu permission fn
    const isAllowedToNavigate = id => {
        if (
            (menuAccess.has(id) && selectedLocation) ||
            (user && user.role_id === ROLES.MASTER_ADMIN && !selectedLocation && masterAdminAllowedRoutes.has(id))
        )
            return true
        return false // TODO:: change this to false after implementing the actual permission logic/ fixing roles & permissions
    }

    const [activeItem, setActiveItem] = useState(
        mainListItems?.children?.[0]?.id &&
            isAllowedToNavigate(mainListItems?.children?.[0]?.id) &&
            mainListItems?.children?.[0]?.type === 'collapse'
            ? mainListItems?.children?.[0]?.id
            : null
    )

    const [activeSubItem, setActiveSubItem] = useState(null)
    const handleItemClick = (id, type, path) => {
        if (type === 'item' && path) {
            // Open the path in a new blank window
            navigate(path)
            // window.open(path, '_blank') // '_blank' opens in a new tab or window
            dispatch(toggleNavBar())
            return
        }
        setActiveItem(prev => (prev === id ? null : id))
        setActiveSubItem(null)
    }

    const handleSubItemClick = (index, type, path) => {
        if (type === 'item' && path) {
            // navigate(path)
            // Open the path in a new blank window
            window.open(path, '_blank') // '_blank' opens in a new tab or window
            dispatch(toggleNavBar())
            return
        }
        setActiveSubItem(prev => (prev === index ? null : index))
    }

    const commonListItemStyles = {
        backgroundColor: 'primary.main',
        color: '#fff',
        borderRadius: '8px',
        '&:hover': {
            backgroundColor: 'primary.dark'
        }
    }

    const subListItemActiveStyles = {
        backgroundColor: 'primary.main',
        color: '#fff',
        '& .MuiListItemText-primary': {
            color: '#fff'
        },
        '&:hover': {
            backgroundColor: 'primary.dark',
            color: '#fff'
        }
    }

    const subListItemStyles = {
        backgroundColor: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        gap: '6px'
    }

    return (
        <Box sx={{ width: '100%', padding: 1.5 }}>
            <Box>
                <motion.div
                    className='sliding-box'
                    initial={{ x: '100vw' }}
                    animate={{ x: isVisible ? 0 : '100vw' }}
                    transition={{
                        type: 'tween',
                        duration: 0.5,
                        ease: 'easeInOut'
                    }}
                    style={{
                        display: 'flex',
                        gap: 4
                    }}
                >
                    <Tooltip title='Main menu'>
                        <ArrowCircleLeftOutlined
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                                setIsVisible(false)
                            }}
                        />
                    </Tooltip>

                    <Typography
                        variant='h3'
                        color='text.primary'
                        sx={{
                            textTransform: 'capitalize'
                        }}
                        gutterBottom
                    >
                        {title}
                    </Typography>
                </motion.div>
            </Box>
            <Box borderTop='1px solid black' mb={1} />

            <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <Box sx={{ flexBasis: '300px' }}>
                    <List component='nav' aria-label='main mailbox folders'>
                        {mainListItems.children.map(item => (
                            <DisabledWrapper key={item.id}>
                                <ListItem
                                    button
                                    onClick={() => handleItemClick(item?.id, item?.type, item.url)}
                                    sx={{
                                        display: 'flex',
                                        gap: '6px',
                                        borderRadius: '6px',
                                        padding: '6px 16px',
                                        '&:hover': {
                                            backgroundColor: '#e3e3e3'
                                        },
                                        marginY: '1px',
                                        ...(activeItem === item.id && commonListItemStyles)
                                    }}
                                >
                                    <item.icon />
                                    <ListItemText
                                        primary={item.label}
                                        // secondary={
                                        //     // menuAccess &&
                                        //     // !isAllowedToNavigate(item.id) && (

                                        //     //     )
                                        // }
                                        sx={{
                                            ...(activeItem === item.id && {
                                                '& .MuiListItemText-primary': { color: 'white' }
                                            }),
                                            display: 'flex',
                                            gap: '2px',
                                            justifyContent: 'start',
                                            alignItems: 'center'
                                        }}
                                    />
                                    {item.children && (activeItem === item.id ? <ChevronRight /> : <ExpandMore />)}
                                </ListItem>
                            </DisabledWrapper>
                        ))}
                    </List>
                </Box>

                {/* Sub Menu Items */}
                {activeItem && mainListItems.children.find(item => item.id === activeItem)?.children && (
                    <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                        <Box
                            sx={{
                                flexBasis: '200px',
                                backgroundColor: '#e3e3e3',
                                padding: '10px',
                                borderRadius: '8px',
                                minWidth: 'max-content'
                            }}
                        >
                            <List component='nav'>
                                {mainListItems.children
                                    .find(item => item.id === activeItem)
                                    .children.map((subItem, index) => (
                                        <DisabledWrapper
                                            key={subItem?.id}
                                            isDisabled={menuAccess && !isAllowedToNavigate(subItem.id)}
                                        >
                                            <ListItem
                                                button
                                                onClick={() => handleSubItemClick(index, subItem?.type, subItem?.path)}
                                                sx={{
                                                    ...subListItemStyles,
                                                    ...(activeSubItem === index && subListItemActiveStyles),
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    borderRadius: '6px'
                                                }}
                                            >
                                                <subItem.icon />
                                                <ListItemText
                                                    primary={subItem.label}
                                                    // secondary={
                                                    //     // menuAccess &&
                                                    //     // !isAllowedToNavigate(subItem.id) && (
                                                    //     <Tooltip title='No access'>
                                                    //         <LockIcon
                                                    //             sx={{
                                                    //                 zIndex: 2, // Ensure it is above the overlay
                                                    //                 color: 'primary.dark',
                                                    //                 display: 'flex',
                                                    //                 justifyContent: 'center',
                                                    //                 alignItems: 'center'
                                                    //             }}
                                                    //         />
                                                    //     </Tooltip>
                                                    //     // )
                                                    // }
                                                    sx={{
                                                        display: 'flex',
                                                        gap: '2px',
                                                        justifyContent: 'start',
                                                        alignItems: 'center'
                                                    }}
                                                />
                                                {subItem.children &&
                                                    (activeSubItem === index ? <ChevronRight /> : <ExpandMore />)}
                                            </ListItem>
                                        </DisabledWrapper>
                                    ))}
                            </List>
                        </Box>

                        {activeSubItem !== null &&
                            mainListItems.children.find(item => item.id === activeItem).children[activeSubItem]
                                .children && (
                                <Box
                                    sx={{
                                        flexBasis: '200px',
                                        backgroundColor: '#ececec',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        minWidth: 'max-content'
                                    }}
                                >
                                    <List component='nav'>
                                        {mainListItems.children
                                            .find(item => item.id === activeItem)
                                            .children[activeSubItem].children.map(nestedItem => (
                                                <DisabledWrapper
                                                    key={nestedItem?.id}
                                                    isDisabled={menuAccess && !isAllowedToNavigate(nestedItem.id)}
                                                >
                                                    <ListItem
                                                        onClick={() => {
                                                            // Check if the nestedItem has a URL
                                                            if (nestedItem?.type === 'item' && nestedItem?.path) {
                                                                // Open the path in a new tab
                                                                window.open(nestedItem.path, '_blank') // Opens in a new tab or window
                                                                dispatch(toggleNavBar()) // Toggles the navigation bar
                                                            }
                                                            // Set active nested sub-item based on the nested item id
                                                        }}
                                                        sx={{
                                                            ...subListItemStyles,
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            borderRadius: '6px',

                                                            '&:hover': {
                                                                backgroundColor: '#e3e3e3'
                                                            }
                                                        }}
                                                    >
                                                        <nestedItem.icon />
                                                        <ListItemText
                                                            primary={nestedItem.label}
                                                            // secondary={
                                                            //     // menuAccess &&
                                                            //     // !isAllowedToNavigate(nestedItem.id) && (
                                                            //     <Tooltip title='No access'>
                                                            //         <LockIcon
                                                            //             sx={{
                                                            //                 zIndex: 2, // Ensure it is above the overlay
                                                            //                 color: 'primary.dark',
                                                            //                 display: 'flex',
                                                            //                 justifyContent: 'center',
                                                            //                 alignItems: 'center'
                                                            //             }}
                                                            //         />
                                                            //     </Tooltip>
                                                            //     // )
                                                            // }
                                                            sx={{
                                                                display: 'flex',
                                                                gap: '2px',
                                                                justifyContent: 'start',
                                                                alignItems: 'center'
                                                            }}
                                                        />
                                                    </ListItem>
                                                </DisabledWrapper>
                                            ))}
                                    </List>
                                </Box>
                            )}
                    </Box>
                )}
            </Box>
        </Box>
    )
}

// Define PropTypes for MenuListView
MenuListView.propTypes = {
    title: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
    setIsVisible: PropTypes.func.isRequired,
    /* eslint-disable react/forbid-prop-types */
    mainListItems: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
}

export default MenuListView
