/* eslint-disable react/no-array-index-key */
import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material'
import { Add, Close } from '@mui/icons-material'

/**
 * A numbered list the user types line by line: Enter adds a line below, Backspace on an empty line removes it.
 * `items` is the array of lines; `onChange` gets the new array.
 */
export default function ListEditor({
    label,
    hint = '',
    items,
    onChange,
    placeholder = 'Type an item',
    showKeys = true
}) {
    const inputs = useRef([])
    // ? the line to put the cursor in once the list has re-drawn
    const focusLine = useRef(null)

    useEffect(() => {
        if (focusLine.current === null) return
        inputs.current[focusLine.current]?.focus()
        focusLine.current = null
    }, [items])

    const setItem = (index, text) => onChange(items.map((item, at) => (at === index ? text : item)))
    const addAfter = index => {
        focusLine.current = index + 1
        onChange([...items.slice(0, index + 1), '', ...items.slice(index + 1)])
    }
    const removeAt = index => {
        focusLine.current = Math.max(0, index - 1)
        onChange(items.length > 1 ? items.filter((_, at) => at !== index) : [''])
    }

    const onKeyDown = (event, index) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            addAfter(index)
        } else if (event.key === 'Backspace' && items[index] === '' && items.length > 1) {
            event.preventDefault()
            removeAt(index)
        }
    }

    return (
        <Box role='group' aria-label={label} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</Typography>
            {hint ? (
                <Typography color='text.secondary' sx={{ fontSize: '0.8125rem', mb: 1 }}>
                    {hint}
                </Typography>
            ) : (
                <Box sx={{ mb: 1 }} />
            )}
            <Box sx={{ display: 'grid', rowGap: 1 }}>
                {items.map((item, index) => (
                    <TextField
                        key={index}
                        size='small'
                        fullWidth
                        autoComplete='off'
                        value={item}
                        placeholder={index === 0 ? placeholder : ''}
                        onChange={event => setItem(index, event.target.value)}
                        onKeyDown={event => onKeyDown(event, index)}
                        inputRef={node => {
                            inputs.current[index] = node
                        }}
                        InputProps={{
                            inputProps: { 'aria-label': `${label}, item ${index + 1}` },
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <Typography
                                        sx={{ fontSize: '0.8125rem', fontWeight: 600, color: 'text.secondary' }}
                                    >
                                        {index + 1}.
                                    </Typography>
                                </InputAdornment>
                            ),
                            endAdornment:
                                items.length > 1 || item ? (
                                    <InputAdornment position='end'>
                                        <IconButton
                                            size='small'
                                            edge='end'
                                            aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`}
                                            onClick={() => removeAt(index)}
                                        >
                                            <Close fontSize='small' />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                        }}
                    />
                ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                <Button size='small' startIcon={<Add />} onClick={() => addAfter(items.length - 1)}>
                    Add item
                </Button>
                {showKeys ? (
                    <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                        Enter adds a line. Backspace on an empty line removes it.
                    </Typography>
                ) : null}
            </Box>
        </Box>
    )
}

ListEditor.propTypes = {
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    showKeys: PropTypes.bool
}
