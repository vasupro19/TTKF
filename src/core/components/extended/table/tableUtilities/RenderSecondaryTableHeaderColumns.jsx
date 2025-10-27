import { Box, TableCell } from '@mui/material'
import SearchFilterDropdown from '@/core/components/SearchFilterDropdown'
import { findLastStickColumnIndex } from '@/utilities'
import generateSecondaryHeaderCellStyles from './generateSecondaryHeaderCellStyles'
import TableCellSearchInput from './TableCellSearchInput'

const RenderSecondaryTableHeaderColumns = ({
    columns,
    stickyLeftHeaderSearchRow,
    handleSearch,
    headerCellSX,
    removeFilters,
    hasData
}) =>
    columns
        ?.filter(column => column?.visible)
        ?.map((column, index, array) => {
            const cellStyles = generateSecondaryHeaderCellStyles(
                column,
                stickyLeftHeaderSearchRow,
                index,
                headerCellSX,
                hasData
            )
            /* eslint-disable no-param-reassign */
            stickyLeftHeaderSearchRow += Number(column.minWidth) || 8

            return (
                <TableCell
                    sx={cellStyles}
                    key={column.id}
                    align={column.align}
                    className={`regular-height ${column.stick && hasData && index === findLastStickColumnIndex(array) ? 'sticky-secondary-cell' : ''}`}
                >
                    {!column?.filter ? (
                        <Box
                            className='regular-height'
                            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            {column?.search && (
                                <TableCellSearchInput
                                    column={column}
                                    handleSearch={handleSearch}
                                    removeFilters={removeFilters}
                                />
                            )}
                        </Box>
                    ) : (
                        <Box
                            className='regular-height'
                            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            <SearchFilterDropdown
                                buttonText='Filter'
                                optionsProp={column?.options}
                                // TODO::add change function over here
                                isSearchable={false}
                                customButtonSx={{
                                    padding: '2px',
                                    fontSize: '12px'
                                }}
                                variant='text'
                                buttonSx={{
                                    padding: '2px 6px',
                                    height: '20px'
                                }}
                                isClearButton
                                singleSelect={column?.singleSelect}
                                removeFilters={removeFilters}
                                handleFilters={handleSearch}
                                column={column}
                            />
                        </Box>
                    )}
                </TableCell>
            )
        })

export default RenderSecondaryTableHeaderColumns
