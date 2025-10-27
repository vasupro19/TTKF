import React, { useRef, useEffect } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import { useDispatch } from 'react-redux'
import { getCustomSx } from '@/utilities'
import { openSnackbar } from '@/app/store/slices/snackbar'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import FormComponent from '@/core/components/forms/FormComponent'

// eslint-disable-next-line react/prop-types
function WeightCourierModal({ isOpen, setIsOpen, onSuccess, setActiveModal, isWeightRequired = false }) {
    // for FormComponent inputs
    const formInputSx = getCustomSx()
    const dispatch = useDispatch()
    const weightInputRef = useRef(null)
    const courierInputRef = useRef(null)
    const awbNumberInputRef = useRef(null)

    const wnCuField = [
        {
            name: 'weight',
            label: 'Weight*',
            type: 'number',
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            endAdornment: <b>KG</b>,
            showEndAdornment: true,
            inputRef: weightInputRef,
            autoComplete: 'off',
            required: isWeightRequired,
            inputProps: {
                onKeyPress: e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (courierInputRef.current) {
                            setTimeout(() => {
                                courierInputRef.current?.focus()
                            }, 100)
                        }
                    }
                }
            }
        },
        {
            name: 'courier',
            label: 'Courier*',
            type: 'CustomAutocomplete',
            options: [
                { value: 'Bluedart', label: 'Bluedart' },
                { value: 'Delhivery', label: 'Delhivery' },
                { value: 'DTDC', label: 'DTDC' },
                { value: 'Others', label: 'Others' }
            ],
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            showAdornment: true,
            inputRef: courierInputRef,
            inputProps: {
                onKeyPress: e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (awbNumberInputRef.current) {
                            setTimeout(() => {
                                awbNumberInputRef.current?.focus()
                            }, 100)
                        }
                    }
                }
            }
        },
        {
            name: 'awbNo',
            label: 'AWB Number*',
            type: 'text',
            grid: { xs: 12 },
            inputRef: awbNumberInputRef,
            size: 'small',
            customSx: formInputSx
        }
    ]

    // Zod validation schema
    const validationSchema = z.object({
        weight: isWeightRequired
            ? z
                  .number({ invalid_type_error: 'Weight is required' })
                  .min(0.01, 'Weight must be greater than 0')
                  .refine(val => val === 0 || val >= 0.01, {
                      message: 'Weight must be greater than 0'
                  })
            : z.preprocess(
                  val => (val === '' || val === null ? undefined : Number(val)),
                  z
                      .number({
                          invalid_type_error: 'Please enter a valid number'
                      })
                      .optional()
                      .nullable()
              ),
        courier: z
            .union([
                z.object({
                    value: z.string().min(1, 'Courier is required'),
                    label: z.string()
                }),
                z.string().min(1, 'Courier is required'),
                z.null()
            ])
            .superRefine((val, ctx) => {
                if (!val || (typeof val === 'object' && !val.value)) {
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Courier is required'
                    })
                }
            }),
        awbNo: z.string().trim().min(1, 'AWB Number is required')
    })

    // Convert the schema to a Formik-compatible validation function
    const validate = values => {
        const result = validationSchema.safeParse(values)
        let errors = {}

        if (!result.success) {
            errors = result.error.issues.reduce((acc, issue) => {
                acc[issue.path[0]] = issue.message
                return acc
            }, {})
        }
        return errors
    }

    const formik = useFormik({
        initialValues: {
            weight: null,
            courier: null,
            awbNo: ''
        },
        validate,
        onSubmit: async (values, { resetForm }) => {
            try {
                // Show success message
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Packed Successfully',
                        variant: 'alert',
                        alert: { color: 'success' },
                        anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    })
                )

                // Reset form and call success callback
                resetForm()
                onSuccess?.(values)

                // Move to next modal
                setActiveModal('awbNumber')
            } catch (error) {
                console.error('Error submitting weight and courier:', error)
            }
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    // Handle custom change for weight field
    const handleCustomChange = e => {
        const { name, value } = e.target
        if (['weight'].includes(name)) {
            // Allow empty input
            if (value === '') {
                formik.setFieldValue(name, '')
                return
            }

            // Allow typing decimal point
            if (value === '.' || value === '0.') {
                formik.setFieldValue(name, value)
                return
            }

            // For decimal input with up to two decimal places
            if (/^(\d+(\.\d{0,2})?)$/.test(value)) {
                // Convert to number before setting
                const numericValue = parseFloat(value)
                formik.setFieldValue(name, numericValue)
            } else if (value.endsWith('.') || /^(\d+\.\d{0,1})$/.test(value)) {
                // Still typing a decimal - allow temporarily as string
                formik.setFieldValue(name, value)
            } else {
                // If more than two decimal places, format to two decimal places
                const numericValue = parseFloat(value)
                if (!Number.isNaN(numericValue) && numericValue >= 0) {
                    formik.setFieldValue(name, Math.max(0, parseFloat(numericValue.toFixed(2))))
                }
            }
            return
        }
        formik.handleChange(e)
    }

    // Focus on weight input when modal opens
    useEffect(() => {
        if (isOpen) {
            formik.resetForm()
            setTimeout(() => {
                weightInputRef.current?.focus()
            }, 100)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    return (
        <TitleModalWrapper
            title='Weight & Courier Selection'
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            boxContainerSx={{
                width: { xs: '340px', sm: '400px' }
            }}
        >
            <FormComponent
                fields={wnCuField}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                submitButtonSx={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}
                showSeparaterBorder
                submitButtonText='Next'
                dividerSx={{
                    margin: '10px 0px'
                }}
            />
        </TitleModalWrapper>
    )
}

export default WeightCourierModal
