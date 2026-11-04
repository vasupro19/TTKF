import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Tooltip,
    Typography
} from '@mui/material'
import { OpenInNew, Settings, UploadFile, WhatsApp, ForwardToInbox } from '@mui/icons-material'
import ListPage from '@core/listing/ListPage'
import StatusBadge from '@core/components/StatusBadge'
import { openSnackbar } from '@app/store/slices/snackbar'
import {
    getProspects,
    useGetOutreachSettingsQuery,
    useGetProspectSummaryQuery,
    useProspectWhatsappOpenedMutation,
    useStartProspectSequenceMutation
} from '@/app/store/slices/api/prospectSlice'
import { dayOf, emailStateOf, filtersOf, statusOption } from './prospectFacts'
import ProspectDrawer from './ProspectDrawer'
import ProspectImportDialog from './ProspectImportDialog'
import OutreachSettingsDialog from './OutreachSettingsDialog'
import { canShareVideo, prefetchVideo, sendOnWhatsapp } from './whatsappVideo'

const column = (id, label, key, width, extra = {}) => ({
    id,
    label,
    key,
    search: false,
    sort: false,
    visible: true,
    minWidth: width,
    maxWidth: width,
    ...extra
})

const HEADERS = [
    column(0, 'Sr. No.', 's_no', 3.1, { isFrontend: true, stick: true, align: 'center' }),
    column(1, 'Agency', 'agency', 11, { stick: true }),
    column(2, 'Priority', 'priority', 4, { align: 'center' }),
    column(3, 'Status', 'statusBadge', 7),
    column(4, 'Email', 'emailState', 10),
    column(5, 'Last contacted', 'lastContacted', 6),
    column(6, 'Phone', 'phone', 9),
    column(7, 'Email address', 'email', 10)
]

// ? one number at the top of the screen
function Stat({ label, value, hint = '' }) {
    return (
        <Paper variant='outlined' sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                {label}
            </Typography>
            <Typography variant='h3' sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </Typography>
            {hint && (
                <Typography variant='caption' color='text.secondary'>
                    {hint}
                </Typography>
            )}
        </Paper>
    )
}

Stat.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    hint: PropTypes.string
}

/**
 * The super admin's sales list: travel agencies to sell Travelytics to. The counts at the top show how far outreach
 * has got; each agency can be sent a WhatsApp message (opened ready to send) or an email from the sales mailbox, or be
 * put on the automatic emails, which stop when the agency replies.
 */
function ProspectsPage() {
    const dispatch = useDispatch()
    const location = useLocation()
    const { data: summaryData, refetch: refetchSummary } = useGetProspectSummaryQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const summary = summaryData?.data || null
    const [whatsappOpened] = useProspectWhatsappOpenedMutation()
    const { data: settingsData, refetch: refetchSettings } = useGetOutreachSettingsQuery(undefined, {
        refetchOnMountOrArgChange: true
    })
    const uploaded = settingsData?.data?.video
    const video = uploaded && !uploaded.missing ? uploaded : null
    const sharesVideo = Boolean(video) && canShareVideo()
    const [startSequence, { isLoading: starting }] = useStartProspectSequenceMutation()

    const [openId, setOpenId] = useState(null)
    const [importOpen, setImportOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [confirmStart, setConfirmStart] = useState(false)
    const [reloadSignal, setReloadSignal] = useState(0)

    const reload = useCallback(() => {
        setReloadSignal(signal => signal + 1)
        refetchSummary()
    }, [refetchSummary])

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

    // ? the video is fetched ahead, so a click can share it at once
    useEffect(() => {
        if (sharesVideo) prefetchVideo(video.url, video.name)
    }, [sharesVideo, video?.url, video?.name])

    const whatsappTip = row => {
        if (!row.whatsappUrl) return 'No mobile number'
        return sharesVideo ? 'Share the video and the message to WhatsApp' : 'WhatsApp with the message ready'
    }

    const openWhatsapp = async row => {
        const result = await sendOnWhatsapp({ whatsappUrl: row.whatsappUrl, video })
        if (result === 'cancelled') return
        if (result === 'failed') {
            notify('The video could not be shared. Open the agency and use “Message only”.', 'error')
            return
        }
        try {
            await whatsappOpened({ id: row.id, withVideo: result === 'shared' }).unwrap()
            reload()
        } catch (error) {
            notify('WhatsApp opened, but it could not be noted on the list', 'warning')
        }
    }

    const handleStart = async () => {
        try {
            const result = await startSequence(location.search).unwrap()
            notify(result?.message || 'Started')
            reload()
        } catch (error) {
            notify(error?.data?.message || 'Could not start the emails', 'error')
        }
        setConfirmStart(false)
    }

    const rowsOf = useCallback(
        rows =>
            (rows || []).map(row => {
                const status = statusOption(row.status)
                return {
                    ...row,
                    agency: (
                        <Box sx={{ minWidth: 0 }}>
                            <Button
                                variant='text'
                                size='small'
                                onClick={() => setOpenId(Number(row.id))}
                                sx={{
                                    p: 0,
                                    minWidth: 0,
                                    fontWeight: 600,
                                    textAlign: 'left',
                                    textTransform: 'none',
                                    justifyContent: 'flex-start'
                                }}
                            >
                                {row.name}
                            </Button>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                {[row.city, row.region].filter(Boolean).join(', ')}
                            </Typography>
                        </Box>
                    ),
                    statusBadge: <StatusBadge type={status.badge} label={status.label} />,
                    emailState: emailStateOf(row),
                    lastContacted: dayOf(row.lastContactedAt) || '—'
                }
            }),
        []
    )

    const filters = useMemo(() => filtersOf(summary?.regions || []), [summary?.regions])
    const mailbox = summary?.mailbox
    const by = summary?.byStatus || {}

    const notice = (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
            {summary && (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: {
                            xs: 'repeat(2, minmax(0, 1fr))',
                            sm: 'repeat(4, minmax(0, 1fr))',
                            lg: 'repeat(8, minmax(0, 1fr))'
                        }
                    }}
                >
                    <Stat label='Agencies' value={summary.total} />
                    <Stat
                        label='Contacted'
                        value={summary.contacted}
                        hint={
                            summary.total ? `${Math.round((summary.contacted / summary.total) * 100)}% of the list` : ''
                        }
                    />
                    <Stat label='Reached this week' value={summary.reachedThisWeek} />
                    <Stat
                        label='Replied'
                        value={(by.replied || 0) + (by.demo || 0) + (by.trial || 0) + (by.won || 0)}
                        hint={`${summary.repliesThisWeek} replies this week`}
                    />
                    <Stat label='Demos booked' value={(by.demo || 0) + (by.trial || 0) + (by.won || 0)} />
                    <Stat label='Won' value={by.won || 0} />
                    <Stat label='Emails today' value={`${summary.emailsToday}/${summary.dailyLimit}`} />
                    <Stat label='On automatic emails' value={summary.onSequence} />
                </Box>
            )}
            {mailbox && !mailbox.ready && (
                <Alert
                    severity='info'
                    action={
                        <Button color='inherit' size='small' onClick={() => setSettingsOpen(true)}>
                            Set up
                        </Button>
                    }
                >
                    Add the sales mailbox to send emails from here. WhatsApp works without it.
                </Alert>
            )}
            {mailbox?.ready && !mailbox.autoSend && summary.onSequence > 0 && (
                <Alert
                    severity='warning'
                    action={
                        <Button color='inherit' size='small' onClick={() => setSettingsOpen(true)}>
                            Settings
                        </Button>
                    }
                >
                    {summary.onSequence} agencies are waiting for automatic emails, but sending is switched off.
                </Alert>
            )}
            {mailbox?.lastError && <Alert severity='error'>Sales mailbox: {mailbox.lastError}</Alert>}
            {mailbox?.ready && !mailbox.readsReplies && (
                <Alert severity='info'>
                    Add the IMAP server in Settings, so replies stop the follow-ups and show up here.
                </Alert>
            )}
        </Box>
    )

    return (
        <>
            <ListPage
                title='Prospects'
                subtitle='Travel agencies to sell Travelytics to, and how far each one has got.'
                noun='agencies'
                searchPlaceholder='Search agency, city, region, email or phone'
                headers={HEADERS}
                endpoint={getProspects}
                reqKey='getProspectsLKey'
                filters={filters}
                dates={false}
                rowsOf={rowsOf}
                csvName='prospects'
                canAdd={false}
                emptyTitle='No agencies yet'
                emptyText='Import the potential clients spreadsheet, or add an agency by hand.'
                reloadSignal={reloadSignal}
                notice={notice}
                extraActions={
                    <>
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={<UploadFile />}
                            onClick={() => setImportOpen(true)}
                        >
                            Add agencies
                        </Button>
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={<ForwardToInbox />}
                            onClick={() => setConfirmStart(true)}
                        >
                            Start automatic emails
                        </Button>
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={<Settings />}
                            onClick={() => setSettingsOpen(true)}
                        >
                            Settings
                        </Button>
                    </>
                }
                renderAction={row => (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title={whatsappTip(row)}>
                            <span>
                                <IconButton
                                    size='small'
                                    aria-label={`WhatsApp ${row.name}`}
                                    disabled={!row.whatsappUrl}
                                    onClick={() => openWhatsapp(row)}
                                    sx={{ color: '#25D366' }}
                                >
                                    <WhatsApp fontSize='small' />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title='Open: email, notes and timeline'>
                            <IconButton
                                size='small'
                                aria-label={`Open ${row.name}`}
                                onClick={() => setOpenId(Number(row.id))}
                            >
                                <OpenInNew fontSize='small' />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            />

            <ProspectDrawer prospectId={openId} onClose={() => setOpenId(null)} onChanged={reload} video={video} />
            <ProspectImportDialog open={importOpen} onClose={() => setImportOpen(false)} onDone={reload} />
            <OutreachSettingsDialog
                open={settingsOpen}
                onClose={() => {
                    setSettingsOpen(false)
                    refetchSettings()
                }}
                onSaved={reload}
            />

            <Dialog open={confirmStart} onClose={() => setConfirmStart(false)} maxWidth='xs' fullWidth>
                <DialogTitle>Start automatic emails?</DialogTitle>
                <DialogContent>
                    <Typography variant='body2'>
                        Every agency in the current filter that has an email address and hasn’t been emailed yet gets
                        the first email, then the follow-ups. They go Monday to Saturday, 10:00 to 18:00, up to{' '}
                        {summary?.dailyLimit || 40} a day, and stop when an agency replies.
                    </Typography>
                    {!mailbox?.autoSend && (
                        <Alert severity='info' sx={{ mt: 2 }}>
                            Sending is switched off in Settings: nothing goes until you switch it on.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStart(false)}>Cancel</Button>
                    <Button variant='contained' onClick={handleStart} disabled={starting}>
                        Start
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default ProspectsPage
