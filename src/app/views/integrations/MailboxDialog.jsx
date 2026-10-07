import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Avatar,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link,
    MenuItem,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
    CheckCircle,
    Close,
    ExpandLess,
    ExpandMore,
    OpenInNew,
    Visibility,
    VisibilityOff,
    WarningAmber
} from '@mui/icons-material'
import {
    useCreateLeadMailboxMutation,
    useTestLeadMailboxMutation,
    useUpdateLeadMailboxMutation
} from '@/app/store/slices/api/leadChannelsSlice'
import { BACKFILL_OPTIONS, MAIL_PROVIDERS, guessProvider, providerOf } from './mailProviders'
import { errorMessage, mailboxShape, providerShape, userShape } from './format'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const draftOf = mailbox => ({
    provider: mailbox?.provider || '',
    email: mailbox?.email || '',
    password: '',
    host: mailbox?.host || '',
    port: mailbox?.port ? String(mailbox.port) : '993',
    secure: mailbox ? Boolean(mailbox.secure) : true,
    username: mailbox?.username || '',
    defaultAssignedTo: mailbox?.defaultAssignedTo ? String(mailbox.defaultAssignedTo) : '',
    keywords: mailbox?.keywords || '',
    backfillDays: 0
})

function ProviderTile({ provider, selected, onSelect }) {
    return (
        <ButtonBase
            onClick={() => onSelect(provider.id)}
            sx={{
                p: 1.5,
                borderRadius: 2,
                border: 2,
                borderColor: selected ? provider.color : 'divider',
                bgcolor: selected ? alpha(provider.color, 0.06) : 'background.paper',
                justifyContent: 'flex-start',
                textAlign: 'left',
                transition: 'all .15s',
                '&:hover': { borderColor: provider.color, bgcolor: alpha(provider.color, 0.04) }
            }}
        >
            <Stack direction='row' spacing={1.5} alignItems='center' sx={{ width: '100%' }}>
                <Avatar
                    variant='rounded'
                    sx={{
                        color: 'common.white',
                        bgcolor: provider.color,
                        width: 36,
                        height: 36,
                        fontWeight: 700,
                        fontSize: 16
                    }}
                >
                    {provider.name[0]}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 700 }} noWrap>
                        {provider.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' noWrap component='div'>
                        {provider.hint}
                    </Typography>
                </Box>
                {selected && <CheckCircle sx={{ color: provider.color }} fontSize='small' />}
            </Stack>
        </ButtonBase>
    )
}

ProviderTile.propTypes = {
    provider: providerShape.isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
}

/**
 * Connect (or edit) an enquiry mailbox in three steps: the provider, signing in with an app password — tested
 * before anything is saved — and the lead rules: who leads go to, how far back to start, optional keywords.
 */
function MailboxDialog({ open, mailbox = null, users = [], onClose, onSaved }) {
    const editing = Boolean(mailbox?.id)
    const steps = editing ? ['Sign in', 'Lead rules'] : ['Provider', 'Sign in', 'Lead rules']
    const [step, setStep] = useState(0)
    const [draft, setDraft] = useState(draftOf(mailbox))
    const [showPassword, setShowPassword] = useState(false)
    const [advanced, setAdvanced] = useState(false)
    const [test, setTest] = useState(null)
    const [failure, setFailure] = useState('')

    const [testMailbox] = useTestLeadMailboxMutation()
    const [createMailbox, { isLoading: creating }] = useCreateLeadMailboxMutation()
    const [updateMailbox, { isLoading: updating }] = useUpdateLeadMailboxMutation()
    const saving = creating || updating

    useEffect(() => {
        if (!open) return
        setDraft(draftOf(mailbox))
        setStep(0)
        setTest(null)
        setFailure('')
        setShowPassword(false)
        setAdvanced(Boolean(mailbox && providerOf(mailbox.provider).manual))
    }, [open, mailbox])

    const provider = providerOf(draft.provider)
    const stepName = steps[step]
    const set = (field, value) => {
        setDraft(current => ({ ...current, [field]: value }))
        if (['email', 'password', 'host', 'port', 'secure', 'username'].includes(field)) setTest(null)
    }

    const chooseProvider = id => {
        const chosen = providerOf(id)
        setDraft(current => ({
            ...current,
            provider: id,
            host: chosen.host || (current.provider === id ? current.host : ''),
            port: String(chosen.port),
            secure: chosen.secure
        }))
        setAdvanced(Boolean(chosen.manual))
        setTest(null)
    }

    // ? typing a gmail.com address while "Other" is picked: offer the right provider
    const suggested = useMemo(() => {
        const guess = guessProvider(draft.email)
        return guess && guess !== draft.provider ? providerOf(guess) : null
    }, [draft.email, draft.provider])

    const signInBody = () => ({
        email: draft.email.trim(),
        host: draft.host.trim(),
        port: draft.port.trim(),
        secure: draft.secure,
        username: draft.username.trim(),
        ...(draft.password ? { password: draft.password } : {}),
        ...(editing ? { id: mailbox.id } : {})
    })

    const signInReady = EMAIL.test(draft.email.trim()) && draft.host.trim() && (editing || draft.password)

    const runTest = async () => {
        setTest({ running: true })
        try {
            const reply = await testMailbox(signInBody()).unwrap()
            setTest({ ok: Boolean(reply?.data?.ok), message: reply?.data?.message })
            return Boolean(reply?.data?.ok)
        } catch (error) {
            setTest({ ok: false, message: errorMessage(error, 'Couldn’t test the mailbox.') })
            return false
        }
    }

    const next = async () => {
        setFailure('')
        if (stepName === 'Sign in' && !test?.ok) {
            const ok = await runTest()
            if (!ok) return
        }
        setStep(current => current + 1)
    }

    const save = async () => {
        setFailure('')
        const body = {
            ...signInBody(),
            provider: draft.provider || 'other',
            defaultAssignedTo: draft.defaultAssignedTo ? Number(draft.defaultAssignedTo) : null,
            keywords: draft.keywords
        }
        delete body.id
        try {
            const reply = editing
                ? await updateMailbox({ id: mailbox.id, ...body }).unwrap()
                : await createMailbox({ ...body, backfillDays: draft.backfillDays }).unwrap()
            onSaved?.(reply?.message || 'Mailbox saved')
            onClose()
        } catch (error) {
            setFailure(errorMessage(error, 'Couldn’t save the mailbox.'))
        }
    }

    let saveLabel = editing ? 'Save changes' : 'Connect mailbox'
    if (saving) saveLabel = 'Connecting…'

    const canNext =
        (stepName === 'Provider' && Boolean(draft.provider)) ||
        (stepName === 'Sign in' && signInReady) ||
        stepName === 'Lead rules'

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth='md' fullWidth scroll='paper'>
            <DialogTitle sx={{ pr: 6 }}>
                <Typography variant='h4' component='span' sx={{ fontWeight: 700 }}>
                    {editing ? `Edit ${mailbox.email}` : 'Connect an enquiry mailbox'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    New enquiry emails in this inbox become leads within about two minutes. Nothing in the mailbox is
                    changed — emails stay unread.
                </Typography>
                <IconButton
                    onClick={onClose}
                    disabled={saving}
                    sx={{ position: 'absolute', right: 12, top: 12 }}
                    aria-label='Close'
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                    {steps.map(label => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {stepName === 'Provider' && (
                    <Box>
                        <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1.5 }}>
                            Where is this mailbox?
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 1.25,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }
                            }}
                        >
                            {MAIL_PROVIDERS.map(each => (
                                <ProviderTile
                                    key={each.id}
                                    provider={each}
                                    selected={draft.provider === each.id}
                                    onSelect={chooseProvider}
                                />
                            ))}
                        </Box>
                        {provider.warning && draft.provider && (
                            <Alert severity='warning' sx={{ mt: 2 }}>
                                {provider.warning}
                            </Alert>
                        )}
                    </Box>
                )}

                {stepName === 'Sign in' && (
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' } }}>
                        <Stack spacing={2}>
                            <TextField
                                label='Email address'
                                placeholder='enquiry@youragency.com'
                                value={draft.email}
                                onChange={event => set('email', event.target.value)}
                                fullWidth
                                autoComplete='off'
                                helperText='The inbox your enquiries arrive in'
                            />
                            {suggested && (
                                <Alert
                                    severity='info'
                                    action={
                                        <Button size='small' onClick={() => chooseProvider(suggested.id)}>
                                            Use {suggested.name}
                                        </Button>
                                    }
                                >
                                    This looks like a {suggested.name} address.
                                </Alert>
                            )}
                            <TextField
                                label={provider.passwordLabel}
                                type={showPassword ? 'text' : 'password'}
                                value={draft.password}
                                onChange={event => set('password', event.target.value)}
                                fullWidth
                                autoComplete='new-password'
                                placeholder={editing ? 'Leave blank to keep the saved password' : ''}
                                helperText={
                                    provider.passwordLabel === 'App password'
                                        ? 'Not your normal password — an app password made for this CRM'
                                        : 'Stored encrypted. Never shown again.'
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton
                                                onClick={() => setShowPassword(value => !value)}
                                                edge='end'
                                                aria-label='Show password'
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <Box>
                                <Button
                                    size='small'
                                    onClick={() => setAdvanced(value => !value)}
                                    endIcon={advanced ? <ExpandLess /> : <ExpandMore />}
                                    sx={{ px: 0, textTransform: 'none' }}
                                >
                                    Server settings {draft.host ? `· ${draft.host}:${draft.port}` : ''}
                                </Button>
                                <Collapse in={advanced}>
                                    <Stack
                                        spacing={2}
                                        sx={{
                                            mt: 1.5,
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: 'grey.50',
                                            border: 1,
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <TextField
                                            label='IMAP server'
                                            placeholder='imap.yourdomain.com'
                                            value={draft.host}
                                            onChange={event => set('host', event.target.value)}
                                            size='small'
                                            fullWidth
                                        />
                                        <Stack direction='row' spacing={2} alignItems='center'>
                                            <TextField
                                                label='Port'
                                                value={draft.port}
                                                onChange={event =>
                                                    set('port', event.target.value.replace(/\D/g, '').slice(0, 5))
                                                }
                                                size='small'
                                                sx={{ width: 120 }}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={draft.secure}
                                                        onChange={event => set('secure', event.target.checked)}
                                                    />
                                                }
                                                label='SSL / TLS'
                                            />
                                        </Stack>
                                        <TextField
                                            label='Sign-in name (only if different from the email)'
                                            value={draft.username}
                                            onChange={event => set('username', event.target.value)}
                                            size='small'
                                            fullWidth
                                        />
                                    </Stack>
                                </Collapse>
                            </Box>

                            <Stack direction='row' spacing={1.5} alignItems='center'>
                                <Button
                                    variant='outlined'
                                    onClick={runTest}
                                    disabled={!signInReady || test?.running}
                                    startIcon={test?.running ? <CircularProgress size={16} /> : null}
                                >
                                    {test?.running ? 'Signing in…' : 'Test connection'}
                                </Button>
                                {test?.ok && (
                                    <Typography
                                        variant='body2'
                                        color='success.main'
                                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                                    >
                                        <CheckCircle fontSize='small' /> Connected
                                    </Typography>
                                )}
                            </Stack>
                            {test && !test.running && (
                                <Alert severity={test.ok ? 'success' : 'error'}>{test.message}</Alert>
                            )}
                        </Stack>

                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: alpha(provider.color, 0.05),
                                border: 1,
                                borderColor: alpha(provider.color, 0.25),
                                alignSelf: 'start'
                            }}
                        >
                            <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.5 }}>
                                <Avatar
                                    variant='rounded'
                                    sx={{
                                        color: 'common.white',
                                        bgcolor: provider.color,
                                        width: 28,
                                        height: 28,
                                        fontSize: 14,
                                        fontWeight: 700
                                    }}
                                >
                                    {provider.name[0]}
                                </Avatar>
                                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                                    {provider.passwordLabel === 'App password' ||
                                    provider.passwordLabel === 'App-specific password'
                                        ? `Get your ${provider.name} app password`
                                        : `Signing in to ${provider.name}`}
                                </Typography>
                            </Stack>
                            <Box component='ol' sx={{ m: 0, pl: 2.5, '& li': { mb: 1, typography: 'body2' } }}>
                                {provider.steps.map(text => (
                                    <li key={text}>{text}</li>
                                ))}
                            </Box>
                            {provider.note && (
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                                    {provider.note}
                                </Typography>
                            )}
                            {provider.warning && (
                                <Alert severity='warning' icon={<WarningAmber fontSize='small' />} sx={{ mt: 1.5 }}>
                                    {provider.warning}
                                </Alert>
                            )}
                            {Boolean(provider.links?.length) && (
                                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                                    {provider.links.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            variant='body2'
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                fontWeight: 600
                                            }}
                                        >
                                            {link.label} <OpenInNew sx={{ fontSize: 14 }} />
                                        </Link>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}

                {stepName === 'Lead rules' && (
                    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                        <Stack spacing={2.5}>
                            <TextField
                                select
                                label='Give new leads to'
                                value={draft.defaultAssignedTo}
                                onChange={event => set('defaultAssignedTo', event.target.value)}
                                fullWidth
                                helperText='They can be reassigned from the lead later'
                            >
                                <MenuItem value=''>
                                    <em>The agency admin</em>
                                </MenuItem>
                                {users.map(user => (
                                    <MenuItem key={user.id} value={String(user.id)}>
                                        {user.name}
                                        {user.email ? (
                                            <Typography
                                                component='span'
                                                variant='caption'
                                                color='text.secondary'
                                                sx={{ ml: 1 }}
                                            >
                                                {user.email}
                                            </Typography>
                                        ) : null}
                                    </MenuItem>
                                ))}
                            </TextField>

                            {!editing && (
                                <TextField
                                    select
                                    label='Start with'
                                    value={draft.backfillDays}
                                    onChange={event => set('backfillDays', Number(event.target.value))}
                                    fullWidth
                                    helperText='Emails older than this stay as they are'
                                >
                                    {BACKFILL_OPTIONS.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}

                            <TextField
                                label='Only emails that mention (optional)'
                                placeholder='e.g. enquiry, package, trip, booking'
                                value={draft.keywords}
                                onChange={event => set('keywords', event.target.value)}
                                fullWidth
                                helperText='Separate words with commas. Leave empty to treat every new email as an enquiry.'
                            />
                        </Stack>

                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'grey.50',
                                border: 1,
                                borderColor: 'divider',
                                alignSelf: 'start'
                            }}
                        >
                            <Typography variant='subtitle1' sx={{ fontWeight: 700, mb: 1 }}>
                                What becomes a lead
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                                Each new email in the inbox, with the sender’s name, email, phone (when written in the
                                email), the subject and the message. Website contact forms are read too — the guest’s
                                details are taken from the form.
                            </Typography>
                            <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
                                Skipped automatically
                            </Typography>
                            <Box
                                component='ul'
                                sx={{
                                    m: 0,
                                    pl: 2.5,
                                    '& li': { typography: 'body2', color: 'text.secondary', mb: 0.25 }
                                }}
                            >
                                <li>Emails from your own team</li>
                                <li>Newsletters, auto-replies and bounces</li>
                                <li>A sender who already has a lead from the last 30 days</li>
                                <li>The same email twice</li>
                            </Box>
                        </Box>
                    </Box>
                )}

                {failure && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {failure}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                {step > 0 && (
                    <Button onClick={() => setStep(current => current - 1)} disabled={saving}>
                        Back
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} disabled={saving} color='inherit'>
                    Cancel
                </Button>
                {stepName !== 'Lead rules' ? (
                    <Button variant='contained' onClick={next} disabled={!canNext || test?.running}>
                        {stepName === 'Sign in' && !test?.ok ? 'Test & continue' : 'Continue'}
                    </Button>
                ) : (
                    <Button
                        variant='contained'
                        onClick={save}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                    >
                        {saveLabel}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

MailboxDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    mailbox: mailboxShape,
    users: PropTypes.arrayOf(userShape),
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func
}

export default MailboxDialog
