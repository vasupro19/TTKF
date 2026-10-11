import { useState } from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    ButtonBase,
    Chip,
    Collapse,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
    ListItemIcon,
    ListItemText
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
    ChevronRight,
    Delete,
    Edit,
    ExpandLess,
    ExpandMore,
    HelpOutline,
    MoreHoriz,
    Timeline as TimelineIcon
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { ALL, STAGES, followUpMeta, fullDateTime, nextAction, relativeTime, stageDetail, stageMeta } from './leadStages'

const leadShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    fullName: PropTypes.string,
    stage: PropTypes.string,
    quoteSentAt: PropTypes.string,
    nextCallAt: PropTypes.string
})

const HELP_KEY = 'leads.howLeadsWork.closed'

const readClosed = () => {
    try {
        return window.localStorage.getItem(HELP_KEY) === '1'
    } catch {
        return false
    }
}

const writeClosed = closed => {
    try {
        if (closed) window.localStorage.setItem(HELP_KEY, '1')
        else window.localStorage.removeItem(HELP_KEY)
    } catch {
        // ? private window or blocked storage: the card just opens again next time
    }
}

/**
 * The five steps, left to right, each with its count and what to do there; clicking one shows only those leads.
 */
export function LeadProcessBar({ stages, total, selected, onSelect }) {
    const allSelected = selected === ALL
    return (
        <Box
            role='group'
            aria-label='Lead steps'
            sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, overflowX: 'auto', pb: 0.5 }}
        >
            <ButtonBase
                onClick={() => onSelect(ALL)}
                aria-pressed={allSelected}
                sx={theme => ({
                    flex: '0 0 auto',
                    minWidth: 112,
                    px: 1.5,
                    py: 1.25,
                    mr: 1,
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: allSelected ? theme.palette.text.primary : theme.palette.divider,
                    bgcolor: allSelected ? alpha(theme.palette.text.primary, 0.05) : 'background.paper',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    textAlign: 'left'
                })}
            >
                <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 600 }}>
                    All leads
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{total}</Typography>
            </ButtonBase>
            {STAGES.map((stage, index) => {
                const isSelected = selected === stage.key
                const count = Number(stages?.[stage.key]) || 0
                return (
                    <Box
                        key={stage.key}
                        sx={{ display: 'flex', alignItems: 'center', flex: '1 0 168px', minWidth: 168 }}
                    >
                        <ButtonBase
                            onClick={() => onSelect(isSelected ? ALL : stage.key)}
                            aria-pressed={isSelected}
                            aria-label={`Step ${stage.step}: ${stage.label}, ${count} lead${count === 1 ? '' : 's'}. ${stage.hint}`}
                            sx={{
                                flex: 1,
                                height: '100%',
                                px: 1.5,
                                py: 1.25,
                                borderRadius: '12px',
                                border: '1.5px solid',
                                borderColor: isSelected ? stage.color : 'divider',
                                bgcolor: isSelected ? stage.bg : 'background.paper',
                                boxShadow: isSelected ? `0 0 0 3px ${alpha(stage.color, 0.15)}` : 'none',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                textAlign: 'left',
                                transition: 'border-color 0.15s, background-color 0.15s',
                                '&:hover': { borderColor: stage.color }
                            }}
                        >
                            <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }}>
                                <Box
                                    sx={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        bgcolor: isSelected ? stage.color : alpha(stage.color, 0.12),
                                        color: isSelected ? '#fff' : stage.color,
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flex: '0 0 auto'
                                    }}
                                >
                                    {stage.step}
                                </Box>
                                <Typography
                                    sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}
                                    noWrap
                                >
                                    {stage.label}
                                </Typography>
                                <Typography
                                    sx={{
                                        ml: 'auto !important',
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                        color: stage.color
                                    }}
                                >
                                    {count}
                                </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }} noWrap>
                                {stage.hint}
                            </Typography>
                        </ButtonBase>
                        {index < STAGES.length - 1 && (
                            <ChevronRight sx={{ color: 'text.disabled', flex: '0 0 auto', mx: 0.25 }} aria-hidden />
                        )}
                    </Box>
                )
            })}
        </Box>
    )
}

LeadProcessBar.propTypes = {
    stages: PropTypes.objectOf(PropTypes.number),
    total: PropTypes.number.isRequired,
    selected: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired
}

/**
 * How leads move through the steps: open the first time, stays closed once closed (remembered in this browser).
 */
export function HowLeadsWork() {
    const [open, setOpen] = useState(() => !readClosed())
    const toggle = () => {
        writeClosed(open)
        setOpen(!open)
    }
    return (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: '#fbfcfe' }}>
            <ButtonBase
                onClick={toggle}
                aria-expanded={open}
                sx={{ width: '100%', justifyContent: 'flex-start', px: 1.5, py: 1, borderRadius: '12px', gap: 1 }}
            >
                <HelpOutline fontSize='small' color='primary' />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>How leads work</Typography>
                <Box sx={{ ml: 'auto', display: 'flex', color: 'text.secondary' }}>
                    {open ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
                </Box>
            </ButtonBase>
            <Collapse in={open}>
                <Box sx={{ px: 2, pb: 1.5 }}>
                    <Box component='ol' sx={{ m: 0, pl: 2.5, '& li': { fontSize: '0.8125rem', mb: 0.5 } }}>
                        {STAGES.map(stage => (
                            <li key={stage.key}>
                                <strong style={{ color: stage.color }}>{stage.label}</strong> — {stage.explain}
                            </li>
                        ))}
                    </Box>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mt: 1 }}>
                        <strong>Verify</strong> means you&apos;ve spoken to the guest and the enquiry is real. Each lead
                        moves on by itself as you work it: saving a quotation, emailing it and converting it to a
                        booking.
                    </Typography>
                </Box>
            </Collapse>
        </Box>
    )
}

export function FollowUpChip({ value }) {
    if (!value) return <Typography sx={{ fontSize: '12px', color: 'text.disabled' }}>—</Typography>
    const meta = followUpMeta(value)
    return (
        <Tooltip title={meta.meaning} arrow>
            <Chip size='small' label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
        </Tooltip>
    )
}

FollowUpChip.propTypes = { value: PropTypes.string }

export function StageCell({ row, now }) {
    const meta = stageMeta(row.stage)
    return (
        <Box sx={{ textAlign: 'left', py: 0.5 }}>
            <Chip
                size='small'
                label={`${meta.step}. ${meta.label}`}
                sx={{
                    bgcolor: meta.bg,
                    color: meta.color,
                    fontWeight: 700,
                    border: `1px solid ${alpha(meta.color, 0.25)}`
                }}
            />
            <Typography sx={{ fontSize: '11px', color: 'text.secondary', mt: 0.25 }} noWrap>
                {stageDetail(row, now)}
            </Typography>
        </Box>
    )
}

StageCell.propTypes = { row: leadShape.isRequired, now: PropTypes.instanceOf(Date) }

export function ReceivedCell({ value, now }) {
    if (!value) return <Typography sx={{ fontSize: '12px', color: 'text.disabled' }}>—</Typography>
    return (
        <Tooltip title={fullDateTime(value)} arrow>
            <Typography sx={{ fontSize: '12px', fontWeight: 500, textAlign: 'left' }} noWrap>
                {relativeTime(value, now)}
            </Typography>
        </Tooltip>
    )
}

ReceivedCell.propTypes = { value: PropTypes.string, now: PropTypes.instanceOf(Date) }

/**
 * One button for the lead's next step, and the rest (timeline, edit, delete) behind "⋯".
 */
export function LeadRowActions({ row, canEdit, onVerify, onGo, onTimeline, onEdit, onDelete }) {
    const [anchor, setAnchor] = useState(null)
    const action = nextAction(row)
    const allowed = action.kind !== 'verify' || canEdit
    const close = () => setAnchor(null)
    const pick = handler => () => {
        close()
        handler(row)
    }
    const meta = stageMeta(row.stage)

    return (
        <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='flex-end' sx={{ px: 0.5, py: 0.5 }}>
            {allowed && (
                <Button
                    size='small'
                    variant={action.kind === 'verify' ? 'contained' : 'outlined'}
                    onClick={() => (action.kind === 'verify' ? onVerify(row) : onGo(action.to))}
                    sx={{
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.25,
                        minWidth: 104,
                        borderRadius: '8px',
                        boxShadow: 'none',
                        ...(action.kind === 'verify'
                            ? {
                                  bgcolor: meta.color,
                                  '&:hover': { bgcolor: alpha(meta.color, 0.85), boxShadow: 'none' }
                              }
                            : {
                                  color: meta.color,
                                  borderColor: alpha(meta.color, 0.5),
                                  '&:hover': { borderColor: meta.color, bgcolor: meta.bg }
                              })
                    }}
                >
                    {action.label}
                </Button>
            )}
            <IconButton
                size='small'
                aria-label={`More for ${row.fullName || 'this lead'}`}
                onClick={event => setAnchor(event.currentTarget)}
            >
                <MoreHoriz fontSize='small' />
            </IconButton>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={close}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={pick(onTimeline)}>
                    <ListItemIcon>
                        <TimelineIcon fontSize='small' color='info' />
                    </ListItemIcon>
                    <ListItemText>View timeline</ListItemText>
                </MenuItem>
                {canEdit && (
                    <MenuItem onClick={pick(onEdit)}>
                        <ListItemIcon>
                            <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                        </ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                    </MenuItem>
                )}
                {canEdit && (
                    <MenuItem onClick={pick(onDelete)} sx={{ color: 'error.main' }}>
                        <ListItemIcon>
                            <Delete fontSize='small' color='error' />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                )}
            </Menu>
        </Stack>
    )
}

LeadRowActions.propTypes = {
    row: leadShape.isRequired,
    canEdit: PropTypes.bool.isRequired,
    onVerify: PropTypes.func.isRequired,
    onGo: PropTypes.func.isRequired,
    onTimeline: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
}

/**
 * What to show when the table has no rows: the first-run welcome, a filter that matches nothing, or an empty step.
 */
export function LeadEmptyState({ kind, stage, canCreate, onAdd, onClear }) {
    if (kind === 'first') {
        return (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600 }}>No leads yet</Typography>
                <Typography
                    color='text.secondary'
                    sx={{ fontSize: '0.875rem', mt: 0.5, mb: 2, maxWidth: 520, mx: 'auto' }}
                >
                    Enquiries arrive here by themselves once a mailbox or Facebook page is connected, or add one you
                    took by phone.
                </Typography>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    justifyContent='center'
                    alignItems='center'
                >
                    {canCreate && (
                        <Button variant='contained' onClick={onAdd} sx={{ textTransform: 'none', boxShadow: 'none' }}>
                            Add lead
                        </Button>
                    )}
                    <Link
                        component={RouterLink}
                        to='/integration/gmail'
                        underline='hover'
                        sx={{ fontSize: '0.875rem' }}
                    >
                        Connect Email Leads
                    </Link>
                    <Link
                        component={RouterLink}
                        to='/integration/facebook'
                        underline='hover'
                        sx={{ fontSize: '0.875rem' }}
                    >
                        Connect Facebook Leads
                    </Link>
                </Stack>
            </Box>
        )
    }
    const text = kind === 'filtered' ? 'No leads match these filters.' : stageMeta(stage).empty
    return (
        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                {text}
            </Typography>
            {kind === 'filtered' && (
                <Button onClick={onClear} sx={{ mt: 1, textTransform: 'none' }}>
                    Clear filters
                </Button>
            )}
        </Box>
    )
}

LeadEmptyState.propTypes = {
    kind: PropTypes.oneOf(['first', 'filtered', 'stage']).isRequired,
    stage: PropTypes.string,
    canCreate: PropTypes.bool,
    onAdd: PropTypes.func,
    onClear: PropTypes.func
}
