/* eslint-disable react/no-array-index-key */
import { useState, useEffect } from 'react'
import { Box, TextField, Typography } from '@mui/material'

function NumberedListInput({ label, value, onChange, required, customSx }) {
    const parseValue = val => {
        if (val) {
            const parsed = val
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
            return parsed.length ? parsed : ['']
        }
        return ['']
    }

    const [lines, setLines] = useState(() => parseValue(value))
    const [initialized, setInitialized] = useState(!!value) // ✅ true if edit data already present on mount

    useEffect(() => {
        if (value && !initialized) {
            // ✅ Edit data arrived after mount (async fetch)
            setLines(parseValue(value))
            setInitialized(true)
        }
        if (!value && initialized) {
            // ✅ Form was reset/cleared
            setLines([''])
            setInitialized(false)
        }
    }, [value])

    const serialize = arr => arr.map((line, i) => `${i + 1}. ${line}`).join('\n')

    const handleChange = (index, newValue) => {
        const updated = [...lines]
        updated[index] = newValue
        setLines(updated)
        onChange(serialize(updated))
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const updated = [...lines]
            updated.splice(index + 1, 0, '')
            setLines(updated)
            onChange(serialize(updated))
            setTimeout(() => {
                const inputs = document.querySelectorAll(
                    `.numbered-list-${label.replace(/\s/g, '-')} input, .numbered-list-${label.replace(/\s/g, '-')} textarea`
                )
                inputs[index + 1]?.focus()
            }, 50)
        }
        if (e.key === 'Backspace' && lines[index] === '' && lines.length > 1) {
            e.preventDefault()
            const updated = lines.filter((_, i) => i !== index)
            setLines(updated)
            onChange(serialize(updated))
            setTimeout(() => {
                const inputs = document.querySelectorAll(
                    `.numbered-list-${label.replace(/\s/g, '-')} input, .numbered-list-${label.replace(/\s/g, '-')} textarea`
                )
                inputs[index - 1]?.focus()
            }, 50)
        }
    }

    return (
        <Box sx={{ width: '100%', ...customSx }} className={`numbered-list-${label.replace(/\s/g, '-')}`}>
            <Typography variant='caption' sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1.2px solid',
                    borderColor: 'grey.400',
                    borderRadius: '6px',
                    p: 1
                }}
            >
                {lines.map((line, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{ minWidth: '24px', fontSize: '12px', color: 'text.secondary', fontWeight: 600 }}
                        >
                            {index + 1}.
                        </Typography>
                        <TextField
                            fullWidth
                            size='small'
                            variant='standard'
                            value={line}
                            placeholder={`Item ${index + 1}`}
                            onChange={e => handleChange(index, e.target.value)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            InputProps={{ disableUnderline: false }}
                            sx={{
                                '& .MuiInputBase-input': { fontSize: 13, padding: '2px 4px' },
                                ...customSx
                            }}
                        />
                    </Box>
                ))}
            </Box>
            <Typography variant='caption' sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                Press Enter to add new line • Backspace on empty line to remove
            </Typography>
        </Box>
    )
}

export default NumberedListInput
