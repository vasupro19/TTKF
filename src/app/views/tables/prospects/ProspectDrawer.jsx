import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    FormControlLabel,
    IconButton,
    Link,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { Close, Edit, Phone, WhatsApp, Send } from '@mui/icons-material'
import StatusBadge from '@core/components/StatusBadge'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useAddProspectActivityMutation,
    useEmailProspectMutation,
    useGetProspectQuery,
    useProspectWhatsappOpenedMutation,
    useRemoveProspectMutation,
    useSetProspectSequenceMutation,
    useSetProspectStatusMutation,
    useUpdateProspectMutation
} from '@/app/store/slices/api/prospectSlice'
import { ACTIVITY_WORDS, STATUS_OPTIONS, emailStateOf, statusOption, timeOf } from './prospectFacts'

const EDIT_FIELDS = [
    ['name', 'Agency name'],
    ['city', 'City'],
    ['region', 'Region'],
    ['phone', 'Phone'],
    ['email', 'Email'],
    ['website', 'Website'],
    ['social', 'Instagram / Facebook']
]

const hrefOf = value => {
    const text = String(value || '').trim()
    if (!text) return ''
    return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

/**
 * One agency: how to reach it, where it stands, the next email (editable before it goes), WhatsApp in one click, calls
 * and notes, and everything that happened, newest first.
 */
function ProspectDrawer({ prospectId = null, onClose, onChanged }) {
    const dispatch = useDispatch()
    const open = Boolean(prospectId)
    const { data, isFetching, refetch } = useGetProspectQuery(prospectId, {
        skip: !open,
        refetchOnMountOrArgChange: true
    })
    const prospect = data?.data || null

    const [setStatus] = useSetProspectStatusMutation()
    const [sendEmail, { isLoading: sending }] = useEmailProspectMutation()
    const [whatsappOpened] = useProspectWhatsappOpenedMutation()
    const [addActivity, { isLoading: adding }] = useAddProspectActivityMutation()
    const [setSequence, { isLoading: switching }] = useSetProspectSequenceMutation()
    const [updateProspect, { isLoading: savingEdit }] = useUpdateProspectMutation()
    const [removeProspect] = useRemoveProspectMutation()

    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [note, setNote] = useState('')
    const [editing, setEditing] = useState(false)
    const [edit, setEdit] = useState({})
    const [confirmRemove, setConfirmRemove] = useState(false)

    useEffect(() => {
        setSubject(prospect?.nextEmail?.subject || '')
        setBody(prospect?.nextEmail?.body || '')
        setEdit(
            Object.fromEntries([...EDIT_FIELDS.map(([key]) => key), 'notes'].map(key => [key, prospect?.[key] || '']))
        )
    }, [prospect])

    useEffect(() => {
        setEditing(false)
        setNote('')
        setConfirmRemove(false)
    }, [prospectId])

    const notify = (message, color = 'success') =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    // ? every action: tell the person, reload this agency and the list behind it
    const run = async (action, done) => {
        try {
            const result = await action().unwrap()
            if (done || result?.message) notify(done || result.message)
            refetch()
            if (onChanged) onChanged()
            return true
        } catch (error) {
            notify(error?.data?.message || 'That did not work. Try again.', 'error')
            return false
        }
    }

    const openWhatsapp = () => {
        // ? opened in the click itself, or the browser blocks the new tab
        window.open(prospect.whatsappUrl, '_blank', 'noopener')
        run(() => whatsappOpened(prospect.id), 'Noted as contacted on WhatsApp')
    }

    const handleSend = () => run(() => sendEmail({ id: prospect.id, subject, body }))
    const handleCall = () => run(() => addActivity({ id: prospect.id, kind: 'call', text: note.trim() || 'Called' }))
    const handleNote = async () => {
        if (await run(() => addActivity({ id: prospect.id, kind: 'note', text: note }))) setNote('')
    }
    const handleEdit = async () => {
        if (await run(() => updateProspect({ id: prospect.id, ...edit }), 'Saved')) setEditing(false)
    }
    const handleRemove = async () => {
        if (await run(() => removeProspect(prospect.id))) onClose()
    }

    const status = statusOption(prospect?.status)

    return (
        <Drawer anchor='right' open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
            <Box sx={{ p: 3 }}>
                <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant='h4' sx={{ wordBreak: 'break-word' }}>
                            {prospect?.name || (isFetching ? 'Loading…' : '')}
                        </Typography>
                        {prospect && (
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                {[prospect.city, prospect.region].filter(Boolean).join(', ')}
                            </Typography>
                        )}
                    </Box>
                    <IconButton aria-label='Close' onClick={onClose}>
                        <Close />
                    </IconButton>
                </Stack>

                {!prospect && isFetching && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}

                {prospect && (
                    <Stack spacing={2.5} sx={{ mt: 2 }}>
                        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                            <TextField
                                select
                                size='small'
                                label='Status'
                                value={prospect.status}
                                onChange={event =>
                                    run(() => setStatus({ id: prospect.id, status: event.target.value }))
                                }
                                sx={{ minWidth: 180 }}
                            >
                                {STATUS_OPTIONS.map(option => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <StatusBadge type={status.badge} label={status.label} />
                            <Chip size='small' label={`Priority ${prospect.priority}`} variant='outlined' />
                        </Stack>

                        {/* how to reach them */}
                        {!editing ? (
                            <Box>
                                <Stack spacing={0.5}>
                                    {prospect.phone && <Typography variant='body2'>Phone: {prospect.phone}</Typography>}
                                    {prospect.email && <Typography variant='body2'>Email: {prospect.email}</Typography>}
                                    {prospect.website && (
                                        <Typography variant='body2'>
                                            Website:{' '}
                                            <Link
                                                href={hrefOf(prospect.website)}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                            >
                                                {prospect.website}
                                            </Link>
                                        </Typography>
                                    )}
                                    {prospect.social && (
                                        <Typography variant='body2' sx={{ wordBreak: 'break-word' }}>
                                            Social: {prospect.social}
                                        </Typography>
                                    )}
                                    {prospect.sells && (
                                        <Typography variant='body2' color='text.secondary'>
                                            Sells: {prospect.sells}
                                        </Typography>
                                    )}
                                    {prospect.sizeSignal && (
                                        <Typography variant='body2' color='text.secondary'>
                                            Size: {prospect.sizeSignal}
                                        </Typography>
                                    )}
                                    {prospect.whyFit && (
                                        <Typography variant='body2' color='text.secondary'>
                                            Why they fit: {prospect.whyFit}
                                        </Typography>
                                    )}
                                    {prospect.notes && (
                                        <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                                            Notes: {prospect.notes}
                                        </Typography>
                                    )}
                                    {prospect.source && (
                                        <Typography variant='caption' color='text.secondary'>
                                            Found on{' '}
                                            <Link
                                                href={hrefOf(prospect.source)}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                            >
                                                this page
                                            </Link>
                                        </Typography>
                                    )}
                                </Stack>
                                <Button
                                    size='small'
                                    startIcon={<Edit />}
                                    onClick={() => setEditing(true)}
                                    sx={{ mt: 1 }}
                                >
                                    Edit details
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={1.5}>
                                {EDIT_FIELDS.map(([key, label]) => (
                                    <TextField
                                        key={key}
                                        size='small'
                                        label={label}
                                        value={edit[key] || ''}
                                        onChange={event =>
                                            setEdit(previous => ({ ...previous, [key]: event.target.value }))
                                        }
                                    />
                                ))}
                                <TextField
                                    size='small'
                                    label='Notes'
                                    multiline
                                    minRows={2}
                                    value={edit.notes || ''}
                                    onChange={event =>
                                        setEdit(previous => ({ ...previous, notes: event.target.value }))
                                    }
                                />
                                <Stack direction='row' spacing={1}>
                                    <Button variant='contained' onClick={handleEdit} disabled={savingEdit}>
                                        Save
                                    </Button>
                                    <Button onClick={() => setEditing(false)}>Cancel</Button>
                                </Stack>
                            </Stack>
                        )}

                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            <Button
                                variant='contained'
                                color='success'
                                startIcon={<WhatsApp />}
                                onClick={openWhatsapp}
                                disabled={!prospect.whatsappUrl}
                            >
                                WhatsApp
                            </Button>
                            <Button variant='outlined' startIcon={<Phone />} onClick={handleCall} disabled={adding}>
                                I called them
                            </Button>
                        </Stack>
                        {!prospect.whatsappUrl && (
                            <Typography variant='caption' color='text.secondary'>
                                No mobile number to open WhatsApp on. Add one with Edit details.
                            </Typography>
                        )}

                        <Divider />

                        {/* email */}
                        <Box>
                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                <Typography variant='subtitle1' fontWeight={700}>
                                    Email
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={prospect.sequence === 'on'}
                                            disabled={switching || (!prospect.canEmail && prospect.sequence !== 'on')}
                                            onChange={event =>
                                                run(() => setSequence({ id: prospect.id, on: event.target.checked }))
                                            }
                                        />
                                    }
                                    label='Automatic emails'
                                />
                            </Stack>
                            <Typography variant='body2' color='text.secondary'>
                                {emailStateOf(prospect)}
                            </Typography>
                            {prospect.emailBlocker ? (
                                <Alert severity='info' sx={{ mt: 1.5 }}>
                                    {prospect.emailBlocker}
                                </Alert>
                            ) : (
                                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                    <TextField
                                        size='small'
                                        label='Subject'
                                        value={subject}
                                        onChange={event => setSubject(event.target.value)}
                                    />
                                    <TextField
                                        size='small'
                                        label={prospect.nextEmail?.kind === 'first' ? 'First email' : 'Follow-up'}
                                        multiline
                                        minRows={6}
                                        value={body}
                                        onChange={event => setBody(event.target.value)}
                                    />
                                    <Box>
                                        <Button
                                            variant='contained'
                                            startIcon={<Send />}
                                            onClick={handleSend}
                                            disabled={sending || !subject.trim() || !body.trim()}
                                        >
                                            {sending ? 'Sending…' : 'Send now'}
                                        </Button>
                                    </Box>
                                </Stack>
                            )}
                        </Box>

                        <Divider />

                        {/* notes and the timeline */}
                        <Box>
                            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>
                                Timeline
                            </Typography>
                            <Stack direction='row' spacing={1} alignItems='flex-start'>
                                <TextField
                                    size='small'
                                    placeholder='Add a note, e.g. “Owner is Rakesh, call after 4pm”'
                                    value={note}
                                    onChange={event => setNote(event.target.value)}
                                    multiline
                                    fullWidth
                                />
                                <Button variant='outlined' onClick={handleNote} disabled={adding || !note.trim()}>
                                    Add
                                </Button>
                            </Stack>
                            <Stack spacing={1.5} sx={{ mt: 2 }}>
                                {prospect.activities?.length ? (
                                    prospect.activities.map(activity => (
                                        <Box
                                            key={activity.id}
                                            sx={{ borderLeft: 3, borderColor: 'divider', pl: 1.5, py: 0.25 }}
                                        >
                                            <Typography variant='caption' color='text.secondary'>
                                                {timeOf(activity.createdAt)} ·{' '}
                                                {ACTIVITY_WORDS[activity.kind] || activity.kind} · {activity.by}
                                            </Typography>
                                            {activity.subject && (
                                                <Typography variant='body2' fontWeight={600}>
                                                    {activity.subject}
                                                </Typography>
                                            )}
                                            {activity.text && (
                                                <Typography
                                                    variant='body2'
                                                    sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
                                                >
                                                    {activity.text.length > 600
                                                        ? `${activity.text.slice(0, 600)}…`
                                                        : activity.text}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant='body2' color='text.secondary'>
                                        Nothing yet.
                                    </Typography>
                                )}
                            </Stack>
                        </Box>

                        <Divider />
                        <Box>
                            {confirmRemove ? (
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <Typography variant='body2'>Remove {prospect.name} and its timeline?</Typography>
                                    <Button color='error' variant='contained' size='small' onClick={handleRemove}>
                                        Remove
                                    </Button>
                                    <Button size='small' onClick={() => setConfirmRemove(false)}>
                                        Keep
                                    </Button>
                                </Stack>
                            ) : (
                                <Button color='error' size='small' onClick={() => setConfirmRemove(true)}>
                                    Remove from the list
                                </Button>
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>
        </Drawer>
    )
}

ProspectDrawer.propTypes = {
    prospectId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    onChanged: PropTypes.func
}

export default ProspectDrawer
