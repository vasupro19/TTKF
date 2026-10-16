import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Divider, Grid, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useDispatch, useSelector } from 'react-redux'
import { DeleteOutline, UploadFileOutlined } from '@mui/icons-material'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { setUserDetails } from '@app/store/slices/auth'
import { useGetCompanyQuery, useUpdateCompanyMutation } from '@/app/store/slices/api/companySlice'
import BrandMark from './BrandMark'
import { draftOf, formDataOf, isChanged, logoProblem, problemsOf } from './companyFacts'

const errorText = (error, fallback) => error?.data?.message || error?.message || fallback

/**
 * The agency's own details: the logo (shown in the menu, on quotes and on invoices), name, phone, address, website and
 * Instagram. The agency's owner and admins edit; everyone else sees them. The email is the login, so it can't change here.
 */
function CompanyProfile() {
    const dispatch = useDispatch()
    const user = useSelector(state => state.auth.user)
    const { data, isFetching, error } = useGetCompanyQuery(undefined, { refetchOnMountOrArgChange: true })
    const [save, { isLoading: saving }] = useUpdateCompanyMutation()
    const company = data?.data?.company
    const canEdit = Boolean(data?.data?.canEdit)

    const [draft, setDraft] = useState(() => draftOf(null))
    const [logo, setLogo] = useState(null) // a file chosen, not saved yet
    const [removeLogo, setRemoveLogo] = useState(false)
    const [touched, setTouched] = useState(false)
    const [logoError, setLogoError] = useState('')
    const fileInput = useRef(null)

    useEffect(() => {
        if (!company) return
        setDraft(draftOf(company))
        setLogo(null)
        setRemoveLogo(false)
        setTouched(false)
    }, [company])

    const preview = useMemo(() => (logo ? URL.createObjectURL(logo) : ''), [logo])
    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

    const problems = problemsOf(draft)
    const changed = company ? isChanged(draft, company, { logo, removeLogo }) : false
    const shown = key => (touched ? problems[key] : '')
    const set = key => event => setDraft(current => ({ ...current, [key]: event.target.value }))
    const shownLogo = preview || (removeLogo ? '' : company?.logo || '')

    const chooseLogo = event => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        const problem = logoProblem(file)
        setLogoError(problem)
        if (problem) return
        setLogo(file)
        setRemoveLogo(false)
    }

    const reset = () => {
        setDraft(draftOf(company))
        setLogo(null)
        setRemoveLogo(false)
        setLogoError('')
        setTouched(false)
    }

    const notify = (message, color) =>
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color },
                anchorOrigin: { vertical: 'top', horizontal: 'right' }
            })
        )

    const onSave = async () => {
        setTouched(true)
        if (Object.keys(problems).length) return
        try {
            const result = await save(formDataOf(draft, { logo, removeLogo })).unwrap()
            const saved = result?.data?.company
            // ? the menu reads the agency's name and logo from the signed-in user: update it now, not at the next sign-in
            if (saved && user) dispatch(setUserDetails({ ...user, clientName: saved.name, clientLogo: saved.logo }))
            notify('Company details saved', 'success')
        } catch (saveError) {
            notify(errorText(saveError, 'Couldn’t save the company details.'), 'error')
        }
    }

    return (
        <MainCard title='Company'>
            <Stack spacing={3} sx={{ maxWidth: 880 }}>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem' }}>
                    Your company’s name and logo appear in the menu, on every quote you send and on your invoices.
                </Typography>

                {error && <Alert severity='error'>{errorText(error, 'Couldn’t load the company details.')}</Alert>}
                {company && !canEdit && (
                    <Alert severity='info'>Only your agency’s owner or admins can change these details.</Alert>
                )}

                <Box
                    sx={theme => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        p: 2.5,
                        borderRadius: '12px',
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        flexWrap: 'wrap'
                    })}
                >
                    <BrandMark name={draft.name || company?.name} logo={shownLogo} size={88} />
                    <Stack spacing={1} sx={{ minWidth: 240, flex: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>Logo</Typography>
                        <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                            A square PNG or JPG on a plain background looks best. Up to 2 MB.
                        </Typography>
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <input
                                ref={fileInput}
                                type='file'
                                hidden
                                accept='image/png,image/jpeg,image/webp,image/gif'
                                onChange={chooseLogo}
                                data-testid='logo-input'
                            />
                            <Button
                                size='small'
                                variant='outlined'
                                startIcon={<UploadFileOutlined />}
                                disabled={!canEdit || saving}
                                onClick={() => fileInput.current?.click()}
                            >
                                {shownLogo ? 'Change logo' : 'Upload logo'}
                            </Button>
                            {shownLogo && (
                                <Button
                                    size='small'
                                    color='inherit'
                                    startIcon={<DeleteOutline />}
                                    disabled={!canEdit || saving}
                                    onClick={() => {
                                        setLogo(null)
                                        setRemoveLogo(true)
                                    }}
                                >
                                    Remove
                                </Button>
                            )}
                        </Stack>
                        {logoError && (
                            <Typography color='error' sx={{ fontSize: '0.8125rem' }}>
                                {logoError}
                            </Typography>
                        )}
                        {(logo || removeLogo) && (
                            <Typography color='text.secondary' sx={{ fontSize: '0.8125rem' }}>
                                {logo ? 'New logo chosen — save to use it.' : 'The logo will be removed when you save.'}
                            </Typography>
                        )}
                    </Stack>
                </Box>

                <Divider />

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Company name'
                            value={draft.name}
                            onChange={set('name')}
                            disabled={!canEdit}
                            error={Boolean(shown('name'))}
                            helperText={shown('name')}
                            inputProps={{ maxLength: 120 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Phone'
                            value={draft.phoneNumber}
                            onChange={set('phoneNumber')}
                            disabled={!canEdit}
                            error={Boolean(shown('phoneNumber'))}
                            helperText={shown('phoneNumber')}
                            inputProps={{ maxLength: 20 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Login email'
                            value={company?.email || ''}
                            disabled
                            helperText='This is the email you sign in with'
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Website'
                            value={draft.website}
                            onChange={set('website')}
                            disabled={!canEdit}
                            error={Boolean(shown('website'))}
                            helperText={shown('website') || 'Optional, like www.yourcompany.in'}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label='Address'
                            value={draft.address}
                            onChange={set('address')}
                            disabled={!canEdit}
                            error={Boolean(shown('address'))}
                            helperText={shown('address')}
                            inputProps={{ maxLength: 300 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label='Instagram'
                            value={draft.insta}
                            onChange={set('insta')}
                            disabled={!canEdit}
                            error={Boolean(shown('insta'))}
                            helperText={shown('insta') || 'Optional: @handle or a link'}
                        />
                    </Grid>
                </Grid>

                {canEdit && (
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                        <Button variant='contained' onClick={onSave} disabled={!changed || saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button color='inherit' onClick={reset} disabled={!changed || saving}>
                            Discard
                        </Button>
                        {(isFetching || saving) && <CircularProgress size={18} />}
                    </Stack>
                )}
            </Stack>
        </MainCard>
    )
}

export default CompanyProfile
