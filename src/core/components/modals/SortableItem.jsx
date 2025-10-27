/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/prefer-default-export */
import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

export function SortableItem({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id,
        activationConstraint: {
            delay: 150,
            tolerance: 5
        }
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%'
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div
                {...listeners}
                style={{
                    cursor: 'grab',
                    marginBottom: 8,
                    touchAction: 'none', // Keep this only on the drag handle
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                }}
            >
                <DragIndicatorIcon />
            </div>
            {children}
        </div>
    )
}
