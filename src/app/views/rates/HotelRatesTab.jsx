import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import { Add, Search } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveHotelRatesMutation } from '@/app/store/slices/api/ratesSlice'
import {
    AMOUNT_FIELDS,
    blankHotelRow,
    changedHotelRows,
    copyHotelRow,
    draftHotelRow,
    duplicateHotelRows,
    hotelPayload,
    hotelRowProblem,
    hotelRowsMatching
} from './rateFacts'
import HotelRateRow from './HotelRateRow'

const cell = { py: 0.75, px: 0.75, verticalAlign: 'top' }
const PLACES_LIST = 'rate-places'

/**
 * What a night costs in each hotel category of each place, per room (two sharing), for each meal plan. A row with From and To
 * dates is a season: it replaces the standard row for the nights inside it.
 */
export default function HotelRatesTab({ hotels, places }) {
    const dispatch = useDispatch()
    const [save, { isLoading: saving }] = useSaveHotelRatesMutation()
    const original = useMemo(() => hotels.map(draftHotelRow), [hotels])
    const [rows, setRows] = useState(original)
    const [removeIds, setRemoveIds] = useState([])
    const [search, setSearch] = useState('')
    const [showProblems, setShowProblems] = useState(false)
    const [serverProblem, setServerProblem] = useState('')

    // ? what the server holds replaces what was on screen: after a save, an import, or opening the page
    useEffect(() => {
        setRows(original)
        setRemoveIds([])
        setShowProblems(false)
        setServerProblem('')
    }, [original])

    const changes = useMemo(() => changedHotelRows(rows, original), [rows, original])
    const duplicates = useMemo(() => duplicateHotelRows(rows), [rows])
    const unsaved = changes.length > 0 || removeIds.length > 0
    const visible = hotelRowsMatching(rows, search)
    const rowNumbers = useMemo(() => new Map(rows.map((row, index) => [row, index + 1])), [rows])

    const problemOf = row => duplicates[row.key] || (changes.includes(row) ? hotelRowProblem(row) : '')
    const hasProblem = changes.some(row => problemOf(row)) || Object.keys(duplicates).length > 0

    const update = useCallback(
        (key, field, value) =>
            setRows(current => current.map(row => (row.key === key ? { ...row, [field]: value } : row))),
        []
    )
    const addRow = () => {
        // ? a search that is still typed would hide the new, empty row
        setSearch('')
        setRows(current => [...current, blankHotelRow()])
    }
    const copyRow = useCallback(
        row =>
            setRows(current => {
                const at = current.findIndex(item => item.key === row.key)
                return [...current.slice(0, at + 1), copyHotelRow(row), ...current.slice(at + 1)]
            }),
        []
    )
    const removeRow = useCallback(row => {
        if (row.id) setRemoveIds(current => [...current, row.id])
        setRows(current => current.filter(item => item.key !== row.key))
    }, [])

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
            await save({ rows: changes.map(hotelPayload), removeIds }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Hotel rates saved',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (error) {
            setServerProblem(error?.data?.message || 'Couldn’t save the rates. Please try again.')
        }
    }

    return (
        <Box>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mb: 2, maxWidth: 760 }}>
                Rates are what you pay <strong>per room per night</strong> (two people sharing), for each meal plan you
                offer. Leave a meal plan empty if you don’t use it. A row with <strong>From</strong> and{' '}
                <strong>To</strong> dates is a season: it replaces the standard row for the nights inside it. Tick{' '}
                <strong>Every year</strong> and the season comes back every year, also over New Year.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
                <TextField
                    size='small'
                    placeholder='Search place, category or season'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    sx={{ width: { xs: '100%', sm: 320 } }}
                    InputProps={{
                        inputProps: { 'aria-label': 'Search rates' },
                        startAdornment: (
                            <InputAdornment position='start'>
                                <Search fontSize='small' />
                            </InputAdornment>
                        )
                    }}
                />
                <Button size='small' variant='outlined' startIcon={<Add />} onClick={addRow}>
                    Add a rate
                </Button>
            </Stack>

            {serverProblem ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {serverProblem}
                </Alert>
            ) : null}

            {rows.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 600 }}>No hotel rates yet</Typography>
                    <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.5 }}>
                        Add a rate, or import your Excel sheet with the button at the top.
                    </Typography>
                </Box>
            ) : (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <datalist id={PLACES_LIST}>
                        {places.map(place => (
                            <option key={place} value={place} />
                        ))}
                    </datalist>
                    <Table size='small' sx={{ minWidth: 1250 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...cell, minWidth: 150 }}>Place</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 150 }}>Category</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 130 }}>Season</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 128 }}>From</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 128 }}>To</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 72 }}>Every year</TableCell>
                                {AMOUNT_FIELDS.map(([field, label]) => (
                                    <TableCell key={field} sx={{ ...cell, minWidth: 80 }}>
                                        {label}
                                    </TableCell>
                                ))}
                                <TableCell sx={{ ...cell, width: 84 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visible.map(row => {
                                const number = rowNumbers.get(row)
                                const problem = problemOf(row)
                                const flagged = showProblems && Boolean(problem)
                                return [
                                    <HotelRateRow
                                        key={row.key}
                                        row={row}
                                        number={number}
                                        flagged={flagged}
                                        listId={PLACES_LIST}
                                        onChange={update}
                                        onCopy={copyRow}
                                        onRemove={removeRow}
                                    />,
                                    flagged ? (
                                        <TableRow key={`${row.key}-problem`}>
                                            <TableCell colSpan={12} sx={{ py: 0.25, borderBottom: 'none' }}>
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
            )}

            <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 2 }}>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save hotel rates'}
                </Button>
                {unsaved ? (
                    <Button onClick={discard} disabled={saving}>
                        Discard changes
                    </Button>
                ) : null}
                <Typography color='text.secondary' sx={{ fontSize: '0.875rem' }} role='status'>
                    {unsaved
                        ? `${changes.length + removeIds.length} change${changes.length + removeIds.length === 1 ? '' : 's'} not saved`
                        : 'All saved'}
                </Typography>
            </Stack>
        </Box>
    )
}

HotelRatesTab.propTypes = {
    hotels: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    places: PropTypes.arrayOf(PropTypes.string).isRequired
}
