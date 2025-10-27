/* eslint-disable react/jsx-props-no-spreading */
import { useRef } from 'react'
import {
    Grid,
    TextField,
    Button,
    Box,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    FormControl,
    Typography,
    Divider,
    Checkbox,
    RadioGroup,
    Radio,
    InputAdornment,
    FormHelperText,
    useMediaQuery,
    CircularProgress,
    Skeleton,
    InputLabel
} from '@mui/material'

// ** import icons
import ImageIcon from '@mui/icons-material/Image'
import LinkIcon from '@mui/icons-material/Link'

// ** import from redux
import { openModal } from '@app/store/slices/modalSlice'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'

import { PropTypes } from 'prop-types'
import CustomAutocomplete from '../extended/CustomAutocomplete'
import CustomFormInput from '../extended/CustomFormInput'
import CustomPhoneInput from './CustomPhoneInput'
import CustomDateInput from './CustomDateInput'
import CustomFileUpload from './CustomFileUpload'
import DynamicUrlModal from '../modals/DynamicUrlModal'
import CustomCurrencyInput from './CustomCurrencyInput'
import DimensionLBHInput from '../DimensionLBHInput'
import FlexibleAutoComplete from './FlexibleAutoComplete'

function FormComponent({
    fields,
    formik,
    handleCustomChange,
    customStyle,
    isStraightAlignedButton = false,
    submitButtonSx = {},
    showSeparaterBorder = true,
    submitButtonText = 'Submit',
    gridStyles = {},
    addedUrls = [],
    setAddedUrls,
    disableSubmitButton = false,
    isHovering = false,
    disabledTabImplementation = false, // when tab below form is disabled
    dividerSx = {},
    submitting = false,
    isLoading = false,
    onClickCancel = () => {},
    showCancelButton = false // Show cancel button
}) {
    const grid = { xs: 12, sm: 6 }
    const dispatch = useDispatch()
    const isMobile = useMediaQuery('(max-width:500px)') // Adjust the breakpoint as needed
    const submitButtonRef = useRef()

    const handlePhoneChange = (name, value) => {
        const e = { target: { name, value } }
        handleCustomChange(e, formik)
        formik.setFieldValue(name, value) // Update Formik's value when phone input changes
    }

    // Create a motion-enabled Button
    const handleAdd = () => {
        dispatch(
            openModal({
                content: <DynamicUrlModal addedUrls={addedUrls} setAddedUrls={setAddedUrls} />,
                closeOnBackdropClick: false,
                title: <Typography variant='h3'>Add Image URLs</Typography>,
                disableEscapeKeyDown: true
            })
        )
    }

    // eslint-disable-next-line no-console
    console.log(' -- Form Component Re rendered -- 🥶🥶 ', fields)

    return (
        <Box
            component='form'
            noValidate
            onSubmit={formik.handleSubmit}
            sx={{ padding: { xs: 0, sm: 1 }, maxWidth: '100%', mx: 'auto', backgroundColor: '#f5f5f5', ...customStyle }}
        >
            <Grid container spacing={1.5} sx={{ ...gridStyles }}>
                {fields
                    .filter(field => field.name)
                    .map(field => (
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        <Grid item {...(field.grid || grid)} key={field.name}>
                            {/* Dynamically rendering field types based on field.type */}
                            {isLoading ? (
                                <Skeleton variant='rectangular' height={40} />
                            ) : (
                                <>
                                    {field.component ? (
                                        field.component // Render custom component
                                    ) : (
                                        // eslint-disable-next-line react/jsx-no-useless-fragment
                                        <>
                                            {['text', 'password', 'email', 'number', 'alphaNumeric'].includes(
                                                field.type
                                            ) &&
                                                (!field?.CustomFormInput ? (
                                                    <TextField
                                                        fullWidth
                                                        required={field?.required || false}
                                                        label={field.label}
                                                        name={field.name}
                                                        type={field.type || 'text'}
                                                        value={formik.values[field.name]}
                                                        placeholder={field.placeholder || ''}
                                                        onChange={e => handleCustomChange(e, formik)}
                                                        onBlur={field.onBlur ? field.onBlur : formik.handleBlur}
                                                        error={
                                                            formik.touched[field.name] &&
                                                            Boolean(formik.errors[field.name])
                                                        }
                                                        helperText={
                                                            formik.touched[field.name] && formik.errors[field.name]
                                                        }
                                                        size={field.size}
                                                        sx={field.customSx}
                                                        disabled={field.isDisabled}
                                                        autoComplete={field.autoComplete ?? 'off'}
                                                        InputLabelProps={{
                                                            shrink:
                                                                !!formik.values[field.name] ||
                                                                formik.values[field.name] ||
                                                                formik.touched[field.name]
                                                        }}
                                                        InputProps={{
                                                            inputRef: field?.inputRef,
                                                            startAdornment: field.startAdornment ? (
                                                                <InputAdornment position='start'>
                                                                    {field.startAdornment}
                                                                </InputAdornment>
                                                            ) : null,
                                                            endAdornment:
                                                                (field.endAdornment && formik.values[field.name]) ||
                                                                field?.showEndAdornment ? (
                                                                    <InputAdornment position='end'>
                                                                        {field.endAdornment}
                                                                    </InputAdornment>
                                                                ) : null,
                                                            ...field?.inputProps
                                                        }}
                                                    />
                                                ) : (
                                                    <CustomFormInput
                                                        name={field.name} // Field name used by Formik
                                                        label={field.label} // Field label
                                                        required={field?.required || false}
                                                        placeholder={field.placeholder ?? ''}
                                                        formik={formik} // Pass the formik instance to access form values, errors, etc.
                                                        inputProps={{
                                                            type: field.type || 'text', // Set type if specified; default to 'text'
                                                            sx: { height: 40 }, // Optional: custom height or other styles for InputProps
                                                            fullWidth: true, // Make the input field take full width if needed
                                                            inputRef: field?.inputRef,
                                                            startAdornment: field?.startAdornment ? (
                                                                <InputAdornment position='start'>
                                                                    {field?.startAdornment}
                                                                </InputAdornment>
                                                            ) : null,
                                                            endAdornment:
                                                                (field?.endAdornment && formik?.values[field?.name]) ||
                                                                field?.showEndAdornment ? (
                                                                    <InputAdornment position='end'>
                                                                        {field?.endAdornment}
                                                                    </InputAdornment>
                                                                ) : null,
                                                            ...field?.inputProps
                                                        }}
                                                        sx={field.customSx}
                                                        handleCustomChange={handleCustomChange}
                                                        disabled={'isDisabled' in field ? field?.isDisabled : false}
                                                        autoComplete={field?.autoComplete ?? 'off'}
                                                    />
                                                ))}
                                        </>
                                    )}
                                    {(field.type === 'date' || field.type === 'time' || field.type === 'dateTime') && (
                                        <CustomDateInput
                                            field={{
                                                ...field,
                                                label: field?.required ? `${field.label} *` : field.label
                                            }}
                                            formik={formik}
                                            helperText={formik.touched[field.name] && formik.errors[field.name]}
                                            handleCustomChange={handleCustomChange}
                                        />
                                    )}
                                    {/* {(field.type === 'dateTime' || field.type === 'customDate') && (
                                <CustomDateTimePicker
                                    field={field}
                                    formik={formik}
                                    handleCustomChange={handleCustomChange}
                                />
                            )} */}
                                    {field.type === 'currency' && <CustomCurrencyInput field={field} formik={formik} />}

                                    <Box
                                        display='flex'
                                        sx={{
                                            justifyContent: 'flex-end',
                                            alignItems: 'flex-end'
                                        }}
                                        gap={0.5}
                                    >
                                        {field.type === 'checkboxLabel' ? (
                                            <FormControlLabel
                                                control={
                                                    <RadioGroup
                                                        row
                                                        name={field.name}
                                                        value={formik.values[field.name] ? 'YES' : 'NO'}
                                                        onChange={e =>
                                                            formik.setFieldValue(
                                                                field.name,
                                                                // eslint-disable-next-line no-unneeded-ternary
                                                                e.target.value === 'YES' ? true : false
                                                            )
                                                        }
                                                    >
                                                        <FormControlLabel
                                                            value='YES'
                                                            control={<Radio size='small' />}
                                                            label='YES'
                                                            sx={{ marginRight: 0.5 }}
                                                        />
                                                        <FormControlLabel
                                                            value='NO'
                                                            control={<Radio size='small' />}
                                                            label='NO'
                                                        />
                                                    </RadioGroup>
                                                }
                                                label={field.label}
                                                labelPlacement={field.labelPlacement ?? 'start'}
                                                sx={{
                                                    whiteSpace: 'nowrap',
                                                    '& .MuiTypography-root': {
                                                        marginRight: 1
                                                    },
                                                    marginLeft: '0px',
                                                    flex: '2.75',
                                                    alignSelf: 'flex-start',
                                                    justifyContent: 'flex-end'
                                                }}
                                                componentsProps={{
                                                    typography: { fontWeight: 'bold', ...(field?.labelTextSx || {}) } // Make only the label bold
                                                }}
                                            />
                                        ) : null}

                                        {field.relatedField && formik.values[field.name] && (
                                            <TextField
                                                fullWidth
                                                label={field.relatedField.label}
                                                required={field?.required || false}
                                                name={field.relatedField.name}
                                                type={field.relatedField.type}
                                                value={formik.values[field.relatedField.name]}
                                                placeholder={field.relatedField.placeholder}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                error={
                                                    formik.touched[field.relatedField.name] &&
                                                    Boolean(formik.errors[field.relatedField.name])
                                                }
                                                helperText={
                                                    formik.touched[field.relatedField.name] &&
                                                    formik.errors[field.relatedField.name]
                                                }
                                                sx={{
                                                    flex: 1,
                                                    '& input': {
                                                        backgroundColor: '#fff',
                                                        padding: '10px 8px',
                                                        height: '16px'
                                                    },
                                                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                                        backgroundColor: 'white'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: 'gray'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        top: '-8px !important'
                                                    }
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {field.type === 'select' && (
                                        <FormControl
                                            error={formik.touched[field.name] && formik.errors[field.name]}
                                            fullWidth
                                        >
                                            <InputLabel id={field.name} size={field.size}>
                                                {field.label}
                                            </InputLabel>
                                            <Select
                                                fullWidth
                                                labelId={field.name}
                                                name={field.name}
                                                label={field.label}
                                                value={formik.values[field.name]}
                                                required={field?.required || false}
                                                onChange={formik.handleChange}
                                                onBlur={formik.handleBlur}
                                                // error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                                                // displayEmpty
                                                size={field.size}
                                                defaultValue={formik.values[field.name] || ''}
                                                sx={{
                                                    backgroundColor: '#fff', // Set initial background color
                                                    '&:hover': {
                                                        backgroundColor: '#fff' // Change background on hover
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: '#fff' // Change background when focused
                                                    },
                                                    '& .MuiSelect-select': {
                                                        backgroundColor: '#fff' // Set background for the input part of Select
                                                    }
                                                }}
                                            >
                                                <MenuItem value='' sx={{ color: '#00000061' }}>
                                                    <em>None</em>
                                                </MenuItem>
                                                {field.options.map(option => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {formik.touched[field.name] && formik.errors[field.name] && (
                                                <FormHelperText>{formik.errors[field.name]}</FormHelperText>
                                            )}
                                        </FormControl>
                                    )}
                                    {field.type === 'phone' && (
                                        <Box>
                                            <CustomPhoneInput
                                                field={{
                                                    ...field,
                                                    label: field?.required ? `${field.label} *` : field.label
                                                }}
                                                formik={formik}
                                                handlePhoneChange={value => handlePhoneChange(field.name, value)}
                                            />
                                        </Box>
                                    )}
                                    {field.type === 'switch' && (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    name={field.name}
                                                    checked={formik.values[field.name]}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    size={field.size}
                                                />
                                            }
                                            label={field.label}
                                        />
                                    )}
                                    {field.type === 'checkbox' && (
                                        <>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        name={field.name}
                                                        checked={Boolean(formik.values[field.name])}
                                                        onChange={e =>
                                                            formik.setFieldValue(field.name, e.target.checked)
                                                        }
                                                        onBlur={formik.handleBlur}
                                                        size={field.size}
                                                        sx={field.customSx}
                                                    />
                                                }
                                                label={field.label}
                                            />

                                            {formik.touched[field.name] && formik.errors[field.name] && (
                                                <FormHelperText error>{formik.errors[field.name]}</FormHelperText>
                                            )}
                                        </>
                                    )}

                                    {field.type === 'file' && (
                                        <CustomFileUpload
                                            field={field}
                                            handleCustomChange={handleCustomChange}
                                            formik={formik}
                                        />
                                    )}
                                    {field.type === 'CustomAutocomplete' && (
                                        <CustomAutocomplete
                                            name={field.name}
                                            label={field?.required ? `${field.label} *` : field.label}
                                            options={field.options}
                                            value={formik.values[field.name]}
                                            touched={formik.touched[field.name]}
                                            error={formik.errors[field.name]}
                                            onChange={(e, newValue, label) => {
                                                // If `e` is available and useful, or purely `newValue`:
                                                handleCustomChange(
                                                    { target: { name: field.name, value: newValue, label } },
                                                    formik
                                                )
                                            }}
                                            onBlur={() => formik.setFieldTouched(field.name, true)}
                                            setFieldValue={formik.setFieldValue}
                                            setFieldTouched={formik.setFieldTouched}
                                            customSx={field?.customSx ? field?.customSx : {}}
                                            showAdornment={field?.showAdornment}
                                            customInputSx={field?.customInputSx}
                                            customTextSx={field?.customTextSx}
                                            placeholder={field?.placeholder ?? ''}
                                            getOptionLabel={field?.getOptionLabel}
                                            isOptionEqualToValue={field?.isOptionEqualToValue}
                                            innerLabel={field.innerLabel}
                                            isDisabled={field.isDisabled}
                                            helperText={field.helperText}
                                            onInputChange={field?.onInputChange}
                                            inputRef={field?.inputRef}
                                            customInputProp={field?.inputProps}
                                            inputProps={field?.inputProps}
                                            loading={field?.loading}
                                        />
                                    )}
                                    {field.type === 'FlexibleAutoComplete' && (
                                        <FlexibleAutoComplete
                                            name={field.name}
                                            label={field.label}
                                            options={field.options}
                                            required={field?.required || false}
                                            value={formik.values[field.name]}
                                            touched={formik.touched[field.name]}
                                            error={formik.errors[field.name]}
                                            onChange={(e, newValue, labelValue) => {
                                                handleCustomChange(
                                                    {
                                                        target: { name: field.name, value: newValue, label: labelValue }
                                                    },
                                                    formik
                                                )
                                            }}
                                            onBlur={() => formik.setFieldTouched(field.name, true)}
                                            setFieldValue={formik.setFieldValue}
                                            setFieldTouched={formik.setFieldTouched}
                                            customSx={field.customSx || {}}
                                            showAdornment={field.showAdornment}
                                            customInputSx={field.customInputSx || {}}
                                            customTextSx={field.customTextSx || {}}
                                            placeholder={field.placeholder || ''}
                                            getOptionLabel={field.getOptionLabel}
                                            isOptionEqualToValue={field.isOptionEqualToValue}
                                            innerLabel={field.innerLabel}
                                            isDisabled={field.isDisabled}
                                            helperText={field.helperText}
                                            onInputChange={field.onInputChange}
                                        />
                                    )}

                                    {field.type === 'textarea' && (
                                        <FormControl fullWidth variant='outlined'>
                                            {!field?.innerLabel && (
                                                <Typography variant='body2' sx={{ mb: 1 }}>
                                                    {field.label}
                                                </Typography>
                                            )}
                                            <TextField
                                                name={field.name}
                                                disabled={field?.isDisabled}
                                                required={field?.required || false}
                                                multiline
                                                rows={field?.rows ?? 3}
                                                label={field?.innerLabel ? field.label : null}
                                                variant='outlined'
                                                placeholder={field?.placeholder || ''}
                                                // eslint-disable-next-line react/prop-types
                                                {...formik.getFieldProps(field.name)} // Directly get formik properties for TextField
                                                onChange={e => handleCustomChange(e, formik)}
                                                onBlur={field.onBlur ? field.onBlur : formik.handleBlur}
                                                error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                                                helperText={formik.touched[field.name] && formik.errors[field.name]}
                                                sx={field?.customSx ?? {}}
                                            />
                                        </FormControl>
                                    )}
                                    {field.type === 'imageUrls' && (
                                        <Box
                                            sx={{
                                                border: '1px solid',
                                                // borderColor: 'primary.200',
                                                borderRadius: '8px',
                                                padding: '6px 8px',
                                                height: '38px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: '#f5f5f5',
                                                maxWidth: '200px',
                                                '&:hover': {
                                                    cursor: 'pointer'
                                                }
                                            }}
                                            onClick={handleAdd}
                                        >
                                            <LinkIcon />
                                            <Typography
                                                sx={{
                                                    fontSize: addedUrls?.length >= 1 ? '10px' : '14px'
                                                }}
                                            >
                                                {addedUrls?.length <= 0
                                                    ? 'Add Image Urls'
                                                    : `Added ${addedUrls?.length} URL | Add more`}{' '}
                                                |
                                            </Typography>
                                            <ImageIcon />
                                        </Box>
                                    )}

                                    {field.type === 'dimensions' && (
                                        <DimensionLBHInput
                                            name={field.name}
                                            label={field.label}
                                            value={formik.values[field?.name]}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.errors[field.name]}
                                            helperText={formik.errors[field.name]}
                                            touched={formik.touched[field.name]}
                                            inputRef={field?.inputRef}
                                            outerLabel={field.outerLabel}
                                            size={field.size}
                                            onEnterKeyPress={field.onEnterKeyPress}
                                            disabled={field?.isDisabled}
                                        />
                                    )}
                                </>
                            )}
                        </Grid>
                    ))}
                {isStraightAlignedButton && isLoading && (
                    <Skeleton
                        variant='rectangular'
                        height={40}
                        width={100}
                        sx={{ marginLeft: { sm: 'auto', xs: '8px' }, marginTop: { sm: '10px', xs: '20px' } }}
                    />
                )}
                {isStraightAlignedButton && !isLoading && (
                    <Button
                        variant='contained'
                        color='primary'
                        type='submit'
                        sx={{
                            width: {
                                xs: '100%',
                                sm: 'auto'
                            },
                            maxHeight: 'fit-content',
                            alignSelf: 'center',
                            marginBottom: '2px',
                            marginLeft: { sm: 'auto', xs: '8px' },
                            marginTop: { sm: '0px', xs: '20px' },
                            ...submitButtonSx
                        }}
                        disabled={disableSubmitButton || submitting}
                        onClick={e => {
                            if (disableSubmitButton && submitting) e.preventDefault()
                        }}
                    >
                        {submitting ? <CircularProgress color='success' size='20px' /> : submitButtonText}
                    </Button>
                )}
            </Grid>
            {!isStraightAlignedButton && submitButtonText !== null && (
                <>
                    {showSeparaterBorder && (
                        <Divider sx={{ borderColor: 'primary.main', margin: '8px', ...dividerSx }} />
                    )}
                    {isLoading ? (
                        <Skeleton variant='rectangular' height={40} />
                    ) : (
                        <Box sx={{ textAlign: 'center', ...submitButtonSx }}>
                            {showCancelButton && (
                                <Box>
                                    <Button variant='outlined' type='button' onClick={onClickCancel}>
                                        Cancel
                                    </Button>
                                </Box>
                            )}
                            <motion.div
                                animate={isHovering ? 'elegant' : 'idle'}
                                variants={{
                                    idle: {},
                                    elegant: {
                                        x: [0, -1, 1, -0.5, 0.5, 0],
                                        y: [0, -0.5, 0, 0.5, 0],
                                        transition: {
                                            duration: 0.6,
                                            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                                            ease: [0.34, 1.56, 0.64, 1],
                                            loop: 0
                                        }
                                    }
                                }}
                            >
                                <Button
                                    variant='contained'
                                    color='primary'
                                    type='submit'
                                    ref={submitButtonRef}
                                    sx={{ width: { xs: '100%', sm: 'auto', position: 'relative' } }}
                                    disabled={disableSubmitButton || submitting}
                                    onClick={e => {
                                        if (disableSubmitButton && submitting) e.preventDefault()
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Tab' && !e.shiftKey && disabledTabImplementation) {
                                            e.preventDefault()
                                            submitButtonRef?.current?.focus() // Note:: Move focus back to first enabled element other wise user enters disabled component
                                        }
                                    }}
                                >
                                    {isHovering && (
                                        <motion.div
                                            style={{
                                                position: 'absolute',
                                                // right: '120px',
                                                left: '-3rem',
                                                // bottom: '28px',
                                                transform: 'translateY(-50%)',
                                                display: isMobile ? 'none' : 'block',
                                                color: '#1DB954', // Green color
                                                fontSize: '42px',
                                                pointerEvents: 'none',
                                                fontWeight: 'bold'
                                            }}
                                            animate={{
                                                x: [0, -10, 0],
                                                opacity: [0.6, 1, 0.6]
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                ease: 'easeInOut',
                                                repeat: Infinity
                                            }}
                                        >
                                            →
                                        </motion.div>
                                    )}
                                    {submitting ? <CircularProgress color='success' size='20px' /> : submitButtonText}
                                </Button>
                            </motion.div>
                        </Box>
                    )}
                </>
            )}
        </Box>
    )
}
/* eslint-disable react/forbid-prop-types */
FormComponent.propTypes = {
    formik: PropTypes.shape({
        values: PropTypes.object.isRequired,
        handleChange: PropTypes.func.isRequired,
        handleBlur: PropTypes.func.isRequired,
        handleSubmit: PropTypes.func.isRequired,
        setFieldValue: PropTypes.func,
        setFieldTouched: PropTypes.func,
        touched: PropTypes.object,
        errors: PropTypes.object
    }).isRequired,
    fields: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            type: PropTypes.string,
            options: PropTypes.arrayOf(
                PropTypes.shape({
                    value: PropTypes.string.isRequired,
                    label: PropTypes.string.isRequired
                })
            ),
            grid: PropTypes.object
        })
    ).isRequired,
    handleCustomChange: PropTypes.func,
    customStyle: PropTypes.object,
    submitButtonSx: PropTypes.object, // submit button style
    isStraightAlignedButton: PropTypes.bool, // if submit button needs to appear like grid items along with the inputs
    showSeparaterBorder: PropTypes.bool,
    submitButtonText: PropTypes.string,
    gridStyles: PropTypes.object,
    addedUrls: PropTypes.array,
    setAddedUrls: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    disableSubmitButton: PropTypes.bool,
    isHovering: PropTypes.bool,
    disabledTabImplementation: PropTypes.bool, // when tab below form is disabled
    dividerSx: PropTypes.object,
    submitting: PropTypes.bool,
    isLoading: PropTypes.bool,
    onClickCancel: PropTypes.func,
    showCancelButton: PropTypes.bool // Show cancel button
}
/* eslint-disable */
export default FormComponent
