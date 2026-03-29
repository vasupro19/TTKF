import { useState, useEffect } from 'react'
import { Box, TextField, Typography } from '@mui/material'

const BANK_TEMPLATE = [
    { key: 'accountName', label: 'Account Name' },
    { key: 'bankName', label: 'Bank Name' },
    { key: 'branchName', label: 'Branch Name' },
    { key: 'accountNo', label: 'Account No' },
    { key: 'accountType', label: 'Account Type' },
    { key: 'ifscCode', label: 'IFSC CODE' }
]

const SEPARATOR = ' ----------'

// ✅ Outside component — stable reference
const EMPTY_FIELDS = BANK_TEMPLATE.reduce((acc, { key }) => ({ ...acc, [key]: '' }), {})

const parseToFields = text => {
    if (!text) return { ...EMPTY_FIELDS }
    const result = {}
    // Split by newline and process line by line — no regex bleed
    const lines = text.split('\n')
    BANK_TEMPLATE.forEach(({ key, label }) => {
        const matchingLine = lines.find(line => line.toLowerCase().startsWith(label.toLowerCase()))
        if (matchingLine) {
            const separatorIndex = matchingLine.indexOf('----------')
            result[key] = separatorIndex !== -1 ? matchingLine.slice(separatorIndex + 10).trim() : ''
        } else {
            result[key] = ''
        }
    })
    return result
}

const serializeToText = fields => {
    const lines = [
        "Please deposit 50% advance in our company's account to confirm your trip.",
        ...BANK_TEMPLATE.map(({ key, label }) => `${label}${SEPARATOR}${fields[key] || ''}`)
    ]
    return lines.join('\n')
}

function BankDetailsInput({ value, onChange, customSx }) {
    const [fields, setFields] = useState(() => (value ? parseToFields(value) : { ...EMPTY_FIELDS }))
    const [initialized, setInitialized] = useState(!!value)

    useEffect(() => {
        if (value && !initialized) {
            setFields(parseToFields(value))
            setInitialized(true)
        }
        if (!value && initialized) {
            setFields({ ...EMPTY_FIELDS })
            setInitialized(false)
        }
    }, [value, initialized])

    const handleChange = (key, val) => {
        const updated = { ...fields, [key]: val }
        setFields(updated)
        onChange(serializeToText(updated))
    }

    return (
        <Box
            sx={{
                width: '100%',
                border: '1.2px solid',
                borderColor: 'grey.400',
                borderRadius: '6px',
                p: 1.5,
                ...customSx
            }}
        >
            <Typography variant='caption' sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
                Bank Details
            </Typography>
            <Typography
                variant='caption'
                sx={{ color: 'text.disabled', mb: 1.5, display: 'block', fontStyle: 'italic' }}
            >
                Please deposit 50% advance in our company&apos;s account to confirm your trip.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {BANK_TEMPLATE.map(({ key, label }) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            sx={{ minWidth: '130px', fontSize: '12px', color: 'text.secondary', fontWeight: 500 }}
                        >
                            {label}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: 'text.disabled', mr: 0.5 }}>----------</Typography>
                        <TextField
                            fullWidth
                            size='small'
                            variant='standard'
                            value={fields[key]}
                            placeholder={`Enter ${label}`}
                            onChange={e => handleChange(key, e.target.value)}
                            InputProps={{ disableUnderline: false }}
                            sx={{ '& .MuiInputBase-input': { fontSize: 13, padding: '2px 4px' } }}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

export default BankDetailsInput
