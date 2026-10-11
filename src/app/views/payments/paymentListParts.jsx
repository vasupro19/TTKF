import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, CircularProgress, InputAdornment, Menu, MenuItem, Stack, TextField } from '@mui/material'
import { FileDownload, FilterAltOff, Search } from '@mui/icons-material'
import { EMPTY_FILTERS } from './paymentListTools'

/**
 * Date range, method, (service type) and a search box for a payments list. The search is applied once typing pauses.
 */
export function PaymentFilters({ filters, onChange, methods, types = null, searchPlaceholder = 'Search…' }) {
    const [text, setText] = useState(filters.q || '')
    useEffect(() => setText(filters.q || ''), [filters.q])
    useEffect(() => {
        if (text === (filters.q || '')) return undefined
        const timer = setTimeout(() => onChange({ ...filters, q: text }), 400)
        return () => clearTimeout(timer)
    }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

    const set = key => event => onChange({ ...filters, [key]: event.target.value })
    const filtered = Object.entries(filters).some(([, value]) => Boolean(value))

    return (
        <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap alignItems='center'>
            <TextField
                size='small'
                type='date'
                label='From'
                value={filters.from}
                onChange={set('from')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
            />
            <TextField
                size='small'
                type='date'
                label='To'
                value={filters.to}
                onChange={set('to')}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
            />
            <TextField
                select
                size='small'
                label='Method'
                value={filters.method}
                onChange={set('method')}
                sx={{ width: 150 }}
            >
                <MenuItem value=''>All methods</MenuItem>
                {methods.map(method => (
                    <MenuItem key={method} value={method}>
                        {method}
                    </MenuItem>
                ))}
            </TextField>
            {types ? (
                <TextField
                    select
                    size='small'
                    label='Service'
                    value={filters.type}
                    onChange={set('type')}
                    sx={{ width: 140 }}
                >
                    <MenuItem value=''>All services</MenuItem>
                    {types.map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                            {label}
                        </MenuItem>
                    ))}
                </TextField>
            ) : null}
            <TextField
                size='small'
                value={text}
                placeholder={searchPlaceholder}
                onChange={event => setText(event.target.value)}
                InputProps={{
                    inputProps: { 'aria-label': 'Search payments' },
                    startAdornment: (
                        <InputAdornment position='start'>
                            <Search fontSize='small' />
                        </InputAdornment>
                    )
                }}
                sx={{ width: 240 }}
            />
            {filtered ? (
                <Button
                    size='small'
                    color='error'
                    startIcon={<FilterAltOff />}
                    onClick={() => {
                        setText('')
                        onChange({ ...EMPTY_FILTERS })
                    }}
                >
                    Clear
                </Button>
            ) : null}
        </Stack>
    )
}

PaymentFilters.propTypes = {
    filters: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string,
        method: PropTypes.string,
        type: PropTypes.string,
        q: PropTypes.string
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    methods: PropTypes.arrayOf(PropTypes.string).isRequired,
    types: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    searchPlaceholder: PropTypes.string
}

/** @description "Export" → Excel or CSV; `onExport(format)` fetches the filtered list and saves it */
export function ExportButton({ onExport, busy = false, disabled = false }) {
    const [anchor, setAnchor] = useState(null)
    const pick = format => {
        setAnchor(null)
        onExport(format)
    }
    return (
        <>
            <Button
                variant='outlined'
                size='small'
                startIcon={busy ? <CircularProgress size={14} color='inherit' /> : <FileDownload />}
                disabled={busy || disabled}
                onClick={event => setAnchor(event.currentTarget)}
            >
                {busy ? 'Exporting…' : 'Export'}
            </Button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => pick('xlsx')}>Excel (.xlsx)</MenuItem>
                <MenuItem onClick={() => pick('csv')}>CSV</MenuItem>
            </Menu>
        </>
    )
}

ExportButton.propTypes = { onExport: PropTypes.func.isRequired, busy: PropTypes.bool, disabled: PropTypes.bool }
