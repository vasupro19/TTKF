/* eslint-disable */
import React from 'react'
import { Sidebar, Menu, MenuItem, Submenu } from 'react-mui-sidebar'
import { Box, Drawer, Typography } from '@mui/material'
import CustomImage from '@/core/components/CustomImage'
import cerebrumLogo from '@assets/images/auth/Cerebrum_logo_final_white.png'
import menuItems from '@/app/layouts/header/menuItems'

function SidebarMenu({ open, onClose }) {
    const renderMenuItems = (items, level = 0) => {
        return items.map(item => {
            const isChildLevel = level > 1 // Adjust this based on the hierarchy you want to style

            if (item.type === 'item') {
                return (
                    <MenuItem
                        key={item.id}
                        link={item.path || '#'}
                        icon={
                            <item.icon
                                sx={
                                    isChildLevel
                                        ? {
                                              color: 'text.primary',
                                              paddingLeft: `${level * 4}px !important`,
                                              fontSize: '28px'
                                          }
                                        : {}
                                }
                                style={
                                    isChildLevel &&
                                    ['item_category_mapping', 'pallet', 'bucket_config'].includes(item.id)
                                        ? { marginLeft: `${level * 4}px`, position: 'relative', fontSize: '28px' }
                                        : {}
                                }
                            />
                        }
                    >
                        <Typography sx={isChildLevel ? { color: 'text.primary' } : {}}>{item.label}</Typography>
                    </MenuItem>
                )
            }

            if (item.type === 'collapse') {
                return (
                    <Submenu
                        key={item.id}
                        title={item.label}
                        icon={
                            <item.icon
                                sx={
                                    isChildLevel
                                        ? { color: 'text.primary', paddingLeft: `${level * 4}px`, fontSize: '28px' }
                                        : {}
                                }
                                style={
                                    isChildLevel && ['storage_location', 'masterPallets'].includes(item.id)
                                        ? { marginLeft: '8px', position: 'relative', fontSize: '28px' }
                                        : {}
                                }
                            />
                        }
                    >
                        {renderMenuItems(item.children || [], level + 1)}
                    </Submenu>
                )
            }

            return null
        })
    }

    return (
        <Drawer anchor='left' open={open} onClose={onClose} sx={{ display: { xs: 'block', sm: 'none' } }}>
            <Sidebar width={'340px'} themeColor={'#2c2c2c'} themeSecondaryColor={'#45484c'} showProfile={false}>
                <CustomImage
                    src={cerebrumLogo}
                    alt='Cerebrum Logo'
                    styles={{
                        width: '340px',
                        backgroundColor: 'primary.main'
                    }}
                />
                {menuItems.map(menu => (
                    <Menu
                        key={menu.id}
                        subHeading={
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%'
                                }}
                            >
                                <Typography
                                    variant='h4'
                                    sx={{
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {menu.label}
                                </Typography>
                                <Box sx={{ flex: 1, height: '1px', backgroundColor: '#e2e2e2', marginLeft: '8px' }} />
                            </Box>
                        }
                    >
                        {renderMenuItems(menu.children || [], 1)}
                    </Menu>
                ))}
            </Sidebar>
        </Drawer>
    )
}

export default SidebarMenu
