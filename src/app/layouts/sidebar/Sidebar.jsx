import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    Avatar,
    Box,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
    AddCircleOutline,
    ChevronLeft,
    ChevronRight,
    ExpandLess,
    ExpandMore,
    FormatListBulleted,
    SwapHoriz
} from '@mui/icons-material'

import { menuIconFor } from '../header/menuIcons'
import {
    CAMPAIGN_ADD_URL,
    CAMPAIGN_SUB_ITEMS,
    CAMPAIGNS_URL,
    SIDEBAR_RAIL_WIDTH,
    SIDEBAR_WIDTH,
    activeKeyFor,
    agencyNameFor,
    buildSections,
    campaignSubItemUrl,
    isCampaignSubKey
} from './navModel'
import useCampaignChoice from './useCampaignChoice'

const itemSx = (theme, { active, nested, collapsed }) => ({
    minHeight: 40,
    borderRadius: '8px',
    mx: collapsed ? 1.5 : 1,
    my: '2px',
    py: 0.75,
    pl: nested && !collapsed ? 5.5 : 1.5,
    pr: collapsed ? 1.5 : 1,
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    backgroundColor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
    position: 'relative',
    '&::before': active
        ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 8,
              bottom: 8,
              width: 3,
              borderRadius: 3,
              backgroundColor: theme.palette.primary.main
          }
        : undefined,
    '&:hover': {
        color: active ? theme.palette.primary.main : theme.palette.text.primary,
        backgroundColor: active ? alpha(theme.palette.primary.main, 0.14) : alpha(theme.palette.primary.main, 0.06),
        '& .MuiListItemIcon-root': { color: theme.palette.primary.main }
    },
    '& .MuiListItemIcon-root': {
        minWidth: collapsed ? 0 : 34,
        color: active ? theme.palette.primary.main : theme.palette.text.secondary
    },
    '& .MuiListItemText-primary': {
        color: 'inherit',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
})

function RailTooltip({ collapsed, title, children }) {
    if (!collapsed) return children
    return (
        <Tooltip title={title} placement='right' arrow>
            {children}
        </Tooltip>
    )
}

RailTooltip.propTypes = {
    collapsed: PropTypes.bool,
    title: PropTypes.string.isRequired,
    children: PropTypes.element.isRequired
}

function NavLinkItem({ item, active, collapsed, nested, onNavigate }) {
    const Icon = menuIconFor({ url: item.url })
    return (
        <RailTooltip collapsed={collapsed} title={item.label}>
            <ListItemButton
                component={RouterLink}
                to={item.to || item.url}
                selected={false}
                aria-current={active ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                onClick={onNavigate}
                sx={theme => itemSx(theme, { active, nested, collapsed })}
            >
                {!nested && (
                    <ListItemIcon>
                        <Icon fontSize='small' />
                    </ListItemIcon>
                )}
                {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
        </RailTooltip>
    )
}

NavLinkItem.propTypes = {
    item: PropTypes.shape({ url: PropTypes.string, to: PropTypes.string, label: PropTypes.string }).isRequired,
    active: PropTypes.bool,
    collapsed: PropTypes.bool,
    nested: PropTypes.bool,
    onNavigate: PropTypes.func
}

function CampaignPicker({ anchorEl, onClose, campaigns, loaded, chosenId, onSelect }) {
    const [filter, setFilter] = useState('')
    useEffect(() => {
        if (anchorEl) setFilter('')
    }, [anchorEl])
    const shown = campaigns.filter(c => c.title.toLowerCase().includes(filter.trim().toLowerCase()))
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { width: 260, maxHeight: 360 } } }}
            MenuListProps={{ 'aria-label': 'Choose a campaign', dense: true }}
        >
            <Typography component='li' variant='caption' sx={{ px: 2, pt: 0.5, pb: 1, display: 'block' }}>
                Choose a campaign
            </Typography>
            {campaigns.length > 6 && (
                <Box component='li' sx={{ px: 1.5, pb: 1 }} onKeyDown={event => event.stopPropagation()}>
                    <TextField
                        size='small'
                        fullWidth
                        placeholder='Search campaigns'
                        value={filter}
                        onChange={event => setFilter(event.target.value)}
                    />
                </Box>
            )}
            {!loaded && <MenuItem disabled>Loading…</MenuItem>}
            {loaded && shown.length === 0 && <MenuItem disabled>No campaigns found</MenuItem>}
            {shown.map(campaign => (
                <MenuItem
                    key={campaign.id}
                    selected={campaign.id === chosenId}
                    onClick={() => onSelect(campaign)}
                    sx={{ fontSize: '14px', whiteSpace: 'normal' }}
                >
                    {campaign.title}
                </MenuItem>
            ))}
        </Menu>
    )
}

CampaignPicker.propTypes = {
    anchorEl: PropTypes.instanceOf(typeof Element === 'undefined' ? Object : Element),
    onClose: PropTypes.func.isRequired,
    campaigns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, title: PropTypes.string })).isRequired,
    loaded: PropTypes.bool,
    chosenId: PropTypes.string,
    onSelect: PropTypes.func.isRequired
}

function CampaignsItem({ item, activeKey, collapsed, onExpandRail, onNavigate, user, pathname }) {
    const navigate = useNavigate()
    const campaignActive = activeKey === item.key || isCampaignSubKey(activeKey)
    const [open, setOpen] = useState(campaignActive)
    const [picker, setPicker] = useState(null) // { anchorEl, target? }
    const { campaigns, loaded, chosen, choose } = useCampaignChoice(user, true, pathname)
    const noCampaigns = loaded && campaigns.length === 0
    const Icon = menuIconFor({ url: item.url })

    useEffect(() => {
        if (campaignActive) setOpen(true)
    }, [campaignActive])

    const handleParent = () => {
        if (collapsed) {
            onExpandRail()
            setOpen(true)
            return
        }
        setOpen(prev => !prev)
    }

    const handleSelect = campaign => {
        choose(campaign)
        const target = picker?.target
        setPicker(null)
        if (target) {
            navigate(campaignSubItemUrl(target, campaign.id))
            onNavigate()
        } else if (isCampaignSubKey(activeKey)) {
            // ? switching trip while on one of its lists: the same list, for the new trip
            const sub = CAMPAIGN_SUB_ITEMS.find(s => s.key === activeKey)
            if (sub) navigate(campaignSubItemUrl(sub, campaign.id))
        }
    }

    return (
        <>
            <RailTooltip collapsed={collapsed} title={item.label}>
                <ListItemButton
                    onClick={handleParent}
                    aria-expanded={collapsed ? undefined : open}
                    aria-label={collapsed ? item.label : undefined}
                    sx={theme => ({
                        ...itemSx(theme, { active: collapsed && campaignActive, collapsed }),
                        ...(!collapsed && campaignActive
                            ? { '& .MuiListItemText-primary': { color: 'inherit', fontSize: '14px', fontWeight: 600 } }
                            : {})
                    })}
                >
                    <ListItemIcon>
                        <Icon fontSize='small' />
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.label} />}
                    {!collapsed && (open ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />)}
                </ListItemButton>
            </RailTooltip>
            {!collapsed && (
                <Collapse in={open} timeout='auto' unmountOnExit>
                    <List disablePadding aria-label='Campaign menu'>
                        <NavLinkItem
                            item={{ url: CAMPAIGNS_URL, label: 'All campaigns' }}
                            active={activeKey === item.key}
                            nested
                            onNavigate={onNavigate}
                        />
                        {noCampaigns ? (
                            <ListItemButton
                                component={RouterLink}
                                to={CAMPAIGN_ADD_URL}
                                onClick={onNavigate}
                                sx={theme => ({
                                    ...itemSx(theme, { nested: true }),
                                    color: theme.palette.primary.main,
                                    '& .MuiListItemText-primary': { color: 'inherit', fontSize: '13px' }
                                })}
                            >
                                <AddCircleOutline fontSize='small' sx={{ mr: 1 }} />
                                <ListItemText primary='Create a campaign first' />
                            </ListItemButton>
                        ) : (
                            <ListItemButton
                                onClick={event => setPicker({ anchorEl: event.currentTarget })}
                                aria-haspopup='menu'
                                aria-label={chosen ? `Trip: ${chosen.title}. Switch campaign` : 'Choose a campaign'}
                                sx={theme => ({
                                    ...itemSx(theme, { nested: true }),
                                    my: '4px',
                                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                                    '& .MuiListItemText-primary': {
                                        color: 'inherit',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }
                                })}
                            >
                                <ListItemText
                                    primary={chosen ? `Trip: ${chosen.title}` : 'Choose a trip'}
                                    primaryTypographyProps={{ title: chosen?.title }}
                                />
                                <SwapHoriz fontSize='small' sx={{ ml: 0.5, color: 'primary.main' }} />
                            </ListItemButton>
                        )}
                        {CAMPAIGN_SUB_ITEMS.map(sub => {
                            const active = activeKey === sub.key
                            if (noCampaigns) {
                                return (
                                    <ListItemButton
                                        key={sub.key}
                                        disabled
                                        sx={theme => itemSx(theme, { nested: true })}
                                    >
                                        <ListItemText primary={sub.label} />
                                    </ListItemButton>
                                )
                            }
                            if (chosen) {
                                return (
                                    <NavLinkItem
                                        key={sub.key}
                                        item={{
                                            url: sub.base,
                                            to: campaignSubItemUrl(sub, chosen.id),
                                            label: sub.label
                                        }}
                                        active={active}
                                        nested
                                        onNavigate={onNavigate}
                                    />
                                )
                            }
                            return (
                                <ListItemButton
                                    key={sub.key}
                                    aria-haspopup='menu'
                                    onClick={event => setPicker({ anchorEl: event.currentTarget, target: sub })}
                                    sx={theme => itemSx(theme, { active, nested: true })}
                                >
                                    <ListItemText primary={sub.label} />
                                </ListItemButton>
                            )
                        })}
                    </List>
                </Collapse>
            )}
            <CampaignPicker
                anchorEl={picker?.anchorEl || null}
                onClose={() => setPicker(null)}
                campaigns={campaigns}
                loaded={loaded}
                chosenId={chosen?.id}
                onSelect={handleSelect}
            />
        </>
    )
}

CampaignsItem.propTypes = {
    item: PropTypes.shape({ key: PropTypes.string, url: PropTypes.string, label: PropTypes.string }).isRequired,
    activeKey: PropTypes.string,
    collapsed: PropTypes.bool,
    onExpandRail: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    user: PropTypes.shape({ clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
    pathname: PropTypes.string
}

export function SidebarContent({ collapsed = false, onToggleCollapsed, onNavigate = () => {}, showToggle = true }) {
    const { pathname } = useLocation()
    const menuItems = useSelector(state => state.auth.menuItems)
    const user = useSelector(state => state.auth.user)
    const sections = useMemo(() => buildSections(menuItems), [menuItems])
    const activeKey = activeKeyFor(pathname, sections)
    const agencyName = agencyNameFor(user)

    return (
        <Box
            component='nav'
            aria-label='Main menu'
            sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minHeight: 64,
                    px: collapsed ? 0 : 2,
                    justifyContent: collapsed ? 'center' : 'space-between',
                    flexDirection: collapsed ? 'column' : 'row',
                    py: collapsed ? 1 : 0,
                    borderBottom: theme => `1px solid ${theme.palette.divider}`
                }}
            >
                <RailTooltip collapsed={collapsed} title={agencyName || 'Menu'}>
                    <Box
                        component={RouterLink}
                        to='/dashboard'
                        onClick={onNavigate}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            minWidth: 0,
                            textDecoration: 'none',
                            color: 'text.primary'
                        }}
                    >
                        <Avatar
                            variant='rounded'
                            sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '15px', fontWeight: 600 }}
                        >
                            {(agencyName || 'T').trim().charAt(0).toUpperCase()}
                        </Avatar>
                        {!collapsed && (
                            <Typography
                                data-testid='sidebar-agency'
                                sx={{
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {agencyName}
                            </Typography>
                        )}
                    </Box>
                </RailTooltip>
                {showToggle && onToggleCollapsed && (
                    <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'} placement='right'>
                        <IconButton
                            size='small'
                            onClick={onToggleCollapsed}
                            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
                            sx={{ color: 'text.secondary' }}
                        >
                            {collapsed ? <ChevronRight fontSize='small' /> : <ChevronLeft fontSize='small' />}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
                {sections.length === 0 && !collapsed && (
                    <Box
                        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}
                    >
                        <FormatListBulleted fontSize='small' />
                        <Typography sx={{ fontSize: '13px' }}>Loading menu…</Typography>
                    </Box>
                )}
                {sections.map((section, index) => (
                    <Box key={section.id} component='section' aria-label={section.label || undefined}>
                        {section.label &&
                            (collapsed ? (
                                index > 0 && <Divider sx={{ mx: 2, my: 1 }} />
                            ) : (
                                <Typography
                                    component='h2'
                                    sx={{
                                        px: 2.5,
                                        pt: index > 0 ? 2 : 1,
                                        pb: 0.5,
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        fontVariant: 'all-small-caps',
                                        letterSpacing: '0.08em',
                                        color: 'text.secondary'
                                    }}
                                >
                                    {section.label}
                                </Typography>
                            ))}
                        <List disablePadding>
                            {section.items.map(item =>
                                item.campaigns ? (
                                    <CampaignsItem
                                        key={item.key}
                                        item={item}
                                        activeKey={activeKey}
                                        collapsed={collapsed}
                                        onExpandRail={() => onToggleCollapsed && onToggleCollapsed(false)}
                                        onNavigate={onNavigate}
                                        user={user}
                                        pathname={pathname}
                                    />
                                ) : (
                                    <NavLinkItem
                                        key={item.key}
                                        item={item}
                                        active={activeKey === item.key}
                                        collapsed={collapsed}
                                        onNavigate={onNavigate}
                                    />
                                )
                            )}
                        </List>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

SidebarContent.propTypes = {
    collapsed: PropTypes.bool,
    onToggleCollapsed: PropTypes.func,
    onNavigate: PropTypes.func,
    showToggle: PropTypes.bool
}

/**
 * @description the app's menu: fixed on the left from md up (full, or an icon rail), a drawer below md
 */
function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onMobileClose }) {
    const isDesktop = useMediaQuery(theme => theme.breakpoints.up('md'), { noSsr: true })
    const { pathname } = useLocation()

    // ? the drawer closes once the user has gone somewhere
    useEffect(() => {
        if (mobileOpen) onMobileClose()
    }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!isDesktop) {
        return (
            <Drawer
                variant='temporary'
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                PaperProps={{ sx: { width: SIDEBAR_WIDTH } }}
            >
                <SidebarContent onNavigate={onMobileClose} showToggle={false} />
            </Drawer>
        )
    }

    const width = collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH
    return (
        <Drawer
            variant='permanent'
            open
            PaperProps={{
                sx: theme => ({
                    width,
                    overflowX: 'hidden',
                    borderRight: `1px solid ${theme.palette.divider}`,
                    transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter })
                })
            }}
            sx={{ width, flexShrink: 0 }}
        >
            <SidebarContent collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
        </Drawer>
    )
}

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    onToggleCollapsed: PropTypes.func.isRequired,
    mobileOpen: PropTypes.bool,
    onMobileClose: PropTypes.func.isRequired
}

export default Sidebar
