import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useGetClientMailQuery,
    useSaveClientMailMutation,
    useTestClientMailMutation
} from '@/app/store/slices/api/clientMailSlice'

// ? common providers, to fill the server in one click
const PRESETS = [
    { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: '587', secure: false },
    { label: 'Zoho (India)', host: 'smtp.zoho.in', port: '465', secure: true },
    { label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: '587', secure: false },
    { label: 'Hostinger', host: 'smtp.hostinger.com', port: '465', secure: true }
]

const draftOf = settings => ({
    host: settings?.server?.host || '',
    port: settings?.server?.port ? String(settings.server.port) : '',
    secure: Boolean(settings?.server?.secure),
    agencyEmail: settings?.agency?.email || '',
    agencyPassword: '',
    supplierEmail: settings?.supplier?.email || '',
    supplierName: settings?.supplier?.name || '',
    supplierPassword: ''
})

/**
 * The super admin's view of how one client sends email: its own mail server, the agency mailbox, and the mailbox
 * its emails to hotels and transporters go from — each with a sign-in test. Guest emails go from the mailbox of
 * the user who sends them; the list at the end shows which users can.
 */
function MailSettingsDialog({ open, client = null, onClose }) {
    const dispatch = useDispatch()
    const clientId = client?.id
    const { data, isFetching, isError, refetch } = useGetClientMailQuery(clientId, {
        skip: !open || !clientId,
        refetchOnMountOrArgChange: true
    })
    const [saveClientMail, { isLoading: saving }] = useSaveClientMailMutation()
    const [testClientMail] = useTestClientMailMutation()

    const settings = data?.data || null
    const [draft, setDraft] = useState(draftOf(null))
    const [removed, setRemoved] = useState({})
    const [tests, setTests] = useState({})

    useEffect(() => {
        setDraft(draftOf(settings))
        setRemoved({})
        setTests({})
    }, [settings, open])

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

    const set = (field, value) => setDraft(current => ({ ...current, [field]: value }))
    const saved = draftOf(settings)
    const serverChanged = ['host', 'port', 'secure'].some(field => draft[field] !== saved[field])
    const agencyChanged = draft.agencyEmail !== saved.agencyEmail || Boolean(draft.agencyPassword) || removed.agency
    const supplierChanged =
        draft.supplierEmail !== saved.supplierEmail ||
        draft.supplierName !== saved.supplierName ||
        Boolean(draft.supplierPassword) ||
        removed.supplier
    const changed = serverChanged || agencyChanged || supplierChanged
    const canStore = Boolean(settings?.setUp && settings?.encryptionReady)

    const serverBody = () => ({ host: draft.host.trim(), port: draft.port.trim(), secure: draft.secure })
    const mailboxBody = which => {
        const password = draft[`${which}Password`]
        return {
            email: draft[`${which}Email`].trim(),
            ...(which === 'supplier' ? { name: draft.supplierName.trim() } : {}),
            ...(password ? { password } : {}),
            ...(removed[which] && !password ? { password: '' } : {})
        }
    }

    const runTest = async which => {
        setTests(current => ({ ...current, [which]: { running: true } }))
        try {
            const reply = await testClientMail({
                id: clientId,
                mailbox: which,
                ...(serverChanged ? { server: serverBody() } : {}),
                [which]: mailboxBody(which)
            }).unwrap()
            setTests(current => ({ ...current, [which]: { ok: reply?.data?.ok, message: reply?.data?.message } }))
        } catch (error) {
            setTests(current => ({
                ...current,
                [which]: { ok: false, message: error?.data?.message || 'Couldn’t test the mailbox.' }
            }))
        }
    }

    const save = async () => {
        try {
            const body = { id: clientId }
            if (serverChanged) body.server = serverBody()
            if (agencyChanged) body.agency = mailboxBody('agency')
            if (supplierChanged) body.supplier = mailboxBody('supplier')
            const reply = await saveClientMail(body).unwrap()
            notify(reply?.message || 'Email settings saved')
            refetch()
        } catch (error) {
            notify(error?.data?.message || 'Couldn’t save the email settings.', 'error')
        }
    }

    const name = client?.name || 'This client'
    const defaultServer = settings?.platformServer?.host
        ? `${settings.platformServer.host}:${settings.platformServer.port}`
        : 'the server’s default'

    const mailbox = (which, title, help) => {
        const info = settings?.[which] || {}
        const test = tests[which]
        let status = info.hasPassword ? 'Password saved' : 'No password'
        if (removed[which]) status = 'Password will be removed when you save'
        return (
            <Box component='section' aria-label={title} sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                <Stack direction='row' alignItems='baseline' spacing={1}>
                    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography
                        color={removed[which] ? 'warning.main' : 'text.secondary'}
                        sx={{ fontSize: '0.8125rem' }}
                    >
                        {status}
                    </Typography>
                </Stack>
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1.5 }}>
                    {help}
                </Typography>
                <Stack spacing={1.5}>
                    <TextField
                        size='small'
                        label='Email address'
                        type='email'
                        value={draft[`${which}Email`]}
                        onChange={event => set(`${which}Email`, event.target.value)}
                    />
                    {which === 'supplier' ? (
                        <TextField
                            size='small'
                            label='Name suppliers see'
                            placeholder={`${name} Reservations`}
                            value={draft.supplierName}
                            onChange={event => set('supplierName', event.target.value)}
                        />
                    ) : null}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <TextField
                            size='small'
                            type='password'
                            fullWidth
                            autoComplete='new-password'
                            label={info.hasPassword ? 'New app password' : 'App password'}
                            placeholder={info.hasPassword ? 'Leave empty to keep the saved one' : ''}
                            value={draft[`${which}Password`]}
                            onChange={event => set(`${which}Password`, event.target.value)}
                            disabled={!canStore}
                        />
                        <Stack direction='row' spacing={1}>
                            <Button
                                variant='outlined'
                                size='small'
                                onClick={() => runTest(which)}
                                disabled={
                                    test?.running ||
                                    !draft[`${which}Email`].trim() ||
                                    (!draft[`${which}Password`] && !info.hasPassword)
                                }
                            >
                                {test?.running ? 'Testing…' : 'Test'}
                            </Button>
                            {info.hasPassword ? (
                                <Button
                                    size='small'
                                    color={removed[which] ? 'inherit' : 'error'}
                                    onClick={() => setRemoved(current => ({ ...current, [which]: !current[which] }))}
                                >
                                    {removed[which] ? 'Keep' : 'Remove'}
                                </Button>
                            ) : null}
                        </Stack>
                    </Stack>
                    {test && !test.running ? (
                        <Typography
                            role='status'
                            color={test.ok ? 'success.main' : 'error.main'}
                            sx={{ fontSize: '0.8125rem' }}
                        >
                            {test.message}
                        </Typography>
                    ) : null}
                </Stack>
            </Box>
        )
    }

    const users = settings?.users || null
    const withMailbox = users ? users.filter(user => user.hasPassword) : []

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='sm'
            aria-labelledby='mail-settings-title'
            sx={{ '& .MuiButton-root': { textTransform: 'none' } }}
        >
            <DialogTitle id='mail-settings-title' sx={{ pb: 1 }}>
                Email settings — {name}
            </DialogTitle>
            <DialogContent>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                    Emails to guests go from the mailbox of the user who sends them. Emails to hotels and transporters
                    go from the supplier mailbox. Either falls back to the agency mailbox when it isn’t set up.
                </Typography>

                {isFetching && !settings ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={28} aria-label='Loading the email settings' />
                    </Box>
                ) : null}
                {isError ? (
                    <Alert severity='error' action={<Button onClick={refetch}>Try again</Button>}>
                        Couldn’t load the email settings.
                    </Alert>
                ) : null}

                {settings ? (
                    <Stack spacing={2}>
                        {!settings.setUp ? (
                            <Alert severity='warning'>
                                Not set up on the server yet. Run <code>node Scripts/setupMailSettings.js --fix</code>{' '}
                                on the server. Until then only the agency mailbox can be saved.
                            </Alert>
                        ) : null}
                        {!settings.encryptionReady ? (
                            <Alert severity='warning'>
                                The server can’t store passwords yet: add CREDENTIAL_ENCRYPTION_KEY to the API’s .env
                                and restart it.
                            </Alert>
                        ) : null}

                        <Box component='section' aria-label='Mail server'>
                            <Typography sx={{ fontWeight: 600 }}>Mail server</Typography>
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1.5 }}>
                                The agency’s email provider. Leave empty to use {defaultServer}.
                            </Typography>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mb: 1.5 }}>
                                {PRESETS.map(preset => (
                                    <Button
                                        key={preset.host}
                                        size='small'
                                        variant={draft.host === preset.host ? 'contained' : 'outlined'}
                                        disabled={!settings.setUp}
                                        onClick={() =>
                                            setDraft(current => ({
                                                ...current,
                                                host: preset.host,
                                                port: preset.port,
                                                secure: preset.secure
                                            }))
                                        }
                                    >
                                        {preset.label}
                                    </Button>
                                ))}
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                                <TextField
                                    size='small'
                                    label='Server (SMTP host)'
                                    placeholder='smtp.example.com'
                                    value={draft.host}
                                    onChange={event => set('host', event.target.value)}
                                    disabled={!settings.setUp}
                                    sx={{ flex: 2 }}
                                />
                                <TextField
                                    size='small'
                                    label='Port'
                                    placeholder={draft.secure ? '465' : '587'}
                                    value={draft.port}
                                    onChange={event => set('port', event.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={!settings.setUp}
                                    inputProps={{ inputMode: 'numeric' }}
                                    sx={{ flex: 1 }}
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={draft.secure}
                                            onChange={event => set('secure', event.target.checked)}
                                            disabled={!settings.setUp}
                                        />
                                    }
                                    label='SSL (465)'
                                />
                            </Stack>
                        </Box>

                        {mailbox(
                            'agency',
                            'Agency mailbox',
                            'Used when a user has no mailbox of their own, and for reminders to staff.'
                        )}
                        {settings.setUp
                            ? mailbox(
                                  'supplier',
                                  'Supplier mailbox',
                                  'Booking requests, amendments, cancellations and payment confirmations to hotels and transporters go from here, and their replies come back here.'
                              )
                            : null}

                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                            <Typography sx={{ fontWeight: 600 }}>Users’ own mailboxes</Typography>
                            {users ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                    {users.length
                                        ? `${withMailbox.length} of ${users.length} users can send from their own mailbox${
                                              withMailbox.length
                                                  ? `: ${withMailbox.map(user => user.name).join(', ')}`
                                                  : ''
                                          }. Each user’s app password is set on the agency’s Users page; their login email is the mailbox.`
                                        : 'The agency has no users yet.'}
                                </Typography>
                            ) : (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                                    The agency’s workspace couldn’t be read.
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>{changed ? 'Cancel' : 'Close'}</Button>
                <Button
                    variant='contained'
                    onClick={save}
                    disabled={!settings || !changed || saving}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

MailSettingsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    client: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
    onClose: PropTypes.func.isRequired
}

export default MailSettingsDialog
