import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { Add, FilterAltOff, InfoOutlined, Search } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import MainCard from '@core/components/extended/MainCard'
import DataTable from '@core/components/extended/table/Table'
import CustomButton from '@core/components/extended/CustomButton'
import { CSVExport } from '@/core/components/extended/CreateCSV'
import CustomSearchDateField from '@/core/components/extended/CustomSearchDateField'
import AssigneeFilter from '@/core/components/AssigneeFilter'
import ToggleColumns from '@/core/components/ToggleColumns'
import UiAccessGuard from '@/app/guards/UiPermissionGuard'
import useUiAccess from '@/hooks/useUiAccess'
import { dispatchLoaderEvent } from '@store/helpers'
import { TOGGLE_ALL, isExcelQuery } from '@/constants'
import ListEmptyState from './ListEmptyState'
import {
    csvOf,
    downloadCsv,
    emptyKindOf,
    searchWithValues,
    valuesFromSearch,
    withPaging,
    withParams
} from './listingFacts'

const EMPTY_DATES = { created_at: { from: '', to: '' } }
const SEARCH_WAIT_MS = 400
const IDENTITY = rows => rows
const NO_FILTERS = []
const BOX_SX = { '& .MuiInputBase-root': { height: 34 } }

/**
 * One list screen, the way Leads looks: a title and a line about it, then one row of search, date range and filters
 * with "Clear filters" when any is set, a column picker and CSV export, and the table with real paging and its own
 * "nothing yet" / "nothing matches" messages. The search, dates and filters go to the server as the same query the
 * Leads table sends: `search[value]`, `filters[created_at]`, and each filter's key as a plain parameter. The filters
 * live in the address bar, so a link can open a filtered list.
 *
 * `endpoint` is the RTK Query endpoint of the list (it answers `{ data: [...], count }`); `baseParams` are always sent
 * (a campaign's id, say).
 */
function ListPage({
    title,
    subtitle,
    eyebrow = null,
    noun,
    searchPlaceholder,
    headers,
    endpoint,
    baseParams,
    reqKey,
    filters = NO_FILTERS,
    dates = true,
    assignee = false,
    assigneeLabel = 'Assigned to',
    rowsOf = IDENTITY,
    renderAction,
    csvName,
    canAdd = true,
    addLabel = 'Add',
    onAdd,
    emptyTitle,
    emptyText,
    reloadSignal = 0,
    extraActions = null,
    notice = null,
    onLoaded
}) {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const hasCreateAccess = useUiAccess('create')
    const loading = Boolean(useSelector(state => state.loading?.[reqKey]))

    const filterList = useMemo(() => [...filters, ...(assignee ? [{ key: 'assignedTo' }] : [])], [filters, assignee])
    const values = useMemo(() => valuesFromSearch(location.search, filterList), [location.search, filterList])

    const [columns, setColumns] = useState([...headers])
    const [rows, setRows] = useState([])
    const [count, setCount] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const [excelHandler, setExcelHandler] = useState(false)
    const [refetch, setRefetch] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [search, setSearch] = useState({ value: '', regex: false })
    const [dateFilters, setDateFilters] = useState(EMPTY_DATES)
    const [datesKey, setDatesKey] = useState(0)

    // ? the newest request wins: an older reply is dropped; the last query is what "export all" repeats
    const requestNo = useRef(0)
    const lastQuery = useRef('')
    const latest = useRef({ values, baseParams })
    latest.current = { values, baseParams }

    const triggerRefetch = useCallback(() => {
        setRefetch(true)
        setTimeout(() => setRefetch(false), 500)
    }, [])
    useEffect(() => {
        if (reloadSignal) triggerRefetch()
    }, [reloadSignal, triggerRefetch])

    // ? search once the person stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            const value = searchText.trim()
            setSearch(previous => (previous.value === value ? previous : { value, regex: false }))
        }, SEARCH_WAIT_MS)
        return () => clearTimeout(timer)
    }, [searchText])

    const setValue = (key, value) => {
        const next = searchWithValues(location.search, { [key]: value })
        navigate({ pathname: location.pathname, search: next }, { replace: true })
    }

    const hasFilters = [
        search.value,
        dateFilters.created_at?.from,
        dateFilters.created_at?.to,
        Object.values(values).some(Boolean)
    ].some(Boolean)

    const clearFilters = () => {
        setSearchText('')
        setSearch({ value: '', regex: false })
        setDateFilters(EMPTY_DATES)
        setDatesKey(key => key + 1) // ? the date boxes keep what was typed until they are drawn again
        navigate(
            {
                pathname: location.pathname,
                search: searchWithValues(location.search, Object.fromEntries(filterList.map(f => [f.key, ''])))
            },
            { replace: true }
        )
    }

    const fetchList = async query => {
        const { data: response } = await dispatch(endpoint.initiate(query, false))
        return response
    }

    const queryOf = queryString =>
        withParams(queryString, { ...(latest.current.baseParams || {}), ...latest.current.values })

    const queryHandler = async queryString => {
        const finalQuery = queryOf(queryString)
        if (isExcelQuery(queryString || '')) {
            const response = await fetchList(finalQuery)
            downloadCsv(csvOf(rowsOf(response?.data || []), columns), `${csvName}.csv`)
            return true
        }
        requestNo.current += 1
        const mine = requestNo.current
        lastQuery.current = finalQuery
        dispatchLoaderEvent(reqKey, true)
        try {
            const response = await fetchList(finalQuery)
            if (mine !== requestNo.current) return true
            setRows(response?.data || [])
            setCount(Number(response?.count ?? response?.recordsTotal) || 0)
            setLoaded(true)
            if (onLoaded) onLoaded(response)
        } finally {
            if (mine === requestNo.current) dispatchLoaderEvent(reqKey, false)
        }
        return true
    }

    const exportAll = async () => {
        const response = await fetchList(withPaging(lastQuery.current, 0, Math.max(count, 1)))
        downloadCsv(csvOf(rowsOf(response?.data || []), columns), `${csvName}-all.csv`)
    }

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    const handleCheckToggle = key => {
        setColumns(current =>
            current.map(item => {
                if (key === TOGGLE_ALL) return { ...item, visible: true }
                if (key === item.key) return { ...item, visible: !item.visible }
                return item
            })
        )
    }

    const shownRows = useMemo(() => rowsOf(rows), [rows, rowsOf])
    const emptyKind = emptyKindOf({ loaded, loading, count: shownRows.length, hasFilters })
    // ? a new search, date or filter starts again from the first page
    const tableKey = `${search.value}|${dateFilters.created_at?.from}|${dateFilters.created_at?.to}|${JSON.stringify(values)}|${JSON.stringify(baseParams || {})}`

    return (
        <MainCard content={false} sx={{ py: '2px' }}>
            <Stack spacing={2} sx={{ py: 1.5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        flexWrap: 'wrap'
                    }}
                >
                    {/* ? the words take what is left, so the buttons stay in one row beside them; on a narrow screen the buttons drop below */}
                    <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
                        {eyebrow}
                        <Typography variant='h3'>{title}</Typography>
                        {subtitle && (
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Stack
                        direction='row'
                        spacing={1.5}
                        alignItems='center'
                        justifyContent='flex-end'
                        flexWrap='wrap'
                        useFlexGap
                    >
                        {extraActions}
                        <ToggleColumns columns={columns} handler={handleCheckToggle} />
                        <UiAccessGuard>
                            <CSVExport handleExcelClick={handleExcelClick} exportAllFunc={exportAll} />
                        </UiAccessGuard>
                        {canAdd && onAdd && (
                            <UiAccessGuard type='create'>
                                <CustomButton variant='clickable' onClick={onAdd} endIcon={<Add />}>
                                    {addLabel || 'Add'}
                                </CustomButton>
                            </UiAccessGuard>
                        )}
                    </Stack>
                </Box>

                {notice}

                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    alignItems={{ md: 'center' }}
                    useFlexGap
                    flexWrap='wrap'
                >
                    <TextField
                        size='small'
                        placeholder={searchPlaceholder}
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        sx={{ width: { xs: '100%', md: 340 }, ...BOX_SX }}
                        InputProps={{
                            inputProps: { 'aria-label': `Search ${noun}` },
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Search fontSize='small' />
                                </InputAdornment>
                            )
                        }}
                    />
                    {dates && (
                        <Stack direction='row' spacing={1.5} key={datesKey}>
                            <CustomSearchDateField
                                type='from'
                                filters={dateFilters}
                                setFilters={setDateFilters}
                                placeholder='From date'
                                label='From'
                            />
                            <CustomSearchDateField
                                type='to'
                                filters={dateFilters}
                                setFilters={setDateFilters}
                                placeholder='To date'
                                label='To'
                            />
                        </Stack>
                    )}
                    {filters.map(filter => (
                        <Stack key={filter.key} direction='row' spacing={0.5} alignItems='center'>
                            <TextField
                                select
                                size='small'
                                label={filter.label}
                                value={values[filter.key] || 'All'}
                                onChange={event =>
                                    setValue(filter.key, event.target.value === 'All' ? '' : event.target.value)
                                }
                                sx={{ width: { xs: '100%', md: filter.width || 160 }, ...BOX_SX }}
                            >
                                <MenuItem value='All'>{filter.allLabel || 'All'}</MenuItem>
                                {filter.options.map(option => (
                                    <MenuItem key={option.value} value={String(option.value)}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {filter.help && (
                                <Tooltip
                                    arrow
                                    title={
                                        <Box sx={{ whiteSpace: 'pre-line', fontSize: '0.75rem' }}>{filter.help}</Box>
                                    }
                                >
                                    <InfoOutlined
                                        fontSize='small'
                                        sx={{ color: 'text.secondary' }}
                                        aria-label={filter.help}
                                    />
                                </Tooltip>
                            )}
                        </Stack>
                    ))}
                    {assignee && (
                        <AssigneeFilter
                            label={assigneeLabel}
                            value={values.assignedTo || ''}
                            onChange={id => setValue('assignedTo', id)}
                        />
                    )}
                    {hasFilters && (
                        <CustomButton
                            variant='text'
                            customStyles={{
                                color: 'error.main',
                                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                            }}
                            startIcon={<FilterAltOff />}
                            onClick={clearFilters}
                        >
                            Clear filters
                        </CustomButton>
                    )}
                    {loaded && !loading && count > 0 && (
                        <Typography variant='body2' color='text.secondary' sx={{ ml: { md: 'auto' } }}>
                            {count} {noun}
                        </Typography>
                    )}
                </Stack>

                {emptyKind && (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                        <ListEmptyState
                            kind={emptyKind}
                            noun={noun}
                            title={emptyTitle}
                            text={emptyText}
                            canAdd={canAdd && hasCreateAccess}
                            addLabel={addLabel}
                            onAdd={onAdd}
                            onClear={clearFilters}
                        />
                    </Box>
                )}

                {/* the table stays mounted while empty so it keeps fetching */}
                <Box sx={{ display: emptyKind ? 'none' : 'block' }}>
                    <DataTable
                        key={tableKey}
                        data={shownRows}
                        columns={columns}
                        queryHandler={queryHandler}
                        reqKey={reqKey}
                        refetch={refetch}
                        globalSearch={search}
                        globalFilters={dateFilters}
                        addExcelQuery={excelHandler}
                        totalRecords={count}
                        isColumnsSearchable={false}
                        renderAction={renderAction}
                        isLoading={loading}
                    />
                </Box>
            </Stack>
        </MainCard>
    )
}

ListPage.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    eyebrow: PropTypes.node,
    noun: PropTypes.string.isRequired,
    searchPlaceholder: PropTypes.string.isRequired,
    headers: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string })).isRequired,
    endpoint: PropTypes.shape({ initiate: PropTypes.func.isRequired }).isRequired,
    baseParams: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    reqKey: PropTypes.string.isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            options: PropTypes.arrayOf(
                PropTypes.shape({
                    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
                    label: PropTypes.string
                })
            ).isRequired,
            width: PropTypes.number,
            allLabel: PropTypes.string,
            help: PropTypes.string
        })
    ),
    dates: PropTypes.bool,
    assignee: PropTypes.bool,
    assigneeLabel: PropTypes.string,
    rowsOf: PropTypes.func,
    renderAction: PropTypes.func,
    csvName: PropTypes.string.isRequired,
    canAdd: PropTypes.bool,
    addLabel: PropTypes.string,
    onAdd: PropTypes.func,
    emptyTitle: PropTypes.string,
    emptyText: PropTypes.string,
    reloadSignal: PropTypes.number,
    extraActions: PropTypes.node,
    notice: PropTypes.node,
    onLoaded: PropTypes.func
}

export default ListPage
