import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'
import { Add, Close } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import nameKey from '@views/forms/packages/nameKey'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveCabRoutesMutation } from '@/app/store/slices/api/ratesSlice'
import { RateInput, RateTick, RowActions } from './rateFields'
import {
    blankSheetRow,
    copySheetRow,
    priceText,
    sheetChanges,
    sheetDuplicates,
    sheetFromRoutes,
    sheetProblem,
    sheetUntouched,
    withPrice
} from './routeSheet'

const cell = { py: 0.75, px: 0.75, verticalAlign: 'top' }

/**
 * The drives from place to place: one row for each route with a price for each cab, so Manali to Jibhi is typed once for
 * Sedan, Innova and Tempo Traveller together. A season is another row for the same route with its dates; "Every year" brings
 * it back every year, also over New Year.
 */
export default function CabRouteSheet({ routes, cabSuggestions, places }) {
    const dispatch = useDispatch()
    const [save, { isLoading: saving }] = useSaveCabRoutesMutation()
    const saved = useMemo(() => sheetFromRoutes(routes), [routes])
    const [rows, setRows] = useState(saved.rows)
    const [cabs, setCabs] = useState(saved.cabs.length ? saved.cabs : ['Sedan'])
    const [newCab, setNewCab] = useState('')
    const [showProblems, setShowProblems] = useState(false)
    const [serverProblem, setServerProblem] = useState('')

    useEffect(() => {
        setRows(saved.rows)
        setCabs(saved.cabs.length ? saved.cabs : ['Sedan'])
        setShowProblems(false)
        setServerProblem('')
    }, [saved])

    const changes = useMemo(() => sheetChanges(rows, saved.rows, cabs), [rows, saved, cabs])
    const duplicates = useMemo(() => sheetDuplicates(rows, cabs), [rows, cabs])
    const unsaved = changes.rows.length > 0 || changes.removeIds.length > 0
    const problemOf = row => {
        if (sheetUntouched(row, cabs)) return ''
        return duplicates[row.key] || sheetProblem(row, cabs)
    }
    const hasProblem = rows.some(row => problemOf(row))

    const update = (key, patch) =>
        setRows(current => current.map(row => (row.key === key ? { ...row, ...patch } : row)))
    const setPrice = (key, cab, value) =>
        setRows(current => current.map(row => (row.key === key ? withPrice(row, cab, value) : row)))
    const copyRow = row =>
        setRows(current => {
            const next = [...current]
            next.splice(current.indexOf(row) + 1, 0, copySheetRow(row))
            return next
        })
    const discard = () => {
        setRows(saved.rows)
        setCabs(saved.cabs.length ? saved.cabs : ['Sedan'])
        setShowProblems(false)
        setServerProblem('')
    }
    const addCab = () => {
        const name = newCab.trim()
        if (name && !cabs.some(cab => nameKey(cab) === nameKey(name))) setCabs(current => [...current, name])
        setNewCab('')
    }
    const columnUsed = cab => rows.some(row => priceText(row, cab) !== '' || row.prices[nameKey(cab)]?.id)
    const offered = cabSuggestions.filter(name => !cabs.some(cab => nameKey(cab) === nameKey(name)))

    const handleSave = async () => {
        setServerProblem('')
        if (hasProblem) {
            setShowProblems(true)
            return
        }
        try {
            await save(changes).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Drive prices saved',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (error) {
            setServerProblem(error?.data?.message || 'Couldn’t save the rates. Please try again.')
        }
    }

    const placeBox = (row, field, label, number, flagged) => (
        <RateInput
            label={`${label}, row ${number}`}
            placeholder={label}
            list='rate-route-places'
            autoComplete='off'
            value={row[field]}
            invalid={flagged && !row[field].trim()}
            onChange={event => update(row.key, { [field]: event.target.value })}
        />
    )

    const width = 132 * 2 + 60 + cabs.length * 112 + 112 + 118 * 2 + 64 + 120

    return (
        <Box sx={{ mb: 4 }}>
            <Typography component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                Drives from place to place
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.5, mb: 2, maxWidth: 760 }}>
                One row for each drive, with a price under each cab: Chandigarh to Manali, Chandigarh to Dharamshala.
                Leave <strong>Both ways</strong> ticked and the same price covers the drive back. Copy a row and give it
                dates for a season; tick <strong>Every year</strong> and it comes back every year, also over New Year.
                You only need the routes you sell: a quote that needs a missing one asks for its price on the spot.
            </Typography>

            {serverProblem ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {serverProblem}
                </Alert>
            ) : null}

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <datalist id='rate-route-places'>
                    {places.map(place => (
                        <option key={place} value={place} />
                    ))}
                </datalist>
                <Table size='small' sx={{ minWidth: width }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ ...cell, minWidth: 132 }}>From</TableCell>
                            <TableCell sx={{ ...cell, minWidth: 132 }}>To</TableCell>
                            <TableCell sx={{ ...cell, minWidth: 60 }}>Both ways</TableCell>
                            {cabs.map(cab => (
                                <TableCell key={cab} sx={{ ...cell, minWidth: 112 }}>
                                    <Stack direction='row' alignItems='center' spacing={0.25}>
                                        <span>{cab}</span>
                                        {columnUsed(cab) ? null : (
                                            <Tooltip title={`Take the ${cab} column out`}>
                                                <IconButton
                                                    size='small'
                                                    aria-label={`Remove the ${cab} column`}
                                                    onClick={() =>
                                                        setCabs(current => current.filter(item => item !== cab))
                                                    }
                                                >
                                                    <Close fontSize='inherit' />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Stack>
                                </TableCell>
                            ))}
                            <TableCell sx={{ ...cell, minWidth: 112 }}>Season</TableCell>
                            <TableCell sx={{ ...cell, minWidth: 118 }}>From</TableCell>
                            <TableCell sx={{ ...cell, minWidth: 118 }}>To</TableCell>
                            <TableCell sx={{ ...cell, minWidth: 64 }}>Every year</TableCell>
                            <TableCell sx={{ ...cell, width: 84 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={cabs.length + 8}
                                    sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}
                                >
                                    No drives yet. Add the routes you sell.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {rows.map((row, index) => {
                            const number = index + 1
                            const problem = problemOf(row)
                            const flagged = showProblems && Boolean(problem)
                            return [
                                <TableRow key={row.key} hover>
                                    <TableCell sx={cell}>
                                        {placeBox(row, 'fromPlace', 'From', number, flagged)}
                                    </TableCell>
                                    <TableCell sx={cell}>{placeBox(row, 'toPlace', 'To', number, flagged)}</TableCell>
                                    <TableCell sx={cell}>
                                        <RateTick
                                            label={`Both ways, row ${number}`}
                                            checked={row.bothWays !== false}
                                            onChange={event => update(row.key, { bothWays: event.target.checked })}
                                        />
                                    </TableCell>
                                    {cabs.map(cab => (
                                        <TableCell key={cab} sx={cell}>
                                            <RateInput
                                                label={`${cab} price, row ${number}`}
                                                inputMode='decimal'
                                                placeholder='₹'
                                                value={priceText(row, cab)}
                                                onChange={event =>
                                                    setPrice(row.key, cab, event.target.value.replace(/[^0-9.,]/g, ''))
                                                }
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell sx={cell}>
                                        <RateInput
                                            label={`Season, row ${number}`}
                                            placeholder='Standard'
                                            maxLength={60}
                                            value={row.season}
                                            onChange={event => update(row.key, { season: event.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell sx={cell}>
                                        <RateInput
                                            type='date'
                                            label={`Season from, row ${number}`}
                                            value={row.validFrom}
                                            onChange={event => update(row.key, { validFrom: event.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell sx={cell}>
                                        <RateInput
                                            type='date'
                                            label={`Season to, row ${number}`}
                                            value={row.validTo}
                                            onChange={event => update(row.key, { validTo: event.target.value })}
                                        />
                                    </TableCell>
                                    <TableCell sx={cell}>
                                        <RateTick
                                            label={`Every year, row ${number}`}
                                            checked={Boolean(row.repeatsYearly)}
                                            onChange={event => update(row.key, { repeatsYearly: event.target.checked })}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ ...cell, whiteSpace: 'nowrap' }}>
                                        <RowActions
                                            copyLabel={`Copy drive ${number}`}
                                            removeLabel={`Remove drive ${number}`}
                                            copyTitle='Copy this drive (to add a season)'
                                            removeTitle='Remove this drive'
                                            onCopy={() => copyRow(row)}
                                            onRemove={() =>
                                                setRows(current => current.filter(item => item.key !== row.key))
                                            }
                                        />
                                    </TableCell>
                                </TableRow>,
                                flagged ? (
                                    <TableRow key={`${row.key}-problem`}>
                                        <TableCell colSpan={cabs.length + 8} sx={{ py: 0.25, borderBottom: 'none' }}>
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

            <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
                <Button
                    size='small'
                    variant='outlined'
                    startIcon={<Add />}
                    onClick={() => setRows(current => [...current, blankSheetRow()])}
                >
                    Add a drive
                </Button>
                <Autocomplete
                    freeSolo
                    size='small'
                    options={offered}
                    inputValue={newCab}
                    onInputChange={(event, value) => setNewCab(value)}
                    sx={{ width: 190 }}
                    renderInput={params => (
                        <TextField
                            // eslint-disable-next-line react/jsx-props-no-spreading -- the picker hands these over as props
                            {...params}
                            placeholder='Add a cab column'
                            inputProps={{ ...params.inputProps, 'aria-label': 'Add a cab column' }}
                        />
                    )}
                />
                <Button size='small' onClick={addCab} disabled={!newCab.trim()}>
                    Add cab
                </Button>
            </Stack>
            <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save drives'}
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
        </Box>
    )
}

CabRouteSheet.propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    cabSuggestions: PropTypes.arrayOf(PropTypes.string).isRequired,
    places: PropTypes.arrayOf(PropTypes.string).isRequired
}
