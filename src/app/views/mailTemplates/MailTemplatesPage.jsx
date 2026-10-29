import { useCallback, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useGetMailTemplatesQuery, useSaveMailThemeMutation } from '@/app/store/slices/api/mailTemplateSlice'
import ConfirmDialog from './ConfirmDialog'
import KindList from './KindList'
import MailTemplateEditor from './MailTemplateEditor'
import ThemeSelect from './ThemeSelect'
import { describeFailure, groupKinds } from './mailTemplateFacts'

/**
 * The wording of the emails the system sends for the agency: guests' receipts and quotes, requests to hotels and transporters,
 * and the team's own notices. Each kind of email has a few texts (subject, greeting, closing…) that can be changed; the tables
 * and details inside an email are made from the booking and can't. How the emails look is a theme — one for all of them, and any
 * kind may have its own; a theme changes colours and layout, never the words. Only the agency's admins and managers may open it.
 */
export default function MailTemplatesPage() {
    const dispatch = useDispatch()
    const { data, isLoading, error } = useGetMailTemplatesQuery(undefined, { refetchOnMountOrArgChange: true })
    const [saveTheme, { isLoading: savingTheme }] = useSaveMailThemeMutation()
    const kinds = useMemo(() => (Array.isArray(data?.data?.kinds) ? data.data.kinds : []), [data])
    const themes = useMemo(() => (Array.isArray(data?.data?.themes) ? data.data.themes : []), [data])
    const themeForAll = data?.data?.themeForAll || 'classic'
    const canChooseTheme = data?.data?.canChooseTheme !== false

    // ? kind: a kind's key, or 'all'; theme: a theme's key, or null to follow the theme for all
    const chooseTheme = async (kind, theme) => {
        try {
            await saveTheme({ kind, theme }).unwrap()
            const name = themes.find(item => item.key === theme)?.label
            dispatch(
                openSnackbar({
                    open: true,
                    message: name ? `Theme set to ${name}` : 'Follows the theme for all emails',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (failure) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: describeFailure(failure, 'Couldn’t save the theme. Please try again.').message,
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: false
                })
            )
        }
    }
    const groups = useMemo(() => groupKinds(kinds), [kinds])
    const [chosen, setChosen] = useState(null)
    const [asking, setAsking] = useState(null) // the kind to open once the typing is given up
    const [locked, setLocked] = useState('')
    // ? whether the open kind has typing that isn't saved: read when another kind is chosen, so it needn't re-render the page
    const dirty = useRef(false)
    const onDirtyChange = useCallback(value => {
        dirty.current = value
    }, [])

    const activeKey = kinds.some(kind => kind.key === chosen) ? chosen : groups[0]?.kinds[0]?.key
    const active = kinds.find(kind => kind.key === activeKey) || null

    const choose = key => {
        if (key === activeKey) return
        if (dirty.current) setAsking(key)
        else setChosen(key)
    }
    const switchNow = () => {
        dirty.current = false
        setChosen(asking)
        setAsking(null)
    }

    let body
    if (isLoading) {
        body = <Skeleton variant='rounded' height={320} />
    } else if (error) {
        const failure = describeFailure(error, 'Couldn’t load the mail templates. Please reload the page.')
        let severity = 'error'
        if (failure.type === 'forbidden') severity = 'info'
        else if (failure.type === 'notReady') severity = 'warning'
        body = <Alert severity={severity}>{failure.message}</Alert>
    } else if (!kinds.length) {
        body = <Alert severity='info'>There are no emails to change yet.</Alert>
    } else {
        body = (
            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '260px minmax(0, 1fr)' },
                    alignItems: 'start'
                }}
            >
                <KindList groups={groups} activeKey={activeKey} onSelect={choose} />
                {active ? (
                    <MailTemplateEditor
                        key={active.key}
                        kind={active}
                        themes={themes}
                        themeForAll={themeForAll}
                        themeBusy={savingTheme || !canChooseTheme}
                        onThemeChange={theme => chooseTheme(active.key, theme || null)}
                        locked={locked}
                        onDirtyChange={onDirtyChange}
                        onLocked={setLocked}
                    />
                ) : null}
            </Box>
        )
    }

    const nextLabel = kinds.find(kind => kind.key === asking)?.label

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ '& .MuiButton-root': { textTransform: 'none' } }}>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600 }}>
                    Mail templates
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5, mb: 3, maxWidth: 720 }}>
                    Word the emails the system sends in your own way: the subject, the greeting, the closing and the
                    sign-off. The tables and booking details inside an email are filled in from the booking, so they
                    stay as they are. Anything you leave alone keeps following our default wording.
                </Typography>
                {themes.length && !error && !isLoading ? (
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                    >
                        <ThemeSelect
                            themes={themes}
                            value={themeForAll}
                            label='Theme for all emails'
                            disabled={savingTheme || !canChooseTheme}
                            onChange={theme => theme !== themeForAll && chooseTheme('all', theme)}
                            sx={{ minWidth: 240 }}
                        />
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                            {canChooseTheme
                                ? 'How every email looks: colours, header and buttons. The words and booking details stay the same. Any email can have its own theme below, and the person sending can pick another for one email.'
                                : 'Themes need the server update finished. Until then every email goes in the Classic theme.'}
                        </Typography>
                    </Stack>
                ) : null}
                {body}
                <ConfirmDialog
                    open={Boolean(asking)}
                    title='Leave without saving?'
                    confirmLabel='Discard and open it'
                    cancelLabel='Keep editing'
                    onConfirm={switchNow}
                    onCancel={() => setAsking(null)}
                >
                    You have changes to “{active?.label}” that aren’t saved. Opening “{nextLabel}” throws them away.
                </ConfirmDialog>
            </Box>
        </MainCard>
    )
}
