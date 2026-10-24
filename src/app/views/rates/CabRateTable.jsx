import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'
import { Add } from '@mui/icons-material'
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { RateInput, RateTick, RowActions } from './rateFields'

const cell = { py: 0.75, px: 0.75, verticalAlign: 'top' }

/**
 * One table of cab prices: the drives from place to place, or the days spent in one place. The columns say which fields it
 * holds (see `routeKit` and `localKit` in rateFacts.js); the rest — adding, copying, removing, checking, saving all at once —
 * is the same for both.
 *
 * A column is { field, label, kind: 'cab' | 'place' | 'amount' | 'date' | 'text' | 'check', minWidth }.
 */
export default function CabRateTable({
    title,
    help,
    kit,
    columns,
    data,
    prefix,
    useSave,
    savedMessage,
    cabNames,
    places,
    addLabel,
    emptyText,
    noun
}) {
    const dispatch = useDispatch()
    const listId = `rate-${prefix}`
    const [save, { isLoading: saving }] = useSave()
    const original = useMemo(() => data.map(row => kit.draft(row, prefix)), [data, kit, prefix])
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

    const changes = useMemo(() => kit.changed(rows, original), [kit, rows, original])
    const duplicates = useMemo(() => kit.duplicates(rows), [kit, rows])
    const unsaved = changes.length > 0 || removeIds.length > 0
    const problemOf = row => duplicates[row.key] || (changes.includes(row) ? kit.problem(row) : '')
    const hasProblem = changes.some(row => problemOf(row)) || Object.keys(duplicates).length > 0

    const update = (key, field, value) =>
        setRows(current => current.map(row => (row.key === key ? { ...row, [field]: value } : row)))
    const removeRow = row => {
        if (row.id) setRemoveIds(current => [...current, row.id])
        setRows(current => current.filter(item => item.key !== row.key))
    }
    const copyRow = row =>
        setRows(current => {
            const at = current.indexOf(row)
            const next = [...current]
            next.splice(at + 1, 0, kit.copy(row))
            return next
        })
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
            await save({ rows: changes.map(kit.payload), removeIds }).unwrap()
            dispatch(
                openSnackbar({
                    open: true,
                    message: savedMessage,
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: false
                })
            )
        } catch (error) {
            setServerProblem(error?.data?.message || 'Couldn’t save the rates. Please try again.')
        }
    }

    const textOf = (column, row, number, flagged) => {
        const label = `${column.label}, row ${number}`
        const onChange = event => update(row.key, column.field, event.target.value)
        if (column.kind === 'cab' || column.kind === 'place') {
            return (
                <RateInput
                    label={label}
                    placeholder={column.label}
                    list={column.kind === 'cab' ? `${listId}-cabs` : `${listId}-places`}
                    autoComplete='off'
                    value={row[column.field]}
                    invalid={flagged && !row[column.field].trim()}
                    onChange={onChange}
                />
            )
        }
        if (column.kind === 'amount') {
            return (
                <RateInput
                    label={label}
                    inputMode='decimal'
                    placeholder='₹'
                    value={row[column.field]}
                    onChange={event => update(row.key, column.field, event.target.value.replace(/[^0-9.,]/g, ''))}
                />
            )
        }
        if (column.kind === 'date')
            return <RateInput type='date' label={label} value={row[column.field]} onChange={onChange} />
        if (column.kind === 'check') {
            return (
                <RateTick
                    label={label}
                    checked={Boolean(row[column.field])}
                    onChange={event => update(row.key, column.field, event.target.checked)}
                />
            )
        }
        return (
            <RateInput
                label={label}
                placeholder={column.placeholder || ''}
                maxLength={60}
                value={row[column.field]}
                onChange={onChange}
            />
        )
    }

    return (
        <Box sx={{ mb: 4 }}>
            <Typography component='h2' sx={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                {title}
            </Typography>
            <Typography color='text.secondary' sx={{ fontSize: '0.875rem', mt: 0.5, mb: 2, maxWidth: 760 }}>
                {help}
            </Typography>

            {serverProblem ? (
                <Alert severity='error' sx={{ mb: 2 }}>
                    {serverProblem}
                </Alert>
            ) : null}

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <datalist id={`${listId}-cabs`}>
                    {cabNames.map(name => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
                <datalist id={`${listId}-places`}>
                    {places.map(name => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
                <Table
                    size='small'
                    sx={{ minWidth: columns.reduce((sum, column) => sum + (column.minWidth || 100), 120) }}
                >
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell key={column.field} sx={{ ...cell, minWidth: column.minWidth || 100 }}>
                                    {column.label}
                                </TableCell>
                            ))}
                            <TableCell sx={{ ...cell, width: 84 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}
                                >
                                    {emptyText}
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {rows.map((row, index) => {
                            const number = index + 1
                            const problem = problemOf(row)
                            return [
                                <TableRow key={row.key} hover>
                                    {columns.map(column => (
                                        <TableCell key={column.field} sx={cell}>
                                            {textOf(column, row, number, showProblems && Boolean(problem))}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ ...cell, whiteSpace: 'nowrap' }}>
                                        <RowActions
                                            copyLabel={`Copy ${noun} ${number}`}
                                            removeLabel={`Remove ${noun} ${number}`}
                                            copyTitle={`Copy this ${noun} (to add a season or another cab)`}
                                            removeTitle={`Remove this ${noun}`}
                                            onCopy={() => copyRow(row)}
                                            onRemove={() => removeRow(row)}
                                        />
                                    </TableCell>
                                </TableRow>,
                                showProblems && problem ? (
                                    <TableRow key={`${row.key}-problem`}>
                                        <TableCell colSpan={columns.length + 1} sx={{ py: 0.25, borderBottom: 'none' }}>
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
                    onClick={() => setRows(current => [...current, kit.blank()])}
                >
                    {addLabel}
                </Button>
                <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || !unsaved}
                    startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
                >
                    {saving ? 'Saving…' : `Save ${noun}s`}
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

CabRateTable.propTypes = {
    title: PropTypes.string.isRequired,
    help: PropTypes.node.isRequired,
    kit: PropTypes.shape({
        draft: PropTypes.func,
        blank: PropTypes.func,
        copy: PropTypes.func,
        changed: PropTypes.func,
        duplicates: PropTypes.func,
        problem: PropTypes.func,
        payload: PropTypes.func
    }).isRequired,
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            field: PropTypes.string,
            label: PropTypes.string,
            kind: PropTypes.string,
            minWidth: PropTypes.number
        })
    ).isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    prefix: PropTypes.string.isRequired,
    useSave: PropTypes.func.isRequired,
    savedMessage: PropTypes.string.isRequired,
    cabNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    places: PropTypes.arrayOf(PropTypes.string).isRequired,
    addLabel: PropTypes.string.isRequired,
    emptyText: PropTypes.string.isRequired,
    noun: PropTypes.string.isRequired
}
