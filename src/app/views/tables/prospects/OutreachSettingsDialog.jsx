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
    Divider,
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography
} from '@mui/material'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useGetOutreachSettingsQuery,
    useRemoveOutreachMediaMutation,
    useSaveOutreachSettingsMutation,
    useTestOutreachSettingsMutation,
    useUploadOutreachMediaMutation
} from '@/app/store/slices/api/prospectSlice'

const ATTACH_OPTIONS = [
    ['first', 'Attach it to the first email (suggested)'],
    ['all', 'Attach it to every email'],
    ['off', 'Don’t attach it: the link and picture only']
]

const megabytes = bytes => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '')

// ? common providers: sending (SMTP) and reading replies (IMAP) in one click
const PRESETS = [
    {
        label: 'Zoho Mail (India)',
        smtpHost: 'smtp.zoho.in',
        smtpPort: '465',
        smtpSecure: true,
        imapHost: 'imap.zoho.in'
    },
    {
        label: 'Gmail / Google Workspace',
        smtpHost: 'smtp.gmail.com',
        smtpPort: '465',
        smtpSecure: true,
        imapHost: 'imap.gmail.com'
    },
    {
        label: 'Outlook / Microsoft 365',
        smtpHost: 'smtp.office365.com',
        smtpPort: '587',
        smtpSecure: false,
        imapHost: 'outlook.office365.com'
    },
    {
        label: 'Hostinger',
        smtpHost: 'smtp.hostinger.com',
        smtpPort: '465',
        smtpSecure: true,
        imapHost: 'imap.hostinger.com'
    },
    {
        label: 'GoDaddy',
        smtpHost: 'smtpout.secureserver.net',
        smtpPort: '465',
        smtpSecure: true,
        imapHost: 'imap.secureserver.net'
    }
]

const TEXTS = ['firstSubject', 'firstBody', 'followSubject', 'followBody', 'whatsappText']

const draftOf = settings => ({
    fromName: settings?.fromName || '',
    email: settings?.email || '',
    password: '',
    smtpHost: settings?.smtpHost || '',
    smtpPort: settings?.smtpPort ? String(settings.smtpPort) : '',
    smtpSecure: Boolean(settings?.smtpSecure),
    imapHost: settings?.imapHost || '',
    imapPort: settings?.imapPort ? String(settings.imapPort) : '',
    autoSend: Boolean(settings?.autoSend),
    dailyLimit: String(settings?.dailyLimit ?? 40),
    followUpDays: String(settings?.followUpDays ?? 3),
    maxFollowUps: String(settings?.maxFollowUps ?? 2),
    videoLink: settings?.videoLink || '',
    attachVideo: settings?.attachVideo || 'first',
    ...Object.fromEntries(TEXTS.map(key => [key, settings?.[key] || '']))
})

/**
 * The sales mailbox prospects are emailed from and replies are read from, the pace of the automatic emails, and the
 * wording of the first email, the follow-up and the WhatsApp message. The password is never shown: only whether one
 * is saved.
 */
function OutreachSettingsDialog({ open, onClose, onSaved }) {
    const dispatch = useDispatch()
    const { data, isFetching, isError, refetch } = useGetOutreachSettingsQuery(undefined, {
        skip: !open,
        refetchOnMountOrArgChange: true
    })
    const [save, { isLoading: saving }] = useSaveOutreachSettingsMutation()
    const [test, { isLoading: testing }] = useTestOutreachSettingsMutation()
    const [uploadMedia, { isLoading: uploading }] = useUploadOutreachMediaMutation()
    const [removeMedia] = useRemoveOutreachMediaMutation()
    const settings = data?.data || null
    const [draft, setDraft] = useState(draftOf(null))
    const [testResult, setTestResult] = useState(null)
    // ? the video and picture change at once on upload, without reloading the form (that would lose typed changes)
    const [media, setMedia] = useState({ video: null, poster: null })

    useEffect(() => {
        setDraft(draftOf(settings))
        setTestResult(null)
        setMedia({ video: settings?.video || null, poster: settings?.poster || null })
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

    const set = key => event =>
        setDraft(previous => ({
            ...previous,
            [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
        }))

    const applyPreset = event => {
        const preset = PRESETS.find(item => item.label === event.target.value)
        if (!preset) return
        setDraft(previous => ({
            ...previous,
            smtpHost: preset.smtpHost,
            smtpPort: preset.smtpPort,
            smtpSecure: preset.smtpSecure,
            imapHost: preset.imapHost,
            imapPort: '993'
        }))
    }

    const bodyOf = () => {
        const body = { ...draft }
        // ? an empty password box keeps the saved one
        if (!body.password) delete body.password
        return body
    }

    const handleTest = async () => {
        setTestResult(null)
        try {
            const result = await test(bodyOf()).unwrap()
            setTestResult({ ok: true, message: result?.message || 'It works.' })
        } catch (error) {
            setTestResult({ ok: false, message: error?.data?.message || 'The test did not work.' })
        }
    }

    const handleSave = async () => {
        try {
            await save(bodyOf()).unwrap()
            notify('Settings saved')
            refetch()
            if (onSaved) onSaved()
            onClose()
        } catch (error) {
            notify(error?.data?.message || 'Could not save the settings', 'error')
        }
    }

    const handleUpload = kind => async event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        try {
            const result = await uploadMedia({ kind, file }).unwrap()
            setMedia({ video: result?.data?.video || null, poster: result?.data?.poster || null })
            notify(result?.message || 'Uploaded')
        } catch (error) {
            notify(error?.data?.message || 'The upload did not work', 'error')
        }
    }

    const handleRemoveMedia = kind => async () => {
        try {
            const result = await removeMedia(kind).unwrap()
            setMedia({ video: result?.data?.video || null, poster: result?.data?.poster || null })
            notify(result?.message || 'Removed')
        } catch (error) {
            notify(error?.data?.message || 'Could not remove it', 'error')
        }
    }

    const resetText = key => setDraft(previous => ({ ...previous, [key]: settings?.defaults?.[key] || '' }))

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>Outreach settings</DialogTitle>
            <DialogContent dividers>
                {isFetching && !settings && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}
                {isError && <Alert severity='error'>The settings could not be loaded.</Alert>}
                {settings && (
                    <Stack spacing={2.5}>
                        {!settings.encryptionReady && (
                            <Alert severity='warning'>
                                The server can’t store passwords yet: add CREDENTIAL_ENCRYPTION_KEY to the API’s .env.
                            </Alert>
                        )}
                        {settings.lastError && <Alert severity='error'>Last problem: {settings.lastError}</Alert>}
                        {!draft.fromName.trim() && (
                            <Alert severity='info'>
                                Add your name below: the messages say “I’m {'{sender}'} from Travelytics”, and without a
                                name it reads “I’m Travelytics from Travelytics”.
                            </Alert>
                        )}

                        <Box>
                            <Typography variant='subtitle1' fontWeight={700}>
                                Sales mailbox
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Use a mailbox of its own, such as sales@travelytics.cloud, and an app password (not the
                                normal password). If cold emails get marked as spam, your agencies’ quotations still
                                arrive.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label='Your name (shown as the sender)'
                                value={draft.fromName}
                                onChange={set('fromName')}
                                fullWidth
                                size='small'
                            />
                            <TextField
                                label='Mailbox address'
                                value={draft.email}
                                onChange={set('email')}
                                fullWidth
                                size='small'
                            />
                            <TextField
                                label='App password'
                                type='password'
                                value={draft.password}
                                onChange={set('password')}
                                placeholder={settings.hasPassword ? 'Saved; type to change' : ''}
                                InputLabelProps={{ shrink: true }}
                                autoComplete='new-password'
                                fullWidth
                                size='small'
                            />
                        </Stack>
                        <TextField
                            select
                            label='Provider (fills the servers)'
                            value=''
                            onChange={applyPreset}
                            size='small'
                            sx={{ maxWidth: 320 }}
                        >
                            {PRESETS.map(preset => (
                                <MenuItem key={preset.label} value={preset.label}>
                                    {preset.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                            <TextField
                                label='SMTP server (sending)'
                                value={draft.smtpHost}
                                onChange={set('smtpHost')}
                                size='small'
                                fullWidth
                            />
                            <TextField
                                label='Port'
                                value={draft.smtpPort}
                                onChange={set('smtpPort')}
                                size='small'
                                sx={{ width: 110 }}
                            />
                            <FormControlLabel
                                control={<Checkbox checked={draft.smtpSecure} onChange={set('smtpSecure')} />}
                                label='SSL'
                            />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label='IMAP server (reading replies)'
                                value={draft.imapHost}
                                onChange={set('imapHost')}
                                size='small'
                                fullWidth
                                helperText='Replies mark the agency “Replied” and stop its follow-ups.'
                            />
                            <TextField
                                label='Port'
                                value={draft.imapPort}
                                onChange={set('imapPort')}
                                placeholder='993'
                                InputLabelProps={{ shrink: true }}
                                size='small'
                                sx={{ width: 110 }}
                            />
                        </Stack>
                        <Stack direction='row' spacing={2} alignItems='center'>
                            <Button variant='outlined' onClick={handleTest} disabled={testing}>
                                {testing ? 'Testing…' : 'Test the mailbox'}
                            </Button>
                            {testResult && (
                                <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ py: 0, flex: 1 }}>
                                    {testResult.message}
                                </Alert>
                            )}
                        </Stack>

                        <Divider />
                        <Box>
                            <Typography variant='subtitle1' fontWeight={700}>
                                Automatic emails
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Agencies you put on the automatic emails get the first email, then follow-ups. They go
                                Monday to Saturday, 10:00 to 18:00, one every few minutes. A reply, a bounce or an
                                opt-out stops them.
                            </Typography>
                        </Box>
                        <FormControlLabel
                            control={<Switch checked={draft.autoSend} onChange={set('autoSend')} />}
                            label={draft.autoSend ? 'Sending is on' : 'Sending is off'}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                label='Emails a day (at most)'
                                value={draft.dailyLimit}
                                onChange={set('dailyLimit')}
                                size='small'
                                helperText='Start at 30–40 for a new mailbox'
                            />
                            <TextField
                                label='Days between emails'
                                value={draft.followUpDays}
                                onChange={set('followUpDays')}
                                size='small'
                            />
                            <TextField
                                label='Follow-ups after the first'
                                value={draft.maxFollowUps}
                                onChange={set('maxFollowUps')}
                                size='small'
                            />
                        </Stack>

                        <Divider />
                        <Box>
                            <Typography variant='subtitle1' fontWeight={700}>
                                Wording
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {'{agency}'} becomes the agency’s name, {'{city}'} its city, {'{sender}'} your name and{' '}
                                {'{video}'} the video link. Every email ends with a “Don’t email me again” link.
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant='subtitle2' fontWeight={700}>
                                Demo video
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Upload the video once. It is attached to the emails you choose below, shared with the
                                WhatsApp message (on a phone, or Safari or Chrome on a Mac), and gets its own page that
                                {' {video}'} links to. The picture is what WhatsApp and the email show before anyone
                                presses play.
                            </Typography>
                        </Box>
                        {!settings.publicLinks && (
                            <Alert severity='warning'>
                                Set BASE_URL in the API’s .env (for example https://api.travelytics.cloud) so the
                                video’s page has a link that works outside this screen.
                            </Alert>
                        )}
                        {media.video?.missing && (
                            <Alert severity='error'>The video file is missing on the server. Upload it again.</Alert>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                            <Button variant='outlined' component='label' disabled={uploading}>
                                {media.video ? 'Replace the video' : 'Upload the video'}
                                <input
                                    hidden
                                    type='file'
                                    accept='video/mp4,video/quicktime,video/webm'
                                    onChange={handleUpload('video')}
                                />
                            </Button>
                            {media.video ? (
                                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                                    <Typography variant='body2'>
                                        {media.video.name} · {megabytes(media.video.size)}
                                    </Typography>
                                    {media.video.watchUrl && (
                                        <Button size='small' href={media.video.watchUrl} target='_blank' rel='noopener'>
                                            Open its page
                                        </Button>
                                    )}
                                    <Button size='small' color='error' onClick={handleRemoveMedia('video')}>
                                        Remove
                                    </Button>
                                </Stack>
                            ) : (
                                <Typography variant='body2' color='text.secondary'>
                                    MP4, at most {settings.maxVideoMb} MB (so it can go as an email attachment).
                                </Typography>
                            )}
                            {uploading && <CircularProgress size={20} />}
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                            <Button variant='outlined' component='label' disabled={uploading}>
                                {media.poster ? 'Replace the picture' : 'Upload a preview picture'}
                                <input
                                    hidden
                                    type='file'
                                    accept='image/jpeg,image/png,image/webp'
                                    onChange={handleUpload('poster')}
                                />
                            </Button>
                            {media.poster ? (
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <Box
                                        component='img'
                                        src={media.poster.url}
                                        alt='Preview picture'
                                        sx={{ width: 120, height: 63, objectFit: 'cover', borderRadius: 1 }}
                                    />
                                    <Button size='small' color='error' onClick={handleRemoveMedia('poster')}>
                                        Remove
                                    </Button>
                                </Stack>
                            ) : (
                                <Typography variant='body2' color='text.secondary'>
                                    1200 × 628 works best (JPG or PNG).
                                </Typography>
                            )}
                        </Stack>
                        <TextField
                            select
                            label='Emails with the video attached'
                            value={draft.attachVideo}
                            onChange={set('attachVideo')}
                            size='small'
                            sx={{ maxWidth: 420 }}
                            helperText='An attachment makes the email about 14 MB. A few mail servers turn big emails away; the link always goes too.'
                        >
                            {ATTACH_OPTIONS.map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label='Or a video link instead of the uploaded video’s page'
                            value={draft.videoLink}
                            onChange={set('videoLink')}
                            placeholder='https://youtu.be/…'
                            InputLabelProps={{ shrink: true }}
                            size='small'
                            helperText='Leave empty to use the uploaded video’s page.'
                        />
                        {[
                            ['firstSubject', 'First email: subject', 1],
                            ['firstBody', 'First email', 9],
                            ['followSubject', 'Follow-up: subject', 1],
                            ['followBody', 'Follow-up', 7],
                            ['whatsappText', 'WhatsApp message', 4]
                        ].map(([key, label, rows]) => (
                            <Box key={key}>
                                <TextField
                                    label={label}
                                    value={draft[key]}
                                    onChange={set(key)}
                                    multiline={rows > 1}
                                    minRows={rows > 1 ? rows : undefined}
                                    fullWidth
                                    size='small'
                                />
                                <Button size='small' onClick={() => resetText(key)} sx={{ mt: 0.5 }}>
                                    Use the suggested wording
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant='contained' onClick={handleSave} disabled={!settings || saving}>
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

OutreachSettingsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func
}

export default OutreachSettingsDialog
