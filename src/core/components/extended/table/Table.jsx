/* eslint-disable prefer-const */
import { memo, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
// material-ui
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Paper,
    Checkbox,
    Skeleton,
    useTheme,
    styled,
    useMediaQuery
} from '@mui/material'
import noDataSvg from '@assets/illustrations/no-data-animate.svg'

import { buildQuery } from '@/utilities'
import { dispatchLoaderEvent } from '@/app/store/helpers'

import { RenderPrimaryHeaderColumns, RenderSecondaryTableHeaderColumns, RenderTableRowCells } from './tableUtilities'
import './globalTable.css'
import { useContextMenu } from '../../RowContextMenu'
import CustomPagination from './CustomPagination'

/**
 * Renders a data table with configurable columns, pagination, and actions.
 *
 * @param {Array<Object>} data - The data to display in the table.
 * @param {Array<Object>} columns - Column configuration, including headers and data keys.
 * @param {Function} queryHandler - Function to handle data queries, typically for sorting or filtering.
 * @param {number} rows - Number of rows to display per page.
 * @param {Array<number>} rowsPerPageOptions - Options for rows per page selection.
 * @param {Function} renderAction - Function to render actions within each row.
 * @param {Object} [headerCellSX={}] - Styles for table header cells.
 * @param {Object} [rowCellSX={}] - Styles for table row cells.
 * @param {Object} [tableContainerSX={}] - Styles for the table container.
 * @param {Object} [headerRowSX={}] - Styles for the header row.
 * @param {boolean} [isCheckbox=false] - Whether to show a checkbox column.
 * @param {boolean} [showStripes=true] - Whether to show striped rows for readability.
 * @param {boolean} [isLoading=false] - Whether to show loading spinner.
 * @param {boolean} [showActionFirst=false] - Whether to show Action column in left end.
 * @param {boolean} [isColumnsSearchable=true] - Whether to show searchable header row.
 * @param {boolean} [addFormRow=false] - Whether to show second header row as form or not.
 * @param {boolean} [tabsFields=[]] - To show Inputs as in table cell dynamically.
 * @param {JSX.Element} formRowComponent - JSX.Element form element.
 * @param {boolean} [setSelectedRow] - Function to set  the selected rows and use it in parent.
 * @param {boolean} [clearSelectionRef] - Whether to show searchable header row.
 * @param {Function} [setIsShowClearButton] - Function to control the visibility of the clear filter button.
 * @param {boolean} [clearAllFilters=false] - Whether to clear all filters on render.
 * @param {string} [noDataText='No Records Found'] - Text to display when there's no data.
 * @param {boolean} [fullSizeCheckBoxCell=false] - Whether to render the checkbox cell in full width.
 * @param {boolean} [enableContextMenu=false] - Whether to display ContextMenu on right click.
 * @param {boolean} [refetch=false] - Controls query handler call from parent component.
 * @param {boolean} [rowKeyField] - which row key to use as unique key for each row, unique data field in data.

 * @returns {JSX.Element} Rendered table component.
 */

// Fixed header that will clone the table header
// eslint-disable-next-line no-shadow
const FixedHeaderContainer = styled(Box)(({ theme, width }) => ({
    position: 'fixed',
    top: '56px', // 50px from the top of viewport
    zIndex: 10,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    width,
    overflowX: 'hidden',
    visibility: 'hidden', // Initially hidden, will be shown when scrolled
    opacity: 0,
    transition: 'opacity 0.2s'
}))

// when user scrolls horizontally
const shadowHelper = {
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: '-6px',
        bottom: 0,
        width: '6px',
        background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)',
        pointerEvents: 'none',
        zIndex: 1
    }
}
function DataTable({
    reqKey,
    data,
    columns,
    queryHandler,
    rows,
    rowsPerPageOptions,
    totalRecords,
    renderAction,
    headerCellSX = {},
    rowCellSX = {},
    tableContainerSX = {},
    headerRowSX = {},
    isCheckbox = false,
    showStripes = false,
    isLoading = false,
    globalSearch,
    globalFilters,
    clearFilters,
    showActionFirst = false,
    addExcelQuery = false,
    isColumnsSearchable = true,
    addFormRow = false,
    formRowComponent,
    setSelectedRow,
    clearSelectionRef,
    setIsShowClearButton,
    clearAllFilters = false,
    noDataText = 'No Records Found',
    fullSizeCheckBoxCell = false,
    enableContextMenu = false,
    refetch = false,
    rowKeyField
}) {
    // Safely get context (no error if provider is missing)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const context = enableContextMenu ? useContextMenu() : null
    const theme = useTheme()
    const isMobile = useMediaQuery('(max-width:600px)')

    // const dispatch = useDispatch()

    const queryColumnItem = {
        data: '', // string
        name: '', // string
        searchable: true, // true || false
        orderable: true, // true || false
        search: {
            value: '',
            regex: false // true || false
        }
    }

    const orderItem = {
        column: 0, // 'column index'
        dir: 'desc' // 'asc|desc'
    }

    if (columns && columns.length && orderItem.column < 1) {
        // eslint-disable-next-line no-return-assign
        columns.map((item, index) => item.key === 'created_at' && (orderItem.column = index > 0 ? index - 1 : index)) //
    }

    // counter variables for updating the stick column left alignment
    let stickyLeft = isCheckbox && columns?.[0]?.stick ? 2.44 : 0
    let stickyLeftHeaderSearchRow = isCheckbox && columns?.[0]?.stick ? 2.44 : 0
    const tableRef = useRef(null)
    // Move scroll handlers outside useEffect to avoid stale closures
    const handleScrollRef = useRef()
    const handleHorizontalScrollRef = useRef()

    const [page, setPage] = useState(0)
    const [length, setLength] = useState(rows || 10)
    const [filteredData, setFilteredData] = useState([])
    const [queryColumns, setQueryColumns] = useState([])
    const [queryColumnsEmpty, setQueryColumnsEmpty] = useState([])
    const [querySearch, setQuerySearch] = useState({ ...globalSearch })
    const [queryFilters, setQueryFilters] = useState({ ...globalFilters })
    const [order, setOrder] = useState([{ ...orderItem }])
    const [selected, setSelected] = useState([]) // selected checkbox
    const [removeFilters, setRemoveFilters] = useState(false)

    // Define the state to track search terms
    // eslint-disable-next-line no-unused-vars
    const [searchTerms, setSearchTerms] = useState({})
    const headerRef = useRef(null)
    const fixedHeaderRef = useRef(null)
    const [tableWidth, setTableWidth] = useState(0)
    const [isInitialized, setIsInitialized] = useState(false)
    // const [queryCount, setQueryCount] = useState(0)

    const isSelected = id => selected.includes(id)

    const handleSelectAllClick = event => {
        if (event.target.checked) {
            const newSelected =
                filteredData
                    ?.filter(row => !row.isDisabled) // Exclude disabled rows
                    .map(row => row.id) || []

            setSelected(newSelected)
            setSelectedRow(newSelected)
            return
        }
        setSelected([])
        setSelectedRow([])
    }

    const handleClick = id => {
        const selectedIndex = selected.indexOf(id)
        let newSelected = []

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id)
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1))
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1))
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1))
        }
        setSelected(newSelected)
        setSelectedRow(newSelected)
    }

    // make query and fire parent handleQuery function
    function makeQuery(excel = false) {
        const queryObject = {
            start: page * length,
            length,
            // columns: queryColumns,
            // order,
            search: querySearch,
            filters: queryFilters
        }
        if (excel) {
            queryObject.export = true
            queryObject.ext = 'csv'
        }

        let query = `?${buildQuery(queryObject)}`
        query = query.replace(/&+$/, '')
        queryHandler(query, queryObject)
        if (excel) setTimeout(() => dispatchLoaderEvent(reqKey, false), 200)
    }

    const handleChangeRowsPerPage = event => {
        setLength(parseInt(event?.target?.value, 10))
        setPage(0)
    }

    // eslint-disable-next-line no-console
    console.log('re-rendered table component !!!!!!! 🥶')

    const handleSort = id => {
        setOrder(prevOrder => {
            const [currentOrder] = prevOrder
            let newIndex

            // eslint-disable-next-line no-return-assign
            columns.map((item, index) => item.id === id && (newIndex = index > 0 ? index - 1 : index))

            let newDir
            if (currentOrder?.column === newIndex && currentOrder.dir === 'asc') newDir = 'desc'
            else if (currentOrder?.column === newIndex && currentOrder.dir === 'desc') newDir = 'asc'
            else if (currentOrder?.column !== newIndex && currentOrder.dir === 'asc') newDir = 'desc'
            else newDir = 'asc'

            return [{ column: newIndex, dir: newDir }]
        })
    }

    const handleClear = () => {
        setQueryColumns(queryColumnsEmpty)
        setOrder([{ ...orderItem }])
        if (clearFilters) clearFilters()
        setRemoveFilters(true)
        setTimeout(() => setRemoveFilters(false), 500)
    }

    const handlePageChange = (event, newPage) => setPage(newPage)

    // Always keep these functions fresh for showing fixed header and sticky column shadow respectively
    handleScrollRef.current = () => {
        const fixedHeader = fixedHeaderRef.current
        const originalHeader = headerRef.current
        const table = tableRef.current

        if (!fixedHeader || !originalHeader || !table) return

        const tableRect = table.getBoundingClientRect()
        const headerRect = originalHeader.getBoundingClientRect()
        const headerThreshold = 64

        if (headerRect.bottom <= headerThreshold && tableRect.bottom > headerThreshold) {
            fixedHeader.style.visibility = 'visible'
            fixedHeader.style.opacity = '1'
            fixedHeader.scrollLeft = table.scrollLeft
        } else {
            fixedHeader.style.visibility = 'hidden'
            fixedHeader.style.opacity = '0'
        }
    }

    handleHorizontalScrollRef.current = () => {
        const fixedHeader = fixedHeaderRef.current
        const table = tableRef.current

        if (!fixedHeader || !table) return

        if (fixedHeader.style.visibility === 'visible') {
            fixedHeader.scrollLeft = table.scrollLeft
        }

        // Toggle scrolled class for styling
        const isScrolled = table.scrollLeft > 0
        table.classList.toggle('scrolled', isScrolled)
    }

    useEffect(() => {
        // if (data && queryCount > 0) {
        if (data) {
            setFilteredData((data && data.map((item, index) => ({ ...item, s_no: page * length + (index + 1) }))) || [])
            dispatchLoaderEvent(reqKey, false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const makeEmptyColumns = () => {
        if (!columns.length) return false
        const currentColumn = columns.filter(col => !col?.isFrontend)
        let queryColumnsEmptyStatic =
            currentColumn?.map(col => {
                queryColumnItem.data = col.key
                queryColumnItem.name = col.key
                queryColumnItem.searchable = col.search
                queryColumnItem.orderable = col.sort

                return { ...queryColumnItem }
            }) || []
        setQueryColumnsEmpty(queryColumnsEmptyStatic)
        setQueryColumns(queryColumnsEmptyStatic)

        return queryColumnsEmptyStatic
    }

    useEffect(() => {
        if (filteredData && !queryColumns.length) makeEmptyColumns()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryColumns])

    useEffect(() => {
        makeEmptyColumns()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns])

    useEffect(() => {
        // ! remove the condition and call makeQuery directly if table fails to load data
        if (queryColumns && queryColumns.length) makeQuery()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryColumns, order, page, length, querySearch, queryFilters])

    useEffect(() => {
        // ! parent component wants to fetch data again
        if (queryColumns && queryColumns.length && refetch) makeQuery()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refetch])

    // useEffect(() => {
    //     setQuerySearch(globalSearch)
    //     if (filteredData && globalFilters?.created_at.from && globalFilters?.created_at.to)
    //         setQueryFilters({
    //             created_at: [`${globalFilters?.created_at.from}`, `${globalFilters?.created_at.to}`]
    //         })
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [globalSearch, globalFilters])

    // Note::height of the table rows along with header can be adjusted by regular-height class
    // but to see changes please update padding of individual elements eg:checkbox

    useEffect(() => {
        if (addExcelQuery) makeQuery(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addExcelQuery])

    useEffect(() => {
        if (clearSelectionRef) {
            // Assign the clearSelection function to the ref so the parent can call it
            clearSelectionRef.current = () => {
                setSelected([]) // Clear the local selected state
            }
        }
    }, [clearSelectionRef])

    const handleSearch = (id, searchKey, value) => {
        let filter = ''
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') filter = value.map(item => item.value)
        //     else if (typeof value[0] === 'string')
        // } else if (value && typeof value === 'string') filter = value
        else filter = value

        const updatedQueryColumns = (queryColumns && queryColumns.length ? queryColumns : makeEmptyColumns()).map(
            col => {
                if (col.data === searchKey) return { ...col, search: { value: filter, regex: false } }
                return col
            }
        )
        setQueryColumns(updatedQueryColumns)
    }

    // ? check if row is active or not
    // const isActive = row => {
    //     if ('active' in row) {
    //         return !!row.active
    //     }
    //     if ('is_active' in row) {
    //         return !!row.is_active
    //     }
    //     return true
    // }

    const globalCellStyles = {
        padding: '6px 8px',
        border: 'none',
        borderColor: 'primary.dark',
        backgroundColor: theme.palette.grey[200]
    }
    const bdStr = '2px solid !important'

    // to show Clear all filter button in table page
    useEffect(() => {
        setIsShowClearButton?.(
            queryColumns.some(column =>
                Array.isArray(column.search.value) ? column.search.value.length > 0 : column.search.value.trim() !== ''
            )
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryColumns])

    // when Clear all filter button is clicked in table page
    useEffect(() => {
        if (clearAllFilters) handleClear()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearAllFilters])

    // Use a layout effect to measure dimensions after DOM is fully rendered
    useEffect(() => {
        // Delay initialization to ensure DOM elements are rendered
        const timer = setTimeout(() => {
            if (tableRef?.current) {
                setTableWidth(tableRef.current.offsetWidth)
                setIsInitialized(true)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // Effect to handle scrolling - only run after initialization
    useEffect(() => {
        if (!isInitialized || isLoading) return

        const table = tableRef.current
        if (!table) return

        const scrollHandler = () => handleScrollRef.current?.()
        const horizontalScrollHandler = () => handleHorizontalScrollRef.current?.()

        const resizeHandler = () => {
            if (tableRef?.current) {
                setTableWidth(tableRef.current.offsetWidth)
                handleScrollRef.current?.()
            }
        }

        handleScrollRef.current?.()

        window.addEventListener('scroll', scrollHandler)
        table.addEventListener('scroll', horizontalScrollHandler)

        const resizeObserver = new ResizeObserver(resizeHandler)
        resizeObserver.observe(table)

        // eslint-disable-next-line consistent-return
        return () => {
            window.removeEventListener('scroll', scrollHandler)
            table.removeEventListener('scroll', horizontalScrollHandler)
            resizeObserver.disconnect()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInitialized, isLoading])

    // Function to flash the row using DOM manipulation - fully optimized version
    const flashRow = rowId => {
        if (!enableContextMenu) {
            // if no custom Context Menu return
            return
        }
        // Get row element
        const rowElement = document.querySelector(`.row-${rowId}`)
        if (!rowElement) return

        // Check if table has 'scrolled' class
        const tableContainer = tableRef?.current
        const isTableScrolled = tableContainer?.classList.contains('scrolled')

        // Define our cell selection strategy based on table scroll state
        let cells
        if (isTableScrolled) {
            // When table is scrolled:
            // 1. Exclude sticky cells
            // 2. Exclude the first cell (checkbox cell)
            // 3. Exclude any cell containing MuiCheckbox-root
            const allCells = Array.from(rowElement.querySelectorAll('td'))
            cells = allCells.filter((cell, index) => {
                // Skip first cell (index 0)
                if (index === 0) return false

                // if (cell.classList.contains('sticky-cell')) return false

                // Skip cells containing checkboxes
                if (cell.querySelector('.MuiCheckbox-root')) return false

                return true
            })
        } else {
            // When table is not scrolled, highlight all cells except checkbox cells
            const allCells = Array.from(rowElement.querySelectorAll('td'))
            cells = allCells.filter(cell => !cell.querySelector('.MuiCheckbox-root'))
        }

        // Skip processing if no valid cells found
        if (cells.length === 0) return

        // Apply styles using requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            cells.forEach(cell => {
                // cell.setAttribute('style', `background-color: ${highlightColor} !important`) // Original static style application
                // ** Updated code for a subtle background change/animation **
                cell.style.transition = 'background-color 0.2s ease-in-out' // Add a transition for smoothness
                cell.style.backgroundColor = '#cdd5df' // Apply the highlight color
            })

            // Remove highlight after 1 second
            setTimeout(() => {
                requestAnimationFrame(() => {
                    cells.forEach(cell => {
                        // cell.removeAttribute('style') // Original style removal
                        // ** Updated code for removing the background color and allowing transition **
                        cell.style.backgroundColor = '' // Remove the background color
                        // The transition property will handle the smooth fade out
                    })
                })
            }, 300)
        })
    }

    // Fixed handleContextMenu function that properly handles scrolled content
    const handleContextMenu = (event, row) => {
        if (!enableContextMenu || !context) return // Exit if context menu is disabled

        // Prevent default browser context menu
        event.preventDefault()
        // Flash the row using DOM manipulation (no state change)
        flashRow(row.id)
        // IMPORTANT FIX: Use pageX and pageY instead of clientX and clientY
        // pageX/Y include scroll position, while clientX/Y are relative to viewport

        // Set context menu data with correct coordinates
        context?.setContextMenuRow(row)
        context?.setContextMenu({
            // Use pageX/Y for correct positioning regardless of scroll position
            mouseX: event.pageX + 2,
            mouseY: event.pageY - 6
        })
    }

    return (
        <Box
            sx={{
                position: 'relative',
                ...(!isMobile && !(!filteredData.length && !isLoading)
                    ? {
                          '& .data-table-container.scrolled .sticky-cell': {
                              ...shadowHelper
                          },
                          '& .data-table-container.scrolled .sticky-secondary-cell': {
                              ...shadowHelper
                          },
                          '& .data-table-container.scrolled .sticky-primary-header-cell': {
                              ...shadowHelper
                          }
                      }
                    : {})
            }}
        >
            {/* Fixed header that becomes visible when scrolled */}
            <FixedHeaderContainer ref={fixedHeaderRef} width={tableWidth}>
                <Table>
                    <TableHead>
                        <TableRow
                            sx={{
                                '& .MuiTableCell-root': {
                                    backgroundColor: 'grey.300',
                                    '&:first-of-type': {
                                        minWidth: '32px', // Exception for the first column
                                        width: '32px' // Adjust width explicitly
                                    }
                                },
                                ...headerRowSX
                            }}
                            className='regular-height'
                        >
                            {isCheckbox && (
                                <TableCell
                                    padding='checkbox'
                                    className='regular-height'
                                    sx={{
                                        textAlign: 'center',
                                        position: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? 'sticky'
                                                    : 'auto'
                                        },
                                        left: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? `${0}rem`
                                                    : 'auto'
                                        },
                                        zIndex: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? 3
                                                    : 'auto'
                                        }
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < filteredData?.length}
                                        checked={filteredData?.length > 0 && selected.length === filteredData?.length}
                                        onChange={handleSelectAllClick}
                                        sx={{
                                            color: 'white', // Ensure checkbox is visible in all states
                                            '&.Mui-checked': {
                                                color: 'white' // Set checked color to white for visibility
                                            },
                                            '&.MuiCheckbox-indeterminate': {
                                                color: 'white' // Set indeterminate state color to white
                                            },
                                            '& .MuiSvgIcon-root': { fontSize: 18 }
                                        }}
                                        className='regular-size'
                                    />
                                </TableCell>
                            )}
                            {renderAction && showActionFirst && (
                                <TableCell
                                    sx={{
                                        padding: '2px 8px',
                                        ...headerCellSX
                                    }}
                                    align='left'
                                    className='regular-height'
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            color: 'text.paper',
                                            padding: '0px 8px'
                                        }}
                                        className='regular-height'
                                    >
                                        <Box>Action</Box>
                                    </Box>
                                </TableCell>
                            )}
                            <RenderPrimaryHeaderColumns
                                columns={columns}
                                stickyLeft={stickyLeft}
                                searchTerms={searchTerms}
                                handleSort={handleSort}
                                headerCellSX={headerCellSX}
                                hasData={isLoading || filteredData.length > 0} // Adding this prop for controlling Css (sticky position in this case) when no data is there
                            />
                            {renderAction && !showActionFirst && (
                                <TableCell
                                    sx={{
                                        padding: '2px 8px',
                                        ...headerCellSX
                                    }}
                                    align='left'
                                    className='regular-height'
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            color: 'text.primary',
                                            padding: '0px 8px'
                                        }}
                                        className='regular-height'
                                    >
                                        <Box>Action</Box>
                                    </Box>
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                </Table>
            </FixedHeaderContainer>

            {/* Scrollable table container */}
            <TableContainer
                sx={{
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    boxShadow: 3,
                    ...tableContainerSX
                }}
                component={Paper}
                ref={tableRef}
                className='custom-y-scroll data-table-container'
            >
                <Table stickyHeader aria-label='sticky table'>
                    <TableHead ref={headerRef}>
                        <TableRow
                            sx={{
                                '& .MuiTableCell-root': {
                                    background: 'linear-gradient(180deg, #f1f5f9 0%, #e5e7eb 100%)',
                                    '&:first-of-type': {
                                        minWidth: '32px', // Exception for the first column
                                        width: '32px' // Adjust width explicitly
                                    }
                                },
                                ...headerRowSX
                            }}
                            className='regular-height'
                        >
                            {isCheckbox && (
                                <TableCell
                                    padding='checkbox'
                                    className='regular-height'
                                    sx={{
                                        textAlign: 'center',
                                        position: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? 'sticky'
                                                    : 'auto'
                                        },
                                        left: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? `${0}rem`
                                                    : 'auto'
                                        },
                                        zIndex: {
                                            xs: 'static',
                                            sm:
                                                columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                    ? 3
                                                    : 'auto'
                                        },
                                        borderBottom: '1px solid #BCC1CAFF',
                                        borderRight: '1px solid #dddddd', // Adjust color as needed
                                        '&:first-of-type': {
                                            borderLeft: 'none' // Remove left border for the first column
                                        }
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < filteredData?.length}
                                        checked={filteredData?.length > 0 && selected.length === filteredData?.length}
                                        onChange={handleSelectAllClick}
                                        sx={{
                                            color: 'primary.main', // Ensure checkbox is visible in all states
                                            '& .MuiSvgIcon-root': { fontSize: 18 }
                                        }}
                                        className='regular-size'
                                    />
                                </TableCell>
                            )}
                            {renderAction && showActionFirst && (
                                <TableCell
                                    sx={{
                                        padding: '2px 8px',
                                        ...headerCellSX
                                    }}
                                    align='left'
                                    className='regular-height'
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            color: 'text.paper',
                                            padding: '0px 8px'
                                        }}
                                        className='regular-height'
                                    >
                                        <Box>Action</Box>
                                    </Box>
                                </TableCell>
                            )}
                            <RenderPrimaryHeaderColumns
                                columns={columns}
                                stickyLeft={stickyLeft}
                                searchTerms={searchTerms}
                                handleSort={handleSort}
                                headerCellSX={headerCellSX}
                                hasData={isLoading || filteredData.length > 0} // Adding this prop for controlling Css (sticky position in this case) when no data is there
                            />
                            {renderAction && !showActionFirst && (
                                <TableCell
                                    sx={{
                                        padding: '2px 8px',
                                        borderBottom: '1px solid #BCC1CAFF',
                                        ...headerCellSX
                                    }}
                                    align='left'
                                    className='regular-height'
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            color: 'text.dark',
                                            padding: '0px 8px'
                                        }}
                                        className='regular-height'
                                    >
                                        <Box>Action</Box>
                                    </Box>
                                </TableCell>
                            )}
                        </TableRow>
                        {addFormRow && (
                            <TableRow
                                sx={{
                                    padding: '0px !important',
                                    border: 'none'
                                }}
                                className='regular-height'
                            >
                                <TableCell
                                    sx={{
                                        ...globalCellStyles,
                                        ...headerCellSX,
                                        borderLeft: bdStr,
                                        borderTop: bdStr,
                                        borderBottom: bdStr,
                                        borderBottomLeftRadius: '8px',
                                        borderTopLeftRadius: '8px',
                                        marginLeft: '8px !important'
                                    }}
                                    className='regular-height'
                                    align='center'
                                    colSpan={isCheckbox ? 2 : 1} // Span across two columns
                                >
                                    Form:{' '}
                                </TableCell>
                                {showActionFirst && <TableCell className='regular-height' sx={globalCellStyles} />}
                                {formRowComponent}
                            </TableRow>
                        )}
                        {/* {isColumnsSearchable && !isLoading && ( */}
                        {isColumnsSearchable && (
                            <TableRow
                                sx={{
                                    padding: '0px'
                                }}
                                className='regular-height'
                            >
                                {isCheckbox && (
                                    <TableCell
                                        sx={{
                                            padding: '0px',
                                            position: {
                                                xs: 'static',
                                                sm:
                                                    columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                        ? 'sticky'
                                                        : 'auto'
                                            },
                                            left: {
                                                xs: 'static',
                                                sm:
                                                    columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                        ? `${0}rem`
                                                        : 'auto'
                                            },
                                            top: '0px',
                                            backgroundColor: 'background.paper',
                                            zIndex: {
                                                xs: 'static',
                                                sm:
                                                    columns?.[0]?.stick && (isLoading || filteredData.length > 0)
                                                        ? 3
                                                        : 'auto'
                                            },
                                            borderRight: '0.2px solid #dddddd', // Adjust color as needed
                                            ...headerCellSX
                                        }}
                                        className='regular-height'
                                        align='center'
                                    >
                                        {/* This cell is intentionally left empty for checkboxes */}
                                    </TableCell>
                                )}
                                {showActionFirst && (
                                    <TableCell
                                        className='regular-height'
                                        style={{
                                            padding: '2px 8px'
                                        }}
                                    >
                                        {/* // This cell is intentionally left empty for action buttons */}
                                    </TableCell>
                                )}
                                <RenderSecondaryTableHeaderColumns
                                    columns={columns}
                                    stickyLeftHeaderSearchRow={stickyLeftHeaderSearchRow}
                                    removeFilters={removeFilters}
                                    handleSearch={handleSearch}
                                    headerCellSX={headerCellSX}
                                    hasData={isLoading || filteredData.length > 0}
                                />
                                {!showActionFirst && renderAction && (
                                    <TableCell
                                        className='regular-height'
                                        style={{
                                            padding: '2px 8px'
                                        }}
                                    >
                                        {/* // This cell is intentionally left empty for action buttons */}
                                    </TableCell>
                                )}
                            </TableRow>
                        )}
                    </TableHead>
                    {/* // ::NOTE here we are showing no data for addFormRow === true prop */}
                    {!filteredData.length && !isLoading ? (
                        <>
                            {/* Empty TableBody to maintain table structure */}
                            <TableBody>
                                <TableRow
                                    sx={{
                                        height: '22rem'
                                    }}
                                >
                                    <TableCell colSpan={(columns?.length ?? 0) + (renderAction ? 2 : 0)} />
                                </TableRow>
                            </TableBody>

                            {/* No data message with pointer-events: none */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '22rem',
                                    paddingTop: '3rem',
                                    pointerEvents: 'none' // This is the key - it makes the element ignore pointer events
                                }}
                            >
                                <img src={noDataSvg} alt='Empty Truck' style={{ maxWidth: '240px' }} />
                                {noDataText}
                            </Box>
                        </>
                    ) : (
                        <TableBody>
                            {isLoading
                                ? Array.from({ length }).map((_, index) => (
                                      <TableRow
                                          tabIndex={-1}
                                          className='regular-height row-1'
                                          // eslint-disable-next-line react/no-array-index-key
                                          key={`skeleton-${index}`}
                                      >
                                          {isCheckbox && (
                                              <TableCell
                                                  className='regular-height'
                                                  sx={{
                                                      padding: '0px'
                                                  }}
                                                  align='left'
                                              >
                                                  <Skeleton animation='wave' />
                                              </TableCell>
                                          )}
                                          {renderAction && showActionFirst && (
                                              <TableCell
                                                  className='regular-height'
                                                  sx={{
                                                      padding: '0px'
                                                  }}
                                                  align='left'
                                              >
                                                  <Skeleton animation='wave' />
                                              </TableCell>
                                          )}
                                          <RenderTableRowCells
                                              columns={columns}
                                              row={{}}
                                              isSelected={isSelected}
                                              rowCellSX={rowCellSX}
                                              indexVal={index}
                                              showStripes={showStripes} // show table with striped rows
                                              isCheckbox={isCheckbox && columns?.[0]?.stick} // to update left sticky dimension
                                              isLoading={isLoading}
                                          />
                                          {renderAction && !showActionFirst && (
                                              <TableCell
                                                  className='regular-height'
                                                  sx={{
                                                      padding: '0px'
                                                  }}
                                                  align='left'
                                              >
                                                  <Skeleton animation='wave' />
                                              </TableCell>
                                          )}
                                      </TableRow>
                                  ))
                                : filteredData?.map((row, index) => (
                                      <TableRow
                                          hover
                                          role='checkbox'
                                          tabIndex={-1}
                                          key={rowKeyField ? row[rowKeyField] : row?.id}
                                          selected={isSelected(row.id)}
                                          className={`regular-height row-${rowKeyField ? row[rowKeyField] : row?.id}`}
                                          sx={{
                                              '&.Mui-selected': {
                                                  backgroundColor: '#E3E3E3',
                                                  '&:hover': {
                                                      backgroundColor: '#ececec' // this is for action column other works normally because of hover prop
                                                  }
                                              },
                                              '&:hover:not(.Mui-selected)': {
                                                  backgroundColor: '#ececec' // when hovered, but not selected for action column
                                              }
                                              //   opacity: isActive(row) ? 1 : 0.7 //TODO: find something that works for inActive rows
                                          }}
                                          onContextMenu={enableContextMenu ? e => handleContextMenu(e, row) : undefined}
                                      >
                                          {isCheckbox && (
                                              <TableCell
                                                  sx={{
                                                      display: 'flex',
                                                      justifyContent: 'center',
                                                      ...(fullSizeCheckBoxCell
                                                          ? {}
                                                          : {
                                                                padding: '0px 0px 0px 2px',
                                                                height: '32px !important',
                                                                maxHeight: '32px !important',
                                                                minWidth: '2.438rem'
                                                            }),
                                                      textAlign: 'center',
                                                      position: {
                                                          xs: 'static',
                                                          sm: columns?.[0]?.stick ? 'sticky' : 'auto'
                                                      },
                                                      left: {
                                                          xs: 'static',
                                                          sm: columns?.[0]?.stick ? `${0}rem` : 'auto'
                                                      },
                                                      zIndex: {
                                                          xs: 'static',
                                                          sm: columns?.[0]?.stick ? 2 : 'auto' // updated to '2', when scrolling in Y secondary header row cell should come on top '3'
                                                      },
                                                      backgroundColor: isSelected(row.id) ? '#E3E3E3' : '#fff',
                                                      borderRight: '1px solid #dddddd',
                                                      '&:first-of-type': {
                                                          borderLeft: 'none' // Remove left border for the first column
                                                      }
                                                  }}
                                                  className={fullSizeCheckBoxCell ? '' : 'regular-height'}
                                              >
                                                  <Checkbox
                                                      checked={isSelected(row.id)}
                                                      onChange={() => handleClick(row.id)}
                                                      className='regular-height'
                                                      sx={{
                                                          '& .MuiSvgIcon-root': { fontSize: 18 }
                                                      }}
                                                      disabled={row?.isDisabled}
                                                  />
                                              </TableCell>
                                          )}
                                          {renderAction && showActionFirst && (
                                              <TableCell
                                                  className='regular-height'
                                                  sx={{
                                                      padding: '0px'
                                                  }}
                                                  align='left'
                                              >
                                                  {renderAction(row)}
                                              </TableCell>
                                          )}
                                          <RenderTableRowCells
                                              columns={columns}
                                              row={row}
                                              isSelected={isSelected}
                                              rowCellSX={rowCellSX}
                                              indexVal={index}
                                              showStripes={showStripes} // show table with striped rows
                                              isCheckbox={isCheckbox && columns?.[0]?.stick} // to update left sticky dimension
                                              isLoading={isLoading}
                                          />
                                          {renderAction && !showActionFirst && (
                                              <TableCell
                                                  className='regular-height'
                                                  sx={{
                                                      padding: '0px'
                                                  }}
                                                  align='left'
                                              >
                                                  {renderAction(row)}
                                              </TableCell>
                                          )}
                                      </TableRow>
                                  ))}
                        </TableBody>
                    )}
                </Table>
            </TableContainer>
            {/* table pagination */}
            <CustomPagination
                totalRecords={totalRecords}
                rowsPerPage={length}
                currentPage={page + 1} // MUI uses 0-based indexing, this component uses 1-based
                rowsPerPageOptions={rowsPerPageOptions || [10, 25, 100]}
                onPageChange={newPage => handlePageChange(null, newPage - 1)} // Convert back to 0-based
                onRowsPerPageChange={newRowsPerPage => {
                    handleChangeRowsPerPage({ target: { value: newRowsPerPage } })
                }}
            />
        </Box>
    )
}

export default memo(DataTable)
/* eslint-disable */

DataTable.propTypes = {
    reqKey: PropTypes.string,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    queryHandler: PropTypes.func,
    rows: PropTypes.number,
    rowsPerPageOptions: PropTypes.array,
    totalRecords: PropTypes.number.isRequired,
    renderAction: PropTypes.func,
    isCheckbox: PropTypes.bool, //show selectable checkbox
    headerCellSX: PropTypes.object,
    headerRowSX: PropTypes.object,
    rowCellSX: PropTypes.object,
    tableContainerSX: PropTypes.object,
    showStripes: PropTypes.bool, //show table with striped rows
    isLoading: PropTypes.bool,
    showActionFirst: PropTypes.bool, //show action column in start
    globalSearch: PropTypes.object,
    globalFilters: PropTypes.object,
    clearFilters: PropTypes.func,
    addExcelQuery: PropTypes.bool,
    isColumnsSearchable: PropTypes.bool,
    addFormRow: PropTypes.bool,
    formRowComponent: PropTypes.node,
    // tabsFields: PropTypes.array,
    // formSubmitHandler: PropTypes.func,
    setSelectedRow: PropTypes.func,
    clearSelectionRef: PropTypes.object,
    setIsShowClearButton: PropTypes.func,
    clearAllFilters: PropTypes.bool,
    noDataText: PropTypes.string,
    fullSizeCheckBoxCell: PropTypes.bool,
    enableContextMenu: PropTypes.bool,
    refetch: PropTypes.bool,
    rowKeyField: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
