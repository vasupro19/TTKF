import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Chip, Grid, InputAdornment, Paper, Stack, Switch, TextField, Tooltip, Typography } from '@mui/material'
import { Lock, Search } from '@mui/icons-material'
import { menuIconFor } from '@app/layouts/header/menuIcons'
import { groupMenus, setManyIds, summaryOf, toggleId } from './menuAccess'

// ? an off switch was white on white: give its track a visible grey and the knob an outline
const SWITCH_SX = {
    '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': { backgroundColor: 'grey.500', opacity: 0.55 },
    '& .MuiSwitch-switchBase:not(.Mui-checked) .MuiSwitch-thumb': { boxShadow: '0 0 0 1px rgba(0,0,0,0.25)' }
}

/**
 * @description which screens someone opens: grouped by section, a switch per screen, a search and a count.
 * Controlled: `value` is the ids turned on (never the ones the role gives — those are `fromRole` and locked).
 * Used for an agency user, for an agency (by the super admin) and for a role.
 */
function MenuAccessEditor({ menus, value, onChange, disabled = false, emptyText = 'No screens to give yet.' }) {
    const [search, setSearch] = useState('')
    const sections = useMemo(() => groupMenus(menus, value, search), [menus, value, search])
    const summary = useMemo(() => summaryOf(menus, value), [menus, value])
    const shown = sections.filter(section => section.visible)

    if (!menus?.length) {
        return (
            <Paper variant='outlined' sx={{ p: 4, textAlign: 'center' }}>
                <Typography color='text.secondary'>{emptyText}</Typography>
            </Paper>
        )
    }

    return (
        <Box>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent='space-between'
                sx={{ mb: 2 }}
            >
                <TextField
                    size='small'
                    placeholder='Search screens'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                    InputProps={{
                        inputProps: { 'aria-label': 'Search screens' },
                        startAdornment: (
                            <InputAdornment position='start'>
                                <Search fontSize='small' />
                            </InputAdornment>
                        )
                    }}
                />
                <Typography variant='body2' color='text.secondary' data-testid='menu-access-summary'>
                    <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {summary.on} of {summary.total} screens
                    </Box>{' '}
                    on{summary.locked ? ` · ${summary.locked} from the role` : ''}
                </Typography>
            </Stack>

            {shown.length === 0 ? (
                <Paper variant='outlined' sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color='text.secondary'>No screen matches “{search.trim()}”.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {shown.map(section => {
                        const GroupIcon = menuIconFor({ id: section.group })
                        const changeable = section.items.filter(item => !item.locked)
                        // ? a section whose screens all come from the role shows on (and locked)
                        const allOn = changeable.length
                            ? changeable.every(item => item.checked)
                            : section.items.length > 0 && section.items.every(item => item.checked)
                        return (
                            <Grid item xs={12} lg={6} key={section.group}>
                                <Paper variant='outlined' sx={{ overflow: 'hidden', height: '100%' }}>
                                    <Stack
                                        direction='row'
                                        alignItems='center'
                                        spacing={1.25}
                                        sx={{
                                            px: 2,
                                            py: 1.25,
                                            bgcolor: 'grey.50',
                                            borderBottom: 1,
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <GroupIcon fontSize='small' color='primary' />
                                        <Typography variant='subtitle1' sx={{ fontWeight: 600, flexGrow: 1 }}>
                                            {section.label}
                                        </Typography>
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                            sx={{ whiteSpace: 'nowrap' }}
                                        >
                                            {section.on} of {section.total} on
                                        </Typography>
                                        <Tooltip
                                            title={
                                                changeable.length
                                                    ? `Turn all ${section.label.toLowerCase()} ${allOn ? 'off' : 'on'}`
                                                    : 'Every screen here comes from the role'
                                            }
                                        >
                                            <span>
                                                <Switch
                                                    size='small'
                                                    sx={SWITCH_SX}
                                                    checked={allOn}
                                                    disabled={disabled || changeable.length === 0}
                                                    onChange={() => onChange(setManyIds(value, changeable, !allOn))}
                                                    inputProps={{ 'aria-label': `All ${section.label} on` }}
                                                />
                                            </span>
                                        </Tooltip>
                                    </Stack>
                                    <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
                                        {section.items.map(item => {
                                            const Icon = menuIconFor(item)
                                            return (
                                                <Stack
                                                    component='li'
                                                    key={item.id}
                                                    direction='row'
                                                    alignItems='center'
                                                    spacing={1.5}
                                                    sx={{
                                                        px: 2,
                                                        py: 0.75,
                                                        borderBottom: 1,
                                                        borderColor: 'divider',
                                                        '&:last-of-type': { borderBottom: 0 },
                                                        bgcolor: item.checked ? 'action.hover' : 'transparent'
                                                    }}
                                                >
                                                    <Icon
                                                        fontSize='small'
                                                        sx={{ color: item.checked ? 'primary.main' : 'text.disabled' }}
                                                    />
                                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                        <Typography variant='body2' sx={{ fontWeight: 500 }} noWrap>
                                                            {item.label}
                                                        </Typography>
                                                        {item.url ? (
                                                            <Typography
                                                                variant='caption'
                                                                color='text.secondary'
                                                                noWrap
                                                                component='div'
                                                            >
                                                                {item.url}
                                                            </Typography>
                                                        ) : null}
                                                    </Box>
                                                    {item.locked ? (
                                                        <Tooltip title='Change it on the role'>
                                                            <Chip
                                                                size='small'
                                                                icon={<Lock sx={{ fontSize: 14 }} />}
                                                                label={
                                                                    item.roleName
                                                                        ? `From role ${item.roleName}`
                                                                        : 'From role'
                                                                }
                                                                variant='outlined'
                                                                color='primary'
                                                                sx={{ maxWidth: 170 }}
                                                            />
                                                        </Tooltip>
                                                    ) : null}
                                                    <Switch
                                                        size='small'
                                                        sx={SWITCH_SX}
                                                        checked={item.checked}
                                                        disabled={disabled || item.locked}
                                                        onChange={() => onChange(toggleId(value, item.id))}
                                                        inputProps={{ 'aria-label': item.label }}
                                                    />
                                                </Stack>
                                            )
                                        })}
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })}
                </Grid>
            )}
        </Box>
    )
}

MenuAccessEditor.propTypes = {
    menus: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            label: PropTypes.string,
            url: PropTypes.string,
            group: PropTypes.string,
            fromRole: PropTypes.bool,
            roleName: PropTypes.string
        })
    ),
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    emptyText: PropTypes.string
}

export default MenuAccessEditor
