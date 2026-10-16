import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { FilterAltOff, Search } from '@mui/icons-material'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import ToggleColumns from '@/core/components/ToggleColumns'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'

// ? the controls of the Leads toolbar, for screens that are not DataTable lists
const BOX_SX = { '& .MuiInputBase-root': { height: 34 } }
const SEARCH_WAIT_MS = 400

/** @description a search box that tells the screen once typing pauses; `value` is what the address bar holds */
export function SearchBox({ value, onCommit, noun, placeholder, width = 300 }) {
    const [text, setText] = useState(value || '')
    useEffect(() => setText(value || ''), [value])
    useEffect(() => {
        if (text.trim() === (value || '')) return undefined
        const timer = setTimeout(() => onCommit(text.trim()), SEARCH_WAIT_MS)
        return () => clearTimeout(timer)
    }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
    return (
        <TextField
            size='small'
            placeholder={placeholder}
            value={text}
            onChange={event => setText(event.target.value)}
            sx={{ width: { xs: '100%', md: width }, ...BOX_SX }}
            InputProps={{
                inputProps: { 'aria-label': `Search ${noun}` },
                startAdornment: (
                    <InputAdornment position='start'>
                        <Search fontSize='small' />
                    </InputAdornment>
                )
            }}
        />
    )
}

SearchBox.propTypes = {
    value: PropTypes.string,
    onCommit: PropTypes.func.isRequired,
    noun: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    width: PropTypes.number
}

/** @description a From / To / Month box */
export function DateBox({ label, value, onChange, type = 'date', min, max, width = 150 }) {
    return (
        <TextField
            size='small'
            type={type}
            label={label}
            value={value || ''}
            onChange={event => onChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min, max, 'aria-label': label }}
            sx={{ width: { xs: '100%', md: width }, ...BOX_SX }}
        />
    )
}

DateBox.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    type: PropTypes.string,
    min: PropTypes.string,
    max: PropTypes.string,
    width: PropTypes.number
}

/** @description a dropdown filter with "All …" first; `options` are `{ value, label }` */
export function SelectBox({ label, value, onChange, options, allLabel = 'All', width = 160 }) {
    return (
        <TextField
            select
            size='small'
            label={label}
            value={value || 'All'}
            onChange={event => onChange(event.target.value === 'All' ? '' : event.target.value)}
            sx={{ width: { xs: '100%', md: width }, ...BOX_SX }}
        >
            <MenuItem value='All'>{allLabel}</MenuItem>
            {options.map(option => (
                <MenuItem key={option.value} value={String(option.value)}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    )
}

SelectBox.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }))
        .isRequired,
    allLabel: PropTypes.string,
    width: PropTypes.number
}

export function ClearFiltersButton({ onClick }) {
    return (
        <CustomButton
            variant='text'
            customStyles={{ color: 'error.main', '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' } }}
            startIcon={<FilterAltOff />}
            onClick={onClick}
        >
            Clear filters
        </CustomButton>
    )
}

ClearFiltersButton.propTypes = { onClick: PropTypes.func.isRequired }

/** @description "12 payments" at the end of the toolbar, once the list has loaded and has something */
export function CountText({ count, noun, show = true }) {
    if (!show || !(count > 0)) return null
    return (
        <Typography variant='body2' color='text.secondary' sx={{ ml: { md: 'auto' }, whiteSpace: 'nowrap' }}>
            {count} {noun}
        </Typography>
    )
}

CountText.propTypes = { count: PropTypes.number, noun: PropTypes.string.isRequired, show: PropTypes.bool }

/** @description the column picker and CSV menu (what is on screen / every matching row), as in the Leads title row */
export function ColumnsAndCsv({ columns, onToggle, onCurrent, onAll }) {
    return (
        <Stack direction='row' spacing={1.5} alignItems='center'>
            <ToggleColumns columns={columns} handler={onToggle} />
            <UiAccessGuard>
                <CSVExport handleExcelClick={onCurrent} exportAllFunc={onAll} />
            </UiAccessGuard>
        </Stack>
    )
}

ColumnsAndCsv.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string })).isRequired,
    onToggle: PropTypes.func.isRequired,
    onCurrent: PropTypes.func.isRequired,
    onAll: PropTypes.func.isRequired
}

/** @description the one toolbar row: its children wrap and the row is the same shape as the Leads one */
export function ToolbarRow({ children }) {
    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ md: 'center' }}
            useFlexGap
            flexWrap='wrap'
        >
            {children}
        </Stack>
    )
}

ToolbarRow.propTypes = { children: PropTypes.node }
