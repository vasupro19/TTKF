import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Box, LinearProgress, Skeleton, Typography } from '@mui/material'
import { usePreviewMailTemplateMutation } from '@/app/store/slices/api/mailTemplateSlice'
import { PREVIEW_DELAY_MS, describeFailure } from './mailTemplateFacts'

/**
 * The email as it would be sent, built by the server from sample data with the texts on screen (nothing is saved). It asks again
 * a moment after the last keystroke. The server's page goes into an iframe with every permission off: no scripts, no links
 * followed, nothing from it can touch this page.
 *
 * `slots` is the body's `slots`: only the texts that differ from what is saved. `theme` is the theme to draw it in (none: the one
 * the kind goes out in). `onProblems` hears the server's per-slot messages when a text can't be used (an unknown fill-in), or {}
 * when the preview worked.
 */
function MailPreview({ kindKey, slots, theme = '', onProblems }) {
    const [preview] = usePreviewMailTemplateMutation()
    const [shown, setShown] = useState(null) // { subject, html } of the last preview that worked
    const [loading, setLoading] = useState(true)
    const [failure, setFailure] = useState(null) // { message, fields } of the last preview that didn't

    // ? the latest of each, read when the wait is over, so the wait restarts only when the texts change
    const run = useRef(preview)
    const report = useRef(onProblems)
    const latest = useRef(slots)
    run.current = preview
    report.current = onProblems
    latest.current = slots
    const asked = useRef(false)
    const signature = JSON.stringify(slots)

    useEffect(() => {
        let stale = false
        // ? the first preview of a kind comes at once; later ones wait for the typing to stop. (Marked when it is sent, not when it
        // ? is planned: a plan that is dropped, as React's development mode does once on opening, doesn't count as a first.)
        const delay = asked.current ? PREVIEW_DELAY_MS : 0
        setLoading(true)
        const timer = setTimeout(async () => {
            asked.current = true
            try {
                const reply = await run
                    .current({ kind: kindKey, slots: latest.current, ...(theme ? { theme } : {}) })
                    .unwrap()
                if (stale) return
                setShown({ subject: reply?.data?.subject || '', html: reply?.data?.html || '' })
                setFailure(null)
                if (report.current) report.current({})
            } catch (error) {
                if (stale) return
                const problem = describeFailure(error, 'Couldn’t build the preview.')
                setFailure({ message: problem.message, fields: problem.type === 'fields' })
                if (report.current) report.current(problem.errors)
            }
            if (!stale) setLoading(false)
        }, delay)
        return () => {
            stale = true
            clearTimeout(timer)
        }
    }, [kindKey, signature, theme])

    return (
        <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>Preview</Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1 }}>
                What the email looks like with sample details, using the text you have typed.
            </Typography>
            <Box sx={{ height: 3, mb: 0.5 }}>
                {loading ? <LinearProgress aria-label='Updating the preview' /> : null}
            </Box>
            {failure ? (
                <Alert severity={failure.fields ? 'warning' : 'error'} sx={{ mb: 1 }}>
                    {failure.fields
                        ? 'The preview can’t be updated until the text marked in red is fixed.'
                        : failure.message}
                </Alert>
            ) : null}
            {shown ? (
                <>
                    <Typography sx={{ fontSize: '0.875rem', mb: 1 }}>
                        <Box component='span' sx={{ color: 'text.secondary' }}>
                            Subject:{' '}
                        </Box>
                        <Box component='span' data-testid='preview-subject' sx={{ fontWeight: 600 }}>
                            {shown.subject}
                        </Box>
                    </Typography>
                    <Box
                        component='iframe'
                        title='Email preview'
                        // ? an empty sandbox: no scripts, no forms, no links followed, and the page is treated as another site
                        sandbox=''
                        srcDoc={shown.html}
                        sx={{
                            display: 'block',
                            width: '100%',
                            height: { xs: 460, lg: 620 },
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: '#fff'
                        }}
                    />
                </>
            ) : null}
            {!shown && !failure ? <Skeleton variant='rounded' height={320} /> : null}
        </Box>
    )
}

MailPreview.propTypes = {
    kindKey: PropTypes.string.isRequired,
    slots: PropTypes.objectOf(PropTypes.string),
    theme: PropTypes.string,
    onProblems: PropTypes.func
}

export default MailPreview
