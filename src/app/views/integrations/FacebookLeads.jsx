import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
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
    Link,
    Skeleton,
    Stack,
    Switch,
    Tooltip,
    Typography
} from '@mui/material'
import { DeleteOutline, EditOutlined, Facebook, OpenInNew, VerifiedOutlined } from '@mui/icons-material'
import { openSnackbar } from '@app/store/slices/snackbar'
import { usePermission } from '@/hooks/usePermission'
import { PERMISSIONS } from '@/constants/permissions'
import {
    useCheckFacebookPageMutation,
    useDisconnectFacebookPageMutation,
    useGetFacebookConnectUrlMutation,
    useGetFacebookOverviewQuery,
    useUpdateFacebookPageMutation
} from '@/app/store/slices/api/leadChannelsSlice'
import { ConnectPageDialog, EditPageDialog } from './FacebookPageDialogs'
import { ChannelHeader, EmptyChannel, Fact, HowItWorks, StatusPill } from './shared'
import { FB_BLUE, ago, errorMessage, pageShape } from './format'

// ? why Facebook sent the user back without a page
const RETURN_ERRORS = {
    denied: 'Facebook login was cancelled. Press Connect with Facebook again and allow the permissions it asks for.',
    expired: 'That Facebook login took too long or was already used. Please connect again.',
    failed: 'Facebook didn’t complete the login. Please try again; if it keeps failing, ask your administrator to check the Meta app settings.'
}

const statusOf = page => {
    if (!page.isActive) return { tone: 'neutral', label: 'Paused' }
    if (page.tokenOk === false) return { tone: 'error', label: 'Reconnect needed' }
    if (page.subscribed === false) return { tone: 'warning', label: 'Not receiving leads' }
    if (page.tokenOk && page.subscribed) return { tone: 'success', label: 'Receiving leads' }
    return { tone: 'info', label: 'Couldn’t reach Facebook' }
}

function PageCard({ page, canWrite, onEdit, onDisconnect, onReconnect, notify }) {
    const [checkPage, { isLoading: checking }] = useCheckFacebookPageMutation()
    const [updatePage, { isLoading: toggling }] = useUpdateFacebookPageMutation()
    const status = statusOf(page)

    const check = async () => {
        try {
            const reply = await checkPage(page.id).unwrap()
            const healthy = reply?.data?.tokenOk && reply?.data?.subscribed
            notify(reply?.message || 'Checked', healthy ? 'success' : 'warning')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t check the page.'), 'error')
        }
    }

    const toggle = async () => {
        try {
            await updatePage({ id: page.id, isActive: !page.isActive }).unwrap()
            notify(page.isActive ? 'Paused — leads from this page are not taken' : 'Resumed')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t change the page.'), 'error')
        }
    }

    return (
        <Card variant='outlined' sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar src={page.picture || undefined} sx={{ width: 48, height: 48, bgcolor: FB_BLUE }}>
                    <Facebook />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                        <Typography variant='h5' sx={{ fontWeight: 700 }}>
                            {page.name || `Page ${page.pageId}`}
                        </Typography>
                        <StatusPill tone={status.tone} label={status.label} />
                    </Stack>
                    <Typography variant='caption' color='text.secondary'>
                        Page ID {page.pageId}
                    </Typography>
                </Box>
                {canWrite && (
                    <Stack direction='row' spacing={0.5} alignItems='center'>
                        <Button
                            size='small'
                            variant='outlined'
                            onClick={check}
                            disabled={checking}
                            startIcon={checking ? <CircularProgress size={14} /> : <VerifiedOutlined />}
                        >
                            {checking ? 'Checking…' : 'Check'}
                        </Button>
                        <Tooltip title='Edit'>
                            <IconButton onClick={() => onEdit(page)} aria-label='Edit page'>
                                <EditOutlined />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={page.isActive ? 'Pause' : 'Resume'}>
                            <span>
                                <Switch
                                    checked={page.isActive}
                                    onChange={toggle}
                                    disabled={toggling}
                                    inputProps={{ 'aria-label': 'Active' }}
                                />
                            </span>
                        </Tooltip>
                        <Tooltip title='Disconnect'>
                            <IconButton onClick={() => onDisconnect(page)} color='error' aria-label='Disconnect page'>
                                <DeleteOutline />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Stack>

            {page.isActive && page.problem && status.tone !== 'success' && (
                <Alert
                    severity={status.tone === 'error' ? 'error' : 'warning'}
                    sx={{ mt: 2 }}
                    action={
                        canWrite ? (
                            <Button color='inherit' size='small' onClick={page.tokenOk === false ? onReconnect : check}>
                                {page.tokenOk === false ? 'Reconnect' : 'Fix'}
                            </Button>
                        ) : null
                    }
                >
                    {page.problem}
                </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
                <Fact label='Leads go to' value={page.assignedToName || '—'} />
                <Fact label='Lead forms' value={page.formIds?.length ? `${page.formIds.length} chosen` : 'All forms'} />
                <Fact label='Connected' value={ago(page.connectedAt)} />
            </Box>
        </Card>
    )
}

PageCard.propTypes = {
    page: pageShape.isRequired,
    canWrite: PropTypes.bool,
    onEdit: PropTypes.func.isRequired,
    onDisconnect: PropTypes.func.isRequired,
    onReconnect: PropTypes.func.isRequired,
    notify: PropTypes.func.isRequired
}

/**
 * Facebook Leads: the agency logs in with Facebook, picks its page (and optionally which lead forms), and every
 * lead from its Facebook and Instagram lead ads arrives as a lead, assigned, within seconds.
 */
function FacebookLeads() {
    const dispatch = useDispatch()
    const canWrite = usePermission(PERMISSIONS.INTEGRATION_WRITE)
    const [params, setParams] = useSearchParams()
    const { data, isLoading, isError, refetch } = useGetFacebookOverviewQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const [getConnectUrl, { isLoading: redirecting }] = useGetFacebookConnectUrlMutation()
    const [disconnectPage, { isLoading: disconnecting }] = useDisconnectFacebookPageMutation()
    const [editing, setEditing] = useState(null)
    const [removal, setRemoval] = useState(null)
    const [session, setSession] = useState(null)
    const [returnError, setReturnError] = useState('')

    const info = data?.data || {}
    const pages = info.pages || []
    const users = info.users || []

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

    // ? back from the Facebook login: ?connect=<session> or ?error=<why>
    useEffect(() => {
        const connect = params.get('connect')
        const error = params.get('error')
        if (!connect && !error) return
        if (connect && /^[a-f0-9]{32}$/.test(connect)) setSession(connect)
        if (error) setReturnError(RETURN_ERRORS[error] || RETURN_ERRORS.failed)
        setParams({}, { replace: true })
    }, [params, setParams])

    const startConnect = async () => {
        try {
            const reply = await getConnectUrl().unwrap()
            const url = reply?.data?.url
            if (url) window.location.assign(url)
            else notify('Facebook login link not received.', 'error')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t start the Facebook login.'), 'error')
        }
    }

    const confirmDisconnect = async () => {
        try {
            const reply = await disconnectPage(removal.id).unwrap()
            notify(reply?.message || 'Page disconnected')
        } catch (error) {
            notify(errorMessage(error, 'Couldn’t disconnect the page.'), 'error')
        }
        setRemoval(null)
    }

    let connectLabel = pages.length ? 'Connect another page' : 'Connect with Facebook'
    if (redirecting) connectLabel = 'Opening Facebook…'

    const connectButton = canWrite ? (
        <Button
            variant='contained'
            size='large'
            onClick={startConnect}
            disabled={redirecting || info.appConfigured === false}
            startIcon={redirecting ? <CircularProgress size={18} color='inherit' /> : <Facebook />}
            sx={{ bgcolor: FB_BLUE, '&:hover': { bgcolor: '#166FE5' }, fontWeight: 700 }}
        >
            {connectLabel}
        </Button>
    ) : null

    const content = () => {
        if (isLoading) return <Skeleton variant='rounded' height={150} />
        if (pages.length)
            return (
                <Stack spacing={2}>
                    {pages.map(page => (
                        <PageCard
                            key={page.id}
                            page={page}
                            canWrite={canWrite}
                            onEdit={setEditing}
                            onDisconnect={setRemoval}
                            onReconnect={startConnect}
                            notify={notify}
                        />
                    ))}
                </Stack>
            )
        return (
            <EmptyChannel
                icon={<Facebook sx={{ fontSize: 34, color: FB_BLUE }} />}
                title='No Facebook page connected yet'
                text='Log in with the Facebook account that manages your business page. You’ll choose the page, and leads start arriving straight away — no codes or tokens to copy.'
                action={connectButton}
            />
        )
    }

    return (
        <Stack spacing={3} sx={{ pb: 4 }}>
            <ChannelHeader
                icon={<Facebook sx={{ fontSize: 30 }} />}
                color={FB_BLUE}
                title='Facebook Leads'
                subtitle='Connect your Facebook page and every lead from your Facebook and Instagram lead ads arrives here within seconds — with every answer from the form, matched to your trip and assigned to your team.'
                action={pages.length ? connectButton : null}
            />

            {returnError && (
                <Alert severity='warning' onClose={() => setReturnError('')}>
                    {returnError}
                </Alert>
            )}
            {info.appConfigured === false && (
                <Alert severity='info'>
                    Facebook isn’t switched on for this CRM yet. Your administrator needs to finish the Meta app set-up;
                    then this button will work.
                </Alert>
            )}
            {isError && (
                <Alert severity='error' action={<Button onClick={refetch}>Retry</Button>}>
                    Couldn’t load your Facebook pages.
                </Alert>
            )}

            {Boolean(pages.length) && (
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                    {[
                        ['Pages connected', pages.length],
                        ['Facebook leads, last 30 days', info.stats?.last30Days ?? '—'],
                        ['Last Facebook lead', ago(info.stats?.lastLeadAt)]
                    ].map(([label, value]) => (
                        <Card key={label} variant='outlined' sx={{ borderRadius: 3, p: 2 }}>
                            <Typography variant='caption' color='text.secondary'>
                                {label}
                            </Typography>
                            <Typography variant='h3' sx={{ fontWeight: 700, mt: 0.5 }}>
                                {value}
                            </Typography>
                        </Card>
                    ))}
                </Box>
            )}

            {content()}

            <Box>
                <Typography variant='h5' sx={{ fontWeight: 700, mb: 1.5 }}>
                    How it works
                </Typography>
                <HowItWorks
                    steps={[
                        {
                            title: 'Connect with Facebook',
                            text: 'Log in with a Facebook account that is an admin of your business page, and allow the permissions asked for.'
                        },
                        {
                            title: 'Choose the page',
                            text: 'Pick the page your lead ads run on, the lead forms to take (or all), and who gets the leads.'
                        },
                        {
                            title: 'Leads arrive instantly',
                            text: (
                                <>
                                    Every form submission becomes a lead.{' '}
                                    <Link
                                        href='https://developers.facebook.com/tools/lead-ads-testing'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        Send a test lead <OpenInNew sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                                    </Link>
                                </>
                            )
                        }
                    ]}
                />
            </Box>

            <ConnectPageDialog
                session={session}
                users={users}
                onClose={() => {
                    setSession(null)
                    refetch()
                }}
                onConnected={message => {
                    notify(message)
                    refetch()
                }}
            />

            <EditPageDialog
                page={editing}
                users={users}
                onClose={() => setEditing(null)}
                onSaved={message => notify(message)}
            />

            <Dialog open={Boolean(removal)} onClose={() => setRemoval(null)} maxWidth='xs' fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Disconnect {removal?.name || 'this page'}?</DialogTitle>
                <DialogContent>
                    <Typography variant='body2' color='text.secondary'>
                        New leads from this page’s lead ads will no longer come into the CRM. Leads already here stay.
                        You can connect it again any time.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setRemoval(null)} color='inherit'>
                        Keep it
                    </Button>
                    <Button variant='contained' color='error' onClick={confirmDisconnect} disabled={disconnecting}>
                        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    )
}

export default FacebookLeads
