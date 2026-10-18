import { useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { Add, ArrowDownward, ArrowUpward, Delete, DragIndicator, Edit, Hotel, Route } from '@mui/icons-material'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { dayTitle, entryTypeLabel, isStay } from './packageDayFacts'

const dayShape = PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string,
    image: PropTypes.string,
    entryType: PropTypes.string,
    destination: PropTypes.shape({ name: PropTypes.string }),
    itenary: PropTypes.shape({ title: PropTypes.string, description: PropTypes.string })
})

// ? longer than this and the description is cut to three lines until "Show more"
const LONG_DESCRIPTION = 180

/** @description a day's description: shown in full when short, else three lines with Show more */
function DayDescription({ text }) {
    const [open, setOpen] = useState(false)
    const body = (text || '').trim()
    if (!body) {
        return (
            <Typography color='text.disabled' sx={{ fontSize: '0.8125rem', mt: 1, fontStyle: 'italic' }}>
                No description yet. Edit this day to add one.
            </Typography>
        )
    }
    const long = body.length > LONG_DESCRIPTION
    return (
        <Box sx={{ mt: 1 }}>
            <Typography
                color='text.secondary'
                sx={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    ...(long && !open
                        ? {
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                          }
                        : {})
                }}
            >
                {body}
            </Typography>
            {long ? (
                <Button
                    size='small'
                    onClick={() => setOpen(shown => !shown)}
                    sx={{ p: 0, minWidth: 0, fontSize: '0.8125rem', textTransform: 'none' }}
                >
                    {open ? 'Show less' : 'Show more'}
                </Button>
            ) : null}
        </Box>
    )
}

DayDescription.propTypes = { text: PropTypes.string }

function InsertButton({ onClick, label }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
            <Button
                size='small'
                startIcon={<Add fontSize='small' />}
                onClick={onClick}
                aria-label={label}
                sx={{ color: 'text.secondary', fontSize: '0.75rem', textTransform: 'none', minHeight: 24 }}
            >
                Add a day here
            </Button>
        </Box>
    )
}

InsertButton.propTypes = { onClick: PropTypes.func.isRequired, label: PropTypes.string.isRequired }

function DayRow({ day, index, count, active, busy, onMove, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: day.id,
        disabled: busy
    })
    const title = dayTitle(day)
    const place = day.destination?.name
    return (
        <Box
            ref={setNodeRef}
            component='li'
            sx={{
                listStyle: 'none',
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.6 : 1,
                position: 'relative',
                zIndex: isDragging ? 2 : 'auto'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: isDragging ? 4 : 'none'
                }}
            >
                {/* eslint-disable react/jsx-props-no-spreading -- the drag library hands these over as props */}
                <Box
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    aria-label={`Drag Day ${index + 1} to move it`}
                    sx={{
                        display: { xs: 'none', sm: 'flex' },
                        alignItems: 'center',
                        color: 'text.disabled',
                        cursor: busy ? 'default' : 'grab',
                        touchAction: 'none'
                    }}
                >
                    <DragIndicator />
                </Box>
                {/* eslint-enable react/jsx-props-no-spreading */}
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: 'success.lighter',
                        color: 'success.dark',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.25
                    }}
                    aria-hidden
                >
                    {index + 1}
                </Box>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                        <Box component='span' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Day {index + 1}
                        </Box>
                        {' · '}
                        {title}
                    </Typography>
                    <Stack direction='row' spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
                        <Chip
                            size='small'
                            icon={isStay(day.entryType || 'Stay') ? <Hotel /> : <Route />}
                            label={entryTypeLabel(day.entryType)}
                            variant='outlined'
                        />
                        {place ? <Chip size='small' label={place} /> : null}
                    </Stack>
                    <DayDescription text={day.itenary?.description} />
                </Box>
                {day.image ? (
                    <Box
                        component='img'
                        src={day.image}
                        alt=''
                        sx={{
                            width: 84,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1.5,
                            flexShrink: 0,
                            display: { xs: 'none', md: 'block' }
                        }}
                    />
                ) : null}
                <Stack direction='row' alignItems='center' sx={{ flexShrink: 0 }}>
                    <Tooltip title='Move up'>
                        <span>
                            <IconButton
                                size='small'
                                aria-label={`Move Day ${index + 1} up`}
                                disabled={busy || index === 0}
                                onClick={() => onMove(index, index - 1)}
                            >
                                <ArrowUpward fontSize='small' />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title='Move down'>
                        <span>
                            <IconButton
                                size='small'
                                aria-label={`Move Day ${index + 1} down`}
                                disabled={busy || index === count - 1}
                                onClick={() => onMove(index, index + 1)}
                            >
                                <ArrowDownward fontSize='small' />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title='Edit this day'>
                        <IconButton size='small' aria-label={`Edit Day ${index + 1}`} onClick={() => onEdit(day)}>
                            <Edit fontSize='small' sx={{ fill: '#60498a' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete this day'>
                        <IconButton
                            size='small'
                            aria-label={`Delete Day ${index + 1}`}
                            color='error'
                            onClick={() => onDelete(day)}
                        >
                            <Delete fontSize='small' />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
        </Box>
    )
}

DayRow.propTypes = {
    day: dayShape.isRequired,
    index: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    active: PropTypes.bool.isRequired,
    busy: PropTypes.bool.isRequired,
    onMove: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
}

/**
 * The package's days in order: drag a day, or use its arrows, to move it; "Add a day here" puts a new one between.
 */
export default function PackageDayList({ days, editingId, busy, onMove, onEdit, onDelete, onInsert }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return
        const from = days.findIndex(day => day.id === active.id)
        const to = days.findIndex(day => day.id === over.id)
        if (from < 0 || to < 0) return
        // ? the same move the arrows make
        onMove(
            from,
            arrayMove(days, from, to).findIndex(day => day.id === active.id)
        )
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={days.map(day => day.id)} strategy={verticalListSortingStrategy}>
                <Box component='ol' aria-label='Days of the package' sx={{ m: 0, p: 0 }}>
                    {days.map((day, index) => (
                        <Box key={day.id}>
                            {index > 0 ? (
                                <InsertButton
                                    onClick={() => onInsert(index)}
                                    label={`Add a day before Day ${index + 1}`}
                                />
                            ) : null}
                            <DayRow
                                day={day}
                                index={index}
                                count={days.length}
                                active={editingId === day.id}
                                busy={busy}
                                onMove={onMove}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </Box>
                    ))}
                </Box>
            </SortableContext>
        </DndContext>
    )
}

PackageDayList.propTypes = {
    days: PropTypes.arrayOf(dayShape).isRequired,
    editingId: PropTypes.number,
    busy: PropTypes.bool,
    onMove: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onInsert: PropTypes.func.isRequired
}
