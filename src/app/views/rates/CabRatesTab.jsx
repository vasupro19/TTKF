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
import { Add, DeleteOutline } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { useSaveCabRatesMutation } from '@/app/store/slices/api/ratesSlice'
import { blankCabRow, cabPayload, cabRowProblem, changedCabRows, draftCabRow, duplicateCabRows } from './rateFacts'

// ? the names a quote's cab field offers; a rate is found by the same name, so these are the usual ones to start from
const USUAL_CABS = ['Sedan', 'SUV', 'Innova', 'Innova Crysta', 'Tempo Traveller', 'Mini Bus']

/**
 * What a cab costs per day, by the cab type the quote names. A quote's cab cost is this rate times the days of the trip.
 */
export default function CabRatesTab({ vehicles }) {
    const dispatch = useDispatch()
    const [save, { isLoading: saving }] = useSaveCabRatesMutation()
    const original = useMemo(() => vehicles.map(draftCabRow), [vehicles])
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

    const changes = useMemo(() => changedCabRows(rows, original), [rows, original])
    const duplicates = useMemo(() => duplicateCabRows(rows), [rows])
    const unsaved = changes.length > 0 || removeIds.length > 0
    const problemOf = row => duplicates[row.key] || (changes.includes(row) ? cabRowProblem(row) : '')
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
            await save({ rows: changes.map(cabPayload), removeIds }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Cab rates saved',
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
                What you pay for a cab <strong>per day</strong>. A quote’s cab cost is this rate times the days of the
                trip, using the cab type chosen in the guest’s trip details. Use the same names your team picks there.
            </Typography>

            {serverProblem ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {serverProblem}
                </Alert>
            ) : null}

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 560 }}>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cab type</TableCell>
                            <TableCell>Rate per day</TableCell>
                            <TableCell sx={{ width: 56 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    No cabs yet. Add the cab types you quote.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {rows.map((row, index) => {
                            const problem = problemOf(row)
                            return [
                                <TableRow key={row.key} hover>
                                    <TableCell sx={{ py: 0.75 }}>
                                        <Autocomplete
                                            freeSolo
                                            size='small'
                                            options={USUAL_CABS}
                                            inputValue={row.vehicle}
                                            onInputChange={(event, value) => update(row.key, 'vehicle', value)}
                                            renderInput={params => (
                                                <TextField
                                                    // eslint-disable-next-line react/jsx-props-no-spreading -- the picker hands these over as props
                                                    {...params}
                                                    inputProps={{
                                                        ...params.inputProps,
                                                        'aria-label': `Cab type, row ${index + 1}`
                                                    }}
                                                    placeholder='Sedan'
                                                />
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75 }}>
                                        <TextField
                                            size='small'
                                            fullWidth
                                            value={row.perDayRate}
                                            onChange={event =>
                                                update(
                                                    row.key,
                                                    'perDayRate',
                                                    event.target.value.replace(/[^0-9.,]/g, '')
                                                )
                                            }
                                            InputProps={{
                                                startAdornment: <InputAdornment position='start'>₹</InputAdornment>,
                                                inputProps: {
                                                    inputMode: 'decimal',
                                                    'aria-label': `Rate per day, row ${index + 1}`
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 0.75 }}>
                                        <Tooltip title='Remove this cab'>
                                            <IconButton
                                                size='small'
                                                color='error'
                                                aria-label={`Remove cab ${index + 1}`}
                                                onClick={() => removeRow(row)}
                                            >
                                                <DeleteOutline fontSize='small' />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>,
                                showProblems && problem ? (
                                    <TableRow key={`${row.key}-problem`}>
                                        <TableCell colSpan={3} sx={{ py: 0.25, borderBottom: 'none' }}>
                                            <Typography color='error' role='alert' sx={{ fontSize: '0.8125rem' }}>
                                                Row {index + 1}: {problem}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : null
                            ]
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mt: 2 }}>
                <Button
                    size='small'
                    variant='outlined'
                    startIcon={<Add />}
                    onClick={() => setRows(current => [...current, blankCabRow()])}
                >
                    Add a cab
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : 'Save cab rates'}
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

CabRatesTab.propTypes = {
    vehicles: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired
}
