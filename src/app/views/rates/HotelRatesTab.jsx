import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    MenuItem,
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
import { Add, ContentCopy, DeleteOutline, Search } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveHotelRatesMutation } from '@/app/store/slices/api/ratesSlice'
import {
    AMOUNT_FIELDS,
    CATEGORY_OPTIONS,
    blankHotelRow,
    changedHotelRows,
    copyHotelRow,
    draftHotelRow,
    duplicateHotelRows,
    hotelPayload,
    hotelRowProblem,
    hotelRowsMatching
} from './rateFacts'

const cell = { py: 0.75, px: 0.75, verticalAlign: 'top' }

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

    const problemOf = row => duplicates[row.key] || (changes.includes(row) ? hotelRowProblem(row) : '')
    const hasProblem = changes.some(row => problemOf(row)) || Object.keys(duplicates).length > 0

    const update = (key, field, value) =>
        setRows(current => current.map(row => (row.key === key ? { ...row, [field]: value } : row)))
    const addRow = () => {
        // ? a search that is still typed would hide the new, empty row
        setSearch('')
        setRows(current => [...current, blankHotelRow()])
    }
    const copyRow = row =>
        setRows(current => {
            const at = current.findIndex(item => item.key === row.key)
            return [...current.slice(0, at + 1), copyHotelRow(row), ...current.slice(at + 1)]
        })
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
                <strong>To</strong> dates is a season: it replaces the standard row for the nights inside it.
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
                    <Table size='small' sx={{ minWidth: 1100 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ ...cell, minWidth: 150 }}>Place</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 120 }}>Category</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 100 }}>Season</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 128 }}>From</TableCell>
                                <TableCell sx={{ ...cell, minWidth: 128 }}>To</TableCell>
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
                                const number = rows.indexOf(row) + 1
                                const problem = problemOf(row)
                                const flagged = showProblems && Boolean(problem)
                                return [
                                    <TableRow key={row.key} hover>
                                        <TableCell sx={cell}>
                                            <Autocomplete
                                                freeSolo
                                                size='small'
                                                options={places}
                                                inputValue={row.place}
                                                onInputChange={(event, value) => update(row.key, 'place', value)}
                                                renderInput={params => (
                                                    <TextField
                                                        // eslint-disable-next-line react/jsx-props-no-spreading -- the picker hands these over as props
                                                        {...params}
                                                        inputProps={{
                                                            ...params.inputProps,
                                                            'aria-label': `Place, row ${number}`
                                                        }}
                                                        placeholder='Place'
                                                        error={flagged && !row.place.trim()}
                                                    />
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell sx={cell}>
                                            <TextField
                                                select
                                                size='small'
                                                fullWidth
                                                value={row.category}
                                                onChange={event => update(row.key, 'category', event.target.value)}
                                                inputProps={{ 'aria-label': `Category, row ${number}` }}
                                            >
                                                {CATEGORY_OPTIONS.map(option => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell sx={cell}>
                                            <TextField
                                                size='small'
                                                fullWidth
                                                placeholder='Standard'
                                                value={row.season}
                                                onChange={event => update(row.key, 'season', event.target.value)}
                                                inputProps={{ 'aria-label': `Season, row ${number}`, maxLength: 60 }}
                                            />
                                        </TableCell>
                                        {['validFrom', 'validTo'].map(field => (
                                            <TableCell key={field} sx={cell}>
                                                <TextField
                                                    size='small'
                                                    type='date'
                                                    fullWidth
                                                    value={row[field]}
                                                    onChange={event => update(row.key, field, event.target.value)}
                                                    inputProps={{
                                                        'aria-label': `${field === 'validFrom' ? 'From' : 'To'}, row ${number}`
                                                    }}
                                                />
                                            </TableCell>
                                        ))}
                                        {AMOUNT_FIELDS.map(([field, label]) => (
                                            <TableCell key={field} sx={cell}>
                                                <TextField
                                                    size='small'
                                                    fullWidth
                                                    value={row[field]}
                                                    onChange={event =>
                                                        update(
                                                            row.key,
                                                            field,
                                                            event.target.value.replace(/[^0-9.,]/g, '')
                                                        )
                                                    }
                                                    inputProps={{
                                                        inputMode: 'decimal',
                                                        'aria-label': `${label}, row ${number}`
                                                    }}
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ ...cell, whiteSpace: 'nowrap' }}>
                                            <Tooltip title='Copy this row (to add a season or another category)'>
                                                <IconButton
                                                    size='small'
                                                    aria-label={`Copy row ${number}`}
                                                    onClick={() => copyRow(row)}
                                                >
                                                    <ContentCopy fontSize='small' />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title='Remove this row'>
                                                <IconButton
                                                    size='small'
                                                    color='error'
                                                    aria-label={`Remove row ${number}`}
                                                    onClick={() => removeRow(row)}
                                                >
                                                    <DeleteOutline fontSize='small' />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>,
                                    flagged ? (
                                        <TableRow key={`${row.key}-problem`}>
                                            <TableCell colSpan={11} sx={{ py: 0.25, borderBottom: 'none' }}>
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
