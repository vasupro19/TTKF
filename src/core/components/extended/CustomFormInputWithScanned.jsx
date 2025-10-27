/*eslint-disable */
import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, FormControl, TextField, InputAdornment } from '@mui/material'
import QrCodeScanner from '@mui/icons-material/QrCodeScanner'

// Optimized scannable input which render as box when double clicked act as an normal input
function CustomFormInput({
  name,
  label,
  placeholder = '',
  formik,
  inputProps,
  sx,
  handleCustomChange,
  disabled = false,
  customSx = {},
  color,
  className = '',
  autoComplete = 'on',
  onScanComplete, // optional callback when scan is done
  setFocusTarget, // callback to shift focus externally
  elementToFocus, // the next element (or field identifier) to focus
  handleSubmitForm
}) {
  // Manage whether the input is in scanner mode or manual mode
  const [manualMode, setManualMode] = useState(false)
  const [scannedValue, setScannedValue] = useState(formik.values[name] || '')

  // Buffer to accumulate scanner keystrokes
  const scanBuffer = useRef('')
  const scanTimeout = useRef(null)

  // New state to track if this component’s input is focused (active)
  const [isActive, setIsActive] = useState(false)

  // Optionally, you can use your provided inputProps.inputRef
  // or create your own ref if needed.
  const containerRef = inputProps.inputRef || useRef(null)

  useEffect(() => {
    // Only attach the global listener if this instance is active
    if (manualMode || !isActive) return

    const handleKeyDown = e => {
      // Ignore if modifier keys are held
      if (e.ctrlKey || e.altKey || e.metaKey) return

      if (e.key === 'Enter') {
        e.preventDefault()
        const trimmed = scanBuffer.current.trim()
        if (trimmed) {
          setScannedValue(trimmed)
          formik.setFieldValue(name, trimmed)
          formik.setFieldTouched(name, true)
          console.log('Scanned for', name, trimmed)
          if (onScanComplete) onScanComplete(trimmed)
        }

        // Clear the scan buffer
        scanBuffer.current = ''

        // If provided, call setFocusTarget to shift focus to the next field.
        if (elementToFocus && setFocusTarget) {
          console.log('elementToFocus====',elementToFocus     )
          setFocusTarget(elementToFocus)
        }else if (handleSubmitForm){
            setTimeout(() => {
                formik?.handleSubmit()
            }, 400);
                
        }
      } else {
        scanBuffer.current += e.key
      }
      clearTimeout(scanTimeout.current)
      scanTimeout.current = setTimeout(() => {
        scanBuffer.current = ''
      }, 150)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(scanTimeout.current)
    }
  }, [formik, name, manualMode, onScanComplete, isActive, setFocusTarget, elementToFocus])

  return (
    <Box sx={{ alignSelf: 'baseline', ...sx }}>
      {label && (
        <Typography variant="body1" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <FormControl fullWidth variant="outlined">
        {manualMode ? (
          <TextField
            name={name}
            value={formik.values[name]}
            placeholder={placeholder}
            onChange={e => {
              if (handleCustomChange) {
                handleCustomChange(e, formik)
              } else {
                formik.setFieldValue(name, e.target.value)
              }
            }}
            onBlur={e => {
              formik.handleBlur(e)
              // Mark this input as inactive when it loses focus.
              setIsActive(false)
            }}
            onFocus={() => setIsActive(true)}
            error={Boolean(formik.touched[name] && formik.errors[name])}
            disabled={disabled}
            autoComplete={autoComplete}
            sx={{
              '& input': {
                backgroundColor: '#fff',
                padding: '12px 8px'
              },
              '& .MuiInputBase-root.MuiOutlinedInput-root': {
                backgroundColor: 'white'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'gray'
              },
              flexGrow: 1,
              width: 'auto',
              ...(customSx || {})
            }}
            helperText={formik.touched[name] && formik.errors[name] ? formik.errors[name] : ''}
            InputProps={{
              ...inputProps,
              sx: {
                height: 40,
                ...((inputProps && inputProps.sx) || {})
              },
              endAdornment: (
                <InputAdornment position="end">
                  <QrCodeScanner />
                </InputAdornment>
              )
            }}
            fullWidth
            color={color}
            className={className}
          />
        ) : (
          <Box
            tabIndex={0}
            ref={containerRef}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            // Allow switching to manual input on a double-click or tap.
            onDoubleClick={() => setManualMode(true)}
            sx={{
              p: 1.5,
              border: '1px solid gray',
              borderRadius: '4px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: disabled ? '#f5f5f5' : '#fff',
              cursor: 'text',
              ...customSx
            }}
          >
            {scannedValue || (
              <Typography variant="body2" color="textSecondary">
                {placeholder}
              </Typography>
            )}
            {inputProps && inputProps.endAdornment && (
              <Box sx={{ ml: 1 }}>{inputProps.endAdornment}</Box>
            )}
          </Box>
        )}
      </FormControl>
      {!manualMode && (
        <Typography variant="caption" color="textSecondary">
          (Double tap to type manually)
        </Typography>
      )}
    </Box>
  )
}

CustomFormInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  handleCustomChange: PropTypes.func,
  formik: PropTypes.object.isRequired,
  inputProps: PropTypes.object,
  sx: PropTypes.object,
  customSx: PropTypes.object,
  color: PropTypes.string,
  className: PropTypes.string,
  autoComplete: PropTypes.string,
  disabled: PropTypes.bool,
  onScanComplete: PropTypes.func,
  setFocusTarget: PropTypes.func,
  elementToFocus: PropTypes.string // Identifier of the next field to focus
}

CustomFormInput.defaultProps = {
  inputProps: {},
  sx: {},
  setFocusTarget: undefined,
  elementToFocus: undefined
}

export default CustomFormInput
