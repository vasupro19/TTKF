import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    MenuItem,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography
} from '@mui/material'
import { Add, AutoAwesome, Delete, Save } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import CustomButton from '@core/components/extended/CustomButton'
import { openSnackbar } from '@app/store/slices/snackbar'
import { getCampaigns } from '@/app/store/slices/api/campaignSlice'
import { getTravelImages } from '@/app/store/slices/api/aiSlice'
import { useCreatePackageClientMutation } from '@/app/store/slices/api/packageSlice'
import { getDestinationClients, useCreateDestinationClientMutation } from '@/app/store/slices/api/destinationSlice'
import { getItenaryClients, useCreateItenaryClientMutation } from '@/app/store/slices/api/itenarySlice'
import { useCreatePackageItenaryClientMutation } from '@/app/store/slices/api/packageItenarySlice'

const steps = ['Package', 'Destinations', 'Activities', 'Review']

const createDestinationRow = (name = '', nights = 1) => ({
    id: `${Date.now()}-${Math.random()}`,
    name,
    nights,
    delux_hotel: '',
    super_delux_hotel: '',
    luxury_hotel: '',
    premium_hotel: ''
})

const createActivityRow = (values = {}) => ({
    id: `${Date.now()}-${Math.random()}`,
    title: '',
    description: '',
    destinationName: '',
    destinationId: '',
    entryType: 'Stay',
    image: '',
    ...values
})

const createInsertedActivityTitle = entryType => {
    if (entryType === 'Transit') {
        return 'Transit Day'
    }

    if (entryType === 'FreshUp') {
        return 'Fresh Up Day'
    }

    return 'New Stay Day'
}

const toNormalized = value => (value || '').toString().trim().toLowerCase()

const parseDraftPrompt = prompt => {
    const lines = prompt
        .split(/\n|,/)
        .map(item => item.trim())
        .filter(Boolean)

    const destinations = []

    lines.forEach(line => {
        const match = line.match(/(\d+)\s*(?:n|night|nights)\s+(.+)/i)
        if (match) {
            destinations.push(createDestinationRow(match[2].trim(), Number(match[1]) || 1))
        }
    })

    return destinations
}

const buildSuggestedPackageName = destinationRows => {
    const validNames = destinationRows.map(item => item.name.trim()).filter(Boolean)

    if (!validNames.length) {
        return ''
    }

    const totalNights = destinationRows.reduce((sum, item) => sum + (Number(item.nights) || 0), 0)
    const totalDays = totalNights + 1

    return `${validNames.join(' - ')} ${totalDays}D/${totalNights}N`
}

const buildActivitiesFromDestinations = (destinationRows, originLocation = '') => {
    const activities = []
    const validOrigin = originLocation.trim()

    destinationRows.forEach((destination, index) => {
        const nights = Number(destination.nights) || 1
        const previousDestination = destinationRows[index - 1]

        if (index === 0 && validOrigin) {
            activities.push(
                createActivityRow({
                    title: `Transfer from ${validOrigin} to ${destination.name}`,
                    description: `Guest pickup from ${validOrigin} and transfer to ${destination.name}.`,
                    entryType: 'Transit'
                })
            )
        } else if (previousDestination) {
            activities.push(
                createActivityRow({
                    title: `Transfer to ${destination.name}`,
                    description: `Travel from ${previousDestination.name} to ${destination.name}.`,
                    entryType: 'Transit'
                })
            )
        }

        for (let day = 0; day < nights; day += 1) {
            activities.push(
                createActivityRow({
                    title: day === 0 ? `Arrival in ${destination.name}` : `Explore ${destination.name}`,
                    description:
                        day === 0
                            ? `Arrive in ${destination.name} and settle into your stay.`
                            : `Enjoy sightseeing and local experiences in ${destination.name}.`,
                    destinationName: destination.name,
                    destinationId: '',
                    entryType: 'Stay'
                })
            )
        }
    })

    return activities
}

const buildDefaultDescription = ({ entryType, destinationName, title, originLocation }) => {
    if (entryType === 'Transit') {
        if (originLocation && destinationName) {
            return `Guest pickup from ${originLocation} and comfortable transfer to ${destinationName}.`
        }

        if (destinationName) {
            return `Comfortable transfer and travel arrangements for reaching ${destinationName}.`
        }

        return 'Travel and transfer arrangements for the guest journey.'
    }

    if (entryType === 'FreshUp') {
        return 'Freshen up, relax, and get ready for the next part of the journey.'
    }

    if (destinationName) {
        return `Enjoy sightseeing, local experiences, and a comfortable stay in ${destinationName}.`
    }

    if (title) {
        return `Enjoy the planned experiences for ${title}.`
    }

    return 'Enjoy sightseeing and local experiences for the day.'
}

const copyHotelsFromDestination = (destination = {}) => ({
    delux_hotel: destination.delux_hotel || '',
    super_delux_hotel: destination.super_delux_hotel || '',
    luxury_hotel: destination.luxury_hotel || '',
    premium_hotel: destination.premium_hotel || ''
})

function PackageCreationWizard() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()

    const campaignContextId = location.state?.campaignId

    const [activeStep, setActiveStep] = useState(0)
    const [campaignOptions, setCampaignOptions] = useState([])
    const [existingDestinations, setExistingDestinations] = useState([])
    const [existingItenaries, setExistingItenaries] = useState([])
    const [draftPrompt, setDraftPrompt] = useState('')
    const [saving, setSaving] = useState(false)
    const [imageOptionsByRow, setImageOptionsByRow] = useState({})
    const [imageLoadingByRow, setImageLoadingByRow] = useState({})
    const imageAutofillTimeoutRef = useRef({})

    const [packageForm, setPackageForm] = useState({
        name: '',
        campaignId: campaignContextId?.toString() || '',
        originLocation: ''
    })
    const [destinations, setDestinations] = useState([createDestinationRow()])
    const [activities, setActivities] = useState([])

    const [createPackageClient] = useCreatePackageClientMutation()
    const [createDestinationClient] = useCreateDestinationClientMutation()
    const [createItenaryClient] = useCreateItenaryClientMutation()
    const [createPackageItenaryClient] = useCreatePackageItenaryClientMutation()

    const totalStayNights = useMemo(
        () => destinations.reduce((sum, item) => sum + (Number(item.nights) || 0), 0),
        [destinations]
    )
    const stayActivityCount = useMemo(() => activities.filter(item => item.entryType === 'Stay').length, [activities])
    const transitActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'Transit').length,
        [activities]
    )
    const freshUpActivityCount = useMemo(
        () => activities.filter(item => item.entryType === 'FreshUp').length,
        [activities]
    )

    const campaignIdNumber = packageForm.campaignId ? Number(packageForm.campaignId) : null
    const availableDestinationChips = useMemo(
        () => existingDestinations.filter(item => item.name?.trim()),
        [existingDestinations]
    )
    const existingDestinationMap = useMemo(
        () =>
            Object.fromEntries(
                existingDestinations.filter(item => item.name?.trim()).map(item => [toNormalized(item.name), item])
            ),
        [existingDestinations]
    )
    const existingItenaryMap = useMemo(
        () =>
            Object.fromEntries(
                existingItenaries.filter(item => item.title?.trim()).map(item => [toNormalized(item.title), item])
            ),
        [existingItenaries]
    )

    const loadCampaigns = useCallback(async () => {
        const { data } = await dispatch(getCampaigns.initiate())
        setCampaignOptions((data?.data || []).map(item => ({ label: item.title, value: item.id.toString() })))
    }, [dispatch])

    const loadCampaignDependencies = useCallback(
        async campaignId => {
            if (!campaignId) {
                setExistingDestinations([])
                setExistingItenaries([])
                return
            }

            const [destinationResponse, itenaryResponse] = await Promise.all([
                dispatch(getDestinationClients.initiate(`?campaignId=${campaignId}`, false)),
                dispatch(getItenaryClients.initiate(`?campaignId=${campaignId}`, false))
            ])

            setExistingDestinations(destinationResponse?.data?.data || [])
            setExistingItenaries(itenaryResponse?.data?.data || [])
        },
        [dispatch]
    )

    useEffect(() => {
        loadCampaigns()
    }, [loadCampaigns])

    useEffect(() => {
        if (campaignIdNumber) {
            loadCampaignDependencies(campaignIdNumber)
        }
    }, [campaignIdNumber, loadCampaignDependencies])

    const handlePackageChange = event => {
        const { name, value } = event.target
        setPackageForm(prev => ({ ...prev, [name]: value }))
    }

    const getMatchedDestination = useCallback(
        name => existingDestinationMap[toNormalized(name)],
        [existingDestinationMap]
    )
    const getMatchedItenary = useCallback(title => existingItenaryMap[toNormalized(title)], [existingItenaryMap])

    const buildDestinationRowFromValue = (name = '', nights = 1) => ({
        ...createDestinationRow(name, nights),
        ...copyHotelsFromDestination(getMatchedDestination(name))
    })

    const shouldReplaceDescription = ({ previousRow, nextDescription, field, nextValue }) => {
        if (!previousRow.description?.trim()) {
            return true
        }

        const previousMatchedItenary = getMatchedItenary(previousRow.title)
        const previousDefaultDescription = buildDefaultDescription({
            entryType: previousRow.entryType,
            destinationName: previousRow.destinationName,
            title: previousRow.title,
            originLocation: packageForm.originLocation
        })

        if (previousRow.description === previousMatchedItenary?.description) {
            return true
        }

        if (previousRow.description === previousDefaultDescription) {
            return true
        }

        if (field === 'description') {
            return false
        }

        return previousRow.description === nextDescription && nextValue !== previousRow[field]
    }

    const scheduleImageAutofillForRow = row => {
        const keyword = (row.destinationName || row.title || '').trim()
        if (!keyword || row.image) {
            return
        }

        const existingTimeout = imageAutofillTimeoutRef.current[row.id]
        if (existingTimeout) {
            clearTimeout(existingTimeout)
        }

        imageAutofillTimeoutRef.current[row.id] = setTimeout(async () => {
            setImageLoadingByRow(prev => ({ ...prev, [row.id]: true }))

            try {
                const response = await dispatch(getTravelImages.initiate(keyword, false))
                const nextOptions = response?.data?.urls || []
                const firstImage = nextOptions?.[0]?.url || ''

                setImageOptionsByRow(prev => ({ ...prev, [row.id]: nextOptions }))
                if (firstImage) {
                    setActivities(prev =>
                        prev.map(item => (item.id === row.id && !item.image ? { ...item, image: firstImage } : item))
                    )
                }
            } catch (error) {
                setImageOptionsByRow(prev => ({ ...prev, [row.id]: prev[row.id] || [] }))
            } finally {
                setImageLoadingByRow(prev => ({ ...prev, [row.id]: false }))
                delete imageAutofillTimeoutRef.current[row.id]
            }
        }, 600)
    }

    const updateDestinationRow = (rowId, field, value) => {
        setDestinations(prev =>
            prev.map(item => {
                if (item.id !== rowId) {
                    return item
                }

                const updated = { ...item, [field]: value }

                if (field === 'name') {
                    const matchedDestination = getMatchedDestination(value)
                    if (matchedDestination) {
                        Object.assign(updated, copyHotelsFromDestination(matchedDestination))
                    }
                }

                return updated
            })
        )
    }

    const addDestinationRow = () => setDestinations(prev => [...prev, createDestinationRow()])
    const removeDestinationRow = rowId => setDestinations(prev => prev.filter(item => item.id !== rowId))

    const addExistingDestination = destination => {
        const alreadyAdded = destinations.some(item => toNormalized(item.name) === toNormalized(destination.name))
        if (alreadyAdded) {
            return
        }

        setDestinations(prev => [
            ...prev,
            {
                ...buildDestinationRowFromValue(destination.name, 1),
                ...copyHotelsFromDestination(destination)
            }
        ])
    }

    const updateActivityRow = (rowId, field, value) => {
        let nextRowForImageAutofill = null

        setActivities(prev =>
            prev.map(item => {
                if (item.id !== rowId) {
                    return item
                }

                const updated = { ...item, [field]: value }
                if (field === 'entryType' && value !== 'Stay') {
                    updated.destinationName = ''
                    updated.destinationId = ''
                }

                const matchedItenary = getMatchedItenary(field === 'title' ? value : updated.title)
                const nextDescription =
                    matchedItenary?.description ||
                    buildDefaultDescription({
                        entryType: updated.entryType,
                        destinationName: updated.destinationName,
                        title: updated.title,
                        originLocation: packageForm.originLocation
                    })

                if (
                    shouldReplaceDescription({
                        previousRow: item,
                        nextDescription,
                        field,
                        nextValue: value
                    })
                ) {
                    updated.description = nextDescription
                }

                if (field === 'destinationName' && !updated.image) {
                    updated.image = ''
                }

                nextRowForImageAutofill = updated
                return updated
            })
        )

        if (field !== 'image' && field !== 'description' && nextRowForImageAutofill) {
            scheduleImageAutofillForRow(nextRowForImageAutofill)
        }
    }

    const addActivityRow = () => {
        const nextRow = createActivityRow({
            title: 'New Stay Day',
            description: buildDefaultDescription({ entryType: 'Stay' })
        })
        setActivities(prev => [...prev, nextRow])
    }
    const insertActivityRow = (index, entryType = 'Stay') => {
        const nextRow = createActivityRow({
            title: createInsertedActivityTitle(entryType),
            entryType,
            description: buildDefaultDescription({ entryType })
        })

        setActivities(prev => [...prev.slice(0, index), nextRow, ...prev.slice(index)])
    }

    const addSpecialActivityRow = entryType => {
        setActivities(prev => [
            ...prev,
            createActivityRow({
                title: entryType === 'Transit' ? 'Transit Day' : 'Fresh Up Day',
                description:
                    entryType === 'Transit'
                        ? 'Travel and transfer between destinations.'
                        : 'Freshen up and relax before continuing the journey.',
                entryType
            })
        ])
    }
    const removeActivityRow = rowId => setActivities(prev => prev.filter(item => item.id !== rowId))

    const fetchImagesForActivity = async row => {
        const keyword = row.destinationName || row.title

        if (!keyword?.trim()) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Add a title or destination first so I can search images.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setImageLoadingByRow(prev => ({ ...prev, [row.id]: true }))

        try {
            const response = await dispatch(getTravelImages.initiate(keyword, false))
            setImageOptionsByRow(prev => ({ ...prev, [row.id]: response?.data?.urls || [] }))
        } catch (error) {
            setImageOptionsByRow(prev => ({ ...prev, [row.id]: [] }))
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to fetch images right now.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setImageLoadingByRow(prev => ({ ...prev, [row.id]: false }))
        }
    }

    const autoFillImagesForActivities = async activityRows => {
        const rowsToUpdate = activityRows.filter(row => !row.image && (row.destinationName || row.title))

        if (!rowsToUpdate.length) {
            return
        }

        setImageLoadingByRow(prev => ({
            ...prev,
            ...Object.fromEntries(rowsToUpdate.map(row => [row.id, true]))
        }))

        const results = await Promise.all(
            rowsToUpdate.map(async row => {
                try {
                    const keyword = row.destinationName || row.title
                    const response = await dispatch(getTravelImages.initiate(keyword, false))
                    const firstImage = response?.data?.urls?.[0]?.url || ''
                    return { rowId: row.id, image: firstImage, options: response?.data?.urls || [] }
                } catch (error) {
                    return { rowId: row.id, image: '', options: [] }
                }
            })
        )

        setActivities(prev =>
            prev.map(item => {
                const matched = results.find(result => result.rowId === item.id)
                if (!matched || !matched.image || item.image) {
                    return item
                }

                return { ...item, image: matched.image }
            })
        )

        setImageOptionsByRow(prev => ({
            ...prev,
            ...Object.fromEntries(results.map(result => [result.rowId, result.options]))
        }))

        setImageLoadingByRow(prev => ({
            ...prev,
            ...Object.fromEntries(rowsToUpdate.map(row => [row.id, false]))
        }))
    }

    const handleGenerateFromPrompt = () => {
        const generatedDestinations = parseDraftPrompt(draftPrompt)
        const hydratedDestinations = generatedDestinations.map(item =>
            buildDestinationRowFromValue(item.name, item.nights)
        )

        if (!hydratedDestinations.length) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Use lines like "2N Shimla, 2N Manali" so I can draft destinations automatically.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        const generatedActivities = buildActivitiesFromDestinations(hydratedDestinations, packageForm.originLocation)
        setDestinations(hydratedDestinations)
        setActivities(generatedActivities)
        autoFillImagesForActivities(generatedActivities)
        setActiveStep(1)
    }

    const handleAutoBuildActivities = () => {
        const validDestinations = destinations.filter(item => item.name.trim())
        const generatedActivities = buildActivitiesFromDestinations(validDestinations, packageForm.originLocation).map(
            item => {
                const matchedItenary = getMatchedItenary(item.title)

                return {
                    ...item,
                    description:
                        matchedItenary?.description ||
                        item.description ||
                        buildDefaultDescription({
                            entryType: item.entryType,
                            destinationName: item.destinationName,
                            title: item.title,
                            originLocation: packageForm.originLocation
                        })
                }
            }
        )

        setActivities(generatedActivities)
        autoFillImagesForActivities(generatedActivities)
        setActiveStep(2)
    }

    const handleSuggestPackageName = () => {
        const suggestedName = buildSuggestedPackageName(destinations)

        if (!suggestedName) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Add destinations first so I can suggest a package name.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setPackageForm(prev => ({ ...prev, name: suggestedName }))
    }

    useEffect(() => {
        const timeouts = imageAutofillTimeoutRef.current
        return () => Object.values(timeouts).forEach(timeoutId => clearTimeout(timeoutId))
    }, [])

    useEffect(() => {
        setDestinations(prev =>
            prev.map(item =>
                item.name?.trim()
                    ? { ...item, ...copyHotelsFromDestination(getMatchedDestination(item.name) || item) }
                    : item
            )
        )
    }, [existingDestinationMap, getMatchedDestination])

    const validateCurrentStep = () => {
        if (activeStep === 0) {
            return packageForm.name.trim().length >= 3 && packageForm.campaignId
        }

        if (activeStep === 1) {
            return destinations.some(item => item.name.trim())
        }

        if (activeStep === 2) {
            return activities.some(item => item.title.trim())
        }

        return true
    }

    const handleNext = () => {
        if (!validateCurrentStep()) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Please complete the current step before moving ahead.',
                    variant: 'alert',
                    alert: { color: 'warning' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
            return
        }

        setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
    }

    const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0))

    const saveWizard = async () => {
        try {
            setSaving(true)

            const packageResponse = await createPackageClient({
                name: packageForm.name.trim(),
                campaignId: Number(packageForm.campaignId)
            }).unwrap()

            const packageId = packageResponse?.data?.id

            const validDestinations = destinations.filter(item => item.name.trim())
            const destinationResults = await Promise.all(
                validDestinations.map(async row => {
                    const existing = existingDestinations.find(
                        item => toNormalized(item.name) === toNormalized(row.name)
                    )

                    if (existing) {
                        return [toNormalized(row.name), existing]
                    }

                    const created = await createDestinationClient({
                        name: row.name.trim(),
                        campaignId: Number(packageForm.campaignId),
                        delux_hotel: row.delux_hotel || '',
                        super_delux_hotel: row.super_delux_hotel || '',
                        luxury_hotel: row.luxury_hotel || '',
                        premium_hotel: row.premium_hotel || ''
                    }).unwrap()

                    return [toNormalized(row.name), created?.data]
                })
            )

            const destinationMap = Object.fromEntries(destinationResults)

            const validActivities = activities.filter(item => item.title.trim())
            const uniqueActivityTitles = [...new Set(validActivities.map(item => item.title.trim()))]

            const itenaryResults = await Promise.all(
                uniqueActivityTitles.map(async title => {
                    const existing = existingItenaries.find(item => toNormalized(item.title) === toNormalized(title))

                    if (existing) {
                        return [toNormalized(title), existing]
                    }

                    const sourceActivity = validActivities.find(
                        item => toNormalized(item.title) === toNormalized(title)
                    )
                    const created = await createItenaryClient({
                        title,
                        description: sourceActivity?.description || '',
                        campaignId: Number(packageForm.campaignId)
                    }).unwrap()

                    return [toNormalized(title), created?.data]
                })
            )

            const itenaryMap = Object.fromEntries(itenaryResults)

            await Promise.all(
                validActivities.map(async row => {
                    const destinationRecord =
                        row.entryType === 'Stay' && row.destinationName
                            ? destinationMap[toNormalized(row.destinationName)] || null
                            : null

                    await createPackageItenaryClient({
                        packageId,
                        campaignId: Number(packageForm.campaignId),
                        itenaryId: itenaryMap[toNormalized(row.title)]?.id,
                        destinationId: destinationRecord?.id || null,
                        entryType: row.entryType,
                        image: row.image || ''
                    }).unwrap()
                })
            )

            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Package wizard completed successfully.',
                    variant: 'alert',
                    alert: { color: 'success' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )

            navigate(`/master/packages/${packageForm.campaignId}`)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: error?.data?.message || 'Unable to save package wizard data.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'right' }
                })
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant='h3'>Package Creation Wizard</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Create package, destinations, and day-wise activities together so the team doesn&apos;t have
                            to jump across masters.
                        </Typography>
                    </Box>

                    <Card sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant='h5'>Quick Draft</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Paste a simple prompt like `2N Shimla, 2N Manali` and we&apos;ll draft the
                                    destination and day plan for you.
                                </Typography>
                                <TextField
                                    multiline
                                    minRows={3}
                                    value={draftPrompt}
                                    onChange={event => setDraftPrompt(event.target.value)}
                                    placeholder='2N Shimla, 2N Manali, 1N Chandigarh'
                                />
                                <Box>
                                    <CustomButton startIcon={<AutoAwesome />} onClick={handleGenerateFromPrompt}>
                                        Generate Draft
                                    </CustomButton>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {activeStep === 0 && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label='Package Name'
                                            name='name'
                                            value={packageForm.name}
                                            onChange={handlePackageChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            select
                                            label='Campaign'
                                            name='campaignId'
                                            value={packageForm.campaignId}
                                            onChange={handlePackageChange}
                                            disabled={Boolean(campaignContextId)}
                                        >
                                            {campaignOptions.map(option => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label='Origin / Pickup City'
                                            name='originLocation'
                                            value={packageForm.originLocation}
                                            onChange={handlePackageChange}
                                            placeholder='Delhi, Chandigarh, Pathankot'
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <CustomButton
                                            variant='outlined'
                                            startIcon={<AutoAwesome />}
                                            onClick={handleSuggestPackageName}
                                        >
                                            Suggest Package Name
                                        </CustomButton>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {activeStep === 1 && (
                        <Stack spacing={2}>
                            {availableDestinationChips.length > 0 && (
                                <Card sx={{ borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Typography variant='h5'>Use Existing Campaign Destinations</Typography>
                                            <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                                                {availableDestinationChips.map(item => (
                                                    <Chip
                                                        key={item.id}
                                                        label={item.name}
                                                        variant='outlined'
                                                        onClick={() => addExistingDestination(item)}
                                                    />
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )}
                            {destinations.map((row, index) => (
                                <Card key={row.id} sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                <Typography variant='h5'>Destination {index + 1}</Typography>
                                                {destinations.length > 1 && (
                                                    <Button
                                                        color='error'
                                                        startIcon={<Delete />}
                                                        onClick={() => removeDestinationRow(row.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label='Destination Name'
                                                        value={row.name}
                                                        onChange={event =>
                                                            updateDestinationRow(row.id, 'name', event.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        fullWidth
                                                        type='number'
                                                        label='Nights'
                                                        value={row.nights}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'nights',
                                                                Math.max(1, Number(event.target.value) || 1)
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <Chip
                                                        color='primary'
                                                        label={`${Number(row.nights) + 1 || 2} day suggestion`}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Deluxe Hotel'
                                                        value={row.delux_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'delux_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Super Deluxe Hotel'
                                                        value={row.super_delux_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'super_delux_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Luxury Hotel'
                                                        value={row.luxury_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'luxury_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Premium Hotel'
                                                        value={row.premium_hotel}
                                                        onChange={event =>
                                                            updateDestinationRow(
                                                                row.id,
                                                                'premium_hotel',
                                                                event.target.value
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            <Stack direction='row' spacing={2}>
                                <CustomButton startIcon={<Add />} onClick={addDestinationRow}>
                                    Add Destination
                                </CustomButton>
                                <CustomButton
                                    variant='outlined'
                                    startIcon={<AutoAwesome />}
                                    onClick={handleAutoBuildActivities}
                                >
                                    Auto Build Day Plan
                                </CustomButton>
                            </Stack>
                        </Stack>
                    )}

                    {activeStep === 2 && (
                        <Stack spacing={2}>
                            <Alert severity='info'>
                                Stay entries will link to destinations and hotel suggestions. Transit and Fresh Up days
                                stay in the itinerary but won&apos;t count as hotel nights.
                            </Alert>
                            {activities.map((row, index) => (
                                <Card key={row.id} sx={{ borderRadius: 3 }}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack direction='row' spacing={1} flexWrap='wrap'>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'Stay')}
                                                >
                                                    Add Stay Before
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'Transit')}
                                                >
                                                    Add Transit Before
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index, 'FreshUp')}
                                                >
                                                    Add Fresh Up Before
                                                </CustomButton>
                                            </Stack>
                                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                <Typography variant='h5'>Day {index + 1}</Typography>
                                                {activities.length > 1 && (
                                                    <Button
                                                        color='error'
                                                        startIcon={<Delete />}
                                                        onClick={() => removeActivityRow(row.id)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </Stack>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={5}>
                                                    <TextField
                                                        fullWidth
                                                        label='Title'
                                                        value={row.title}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'title', event.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label='Entry Type'
                                                        value={row.entryType}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'entryType', event.target.value)
                                                        }
                                                    >
                                                        <MenuItem value='Stay'>Stay</MenuItem>
                                                        <MenuItem value='Transit'>Transit</MenuItem>
                                                        <MenuItem value='FreshUp'>Fresh Up</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        select
                                                        label='Destination'
                                                        value={row.destinationName}
                                                        disabled={row.entryType !== 'Stay'}
                                                        onChange={event =>
                                                            updateActivityRow(
                                                                row.id,
                                                                'destinationName',
                                                                event.target.value
                                                            )
                                                        }
                                                        helperText={
                                                            row.entryType !== 'Stay'
                                                                ? 'Destination is optional for transit and fresh up'
                                                                : ''
                                                        }
                                                    >
                                                        {destinations
                                                            .filter(item => item.name.trim())
                                                            .map(item => (
                                                                <MenuItem key={item.id} value={item.name}>
                                                                    {item.name}
                                                                </MenuItem>
                                                            ))}
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        multiline
                                                        minRows={2}
                                                        label='Description'
                                                        value={row.description}
                                                        onChange={event =>
                                                            updateActivityRow(row.id, 'description', event.target.value)
                                                        }
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Stack spacing={1.5}>
                                                        <Stack
                                                            direction='row'
                                                            spacing={1}
                                                            alignItems='center'
                                                            flexWrap='wrap'
                                                        >
                                                            <TextField
                                                                fullWidth
                                                                label='Image URL'
                                                                value={row.image}
                                                                onChange={event =>
                                                                    updateActivityRow(
                                                                        row.id,
                                                                        'image',
                                                                        event.target.value
                                                                    )
                                                                }
                                                            />
                                                            <CustomButton
                                                                variant='outlined'
                                                                startIcon={<AutoAwesome />}
                                                                onClick={() => fetchImagesForActivity(row)}
                                                                loading={Boolean(imageLoadingByRow[row.id])}
                                                            >
                                                                Fetch Images
                                                            </CustomButton>
                                                        </Stack>

                                                        {imageOptionsByRow[row.id]?.length > 0 && (
                                                            <Stack
                                                                direction='row'
                                                                spacing={1}
                                                                useFlexGap
                                                                flexWrap='wrap'
                                                            >
                                                                {imageOptionsByRow[row.id].slice(0, 6).map(image => (
                                                                    <Box
                                                                        key={image.url}
                                                                        onClick={() =>
                                                                            updateActivityRow(
                                                                                row.id,
                                                                                'image',
                                                                                image.url
                                                                            )
                                                                        }
                                                                        sx={{
                                                                            width: 108,
                                                                            cursor: 'pointer',
                                                                            border:
                                                                                row.image === image.url
                                                                                    ? '2px solid #1976d2'
                                                                                    : '1px solid #d1d5db',
                                                                            borderRadius: 2,
                                                                            overflow: 'hidden',
                                                                            bgcolor: 'white'
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            component='img'
                                                                            src={image.thumb}
                                                                            alt={row.title || 'Travel option'}
                                                                            sx={{
                                                                                width: '100%',
                                                                                height: 74,
                                                                                objectFit: 'cover',
                                                                                display: 'block'
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                            <Stack direction='row' spacing={1} flexWrap='wrap'>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'Stay')}
                                                >
                                                    Add Stay After
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'Transit')}
                                                >
                                                    Add Transit After
                                                </CustomButton>
                                                <CustomButton
                                                    variant='outlined'
                                                    onClick={() => insertActivityRow(index + 1, 'FreshUp')}
                                                >
                                                    Add Fresh Up After
                                                </CustomButton>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            <Box>
                                <Stack direction='row' spacing={2}>
                                    <CustomButton startIcon={<Add />} onClick={addActivityRow}>
                                        Add Stay Day
                                    </CustomButton>
                                    <CustomButton variant='outlined' onClick={() => addSpecialActivityRow('Transit')}>
                                        Add Transit Day
                                    </CustomButton>
                                    <CustomButton variant='outlined' onClick={() => addSpecialActivityRow('FreshUp')}>
                                        Add Fresh Up Day
                                    </CustomButton>
                                </Stack>
                            </Box>
                        </Stack>
                    )}

                    {activeStep === 3 && (
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant='h5'>Review</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='primary'
                                                label={`Campaign: ${packageForm.campaignId || 'Not selected'}`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='success'
                                                label={`${destinations.filter(item => item.name.trim()).length} destinations`}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Chip
                                                color='warning'
                                                label={`${activities.filter(item => item.title.trim()).length} day entries`}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                                        <Chip color='success' label={`${stayActivityCount} Stay`} />
                                        <Chip color='info' label={`${transitActivityCount} Transit`} />
                                        <Chip color='secondary' label={`${freshUpActivityCount} Fresh Up`} />
                                    </Stack>
                                    <Divider />
                                    <Typography variant='body2' color='text.secondary'>
                                        Total stay nights: {totalStayNights}. Transit and Fresh Up days will still be
                                        saved in the package plan, but only stay rows will drive hotel summaries.
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    <Stack direction='row' justifyContent='space-between'>
                        <Button disabled={activeStep === 0} onClick={handleBack}>
                            Back
                        </Button>

                        <Stack direction='row' spacing={2}>
                            <Button variant='outlined' onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            {activeStep === steps.length - 1 ? (
                                <CustomButton startIcon={<Save />} onClick={saveWizard} loading={saving}>
                                    Save Package Flow
                                </CustomButton>
                            ) : (
                                <CustomButton onClick={handleNext}>Next</CustomButton>
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            </Box>
        </MainCard>
    )
}

export default PackageCreationWizard
