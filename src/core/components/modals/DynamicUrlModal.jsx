import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Divider, IconButton, TextField } from '@mui/material'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Add, Remove } from '@mui/icons-material'
import placeholderImg from '@assets/images/placeholder-image.webp'
import { useDispatch } from 'react-redux'
import { closeModal } from '@app/store/slices/modalSlice'
import { SortableItem } from './SortableItem'

/**
 * DynamicUrlModal component allows users to manage a list of image URLs.
 * Features include adding, removing, and reordering rows, with URL validation.
 *
 * @param {Object} props - The component props.
 * @param {Function} props.setAddedUrls - Callback to update the list of added URLs.
 * @param {Array} props.addedUrls - Array of preloaded URLs.
 * @returns {React.Element} Dynamic URL Modal Component.
 */
export default function DynamicUrlModal({ setAddedUrls, addedUrls }) {
    const dispatch = useDispatch()
    const boxRef = useRef(null)

    const [rows, setRows] = useState([{ id: `row-${Date.now()}`, url: '' }])

    /**
     * Adds a new row for inputting a URL.
     * Prevents adding more than 10 rows.
     */
    const handleAddRow = () => {
        if (rows?.length === 10) {
            return
        }
        setRows([...rows, { id: `row-${Date.now()}`, url: '' }])
        // Scroll to bottom
        setTimeout(() => {
            if (boxRef.current) {
                boxRef.current.scrollTo({
                    top: boxRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }
        }, 0)
    }

    /**
     * Removes a row by ID.
     * @param {string} id - The ID of the row to remove.
     */
    const handleRemoveRow = id => {
        setRows(rows.filter(row => row.id !== id))
    }

    /**
     * Updates the URL value for a specific row.
     * @param {string} id - The ID of the row to update.
     * @param {string} value - The new URL value.
     */
    const handleUrlChange = (id, value) => {
        setRows(rows.map(row => (row.id === id ? { ...row, url: value } : row)))
    }

    /**
     * Handles the drag-and-drop functionality to reorder rows.
     * @param {Object} event - The drag event object.
     */
    const handleDragEnd = event => {
        const { active, over } = event
        if (active.id !== over.id) {
            /* eslint-disable */
            setRows(rows => {
                const oldIndex = rows.findIndex(row => row.id === active.id)
                const newIndex = rows.findIndex(row => row.id === over.id)
                return arrayMove(rows, oldIndex, newIndex)
            })
            /* eslint-enable */
        }
    }

    // Initialize rows if preloaded URLs are provided
    useEffect(() => {
        if (addedUrls?.length > 0) {
            setRows(addedUrls)
        }
    }, [addedUrls])

    return (
        <Box sx={{ width: '500px', mx: 'auto' }}>
            <Box
                ref={boxRef}
                sx={{
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    maxHeight: '240px'
                }}
            >
                <DndContext onDragEnd={handleDragEnd}>
                    <SortableContext items={rows.map(row => row.id)} strategy={verticalListSortingStrategy}>
                        {rows.map((row, index) => (
                            <SortableItem key={row.id} id={row.id}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 2,
                                        p: 1,
                                        flexGrow: 1
                                    }}
                                >
                                    <Box
                                        component='img'
                                        src={row.url || placeholderImg}
                                        alt=''
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            objectFit: 'cover',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            mr: 2
                                        }}
                                    />
                                    <TextField
                                        value={row.url}
                                        onChange={e => handleUrlChange(row.id, e.target.value)}
                                        placeholder='Paste Image URL here...'
                                        fullWidth
                                        size='small'
                                        sx={{
                                            '& input': {
                                                backgroundColor: '#fff',
                                                padding: '12px 8px',
                                                height: '18px' // Decrease input height
                                            },
                                            '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                backgroundColor: 'white' // Apply the white background to the root element
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'gray' // Optional: change border color if needed
                                            }
                                        }}
                                    />
                                    {rows.length > 1 && (
                                        <IconButton
                                            onClick={() => handleRemoveRow(row.id)}
                                            sx={{
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                margin: '0px 4px',
                                                padding: '6px 8px'
                                            }}
                                        >
                                            <Remove />
                                        </IconButton>
                                    )}
                                    {index === rows.length - 1 && rows?.length < 10 && (
                                        <IconButton
                                            onClick={handleAddRow}
                                            sx={{
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                margin: '0px 4px',
                                                padding: '6px 8px'
                                            }}
                                        >
                                            <Add />
                                        </IconButton>
                                    )}
                                </Box>
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>
            </Box>
            <Divider sx={{ borderColor: 'primary.main', marginY: '4px' }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                    variant='outlined'
                    onClick={() => {
                        dispatch(closeModal())
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={() => {
                        const filteredData = rows?.filter(item => {
                            try {
                                return item.url && new URL(item.url)
                            } catch {
                                return false
                            }
                        })
                        setAddedUrls(filteredData)
                        dispatch(closeModal())
                    }}
                >
                    Save
                </Button>
            </Box>
        </Box>
    )
}

DynamicUrlModal.propTypes = {
    setAddedUrls: PropTypes.func.isRequired,
    addedUrls: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            url: PropTypes.string
        })
    ).isRequired
}
