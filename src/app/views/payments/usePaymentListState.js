import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { pickerColumns, toggleColumn } from '@/core/listing/screenFacts'
import { EMPTY_FILTERS, filtersFromSearch, hasListFilters, searchAfter, statusFromSearch } from './paymentListTools'

const CLEARED = Object.fromEntries(Object.keys(EMPTY_FILTERS).map(key => [key, '']))

/**
 * What a payments tab keeps: its filters and status in the address bar (so a link or a reload keeps them), the page and
 * page size, and the picked columns. `methods` / `types` must be the same arrays each render.
 */
export default function usePaymentListState({ methods, types = [], baseColumns }) {
    const [params, setParams] = useSearchParams()
    const search = params.toString()
    const filters = useMemo(() => filtersFromSearch(search, { methods, types }), [search, methods, types])
    const status = statusFromSearch(search)
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(25)
    const [columns, setColumns] = useState(() => pickerColumns(baseColumns))

    // ? any change starts again from the first page; the tab (`tab=`) and anything else in the address stays
    const change = patch => {
        setParams(new URLSearchParams(searchAfter(search, patch)), { replace: true })
        setPage(0)
    }

    return {
        filters,
        status,
        hasFilters: hasListFilters(filters),
        change,
        clear: () => change(CLEARED),
        page,
        setPage,
        pageSize,
        setPageSize,
        columns,
        toggle: key => setColumns(current => toggleColumn(current, key))
    }
}
