/* eslint-disable */
import React, { createContext, useState, useContext } from 'react'
import { Menu, MenuItem,
    Popper, Paper, ClickAwayListener, MenuList
 } from '@mui/material'

// Create a context for the context menu
const ContextMenuContext = createContext(null)

// Provider component
export function ContextMenuProvider({ children }) {
    const [contextMenu, setContextMenu] = useState(null)
    const [contextMenuRow, setContextMenuRow] = useState(null)
    
    const handleClose = () => {
        setContextMenu(null)
    }
    
    return (
        <ContextMenuContext.Provider
            value={{ contextMenu, setContextMenu, contextMenuRow, setContextMenuRow, handleClose }}
        >
            {children}
        </ContextMenuContext.Provider>
    )
}

// Custom hook for using the context
export function useContextMenu() {
    const context = useContext(ContextMenuContext)
    if (!context) {
        throw new Error('useContextMenu must be used within a ContextMenuProvider')
    }
    
    // Add this function to the hook
    const handleContextMenu = (event, row) => {
        event.preventDefault();
        // Close previous menu and set new one in a single update cycle
        context.setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
        });
        context.setContextMenuRow(row);
    };
    
    return { ...context, handleContextMenu };
}

// Context Menu component that consumes the context
export function PopperContextMenu({ options = [] }) {
    const { contextMenu, contextMenuRow, handleClose } = useContextMenu()
    
    if (!contextMenu) return null
    
    const handleOptionClick = onClick => event => {
        if (contextMenuRow && onClick) {
            onClick(contextMenuRow)
        }
        handleClose()
    }
    
    // Filter options based on conditions
    const visibleOptions = options.filter(
        option => !option.condition || (contextMenuRow && option.condition(contextMenuRow))
    )

    if (!visibleOptions || visibleOptions?.length <= 0 ) return

    return (
        <Popper
            open={Boolean(contextMenu)}
            anchorEl={null}
            style={{
                position: 'absolute',
                top: contextMenu?.mouseY || 0,
                left: contextMenu?.mouseX || 0,
                zIndex: 1300
            }}
            placement='bottom-start'
        >
            <ClickAwayListener onClickAway={handleClose}>
                <Paper elevation={3}>
                    <MenuList autoFocusItem={Boolean(contextMenu)}>
                        {visibleOptions.map((option, index) => (
                            <MenuItem key={index} onClick={handleOptionClick(option?.onClick)}>
                                {option?.component ? (
                                    option.component(contextMenuRow)
                                ) : (
                                    <>
                                        {option?.icon && <span style={{ marginRight: '8px' }}>{option?.icon}</span>}
                                        {option?.label}
                                    </>
                                )}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Paper>
            </ClickAwayListener>
        </Popper>
    )
}