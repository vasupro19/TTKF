import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useGetClientAiQuery,
    useSaveClientAiMutation,
    useTestClientAiKeyMutation
} from '@/app/store/slices/api/clientAiSlice'

const PROVIDERS = [
    { key: 'gemini', label: 'Gemini', getKey: 'https://aistudio.google.com/apikey' },
    { key: 'groq', label: 'Groq', getKey: 'https://console.groq.com/keys' },
    { key: 'cerebras', label: 'Cerebras', getKey: 'https://cloud.cerebras.ai/' },
    { key: 'openrouter', label: 'OpenRouter', getKey: 'https://openrouter.ai/keys' }
]

const EMPTY_DRAFTS = Object.fromEntries(PROVIDERS.map(({ key }) => [key, '']))

const calls = count => `${count} call${count === 1 ? '' : 's'}`

/**
 * The super admin's view of one client's AI keys: which are saved (never the key itself), new ones to paste,
 * a test call for each, and the client's daily allowance on the shared keys.
 */
function AiKeysDialog({ open, client = null, onClose }) {
    const dispatch = useDispatch()
    const clientId = client?.id
    const { data, isFetching, isError, refetch } = useGetClientAiQuery(clientId, {
        skip: !open || !clientId,
        refetchOnMountOrArgChange: true
    })
    const [saveClientAi, { isLoading: saving }] = useSaveClientAiMutation()
    const [testClientAiKey] = useTestClientAiKeyMutation()

    const settings = data?.data || null
    const [drafts, setDrafts] = useState(EMPTY_DRAFTS)
    const [removed, setRemoved] = useState({})
    const [limit, setLimit] = useState('')
    const [tests, setTests] = useState({})

    useEffect(() => {
        setDrafts(EMPTY_DRAFTS)
        setRemoved({})
        setTests({})
        setLimit(settings?.dailyLimit === null || settings?.dailyLimit === undefined ? '' : String(settings.dailyLimit))
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

    const savedLimit =
        settings?.dailyLimit === null || settings?.dailyLimit === undefined ? '' : String(settings.dailyLimit)
    const keyChanges = Object.fromEntries(
        PROVIDERS.flatMap(({ key }) => {
            if (drafts[key].trim()) return [[key, drafts[key].trim()]]
            if (removed[key]) return [[key, null]]
            return []
        })
    )
    const limitChanged = limit.trim() !== savedLimit
    const changed = Object.keys(keyChanges).length > 0 || limitChanged
    const canStoreKeys = Boolean(settings?.setUp && settings?.encryptionReady)

    const runTest = async provider => {
        setTests(current => ({ ...current, [provider]: { running: true } }))
        try {
            const reply = await testClientAiKey({
                id: clientId,
                provider,
                ...(drafts[provider].trim() ? { key: drafts[provider].trim() } : {})
            }).unwrap()
            setTests(current => ({ ...current, [provider]: { ok: reply?.data?.ok, message: reply?.data?.message } }))
        } catch (error) {
            setTests(current => ({
                ...current,
                [provider]: { ok: false, message: error?.data?.message || 'Couldn’t test the key.' }
            }))
        }
    }

    const save = async () => {
        try {
            const body = { id: clientId }
            if (Object.keys(keyChanges).length) body.keys = keyChanges
            if (limitChanged) body.dailyLimit = limit.trim() === '' ? null : Number(limit)
            const reply = await saveClientAi(body).unwrap()
            notify(reply?.message || 'AI settings saved')
            refetch()
        } catch (error) {
            notify(error?.data?.message || 'Couldn’t save the AI settings.', 'error')
        }
    }

    const today = settings?.usage?.today || { own: 0, shared: 0 }
    const week = (settings?.usage?.days || []).reduce(
        (total, day) => ({ own: total.own + day.own, shared: total.shared + day.shared }),
        { own: 0, shared: 0 }
    )
    const name = client?.name || 'This client'

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='sm'
            aria-labelledby='ai-keys-title'
            sx={{ '& .MuiButton-root': { textTransform: 'none' } }}
        >
            <DialogTitle id='ai-keys-title' sx={{ pb: 1 }}>
                AI keys — {name}
            </DialogTitle>
            <DialogContent>
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2 }}>
                    {name}’s AI requests use these keys first. When it has none, or they stop working, your shared keys
                    are used, up to the daily allowance below. Use keys from the client’s own accounts: limits belong to
                    the account, so keys from your account share your limit.
                </Typography>

                {isFetching && !settings ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={28} aria-label='Loading the AI settings' />
                    </Box>
                ) : null}
                {isError ? (
                    <Alert severity='error' action={<Button onClick={refetch}>Try again</Button>}>
                        Couldn’t load the AI settings.
                    </Alert>
                ) : null}

                {settings ? (
                    <Stack spacing={2}>
                        {!settings.setUp ? (
                            <Alert severity='warning'>
                                Not set up on the server yet. Run <code>node Scripts/setupAiKeys.js --fix</code> on the
                                server.
                            </Alert>
                        ) : null}
                        {settings.setUp && !settings.encryptionReady ? (
                            <Alert severity='warning'>
                                The server can’t store keys yet: add CREDENTIAL_ENCRYPTION_KEY to the API’s .env and
                                restart it.
                            </Alert>
                        ) : null}
                        {settings.unreadable ? (
                            <Alert severity='warning'>
                                The saved keys can’t be read with the server’s current encryption key. Enter them again.
                            </Alert>
                        ) : null}

                        {PROVIDERS.map(provider => {
                            const saved = settings.keys?.[provider.key] || { set: false }
                            const test = tests[provider.key]
                            let status = 'Not set'
                            if (saved.set) status = `Saved · ${saved.hint}`
                            if (removed[provider.key]) status = 'Will be removed when you save'
                            return (
                                <Box
                                    key={provider.key}
                                    component='section'
                                    aria-label={provider.label}
                                    sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}
                                >
                                    <Stack direction='row' alignItems='baseline' spacing={1} sx={{ mb: 1 }}>
                                        <Typography sx={{ fontWeight: 600 }}>{provider.label}</Typography>
                                        <Typography
                                            color={removed[provider.key] ? 'warning.main' : 'text.secondary'}
                                            sx={{ fontSize: '0.8125rem' }}
                                        >
                                            {status}
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <Link
                                            href={provider.getKey}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            sx={{ fontSize: '0.8125rem' }}
                                        >
                                            Get a key
                                        </Link>
                                    </Stack>
                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={1}
                                        alignItems={{ sm: 'center' }}
                                    >
                                        <TextField
                                            size='small'
                                            type='password'
                                            fullWidth
                                            autoComplete='off'
                                            value={drafts[provider.key]}
                                            onChange={event =>
                                                setDrafts(current => ({
                                                    ...current,
                                                    [provider.key]: event.target.value
                                                }))
                                            }
                                            placeholder={saved.set ? 'Paste a new key to replace it' : 'Paste a key'}
                                            disabled={!canStoreKeys}
                                            inputProps={{ 'aria-label': `${provider.label} key` }}
                                        />
                                        <Stack direction='row' spacing={1}>
                                            <Button
                                                variant='outlined'
                                                size='small'
                                                onClick={() => runTest(provider.key)}
                                                disabled={test?.running || (!drafts[provider.key].trim() && !saved.set)}
                                            >
                                                {test?.running ? 'Testing…' : 'Test'}
                                            </Button>
                                            {saved.set ? (
                                                <Button
                                                    size='small'
                                                    color={removed[provider.key] ? 'inherit' : 'error'}
                                                    onClick={() =>
                                                        setRemoved(current => ({
                                                            ...current,
                                                            [provider.key]: !current[provider.key]
                                                        }))
                                                    }
                                                    disabled={!canStoreKeys}
                                                >
                                                    {removed[provider.key] ? 'Keep' : 'Remove'}
                                                </Button>
                                            ) : null}
                                        </Stack>
                                    </Stack>
                                    {test && !test.running ? (
                                        <Typography
                                            role='status'
                                            color={test.ok ? 'success.main' : 'error.main'}
                                            sx={{ fontSize: '0.8125rem', mt: 0.75 }}
                                        >
                                            {test.message}
                                        </Typography>
                                    ) : null}
                                </Box>
                            )
                        })}

                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                            <TextField
                                size='small'
                                type='number'
                                label='Shared-key AI calls a day'
                                value={limit}
                                onChange={event => setLimit(event.target.value.replace(/[^0-9]/g, ''))}
                                disabled={!settings.setUp}
                                inputProps={{ min: 0, inputMode: 'numeric' }}
                                helperText={`Leave empty for the default (${
                                    settings.defaultDailyLimit === null ? 'no limit' : calls(settings.defaultDailyLimit)
                                }). 0 means only its own keys.`}
                                sx={{ width: { xs: '100%', sm: 280 } }}
                            />
                            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 1.5 }}>
                                Today: {calls(today.own)} on its own keys · {calls(today.shared)} on shared keys
                                {settings.usage?.days?.length ? ` · last 7 days: ${calls(week.own + week.shared)}` : ''}
                            </Typography>
                            {!settings.sharedProviders?.length ? (
                                <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                                    No shared keys are set in the server’s .env, so only the client’s own keys work.
                                </Typography>
                            ) : null}
                        </Box>
                    </Stack>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose}>{changed ? 'Cancel' : 'Close'}</Button>
                <Button
                    variant='contained'
                    onClick={save}
                    disabled={!settings?.setUp || !changed || saving}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

AiKeysDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    client: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
    onClose: PropTypes.func.isRequired
}

export default AiKeysDialog
