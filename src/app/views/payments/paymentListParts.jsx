import PropTypes from 'prop-types'
import { LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material'
import AssigneeFilter from '@/core/components/AssigneeFilter'
import {
    ClearFiltersButton,
    ColumnsAndCsv,
    CountText,
    DateBox,
    SearchBox,
    SelectBox,
    ToolbarRow
} from '@/core/listing/ScreenToolbar'
import { shownColumns } from '@/core/listing/screenFacts'

const COLUMN = PropTypes.shape({ key: PropTypes.string.isRequired, label: PropTypes.string.isRequired })

/**
 * The one toolbar row of a payments list, in the Leads look: search, From / To, method, (service), recorded by, "Clear
 * filters" once any is set, the count, the column picker and CSV. Every change goes up as `onChange({ key: value })`.
 */
export function PaymentsToolbar({
    filters,
    onChange,
    onClear,
    hasFilters,
    methods,
    types = null,
    searchPlaceholder,
    count,
    showCount,
    columns,
    onToggle,
    onCurrent,
    onAll
}) {
    return (
        <ToolbarRow>
            <SearchBox
                value={filters.q}
                onCommit={q => onChange({ q })}
                noun='payments'
                placeholder={searchPlaceholder}
            />
            <DateBox
                label='From'
                value={filters.from}
                max={filters.to || undefined}
                onChange={from => onChange({ from })}
            />
            <DateBox label='To' value={filters.to} min={filters.from || undefined} onChange={to => onChange({ to })} />
            <SelectBox
                label='Method'
                value={filters.method}
                onChange={method => onChange({ method })}
                options={methods.map(method => ({ value: method, label: method }))}
                allLabel='All methods'
            />
            {types ? (
                <SelectBox
                    label='Service'
                    value={filters.type}
                    onChange={type => onChange({ type })}
                    options={types.map(([value, label]) => ({ value, label }))}
                    allLabel='All services'
                    width={140}
                />
            ) : null}
            <AssigneeFilter
                label='Recorded by'
                value={filters.recordedBy}
                onChange={recordedBy => onChange({ recordedBy })}
            />
            {hasFilters ? <ClearFiltersButton onClick={onClear} /> : null}
            <CountText count={count} noun={count === 1 ? 'payment' : 'payments'} show={showCount} />
            <ColumnsAndCsv columns={columns} onToggle={onToggle} onCurrent={onCurrent} onAll={onAll} />
        </ToolbarRow>
    )
}

PaymentsToolbar.propTypes = {
    filters: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string,
        method: PropTypes.string,
        type: PropTypes.string,
        recordedBy: PropTypes.string,
        q: PropTypes.string
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    hasFilters: PropTypes.bool.isRequired,
    methods: PropTypes.arrayOf(PropTypes.string).isRequired,
    types: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    searchPlaceholder: PropTypes.string.isRequired,
    count: PropTypes.number,
    showCount: PropTypes.bool,
    columns: PropTypes.arrayOf(COLUMN).isRequired,
    onToggle: PropTypes.func.isRequired,
    onCurrent: PropTypes.func.isRequired,
    onAll: PropTypes.func.isRequired
}

/** @description the table of a payments list: the columns that are picked, each drawn by its own `render(row, context)` */
export function PaymentsTable({ columns, rows, context, label, fetching, hidden = false }) {
    const shown = shownColumns(columns)
    return (
        <Box sx={{ position: 'relative', display: hidden ? 'none' : 'block' }}>
            {fetching ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} /> : null}
            <TableContainer sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size='small' aria-label={label}>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 600, whiteSpace: 'nowrap', bgcolor: 'grey.50' } }}>
                            {shown.map(column => (
                                <TableCell key={column.key} align={column.align}>
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.id} hover>
                                {shown.map(column => (
                                    <TableCell
                                        key={column.key}
                                        align={column.align}
                                        sx={{
                                            ...(column.nowrap ? { whiteSpace: 'nowrap' } : {}),
                                            ...(column.bold ? { fontWeight: 600 } : {})
                                        }}
                                    >
                                        {column.render(row, context)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

PaymentsTable.propTypes = {
    columns: PropTypes.arrayOf(COLUMN).isRequired,
    rows: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number })).isRequired,
    context: PropTypes.shape({ canDecide: PropTypes.bool, decide: PropTypes.func }),
    label: PropTypes.string.isRequired,
    fetching: PropTypes.bool,
    hidden: PropTypes.bool
}
