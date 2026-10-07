import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Avatar,
    Box,
    Button,
    ButtonBase,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Skeleton,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { CheckCircle, Facebook } from '@mui/icons-material'
import {
    useConnectFacebookPageMutation,
    useGetFacebookPageFormsQuery,
    useGetFacebookSessionFormsQuery,
    useGetFacebookSessionPagesQuery,
    useUpdateFacebookPageMutation
} from '@/app/store/slices/api/leadChannelsSlice'
import { FB_BLUE, errorMessage, formShape, pageShape, userShape } from './format'

// ? what the connect dialog says at each step
const HEADINGS = {
    page: ['Choose your Facebook page', 'The page your lead ads run on'],
    rules: [null, 'Choose which leads come in and who gets them'],
    done: ['Page connected', 'New leads from this page will appear in Leads within seconds']
}

// ? the line under a page's name in the picker
const captionOf = (page, connectedNow) => {
    if (connectedNow) return 'Connected just now'
    if (page.connected === 'here') return 'Already connected — connecting again refreshes it'
    if (page.connected === 'elsewhere') return 'Connected to another workspace'
    if (!page.canGetLeads) return 'Your role on this page may not allow reading leads'
    return `Page ID ${page.id}`
}

/** "All lead forms" or a chosen few, and who the leads go to */
function LeadRules({
    forms,
    formsLoading,
    formsProblem,
    allForms,
    setAllForms,
    chosen,
    setChosen,
    assignee,
    setAssignee,
    users
}) {
    const toggle = id =>
        setChosen(current => (current.includes(id) ? current.filter(each => each !== id) : [...current, id]))
    return (
        <Stack spacing={2.5}>
            <TextField
                select
                label='Give new leads to'
                value={assignee}
                onChange={event => setAssignee(event.target.value)}
                fullWidth
                required
                helperText='They can be reassigned from the lead later'
            >
                {users.map(user => (
                    <MenuItem key={user.id} value={String(user.id)}>
                        {user.name}
                    </MenuItem>
                ))}
            </TextField>

            <Box>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 0.5 }}>
                    Which lead forms?
                </Typography>
                <RadioGroup
                    value={allForms ? 'all' : 'some'}
                    onChange={event => setAllForms(event.target.value === 'all')}
                >
                    <FormControlLabel
                        value='all'
                        control={<Radio />}
                        label='Every lead form on this page, including new ones'
                    />
                    <FormControlLabel value='some' control={<Radio />} label='Only the forms I choose' />
                </RadioGroup>
                {!allForms && (
                    <Box
                        sx={{
                            mt: 1,
                            maxHeight: 260,
                            overflowY: 'auto',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 1
                        }}
                    >
                        {formsLoading && <Skeleton variant='rounded' height={80} />}
                        {!formsLoading && formsProblem && <Alert severity='warning'>{formsProblem}</Alert>}
                        {!formsLoading && !formsProblem && !forms.length && (
                            <Typography variant='body2' color='text.secondary' sx={{ p: 1 }}>
                                This page has no lead forms yet. Create one in Meta Ads Manager, or keep “every lead
                                form”.
                            </Typography>
                        )}
                        {forms.map(form => (
                            <FormControlLabel
                                key={form.id}
                                sx={{
                                    display: 'flex',
                                    mx: 0,
                                    px: 1,
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'grey.50' }
                                }}
                                control={
                                    <Checkbox checked={chosen.includes(form.id)} onChange={() => toggle(form.id)} />
                                }
                                label={
                                    <Stack direction='row' spacing={1} alignItems='center'>
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {form.name}
                                        </Typography>
                                        {form.status && form.status !== 'ACTIVE' && (
                                            <Chip size='small' label={form.status.toLowerCase()} />
                                        )}
                                        {form.leads !== null && form.leads !== undefined && (
                                            <Typography variant='caption' color='text.secondary'>
                                                {form.leads} leads
                                            </Typography>
                                        )}
                                    </Stack>
                                }
                            />
                        ))}
                        {chosen
                            .filter(id => !forms.some(form => form.id === id))
                            .map(id => (
                                <FormControlLabel
                                    key={id}
                                    sx={{ display: 'flex', mx: 0, px: 1 }}
                                    control={<Checkbox checked onChange={() => toggle(id)} />}
                                    label={<Typography variant='body2'>Form {id}</Typography>}
                                />
                            ))}
                    </Box>
                )}
            </Box>
        </Stack>
    )
}

LeadRules.propTypes = {
    forms: PropTypes.arrayOf(formShape).isRequired,
    formsLoading: PropTypes.bool,
    formsProblem: PropTypes.string,
    allForms: PropTypes.bool.isRequired,
    setAllForms: PropTypes.func.isRequired,
    chosen: PropTypes.arrayOf(PropTypes.string).isRequired,
    setChosen: PropTypes.func.isRequired,
    assignee: PropTypes.string.isRequired,
    setAssignee: PropTypes.func.isRequired,
    users: PropTypes.arrayOf(userShape).isRequired
}

/**
 * After the Facebook login: pick one of the pages the user manages, then which lead forms and who gets the
 * leads. Connecting subscribes the page to the app's lead webhook. Another page can be connected from the same
 * login afterwards.
 */
export function ConnectPageDialog({ session, users, onClose, onConnected }) {
    const { data, isLoading, isError, error } = useGetFacebookSessionPagesQuery(session, { skip: !session })
    const [connectPage, { isLoading: connecting }] = useConnectFacebookPageMutation()
    const [pageId, setPageId] = useState('')
    const [step, setStep] = useState('page')
    const [allForms, setAllForms] = useState(true)
    const [chosen, setChosen] = useState([])
    const [assignee, setAssignee] = useState('')
    const [failure, setFailure] = useState('')
    const [connectedIds, setConnectedIds] = useState([])

    const pages = data?.data?.pages || []
    const page = pages.find(each => each.id === pageId)
    const forms = useGetFacebookSessionFormsQuery(
        { session, pageId },
        { skip: !session || !pageId || step !== 'rules' || allForms }
    )

    useEffect(() => {
        if (!assignee && users.length) setAssignee(String(users[0].id))
    }, [users, assignee])

    const connect = async () => {
        setFailure('')
        try {
            const reply = await connectPage({
                session,
                pageId,
                defaultAssignedTo: Number(assignee),
                formIds: allForms ? [] : chosen
            }).unwrap()
            onConnected(reply?.message || 'Page connected')
            setConnectedIds(current => [...current, pageId])
            setStep('done')
        } catch (problem) {
            setFailure(errorMessage(problem, 'Couldn’t connect the page.'))
        }
    }

    const another = () => {
        setPageId('')
        setChosen([])
        setAllForms(true)
        setStep('page')
    }

    const expired = isError && error?.status === 404
    const selectable = each => each.connected !== 'elsewhere' && !connectedIds.includes(each.id)

    return (
        <Dialog open={Boolean(session)} onClose={connecting ? undefined : onClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                <Stack direction='row' spacing={1.5} alignItems='center'>
                    <Avatar sx={{ color: 'common.white', bgcolor: FB_BLUE, width: 36, height: 36 }}>
                        <Facebook />
                    </Avatar>
                    <Box>
                        <Typography variant='h4' component='span' sx={{ fontWeight: 700, display: 'block' }}>
                            {HEADINGS[step][0] || page?.name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            {HEADINGS[step][1]}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                {isLoading && <Skeleton variant='rounded' height={160} />}
                {expired && (
                    <Alert severity='warning'>
                        This Facebook login has expired. Close this and press Connect with Facebook again.
                    </Alert>
                )}
                {isError && !expired && (
                    <Alert severity='error'>{errorMessage(error, 'Couldn’t load your Facebook pages.')}</Alert>
                )}

                {step === 'page' && !isLoading && !isError && (
                    <Stack spacing={1}>
                        {!pages.length && (
                            <Alert severity='info'>
                                Facebook didn’t share any pages. Connect again and, when Facebook asks, choose your
                                business page and allow every permission.
                            </Alert>
                        )}
                        {pages.map(each => (
                            <ButtonBase
                                key={each.id}
                                disabled={!selectable(each)}
                                onClick={() => setPageId(each.id)}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: 2,
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    borderColor: pageId === each.id ? FB_BLUE : 'divider',
                                    bgcolor: pageId === each.id ? alpha(FB_BLUE, 0.05) : 'background.paper',
                                    opacity: selectable(each) ? 1 : 0.55
                                }}
                            >
                                <Stack direction='row' spacing={1.5} alignItems='center' sx={{ width: '100%' }}>
                                    <Avatar src={each.picture || undefined} sx={{ width: 40, height: 40 }}>
                                        {each.name?.[0]}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant='subtitle1' sx={{ fontWeight: 700 }} noWrap>
                                            {each.name}
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                            {captionOf(each, connectedIds.includes(each.id))}
                                        </Typography>
                                    </Box>
                                    {pageId === each.id && <CheckCircle sx={{ color: FB_BLUE }} />}
                                </Stack>
                            </ButtonBase>
                        ))}
                    </Stack>
                )}

                {step === 'rules' && (
                    <LeadRules
                        forms={forms.data?.data?.forms || []}
                        formsLoading={forms.isFetching}
                        formsProblem={forms.data?.data?.problem || ''}
                        allForms={allForms}
                        setAllForms={setAllForms}
                        chosen={chosen}
                        setChosen={setChosen}
                        assignee={assignee}
                        setAssignee={setAssignee}
                        users={users}
                    />
                )}

                {step === 'done' && (
                    <Stack spacing={2} alignItems='center' sx={{ py: 2, textAlign: 'center' }}>
                        <CheckCircle color='success' sx={{ fontSize: 56 }} />
                        <Typography variant='body1'>
                            <strong>{page?.name}</strong> is connected. Send a test lead from Meta’s Lead Ads Testing
                            Tool to see it arrive.
                        </Typography>
                        <Button
                            href='https://developers.facebook.com/tools/lead-ads-testing'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            Open the Lead Ads Testing Tool
                        </Button>
                    </Stack>
                )}

                {failure && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {failure}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                {step === 'rules' && (
                    <Button onClick={() => setStep('page')} disabled={connecting}>
                        Back
                    </Button>
                )}
                {step === 'done' && pages.some(selectable) && <Button onClick={another}>Connect another page</Button>}
                <Box sx={{ flex: 1 }} />
                <Button onClick={onClose} color='inherit' disabled={connecting}>
                    {step === 'done' ? 'Done' : 'Cancel'}
                </Button>
                {step === 'page' && (
                    <Button variant='contained' onClick={() => setStep('rules')} disabled={!page}>
                        Continue
                    </Button>
                )}
                {step === 'rules' && (
                    <Button
                        variant='contained'
                        onClick={connect}
                        disabled={connecting || !assignee || (!allForms && !chosen.length)}
                        startIcon={connecting ? <CircularProgress size={16} color='inherit' /> : null}
                        sx={{ bgcolor: FB_BLUE }}
                    >
                        {connecting ? 'Connecting…' : 'Connect page'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

ConnectPageDialog.propTypes = {
    session: PropTypes.string,
    users: PropTypes.arrayOf(userShape).isRequired,
    onClose: PropTypes.func.isRequired,
    onConnected: PropTypes.func.isRequired
}

/** change who a connected page's leads go to, and which of its forms are taken */
export function EditPageDialog({ page, users, onClose, onSaved }) {
    const [allForms, setAllForms] = useState(true)
    const [chosen, setChosen] = useState([])
    const [assignee, setAssignee] = useState('')
    const [failure, setFailure] = useState('')
    const [updatePage, { isLoading: saving }] = useUpdateFacebookPageMutation()
    const forms = useGetFacebookPageFormsQuery(page?.id, { skip: !page || allForms })

    useEffect(() => {
        if (!page) return
        setAllForms(!page.formIds?.length)
        setChosen(page.formIds || [])
        setAssignee(page.defaultAssignedTo ? String(page.defaultAssignedTo) : '')
        setFailure('')
    }, [page])

    const save = async () => {
        try {
            const reply = await updatePage({
                id: page.id,
                defaultAssignedTo: Number(assignee),
                formIds: allForms ? '' : chosen.join(',')
            }).unwrap()
            onSaved(reply?.message || 'Saved')
            onClose()
        } catch (problem) {
            setFailure(errorMessage(problem, 'Couldn’t save.'))
        }
    }

    return (
        <Dialog open={Boolean(page)} onClose={saving ? undefined : onClose} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{page?.name || `Page ${page?.pageId}`}</DialogTitle>
            <DialogContent dividers>
                <LeadRules
                    forms={forms.data?.data?.forms || []}
                    formsLoading={forms.isFetching}
                    formsProblem={forms.data?.data?.problem || ''}
                    allForms={allForms}
                    setAllForms={setAllForms}
                    chosen={chosen}
                    setChosen={setChosen}
                    assignee={assignee}
                    setAssignee={setAssignee}
                    users={users}
                />
                {failure && (
                    <Alert severity='error' sx={{ mt: 2 }}>
                        {failure}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color='inherit' disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    onClick={save}
                    disabled={saving || !assignee || (!allForms && !chosen.length)}
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

EditPageDialog.propTypes = {
    page: pageShape,
    users: PropTypes.arrayOf(userShape).isRequired,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired
}
