import { useEffect, useMemo, useState } from 'react'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'
import { Add, DeleteOutline } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import MainCard from '@core/components/extended/MainCard'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useGetVehiclesQuery, useSaveVehiclesMutation } from '@/app/store/slices/api/vehicleSlice'
import { RateInput, RateTick } from '../rates/rateFields'
import {
    blankVehicle,
    changedVehicles,
    draftVehicle,
    vehicleDuplicates,
    vehiclePayload,
    vehicleProblem
} from './vehicleFacts'

const cell = { py: 0.75, px: 0.75, verticalAlign: 'top' }

/**
 * The agency's own vehicles: add the ones you quote and book. The trip form, the supplier form and the rate card offer this
 * list. A saved vehicle keeps its name — rates and trips find it by that name — so hide it from the lists, or remove it and add
 * the new name. Removing a vehicle takes nothing else with it: its rates and the trips that used it stay as they were.
 */
export default function VehiclesPage() {
    const dispatch = useDispatch()
    const { data, isLoading, error } = useGetVehiclesQuery(undefined, { refetchOnMountOrArgChange: true })
    const [save, { isLoading: saving }] = useSaveVehiclesMutation()
    const saved = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data])
    const canEdit = data?.summary?.canEdit === true
    const ready = data?.summary?.ready === true
    const original = useMemo(() => saved.map(draftVehicle), [saved])
    const [rows, setRows] = useState(original)
    const [removeIds, setRemoveIds] = useState([])
    const [showProblems, setShowProblems] = useState(false)
    const [serverProblem, setServerProblem] = useState('')

    useEffect(() => {
        setRows(original)
        setRemoveIds([])
        setShowProblems(false)
        setServerProblem('')
    }, [original])

    const changes = useMemo(() => changedVehicles(rows, original), [rows, original])
    const duplicates = useMemo(() => vehicleDuplicates(rows), [rows])
    const unsaved = changes.length > 0 || removeIds.length > 0
    const problemOf = row => duplicates[row.key] || (changes.includes(row) ? vehicleProblem(row) : '')
    const hasProblem = changes.some(row => problemOf(row)) || Object.keys(duplicates).length > 0

    const update = (key, field, value) =>
        setRows(current => current.map(row => (row.key === key ? { ...row, [field]: value } : row)))
    const removeRow = row => {
        if (row.id) setRemoveIds(current => [...current, row.id])
        setRows(current => current.filter(item => item.key !== row.key))
    }
    const discard = () => {
        setRows(original)
        setRemoveIds([])
        setShowProblems(false)
        setServerProblem('')
    }

    const handleSave = async () => {
        setServerProblem('')
        if (hasProblem) {
            setShowProblems(true)
            return
        }
        try {
            await save({ rows: changes.map(vehiclePayload), removeIds }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Vehicles saved',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (problem) {
            setServerProblem(problem?.data?.message || 'Couldn’t save the vehicles. Please try again.')
        }
    }

    let body
    if (isLoading) {
        body = <Skeleton variant='rounded' height={220} />
    } else if (error) {
        body = <Alert severity='error'>Couldn’t load the vehicles. Please reload the page.</Alert>
    } else if (!ready) {
        body = (
            <Alert severity='info'>
                The vehicle list needs a one-time update on the server: run node Scripts/upgradeQuotes.js --fix, then
                restart the API. Until then the forms offer the built-in vehicles.
            </Alert>
        )
    } else {
        body = (
            <>
                {serverProblem ? (
                    <Alert severity='error' sx={{ mb: 2 }}>
                        {serverProblem}
                    </Alert>
                ) : null}
                {canEdit ? null : (
                    <Alert severity='info' sx={{ mb: 2 }}>
                        The operations team and the agency’s admins change this list.
                    </Alert>
                )}
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 640 }}>
                    <Table size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...cell, minWidth: 220 }}>Vehicle</TableCell>
                                <TableCell sx={{ ...cell, width: 90 }}>Seats</TableCell>
                                <TableCell sx={{ ...cell, width: 110 }}>Show in lists</TableCell>
                                <TableCell sx={{ ...cell, width: 56 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        No vehicles yet. Add the ones you quote and book.
                                    </TableCell>
                                </TableRow>
                            ) : null}
                            {rows.map((row, index) => {
                                const problem = problemOf(row)
                                const number = index + 1
                                return [
                                    <TableRow key={row.key} hover>
                                        <TableCell sx={cell}>
                                            <Tooltip
                                                title={
                                                    row.id
                                                        ? 'A saved vehicle’s name can’t change: rates and trips use it. Hide it, or remove it and add the new name.'
                                                        : ''
                                                }
                                            >
                                                <span>
                                                    <RateInput
                                                        label={`Vehicle, row ${number}`}
                                                        placeholder='Innova Crysta'
                                                        maxLength={60}
                                                        autoComplete='off'
                                                        value={row.name}
                                                        disabled={!canEdit || Boolean(row.id)}
                                                        invalid={showProblems && Boolean(problem)}
                                                        onChange={event => update(row.key, 'name', event.target.value)}
                                                    />
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell sx={cell}>
                                            <RateInput
                                                label={`Seats, row ${number}`}
                                                inputMode='numeric'
                                                placeholder='Seats'
                                                value={row.seats}
                                                disabled={!canEdit}
                                                onChange={event =>
                                                    update(row.key, 'seats', event.target.value.replace(/[^0-9]/g, ''))
                                                }
                                            />
                                        </TableCell>
                                        <TableCell sx={cell}>
                                            <Box
                                                sx={{
                                                    pointerEvents: canEdit ? 'auto' : 'none',
                                                    opacity: canEdit ? 1 : 0.6
                                                }}
                                            >
                                                <RateTick
                                                    label={`Show in lists, row ${number}`}
                                                    checked={row.active}
                                                    onChange={event => update(row.key, 'active', event.target.checked)}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ ...cell, whiteSpace: 'nowrap' }}>
                                            {canEdit ? (
                                                <Tooltip title='Remove this vehicle (its rates and old trips stay as they were)'>
                                                    <IconButton
                                                        size='small'
                                                        color='error'
                                                        aria-label={`Remove vehicle ${number}`}
                                                        onClick={() => removeRow(row)}
                                                    >
                                                        <DeleteOutline fontSize='small' />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>,
                                    showProblems && problem ? (
                                        <TableRow key={`${row.key}-problem`}>
                                            <TableCell colSpan={4} sx={{ py: 0.25, borderBottom: 'none' }}>
                                                <Typography color='error' role='alert' sx={{ fontSize: '0.8125rem' }}>
                                                    Row {number}: {problem}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : null
                                ]
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {canEdit ? (
                    <Stack
                        direction='row'
                        spacing={1.5}
                        alignItems='center'
                        sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}
                    >
                        <Button
                            size='small'
                            variant='outlined'
                            startIcon={<Add />}
                            onClick={() => setRows(current => [...current, blankVehicle()])}
                        >
                            Add a vehicle
                        </Button>
                        <Button
                            variant='contained'
                            onClick={handleSave}
                            disabled={saving || !unsaved}
                            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                        >
                            {saving ? 'Saving…' : 'Save vehicles'}
                        </Button>
                        {unsaved ? (
                            <Button onClick={discard} disabled={saving}>
                                Discard changes
                            </Button>
                        ) : null}
                        <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} role='status'>
                            {unsaved ? 'Changes not saved' : 'All saved'}
                        </Typography>
                    </Stack>
                ) : null}
            </>
        )
    }

    return (
        <MainCard sx={{ py: 2 }} contentSX={{ px: { xs: 2, sm: 3 }, py: 2 }}>
            <Box sx={{ '& .MuiButton-root': { textTransform: 'none' } }}>
                <Typography component='h1' sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600 }}>
                    Vehicles
                </Typography>
                <Typography color='text.secondary' sx={{ fontSize: '0.9375rem', mt: 0.5, mb: 3, maxWidth: 720 }}>
                    The vehicles you quote and book. The trip form, the supplier form and the rate card all offer this
                    list, so a vehicle added here is there everywhere. A saved vehicle keeps its name because rates and
                    trips use it: hide it from the lists, or remove it and add the new name.
                </Typography>
                {body}
            </Box>
        </MainCard>
    )
}
