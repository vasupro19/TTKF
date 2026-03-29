/* eslint-disable no-underscore-dangle */
import { useState, useRef, useEffect } from 'react'
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Paper,
    Chip,
    CircularProgress,
    Collapse,
    Tooltip,
    Divider,
    Button
} from '@mui/material'
import {
    AutoAwesome,
    Send,
    Close,
    ContentCopy,
    CheckCircle,
    ExpandMore,
    ExpandLess,
    Refresh
} from '@mui/icons-material'

/**
 * AiFormAssistant
 *
 * Drop this into any form page. It reads your field config and lets the user
 * describe what they want in plain English. Claude fills the fields.
 *
 * Props:
 *  - fields: array of { name, label, type } — same shape as your tabsFields[n].fields
 *  - formik: formik instance
 *  - context: string — e.g. "Travel itinerary for a 5-day Manali trip"
 *  - suggestions: string[] — quick prompt chips shown to user
 */

const SUGGESTIONS = {
    itenary: [
        'Write a 5-day Manali itinerary',
        'Create a Goa beach trip plan',
        'Write a Kerala backwaters tour',
        'Generate a Rajasthan heritage tour'
    ],
    campaign: [
        'Summer Himalayan Escape campaign',
        'Budget South India Tour',
        'Luxury Maldives Honeymoon package',
        'Family Ooty Hill Station trip'
    ],
    destination: [
        'Describe Shimla as a destination',
        'Write about Jaipur Pink City',
        'Describe Coorg coffee plantation stay',
        'Write about Andaman Islands'
    ],
    default: [
        'Fill all fields with sample data',
        'Write a detailed description',
        'Generate professional content',
        'Create engaging copy'
    ]
}

function AiFormAssistant({ fields = [], formik, context = '', suggestions = [], entityType = 'default' }) {
    const [open, setOpen] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [aiResponse, setAiResponse] = useState(null)
    const [copied, setCopied] = useState(false)
    const [appliedFields, setAppliedFields] = useState([])
    const inputRef = useRef(null)

    const chips = suggestions.length ? suggestions : SUGGESTIONS[entityType] || SUGGESTIONS.default

    // Only text-like fields that AI can fill
    const fillableFields = fields.filter(
        f => ['text', 'textarea', 'numberedList'].includes(f.type) && f.name !== 's_no'
    )

    const buildSystemPrompt = () => {
        const fieldList = fillableFields.map(f => `- ${f.name} (${f.label}): type=${f.type}`).join('\n')

        return `You are an AI assistant helping fill a travel management form.
Context: ${context || 'Travel management system'}

The form has these fillable fields:
${fieldList}

RULES:
1. Respond ONLY with a valid JSON object
2. Keys must exactly match the field names listed above
3. For "numberedList" type fields, format value as "1. item\\n2. item\\n3. item"
4. For "bankDetails" type, use the format:
   "Please deposit 50% advance...\\nAccount Name ----------VALUE\\nBank Name ----------VALUE\\n..."
5. Keep values professional, relevant, and detailed
6. Only include fields you have content for
7. No markdown, no explanation — pure JSON only

Example response:
{"title": "5 Days in Manali", "description": "An unforgettable mountain escape...", "inclusions": "1. Breakfast daily\\n2. Hotel stay\\n3. Airport transfers"}`
    }

    const handleAsk = async userPrompt => {
        if (!userPrompt.trim()) return
        setLoading(true)
        setAiResponse(null)
        setAppliedFields([])

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/ai/assist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system: buildSystemPrompt(),
                    messages: [{ role: 'user', content: userPrompt }]
                })
            })

            const data = await response.json()
            const text = data?.content?.[0]?.text || ''

            // Strip markdown fences if present
            const clean = text.replace(/```json|```/g, '').trim()
            const parsed = JSON.parse(clean)
            setAiResponse(parsed)
        } catch (err) {
            setAiResponse({ _error: 'Could not parse AI response. Please try again.' })
        } finally {
            setLoading(false)
        }
    }

    const applyField = (fieldName, value) => {
        formik.setFieldValue(fieldName, value)
        setAppliedFields(prev => [...prev, fieldName])
    }

    const applyAll = () => {
        if (!aiResponse) return
        Object.entries(aiResponse).forEach(([key, val]) => {
            if (key !== '_error' && fillableFields.find(f => f.name === key)) {
                formik.setFieldValue(key, val)
            }
        })
        setAppliedFields(fillableFields.map(f => f.name))
    }

    const getFieldLabel = name => fillableFields.find(f => f.name === name)?.label || name

    const isApplied = name => appliedFields.includes(name)

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    return (
        <Box sx={{ mb: 2 }}>
            {/* Trigger Button */}
            <Button
                variant='outlined'
                size='small'
                startIcon={<AutoAwesome sx={{ fontSize: '16px !important', color: 'primary.main' }} />}
                onClick={() => setOpen(prev => !prev)}
                sx={{
                    borderColor: 'primary.main',
                    borderStyle: 'dashed',
                    borderRadius: '20px',
                    fontSize: '12px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: 'primary.main',
                    '&:hover': { borderStyle: 'solid', backgroundColor: 'primary.50' }
                }}
                endIcon={open ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
            >
                AI Assistant — fill form with AI
            </Button>

            <Collapse in={open}>
                <Paper
                    elevation={2}
                    sx={{
                        mt: 1.5,
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'primary.light',
                        backgroundColor: '#fafbff'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoAwesome sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant='body2' fontWeight={600} color='primary.main'>
                                Describe what you want to fill
                            </Typography>
                        </Box>
                        <IconButton size='small' onClick={() => setOpen(false)}>
                            <Close fontSize='small' />
                        </IconButton>
                    </Box>

                    {/* Quick Suggestion Chips */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                        {chips.map(chip => (
                            <Chip
                                key={chip}
                                label={chip}
                                size='small'
                                variant='outlined'
                                onClick={() => {
                                    setPrompt(chip)
                                    handleAsk(chip)
                                }}
                                sx={{
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'primary.50', borderColor: 'primary.main' }
                                }}
                            />
                        ))}
                    </Box>

                    {/* Input */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            size='small'
                            placeholder='e.g. Write a 5-day Manali itinerary with hotel and sightseeing...'
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAsk(prompt)
                                }
                            }}
                            sx={{
                                '& .MuiInputBase-input': { fontSize: 13 },
                                '& .MuiOutlinedInput-root': { borderRadius: '8px' }
                            }}
                        />
                        <IconButton
                            color='primary'
                            onClick={() => handleAsk(prompt)}
                            disabled={loading || !prompt.trim()}
                            sx={{
                                backgroundColor: 'primary.main',
                                color: '#fff',
                                borderRadius: '8px',
                                '&:hover': { backgroundColor: 'primary.dark' },
                                '&.Mui-disabled': { backgroundColor: 'grey.300' }
                            }}
                        >
                            {loading ? <CircularProgress size={18} color='inherit' /> : <Send fontSize='small' />}
                        </IconButton>
                    </Box>

                    {/* AI Response */}
                    {aiResponse && !aiResponse._error && (
                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 1.5 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                                    AI SUGGESTIONS — click to apply individually or apply all
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title='Regenerate'>
                                        <IconButton size='small' onClick={() => handleAsk(prompt)}>
                                            <Refresh fontSize='small' />
                                        </IconButton>
                                    </Tooltip>
                                    <Button
                                        size='small'
                                        variant='contained'
                                        onClick={applyAll}
                                        sx={{ fontSize: '11px', py: 0.25, px: 1.5, borderRadius: '6px' }}
                                    >
                                        Apply All
                                    </Button>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {Object.entries(aiResponse).map(([key, val]) => {
                                    if (key === '_error') return null
                                    const fieldExists = fillableFields.find(f => f.name === key)
                                    if (!fieldExists) return null
                                    const applied = isApplied(key)

                                    return (
                                        <Box
                                            key={key}
                                            sx={{
                                                p: 1.25,
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: applied ? 'success.light' : 'grey.200',
                                                backgroundColor: applied ? 'success.50' : '#fff',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: 1,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant='caption'
                                                    fontWeight={600}
                                                    color='text.secondary'
                                                    sx={{ display: 'block', mb: 0.25 }}
                                                >
                                                    {getFieldLabel(key)}
                                                </Typography>
                                                <Typography
                                                    variant='caption'
                                                    color='text.primary'
                                                    sx={{
                                                        display: 'block',
                                                        whiteSpace: 'pre-line',
                                                        fontSize: '12px',
                                                        lineHeight: 1.5,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxHeight: '80px',
                                                        overflowY: 'auto'
                                                    }}
                                                >
                                                    {String(val)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                                {applied ? (
                                                    <CheckCircle
                                                        sx={{ fontSize: 20, color: 'success.main', mt: 0.25 }}
                                                    />
                                                ) : (
                                                    <Tooltip title='Apply this field'>
                                                        <IconButton
                                                            size='small'
                                                            onClick={() => applyField(key, val)}
                                                            sx={{ color: 'primary.main' }}
                                                        >
                                                            <ContentCopy fontSize='small' />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Error state */}
                    {aiResponse?._error && (
                        <Box
                            sx={{
                                mt: 1.5,
                                p: 1.5,
                                borderRadius: '8px',
                                backgroundColor: 'error.50',
                                border: '1px solid',
                                borderColor: 'error.light'
                            }}
                        >
                            <Typography variant='caption' color='error.main'>
                                {aiResponse._error}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            </Collapse>
        </Box>
    )
}

export default AiFormAssistant
