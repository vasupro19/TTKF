import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Skeleton,
    Stack,
    Switch,
    Tooltip,
    Typography
} from '@mui/material'
import { Add, DeleteOutline, EditOutlined, MailOutline, MarkEmailRead, Refresh } from '@mui/icons-material'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    useGetLeadMailboxesQuery,
    useRemoveLeadMailboxMutation,
    useSyncLeadMailboxMutation,
    useUpdateLeadMailboxMutation
} from '@/app/store/slices/api/leadChannelsSlice'
import MailboxDialog from './MailboxDialog'
import { providerOf } from './mailProviders'
import { ChannelHeader, EmptyChannel, Fact, HowItWorks, StatusPill } from './shared'
import { ago, errorMessage, mailboxShape } from './format'

const BRAND = '#EA4335'

const STATUS = {
    active: { tone: 'success', label: 'Receiving leads' },
    waiting: { tone: 'info', label: 'First check in a moment' },
    paused: { tone: 'neutral', label: 'Paused' },
    error: { tone: 'error', label: 'Needs attention' }
}

function MailboxCard({ mailbox, canWrite, onEdit, onRemove, notify }) {
    const [syncMailbox, { isLoading: syncing }] = useSyncLeadMailboxMutation()
    const [updateMailbox, { isLoading: toggling }] = useUpdateLeadMailboxMutation()
    const provider = providerOf(mailbox.provider)
    const status = STATUS[mailbox.status] || STATUS.waiting

    const checkNow = async () => {
        try {
            const reply = await syncMailbox(mailbox.id).unwrap()
            notify(reply?.message || 'Checked', reply?.data?.result?.ok === false ? 'error' : 'success')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t check the mailbox.'), 'error')
        }
    }

    const toggle = async () => {
        try {
            await updateMailbox({ id: mailbox.id, active: !mailbox.active }).unwrap()
            notify(
                mailbox.active
                    ? 'Paused — no new leads from this mailbox'
                    : 'Resumed — new enquiries become leads again'
            )
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t change the mailbox.'), 'error')
        }
    }

    return (
        <Card variant='outlined' sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, opacity: mailbox.active ? 1 : 0.8 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar
                    variant='rounded'
                    sx={{
                        color: 'common.white',
                        bgcolor: provider.color,
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        fontWeight: 700
                    }}
                >
                    {provider.name[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                        <Typography variant='h5' sx={{ fontWeight: 700, wordBreak: 'break-all' }}>
                            {mailbox.email}
                        </Typography>
                        <StatusPill tone={status.tone} label={status.label} />
                    </Stack>
                    <Typography variant='caption' color='text.secondary'>
                        {provider.name} · {mailbox.host}:{mailbox.port}
                    </Typography>
                </Box>
                {canWrite && (
                    <Stack direction='row' spacing={0.5} alignItems='center'>
                        <Button
                            size='small'
                            variant='outlined'
                            onClick={checkNow}
                            disabled={syncing || !mailbox.active}
                            startIcon={syncing ? <CircularProgress size={14} /> : <Refresh />}
                        >
                            {syncing ? 'Checking…' : 'Check now'}
                        </Button>
                        <Tooltip title='Edit'>
                            <IconButton onClick={() => onEdit(mailbox)} aria-label='Edit mailbox'>
                                <EditOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={mailbox.active ? 'Pause' : 'Resume'}>
                            <span>
                                <Switch
                                    checked={mailbox.active}
                                    onChange={toggle}
                                    disabled={toggling}
                                    inputProps={{ 'aria-label': 'Active' }}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title='Remove'>
                            <IconButton onClick={() => onRemove(mailbox)} aria-label='Remove mailbox' color='error'>
                                <DeleteOutline />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Stack>

            {mailbox.lastError && mailbox.active && (
                <Alert
                    severity='error'
                    sx={{ mt: 2 }}
                    action={
                        canWrite ? (
                            <Button color='inherit' size='small' onClick={() => onEdit(mailbox)}>
                                Fix
                            </Button>
                        ) : null
                    }
                >
                    {mailbox.lastError}
                </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' } }}>
                <Fact label='Leads brought in' value={mailbox.leadsCaptured} />
                <Fact label='Last lead' value={ago(mailbox.lastLeadAt)} />
                <Fact label='Last checked' value={ago(mailbox.lastCheckedAt)} />
                <Fact label='Leads go to' value={mailbox.assignedToName || 'Agency admin'} />
                <Fact label='Only emails mentioning' value={mailbox.keywords || 'Every email'} />
            </Box>
        </Card>
    )
}

MailboxCard.propTypes = {
    mailbox: mailboxShape.isRequired,
    canWrite: PropTypes.bool,
    onEdit: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    notify: PropTypes.func.isRequired
}

/**
 * Email Leads: the agency connects the inbox its enquiries arrive in (Gmail, Zoho, Hostinger… with an app
 * password), and every new enquiry email becomes a lead. Each mailbox shows whether it is working, how many
 * leads it brought in, and what to fix when it can't be read.
 */
function EmailLeads() {
    const dispatch = useDispatch()
    const { data, isLoading, isError, refetch } = useGetLeadMailboxesQuery(undefined, {
        refetchOnMountOrArgChange: true,
        pollingInterval: 60000
    })
    const [removeMailbox, { isLoading: removing }] = useRemoveLeadMailboxMutation()
    const [dialog, setDialog] = useState({ open: false, mailbox: null })
    const [removal, setRemoval] = useState(null)

    const info = data?.data || {}
    // ? the API says whether this user may connect and change channels (the agency's owner and admins)
    const canWrite = Boolean(info.canManage)
    const mailboxes = info.mailboxes || []
    const blocked = info.setUp === false || info.encryptionReady === false

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

    const openDialog = (mailbox = null) => setDialog({ open: true, mailbox })

    const confirmRemove = async () => {
        try {
            const reply = await removeMailbox(removal.id).unwrap()
            notify(reply?.message || 'Mailbox removed')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t remove the mailbox.'), 'error')
        }
        setRemoval(null)
    }

    const connectButton = canWrite ? (
        <Button variant='contained' size='large' startIcon={<Add />} onClick={() => openDialog()} disabled={blocked}>
            Connect mailbox
        </Button>
    ) : null

    const content = () => {
        if (isLoading)
            return (
                <Stack spacing={2}>
                    <Skeleton variant='rounded' height={150} />
                    <Skeleton variant='rounded' height={150} />
                </Stack>
            )
        if (mailboxes.length)
            return (
                <Stack spacing={2}>
                    {mailboxes.map(mailbox => (
                        <MailboxCard
                            key={mailbox.id}
                            mailbox={mailbox}
                            canWrite={canWrite}
                            onEdit={openDialog}
                            onRemove={setRemoval}
                            notify={notify}
                        />
                    ))}
                </Stack>
            )
        return (
            <EmptyChannel
                icon={<MarkEmailRead sx={{ fontSize: 32 }} />}
                title='No mailbox connected yet'
                text='Connect your enquiry inbox — Gmail, Google Workspace, Zoho, Hostinger, GoDaddy or any other — and stop copying enquiries into the CRM by hand.'
                action={connectButton}
            />
        )
    }

    return (
        <Stack spacing={3} sx={{ pb: 4 }}>
            <ChannelHeader
                icon={<MailOutline sx={{ fontSize: 28 }} />}
                color={BRAND}
                title='Email Leads'
                subtitle='Connect the inbox your enquiries arrive in. Every new enquiry email becomes a lead — with the guest’s name, email, phone and message — assigned to your team within about two minutes.'
                action={mailboxes.length ? connectButton : null}
            />

            {info.setUp === false && (
                <Alert severity='warning'>{info.problem || 'Email leads are not set up on the server yet.'}</Alert>
            )}
            {info.encryptionReady === false && (
                <Alert severity='warning'>
                    The server can’t store mailbox passwords safely yet. Ask your administrator to set
                    CREDENTIAL_ENCRYPTION_KEY.
                </Alert>
            )}
            {isError && (
                <Alert severity='error' action={<Button onClick={refetch}>Retry</Button>}>
                    Couldn’t load your mailboxes.
                </Alert>
            )}

            {content()}

            <Box>
                <Typography variant='h5' sx={{ fontWeight: 700, mb: 1.5 }}>
                    How it works
                </Typography>
                <HowItWorks
                    steps={[
                        {
                            title: 'Create an app password',
                            text: 'A separate password just for the CRM, made in your email account’s security settings.'
                        },
                        {
                            title: 'Connect the mailbox here',
                            text: 'Pick your provider, enter the address and app password, and choose who gets the leads.'
                        },
                        {
                            title: 'Enquiries become leads',
                            text: 'Checked every 2 minutes. Emails stay unread in your inbox; nothing is moved or deleted.'
                        }
                    ]}
                />
            </Box>

            <MailboxDialog
                open={dialog.open}
                mailbox={dialog.mailbox}
                users={info.users || []}
                onClose={() => setDialog({ open: false, mailbox: null })}
                onSaved={message => notify(message)}
            />

            <Dialog open={Boolean(removal)} onClose={() => setRemoval(null)} maxWidth='xs' fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Remove {removal?.email}?</DialogTitle>
                <DialogContent>
                    <Typography variant='body2' color='text.secondary'>
                        New emails in this inbox will no longer become leads. Leads already brought in stay as they are,
                        and nothing in the mailbox changes. You can connect it again any time.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRemoval(null)} color='inherit'>
                        Keep it
                    </Button>
                    <Button variant='contained' color='error' onClick={confirmRemove} disabled={removing}>
                        {removing ? 'Removing…' : 'Remove mailbox'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    )
}

export default EmailLeads
