/* eslint-disable */
import React from 'react'
import { Box, Select, MenuItem, Typography, IconButton, FormControl } from '@mui/material'
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from '@mui/icons-material'

const CustomPagination = ({
    totalRecords = 290,
    rowsPerPage = 10,
    currentPage = 1,
    rowsPerPageOptions = [10, 25, 50, 100],
    onPageChange = () => {},
    onRowsPerPageChange = () => {}
}) => {
    const totalPages = Math.ceil(totalRecords / rowsPerPage)
    const startRecord = (currentPage - 1) * rowsPerPage + 1
    const endRecord = Math.min(currentPage * rowsPerPage, totalRecords)

    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage)
        }
    }

    const handleRowsPerPageChange = event => {
        onRowsPerPageChange(event.target.value)
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i)
                }
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                minHeight: '56px',
                flexWrap: 'wrap',
                gap: 2,
                fontFamily: 'inherit',
                '@media (max-width: 768px)': {
                    flexDirection: 'column',
                    gap: 1
                },
                mt: { xs: 2, sm: 0 } // Add margin-top for mobile view
            }}
        >
            {/* Left side - Records per page */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '@media (max-width: 768px)': {
                        order: 2
                    }
                }}
            >
                <Typography
                    variant='body2'
                    sx={{
                        fontSize: '14px',
                        color: 'primary.800',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                        fontWeight: 500
                    }}
                >
                    Records per page:
                </Typography>
                <FormControl size='small'>
                    <Select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        sx={{
                            minWidth: '65px',
                            height: '32px',
                            fontFamily: 'inherit',
                            backgroundColor: 'background.paper',
                            color: 'text.primary',
                            '& .MuiSelect-select': {
                                padding: '4px 10px !important',
                                fontSize: '13px',
                                fontFamily: 'inherit',
                                backgroundColor: 'background.paper'
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '8px'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'grey.400'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: '1.5px'
                            }
                        }}
                    >
                        {rowsPerPageOptions.map(option => (
                            <MenuItem
                                key={option}
                                value={option}
                                sx={{
                                    fontFamily: 'inherit',
                                    fontSize: '13px'
                                }}
                            >
                                {option}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography
                    variant='body2'
                    sx={{
                        fontSize: '13px',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                        fontFamily: 'inherit',
                        fontWeight: 500
                    }}
                >
                    {startRecord}-{endRecord} of {totalRecords}
                </Typography>
            </Box>

            {/* Right side - Pagination controls */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    '@media (max-width: 768px)': {
                        order: 1
                    }
                }}
            >
                {/* Previous page button */}
                <IconButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    size='small'
                    sx={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '8px',
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        '&:hover': {
                            backgroundColor: 'grey.100',
                            borderColor: 'grey.400'
                        },
                        '&.Mui-disabled': {
                            opacity: 0.4,
                            borderColor: 'divider'
                        }
                    }}
                >
                    <ChevronLeft sx={{ fontSize: '18px' }} />
                </IconButton>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                    <Box key={index}>
                        {page === '...' ? (
                            <Typography
                                sx={{
                                    padding: '4px 6px',
                                    fontSize: '13px',
                                    color: 'text.secondary',
                                    fontFamily: 'inherit'
                                }}
                            >
                                ...
                            </Typography>
                        ) : (
                            <IconButton
                                onClick={() => handlePageChange(page)}
                                size='small'
                                sx={{
                                    minWidth: '32px',
                                    height: '32px',
                                    border: '1px solid',
                                    borderColor: page === currentPage ? 'primary.main' : 'divider',
                                    borderRadius: '8px',
                                    paddingX: '8px',
                                    fontSize: '13px',
                                    fontFamily: 'inherit',
                                    fontWeight: page === currentPage ? 700 : 500,
                                    backgroundColor: page === currentPage ? 'primary.main' : 'background.paper',
                                    color: page === currentPage ? '#ffffff' : 'text.primary',
                                    boxShadow: page === currentPage ? '0 2px 6px rgba(49, 101, 35, 0.25)' : 'none',
                                    '&:hover': {
                                        backgroundColor: page === currentPage ? 'primary.dark' : 'grey.100',
                                        borderColor: page === currentPage ? 'primary.dark' : 'grey.400'
                                    },
                                    transition: 'all 0.15s ease-in-out'
                                }}
                            >
                                {page}
                            </IconButton>
                        )}
                    </Box>
                ))}

                {/* Next page button */}
                <IconButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    size='small'
                    sx={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '8px',
                        backgroundColor: 'background.paper',
                        color: 'text.primary',
                        '&:hover': {
                            backgroundColor: 'grey.100',
                            borderColor: 'grey.400'
                        },
                        '&.Mui-disabled': {
                            opacity: 0.4,
                            borderColor: 'divider'
                        }
                    }}
                >
                    <ChevronRight sx={{ fontSize: '18px' }} />
                </IconButton>
            </Box>
        </Box>
    )
}

export default CustomPagination
