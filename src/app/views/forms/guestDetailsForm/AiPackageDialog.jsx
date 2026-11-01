import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { AutoAwesome } from '@mui/icons-material'
import { useAssistAiMutation, useLazyGetTravelImagesQuery } from '@/app/store/slices/api/aiSlice'
import { useCreatePlannedPackageMutation } from '@/app/store/slices/api/packageSlice'
import {
    buildHotelsRequest,
    daysFromPlan,
    packageNameFor,
    parseAiReply,
    planFromTrip,
    readHotels,
    stayPlaces,
    withPhotos
} from './aiPackage'
import { tripSummary } from './tripDetails'
import PlacesField from '../leads/PlacesField'
import { cleanPlaces, samePlaces } from '../leads/places'

// ? one empty list for every render: a new [] each time would reset the places the agent is typing
const NO_PLACES = []

const lower = name =>
    String(name || '')
        .trim()
        .toLowerCase()

const sleep = ms =>
    new Promise(resolve => {
        setTimeout(resolve, ms)
    })

/**
 * "Create package with AI": plans the days from the guest's trip details, saves them as a package of the quote's
 * trip (so the next lead can pick it), and hands the package to the quote.
 */
function AiPackageDialog({
    open,
    onClose,
    tripValues,
    region,
    campaignId,
    enquiry,
    replacingDays,
    quoteNo,
    onCreated,
    places = NO_PLACES,
    placeOptions = [],
    onSavePlaces = null
}) {
    const [extra, setExtra] = useState('')
    // ? the lead's places, checked here before planning; a change is saved back to the lead
    const [wanted, setWanted] = useState(places)
    useEffect(() => {
        if (open) setWanted(places)
    }, [open, places])
    const [phase, setPhase] = useState('idle')
    const [problem, setProblem] = useState(null)
    const [assistAi] = useAssistAiMutation()
    const [findPhotos] = useLazyGetTravelImagesQuery()
    const [createPlannedPackage] = useCreatePlannedPackageMutation()
    const busy = phase !== 'idle'

    // ? one request to the AI; the per-user limit (30 a minute) is waited out twice before giving up
    const ask = async (request, attempt = 0) => {
        try {
            return parseAiReply(await assistAi(request).unwrap())
        } catch (error) {
            if (error?.status === 429 && attempt < 2) {
                await sleep(20000)
                return ask(request, attempt + 1)
            }
            throw error
        }
    }

    // ? hotels (one AI request for all the places) and photos of the places; best effort: a place the AI or the photo
    //   search misses is saved without, and the agent fills it in the day as before
    const lookUp = async names => {
        if (!names.length) return { hotels: {}, photos: {} }
        const hotels = ask(buildHotelsRequest({ places: names, region }))
            .then(raw => readHotels(raw, names))
            .catch(() => ({}))
        const photos = Promise.all(
            names.map(place =>
                findPhotos(place, true)
                    .unwrap()
                    .then(result => (result?.urls || []).map(photo => photo.url).filter(Boolean))
                    .catch(() => [])
            )
        ).then(lists => Object.fromEntries(names.map((place, index) => [place, lists[index]])))
        return { hotels: await hotels, photos: await photos }
    }

    const create = async () => {
        setProblem(null)
        setPhase('planning')
        const route = cleanPlaces(wanted)
        if (onSavePlaces && !samePlaces(route, places)) await onSavePlaces(route)
        // ? looked up while the days are planned, from the places the planner settles on first
        let early = Promise.resolve({ hotels: {}, photos: {} })
        let earlyPlaces = []
        try {
            const trip = await planFromTrip({
                values: tripValues,
                region,
                enquiry,
                extra,
                ask,
                places: route,
                onPlaces: names => {
                    earlyPlaces = names
                    early = lookUp(names)
                }
            })
            if (trip.status !== 'ready') {
                const lines = [
                    ...(trip.questions || []).map(item => item.text),
                    ...(trip.conflicts || []).map(item => item.text)
                ]
                setProblem({
                    kind: 'needs',
                    lines: lines.length ? lines : ['The AI could not build a full plan from these details.']
                })
                return
            }
            setPhase('saving')
            const planned = daysFromPlan(trip)
            const stays = stayPlaces(planned)
            const known = new Set(earlyPlaces.map(lower))
            const found = await Promise.all([early, lookUp(stays.filter(place => !known.has(lower(place))))])
            const hotels = new Map(
                found.flatMap(item => Object.entries(item.hotels)).map(([name, h]) => [lower(name), h])
            )
            const photos = Object.assign({}, ...found.map(item => item.photos))
            const days = withPhotos(planned, photos)
            const saved = await createPlannedPackage({
                campaignId,
                name: packageNameFor(trip) || `${region || 'Trip'} package`,
                days,
                places: stays.map(name => ({ name, ...(hotels.get(lower(name)) || {}) }))
            }).unwrap()
            await onCreated(saved.data, days, trip.assumptions || [])
            setExtra('')
        } catch (error) {
            setProblem({
                kind: 'error',
                lines: [
                    error?.data?.message ||
                        'We couldn’t reach the AI just now. Nothing was changed — please try again in a minute.'
                ]
            })
        } finally {
            setPhase('idle')
        }
    }

    const summary = tripSummary(tripValues)

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth='sm'>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color='primary' fontSize='small' />
                Create package with AI
            </DialogTitle>
            <DialogContent>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mb: 2 }}>
                    The AI plans the route and every day from the trip details
                    {region ? ` for ${region}` : ''}, writes the days for this guest and saves the package, so you can
                    pick it again for the next lead.
                </Typography>
                {summary ? (
                    <Box sx={{ p: 1.5, mb: 2, borderRadius: 1, bgcolor: 'action.hover', fontSize: '0.875rem' }}>
                        {summary}
                    </Box>
                ) : null}
                {replacingDays ? (
                    <Alert severity='info' sx={{ mb: 2 }}>
                        This replaces the {replacingDays} day{replacingDays === 1 ? '' : 's'} now on Quote {quoteNo}.
                    </Alert>
                ) : null}
                {!campaignId ? (
                    <Alert severity='warning' sx={{ mb: 2 }}>
                        Pick the trip for this quote first (Himachal, Kashmir …): the package is saved under it.
                    </Alert>
                ) : null}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>Places & nights</Typography>
                <PlacesField
                    value={wanted}
                    onChange={setWanted}
                    options={placeOptions}
                    disabled={busy}
                    helperText={
                        cleanPlaces(wanted).length
                            ? 'The route, in this order. Saved on the lead.'
                            : 'Where the guest wants to go. Without places, the AI reads them from the notes.'
                    }
                />
                <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ mt: 2.5 }}
                    label='Anything else the guest wants? (optional)'
                    placeholder='e.g. Solang Valley, no long drives, a candle-light dinner'
                    value={extra}
                    onChange={event => setExtra(event.target.value)}
                    disabled={busy}
                    helperText='Must-see spots, things to avoid. The guest’s notes and enquiry are read too.'
                />
                {problem ? (
                    <Alert severity={problem.kind === 'error' ? 'error' : 'info'} sx={{ mt: 2 }}>
                        {problem.kind === 'needs' ? (
                            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                                The AI needs a little more. Add it above, then try again:
                            </Typography>
                        ) : null}
                        {problem.lines.map(line => (
                            <Typography key={line} sx={{ fontSize: '0.875rem' }}>
                                {line}
                            </Typography>
                        ))}
                    </Alert>
                ) : null}
                {busy ? (
                    <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 2 }} role='status'>
                        <CircularProgress size={18} />
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }}>
                            {phase === 'planning'
                                ? 'Planning the route, writing the days and finding hotels and photos…'
                                : 'Adding hotels and photos, then saving the package to the quote…'}
                        </Typography>
                    </Stack>
                ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button variant='contained' startIcon={<AutoAwesome />} onClick={create} disabled={busy || !campaignId}>
                    {problem?.kind === 'needs' ? 'Try again' : 'Create package'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

AiPackageDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    tripValues: PropTypes.objectOf(PropTypes.string).isRequired,
    region: PropTypes.string,
    campaignId: PropTypes.number,
    enquiry: PropTypes.string,
    replacingDays: PropTypes.number,
    quoteNo: PropTypes.number,
    onCreated: PropTypes.func.isRequired,
    places: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, nights: PropTypes.number })),
    placeOptions: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, group: PropTypes.string })),
    onSavePlaces: PropTypes.func
}

export default AiPackageDialog
