import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography, Grid, FormControlLabel, Checkbox, Button, Paper, styled, Divider } from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useDispatch } from 'react-redux'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptIcon from '@mui/icons-material/Receipt'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import InputIcon from '@mui/icons-material/Input'
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CheckIcon from '@mui/icons-material/Check'
import ArchiveIcon from '@mui/icons-material/Archive'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import DescriptionIcon from '@mui/icons-material/Description'
import InboxIcon from '@mui/icons-material/Inbox'
import StoreIcon from '@mui/icons-material/Store'
import CategoryIcon from '@mui/icons-material/Category'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import TuneIcon from '@mui/icons-material/Tune'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import PeopleIcon from '@mui/icons-material/People'
import BusinessIcon from '@mui/icons-material/Business'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BuildIcon from '@mui/icons-material/Build'
import InventoryIcon from '@mui/icons-material/Inventory'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import BuildCircleIcon from '@mui/icons-material/BuildCircle'
import NotificationsIcon from '@mui/icons-material/Notifications'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import AddIcon from '@mui/icons-material/Add'
import QrCodeIcon from '@mui/icons-material/QrCode'
import PropTypes from 'prop-types'
import { objectLength } from '@/utilities'
import CustomButton from '@/core/components/extended/CustomButton'

// static data for permissions
const permissionsStructure = {
    inbound: {
        label: 'Inbound',
        icon: LocalShippingIcon, // Example icon for inbound category
        items: {
            purchaseOrder: { label: 'Purchase Order', icon: ReceiptIcon },
            asn: { label: 'ASN', icon: AssignmentIcon },
            gateEntry: { label: 'Gate Entry', icon: VpnKeyIcon },
            grn: { label: 'GRN', icon: LibraryBooksIcon },
            putaway: { label: 'Putaway', icon: InputIcon }
        }
    },
    outbound: {
        label: 'Outbound',
        icon: FlightTakeoffIcon,
        items: {
            saleOrder: { label: 'Sale Order', icon: ShoppingCartIcon },
            pick: { label: 'Pick', icon: CheckIcon },
            pack: { label: 'Pack', icon: ArchiveIcon },
            handover: { label: 'Handover', icon: SwapHorizIcon },
            invoicing: { label: 'Invoicing', icon: RequestQuoteIcon },
            manifest: { label: 'Manifest', icon: DescriptionIcon },
            ship: { label: 'Ship', icon: LocalShippingIcon }
        }
    },
    inventory: {
        label: 'Inventory',
        icon: InboxIcon,
        items: {
            storageWiseInventory: { label: 'Storage Wise Inventory', icon: StoreIcon },
            completeInventory: { label: 'Complete Inventory', icon: CategoryIcon },
            itemMovement: { label: 'Item Movement', icon: SyncAltIcon },
            palletMovement: { label: 'Pallet Movement', icon: LocalShippingIcon },
            adjustment: { label: 'Adjustment', icon: TuneIcon },
            cycleCount: { label: 'Cycle Count', icon: RotateRightIcon },
            kittingBundling: { label: 'Kitting / Bundling', icon: CategoryIcon }
        }
    },
    admin: {
        label: 'Admin',
        icon: AdminPanelSettingsIcon,
        items: {
            userManagement: { label: 'User Management', icon: PeopleIcon, children: ['Create User', 'Create Role'] },
            client: { label: 'Client', icon: BusinessIcon, children: ['Master Client', 'Client Config'] },
            location: { label: 'Location', icon: LocationOnIcon }
        }
    },
    master: {
        label: 'Master',
        icon: BuildIcon,
        items: {
            skuMaster: {
                label: 'SKU Master',
                icon: InventoryIcon,
                children: ['Create SKU', 'EAN Mapping', 'UOM', 'Category']
            },
            warehouseMaster: {
                label: 'Warehouse Master',
                icon: WarehouseIcon,
                children: ['Pallet Id', 'Bin Master', 'Storage Location']
            },
            courierMaster: {
                label: 'Courier Master',
                icon: LocalShippingIcon,
                children: ['Create Courier', 'Courier Config', 'Docket Reservoir']
            },
            vendorMaster: { label: 'Vendor Master', icon: StoreIcon },
            customerMaster: { label: 'Customer Master', icon: PeopleIcon }
        }
    },
    tool: {
        label: 'Tool',
        icon: BuildCircleIcon,
        items: {
            notification: {
                label: 'Notification',
                icon: NotificationsIcon,
                children: ['Notification Setup', 'Notification Log']
            },
            tracking: {
                label: 'Tracking',
                icon: TrackChangesIcon,
                children: ['Status NSL Mapping', 'Manual Tracking Update']
            },
            rosterManagement: { label: 'Roster Management', icon: CalendarTodayIcon },
            ticketingModule: { label: 'Ticketing Module', icon: ConfirmationNumberIcon },
            approval: { label: 'Approval', icon: ThumbUpIcon },
            addNSLCode: { label: 'Add NSL Code', icon: AddIcon },
            barcode: { label: 'Barcode', icon: QrCodeIcon }
        }
    }
}
let valuesToSubmit = {}
function PermissionCheckboxGroup({
    handleSubmitAll,
    permissionsAndAccess,
    modulePermissions,
    createRoleMenuPermissionsLKey,
    getRolePermissionsAndAccessForEditLKey
}) {
    // eslint-disable-next-line no-unused-vars
    const { id: roleId } = useParams()

    const dispatch = useDispatch()
    // eslint-disable-next-line no-unused-vars
    const [menus, setMenus] = useState([])
    // const [access, setAccess] = useState({})
    const [canSelect, setCanSelect] = useState(false)
    // eslint-disable-next-line no-unused-vars
    const [permissions, setPermissions] = useState(
        Object.keys(permissionsStructure).reduce((acc, section) => {
            acc[section] = {}
            Object.keys(permissionsStructure[section].items).forEach(item => {
                const hasChildren = permissionsStructure[section].items[item].children
                acc[section][item] = hasChildren
                    ? {
                          checked: false,
                          children: hasChildren.reduce((childAcc, child) => ({ ...childAcc, [child]: false }), {})
                      }
                    : false
            })
            return acc
        }, {})
    )

    const [tempPermission, setTempPermission] = useState(null)
    // here uncomment to make dark theme cards
    const StyledCheckbox = styled(Checkbox)(() => ({
        paddingTop: '2px',
        paddingBottom: '2px'
        // color: '#fff',
        // '&.Mui-checked': {
        //     color: '#fff' // selected color
        // }
    }))

    // const handleParentChange = (section, item) => {
    //     console.log('section ', section, 'item ', item)

    //     setPermissions(prev => {
    //         const newSection = { ...prev[section] }
    //         const itemData = permissionsStructure[section].items[item]
    //         if (itemData.children) {
    //             const newChildren = Object.keys(newSection[item].children).reduce(
    //                 (acc, child) => ({ ...acc, [child]: !newSection[item].access }),
    //                 {}
    //             )
    //             newSection[item] = { access: !newSection[item].access, children: newChildren }
    //         } else {
    //             newSection[item] = !newSection[item]
    //         }
    //         return { ...prev, [section]: newSection }
    //     })
    // }
    const checkCanSelect = () => {
        if (!canSelect) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please select at least one module access first.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return false
        }
        return true
    }
    const checkUserAccess = (access = []) => {
        if (!access.filter(Boolean).length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'You do not have access to change this permission.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return false
        }
        return true
    }

    const updateChildren = (parentChecked, children) => {
        const spreadChildren = { ...children }
        if (spreadChildren && Object.keys(spreadChildren).length)
            Object.keys(spreadChildren).map(key => {
                const childAccess = spreadChildren[key].user_access === false ? false : parentChecked
                spreadChildren[key].access = childAccess
                if (spreadChildren[key]?.children && Object.keys(spreadChildren[key]?.children).length)
                    spreadChildren[key].children = updateChildren(childAccess, spreadChildren[key].children)
                return key
            })

        return spreadChildren
    }

    const handleParentChange = (section, item) => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const newParent = { ...newSection.children[item] }
            const parentAccess = !newParent.access
            newSection.access = newSection.access || parentAccess
            newParent.access = parentAccess

            if (!checkUserAccess([newSection.user_access, newParent.user_access])) return prev

            if (newParent?.children && Object.keys(newParent?.children).length)
                newParent.children = updateChildren(parentAccess, newParent?.children)

            newSection.children[item] = newParent
            newSection.access = Object.values(newSection.children).some(p => p.access)

            return { ...prev, [section]: newSection }
        })
    }

    // const handleChildChange = (section, item, child) => {
    //     console.log('section ', section, 'item ', item, 'child ', child)
    //     setTempPermission(prev => {
    //         const newSection = { ...prev[section] }
    //         console.log('newSection handleChildChange ', newSection)
    //         // Toggle the specific child checkbox
    //         newSection[item].children[child] = !newSection[item].children[child]

    //         // Update the item checkbox based on child checkboxes
    //         newSection[item].access = Object.values(newSection[item].children).some(Boolean)

    //         // Determine if the entire section should be checked (if all items are selected or partially selected)
    //         const allItemsChecked = Object.values(newSection).every(
    //             subItem => (typeof subItem === 'object' && subItem.access) || subItem === true
    //         )

    //         // Set the section checked state based on all items' status
    //         return { ...prev, [section]: newSection, [section]: { ...newSection, access: allItemsChecked } }
    //     })
    // }

    // const handleSectionChange = section => {
    //     setPermissions(prev => {
    //         const newSection = { ...prev[section] }

    //         // Determine whether to activate or deactivate the section
    //         const shouldActivate = !Object.values(newSection).some(item =>
    //             typeof item === 'object' ? item.access : item
    //         )

    //         Object.keys(newSection).forEach(item => {
    //             const itemData = permissionsStructure[section]?.items[item]
    //             if (itemData?.children) {
    //                 // Set each child to the value of shouldActivate
    //                 const newChildren = Object.keys(newSection[item]?.children).reduce(
    //                     (acc, child) => ({ ...acc, [child]: shouldActivate }),
    //                     {}
    //                 )
    //                 // Set item to shouldActivate and update its children
    //                 newSection[item] = { access: shouldActivate, children: newChildren }
    //             } else {
    //                 // Set item directly to shouldActivate
    //                 newSection[item] = shouldActivate
    //             }
    //         })

    //         return { ...prev, [section]: newSection }
    //     })
    // }

    const handleChildChange = (section, item, child) => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const newParent = { ...newSection.children[item] }
            const newChild = { ...newSection.children[item].children[child] }

            const childAccess = !newChild.access
            newChild.access = childAccess
            newParent.access = newChild.access || childAccess
            newSection.access = newSection.access || childAccess

            if (!checkUserAccess([newSection.user_access, newParent.user_access, newChild.user_access])) return prev

            if (newChild?.children && Object.keys(newChild?.children).length)
                newChild.children = updateChildren(childAccess, newChild?.children)

            newParent.children[child] = newChild
            newSection.children[item] = newParent

            newParent.access = Object.values(newParent.children).some(c => c.access)
            newSection.access = Object.values(newSection.children).some(p => p.access)

            return { ...prev, [section]: newSection }
        })
    }

    const handleSectionChange = section => {
        if (!checkCanSelect()) return
        setTempPermission(prev => {
            const newSection = { ...prev[section] }
            const sectionAccess = !newSection.access
            newSection.access = sectionAccess

            if (!checkUserAccess([newSection.user_access])) return prev
            if (newSection?.children) newSection.children = updateChildren(sectionAccess, newSection?.children)

            return { ...prev, [section]: newSection }
        })
    }

    const setDataToSubmit = data => {
        Object.values(data).map(values => {
            if (values.access) valuesToSubmit[values.code] = values.id.toString()
            if (values.children && Object.keys(values.children)) {
                setDataToSubmit(values.children)
            }
            return values
        })
        return valuesToSubmit
    }

    const handleSubmit = () => {
        valuesToSubmit = {}

        const formData = setDataToSubmit(tempPermission)

        if (!Object.keys(formData).length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'You must enable at least one permission to submit.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            return
        }

        handleSubmitAll(formData)
    }

    const getPermissionObjects = menu => {
        if (!menu || !menu.length) return {}
        const permissionObject = menu.reduce((acc, item) => {
            acc[item.menu_code] = {
                label: item.display_name,
                user_access: modulePermissions === false ? false : item.user_access,
                id: item.id,
                access: !!item?.selected_role_access,
                code: item.menu_code
            }
            const children = getPermissionObjects(item?.child)
            acc[item.menu_code].children = children
            return acc
        }, {})
        return permissionObject
    }

    useEffect(() => {
        if (permissionsAndAccess && objectLength(permissionsAndAccess) === 2) {
            setMenus(permissionsAndAccess.menus)
            setTempPermission(getPermissionObjects(permissionsAndAccess.menus))
        }
        if (modulePermissions && objectLength(modulePermissions))
            setCanSelect(Object.values(modulePermissions).reduce((acc, moduleAccess) => acc || moduleAccess, false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permissionsAndAccess, modulePermissions])

    return (
        // <Box p={1.5} sx={{ borderRadius: '8px', border: '1px solid #e2e2e2', backgroundColor: '#ececec' }}>
        //     <Grid container spacing={1.2}>
        //         {Object.entries(permissionsStructure).map(([section, sectionData]) => (
        //             <Grid item xs={12} md={4} key={section} sx={{ display: 'flex', flexDirection: 'column' }}>
        //                 {/* here uncomment to make dark theme cards */}
        //                 <Paper
        //                     elevation={3}
        //                     sx={{
        //                         padding: 2,
        //                         flex: 1,
        //                         // backgroundColor: '#3c3c44',
        //                         borderRadius: '8px'
        //                         // color: '#fff'
        //                     }}
        //                 >
        //                     <Box display='flex' alignItems='center' mb={1}>
        //                         <FormControlLabel
        //                             control={
        //                                 <StyledCheckbox
        //                                     checked={Object.values(permissions[section]).some(
        //                                         item => item.checked || item === true
        //                                     )}
        //                                     onChange={() => handleSectionChange(section)}
        //                                     size='small'
        //                                 />
        //                             }
        //                             label={
        //                                 <Typography
        //                                     variant='h4'
        //                                     fontWeight='700'
        //                                     // here uncomment to make dark theme cards
        //                                     sx={{
        //                                         // color: '#fff',
        //                                         display: 'flex',
        //                                         alignItems: 'center',
        //                                         gap: 1
        //                                     }}
        //                                 >
        //                                     {sectionData.label}
        //                                     {sectionData.icon && (
        //                                         <sectionData.icon sx={{ mr: 1, fontSize: '18px' }} />
        //                                     )}{' '}
        //                                     {/* Render the icon here */}
        //                                 </Typography>
        //                             }
        //                         />
        //                     </Box>
        //                     <Box
        //                         sx={{
        //                             '&::before, &::after': {
        //                                 display: 'none' // Removes default lines on either side
        //                             },
        //                             boxShadow: '1px 2px 7px 0px #11182754',
        //                             backgroundColor: '#a1a1aa',
        //                             height: '0.5px'
        //                         }}
        //                     >
        //                         {' '}
        //                     </Box>
        //                     {Object.entries(sectionData.items).map(([itemKey, itemData]) => (
        //                         <Box key={itemKey} sx={{ pl: 2 }}>
        //                             <FormControlLabel
        //                                 control={
        //                                     <StyledCheckbox
        //                                         checked={
        //                                             itemData.children
        //                                                 ? permissions[section][itemKey].checked
        //                                                 : permissions[section][itemKey]
        //                                         }
        //                                         onChange={() => handleParentChange(section, itemKey)}
        //                                         size='small'
        //                                     />
        //                                 }
        //                                 label={
        //                                     <Typography
        //                                         sx={{
        //                                             // color: '#fff',
        //                                             fontWeight: '500',
        //                                             fontSize: '14px',
        //                                             display: 'flex',
        //                                             alignItems: 'center',
        //                                             gap: 1
        //                                         }}
        //                                     >
        //                                         {itemData.label}
        //                                         {itemData.icon && (
        //                                             <itemData.icon sx={{ mr: 1, fontSize: '18px' }} />
        //                                         )}{' '}
        //                                         {/* Render the icon here */}
        //                                     </Typography>
        //                                 }
        //                                 sx={{
        //                                     marginY: '4px',
        //                                     // borderBottom: '0.4px solid #e2e2e2',
        //                                     width: '100%'
        //                                 }}
        //                             />
        //                             {itemData.children && (
        //                                 <Grid
        //                                     container
        //                                     spacing={1}
        //                                     sx={{
        //                                         ml: 3.4,
        //                                         pl: 1,
        //                                         width: 'auto'
        //                                         // here uncomment to make dark theme cards
        //                                         // backgroundColor: '#ececec5c',
        //                                         // borderTop: '1px solid #ececec',
        //                                         // borderLeft: '1px solid #ececec',
        //                                         // borderTopRightRadius: '8px',
        //                                         // borderBottomRightRadius: '8px',
        //                                     }}
        //                                 >
        //                                     {itemData.children.map(child => (
        //                                         <FormControlLabel
        //                                             key={child}
        //                                             control={
        //                                                 <StyledCheckbox
        //                                                     checked={permissions[section][itemKey].children[child]}
        //                                                     onChange={() => handleChildChange(section, itemKey, child)}
        //                                                     size='small'
        //                                                 />
        //                                             }
        //                                             label={child}
        //                                             sx={{ marginY: '2px' }}
        //                                         />
        //                                     ))}
        //                                 </Grid>
        //                             )}
        //                             <Divider
        //                                 sx={{
        //                                     '&::before, &::after': {
        //                                         display: 'none' // Removes default lines on either side
        //                                     },
        //                                     boxShadow: '0px 2px 4px #ffffff45', // Subtle shadow
        //                                     backgroundColor: 'gray', // Line color
        //                                     height: '0.2px' // Line thickness
        //                                 }}
        //                             />
        //                         </Box>
        //                     ))}
        //                 </Paper>
        //             </Grid>
        //         ))}
        //     </Grid>

        //     <Box mt={4} display='flex' justifyContent='flex-end'>
        //         <Button variant='contained' color='primary' onClick={handleSubmit}>
        //             Submit
        //         </Button>
        //     </Box>
        // </Box>
        <Box p={1.5} sx={{ borderRadius: '8px', border: '1px solid #e2e2e2', backgroundColor: '#ececec' }}>
            <Grid container spacing={1.2}>
                {tempPermission &&
                    Object.entries(tempPermission).map(([section, sectionData]) => (
                        <Grid item xs={12} md={4} key={section} sx={{ display: 'flex', flexDirection: 'column' }}>
                            {/* here uncomment to make dark theme cards */}
                            <Paper
                                elevation={3}
                                sx={{
                                    padding: 2,
                                    flex: 1,
                                    // backgroundColor: '#3c3c44',
                                    borderRadius: '8px'
                                    // color: '#fff'
                                }}
                            >
                                <Box display='flex' alignItems='center' mb={1}>
                                    <FormControlLabel
                                        control={
                                            <StyledCheckbox
                                                // checked={Object.values(tempPermission[section]).some(
                                                //     item => item.access || item === true
                                                // )}
                                                checked={sectionData?.access}
                                                disabled={!sectionData?.user_access}
                                                onChange={() => handleSectionChange(section)}
                                                size='small'
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant='h4'
                                                fontWeight='700'
                                                // here uncomment to make dark theme cards
                                                sx={{
                                                    // color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    color: !sectionData?.user_access ? 'text.disabled' : 'inherit'
                                                }}
                                            >
                                                {sectionData?.label}
                                                {sectionData?.icon && (
                                                    <sectionData.icon sx={{ mr: 1, fontSize: '18px' }} />
                                                )}{' '}
                                                {/* Render the icon here */}
                                            </Typography>
                                        }
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        '&::before, &::after': {
                                            display: 'none' // Removes default lines on either side
                                        },
                                        boxShadow: '1px 2px 7px 0px #11182754',
                                        backgroundColor: '#a1a1aa',
                                        height: '0.5px'
                                    }}
                                >
                                    {' '}
                                </Box>
                                {/* adding new parent box to handle scrollbar and boxShadow */}
                                <Box
                                    sx={{
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        maxHeight: '260px',
                                        height: '100%',
                                        boxShadow:
                                            Object.entries(sectionData?.children)?.length > 3
                                                ? 'inset 0px -10px 9px -8px rgb(0 0 0 / 14%)'
                                                : 'none',
                                        transition: 'box-shadow 0.2s',
                                        border: 'none' // Ensures no borders are mistakenly visible
                                    }}
                                >
                                    {Object.entries(sectionData?.children).map(([itemKey, itemData]) => (
                                        <Box key={itemKey} sx={{ pl: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <StyledCheckbox
                                                        // checked={
                                                        //     itemData?.children
                                                        //         ? tempPermission[section][itemKey]?.access
                                                        //         : tempPermission[section][itemKey]
                                                        // }
                                                        disabled={!itemData?.user_access}
                                                        checked={itemData?.access}
                                                        onChange={() => handleParentChange(section, itemKey)}
                                                        size='small'
                                                    />
                                                }
                                                label={
                                                    <Typography
                                                        sx={{
                                                            // color: '#fff',
                                                            fontWeight: '500',
                                                            fontSize: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            color: !itemData?.user_access ? 'text.disabled' : 'inherit'
                                                        }}
                                                    >
                                                        {itemData?.label}
                                                        {itemData?.icon && (
                                                            <itemData.icon sx={{ mr: 1, fontSize: '18px' }} />
                                                        )}{' '}
                                                        {/* Render the icon here */}
                                                    </Typography>
                                                }
                                                sx={{
                                                    marginY: '4px',
                                                    // borderBottom: '0.4px solid #e2e2e2',
                                                    width: '100%'
                                                }}
                                            />
                                            {itemData?.children && (
                                                <Grid
                                                    container
                                                    spacing={1}
                                                    sx={{
                                                        ml: 3.4,
                                                        pl: 1,
                                                        width: 'auto'
                                                        // here uncomment to make dark theme cards
                                                        // backgroundColor: '#ececec5c',
                                                        // borderTop: '1px solid #ececec',
                                                        // borderLeft: '1px solid #ececec',
                                                        // borderTopRightRadius: '8px',
                                                        // borderBottomRightRadius: '8px',
                                                    }}
                                                >
                                                    {Object.entries(itemData?.children).map(([child, childData]) => (
                                                        <React.Fragment key={child}>
                                                            <FormControlLabel
                                                                key={child}
                                                                disabled={!childData?.user_access}
                                                                control={
                                                                    <StyledCheckbox
                                                                        // checked={
                                                                        //     tempPermission[section][itemKey]?.children[child]
                                                                        // }
                                                                        checked={childData?.access}
                                                                        disabled={!childData?.user_access}
                                                                        onChange={() =>
                                                                            handleChildChange(section, itemKey, child)
                                                                        }
                                                                        size='small'
                                                                    />
                                                                }
                                                                label={childData?.label}
                                                                sx={{ marginY: '2px' }}
                                                            />
                                                            {/* third-level child */}
                                                            {childData?.children &&
                                                                Object.keys(childData.children).length > 0 && (
                                                                    <Grid
                                                                        container
                                                                        spacing={1}
                                                                        sx={{
                                                                            ml: 4,
                                                                            pl: 1,
                                                                            width: '100%' // Ensures children are in a new row
                                                                        }}
                                                                    >
                                                                        {Object.entries(childData.children).map(
                                                                            ([subChild, subChildData]) => (
                                                                                <FormControlLabel
                                                                                    key={subChild}
                                                                                    disabled={
                                                                                        !subChildData?.user_access
                                                                                    }
                                                                                    control={
                                                                                        <StyledCheckbox
                                                                                            checked={
                                                                                                subChildData?.access ||
                                                                                                false
                                                                                            }
                                                                                            disabled={
                                                                                                !subChildData?.user_access
                                                                                            }
                                                                                            onChange={() =>
                                                                                                handleChildChange(
                                                                                                    section,
                                                                                                    itemKey,
                                                                                                    subChild
                                                                                                )
                                                                                            }
                                                                                            size='small'
                                                                                        />
                                                                                    }
                                                                                    label={
                                                                                        subChildData?.label ||
                                                                                        'Unnamed Sub Child'
                                                                                    }
                                                                                    sx={{
                                                                                        marginY: '2px',
                                                                                        fontSize: '12px !important'
                                                                                    }}
                                                                                />
                                                                            )
                                                                        )}
                                                                        <Divider
                                                                            sx={{
                                                                                '&::before, &::after': {
                                                                                    display: 'none' // Removes default lines on either side
                                                                                },
                                                                                width: '100%',
                                                                                boxShadow: '0px 2px 4px #ffffff45', // Subtle shadow
                                                                                backgroundColor: 'gray', // Line color
                                                                                height: '0.2px' // Line thickness
                                                                            }}
                                                                        />
                                                                    </Grid>
                                                                )}
                                                        </React.Fragment>
                                                    ))}
                                                </Grid>
                                            )}
                                            <Divider
                                                sx={{
                                                    '&::before, &::after': {
                                                        display: 'none' // Removes default lines on either side
                                                    },
                                                    boxShadow: '0px 2px 4px #ffffff45', // Subtle shadow
                                                    backgroundColor: 'gray', // Line color
                                                    height: '0.2px' // Line thickness
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
            </Grid>

            <Box mt={4} display='flex' justifyContent='flex-end'>
                <CustomButton
                    variant='clickable'
                    type='submit'
                    onClick={handleSubmit}
                    loading={createRoleMenuPermissionsLKey || getRolePermissionsAndAccessForEditLKey}
                >
                    Submit
                </CustomButton>
            </Box>
        </Box>
    )
}

PermissionCheckboxGroup.propTypes = {
    handleSubmitAll: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    permissionsAndAccess: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    modulePermissions: PropTypes.object
}

export default PermissionCheckboxGroup
