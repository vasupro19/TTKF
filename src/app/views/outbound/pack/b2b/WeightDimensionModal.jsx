/* eslint-disable react/prop-types */
import React, { useRef, useEffect } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import FormComponent from '@/core/components/forms/FormComponent'
import { getCustomSx } from '@/utilities'

// for FormComponent inputs
const formInputSx = getCustomSx()

function WeightDimensionModal({
    isOpen,
    onClose,
    onSubmit,
    submitButtonText = 'Close',
    title = 'Close Pack',
    isCourierRequired = false,
    isWeightRequired = false
}) {
    const weightInputRef = useRef(null)
    const dimensionInputRef = useRef(null)
    const courierInputRef = useRef(null)
    const awbInputRef = useRef(null)

    const wnCuField = [
        {
            name: 'weight',
            label: 'Weight',
            type: 'number',
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            endAdornment: <b>KG</b>,
            showEndAdornment: true,
            inputRef: weightInputRef,
            autoComplete: 'off',
            CustomFormInput: false,
            required: isWeightRequired,
            inputProps: {
                onKeyPress: e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (dimensionInputRef.current) {
                            setTimeout(() => {
                                dimensionInputRef.current?.focus()
                            }, 100)
                        }
                    }
                }
            }
        },
        {
            name: 'dimensions',
            label: 'Dimension',
            type: 'dimensions',
            grid: { xs: 12 },
            size: 'regular',
            inputRef: dimensionInputRef,
            outerLabel: false,
            onEnterKeyPress: () => {
                if (courierInputRef.current) {
                    setTimeout(() => {
                        courierInputRef.current?.focus()
                    }, 100)
                }
            }
        },
        {
            name: 'courier',
            label: 'Courier',
            type: 'CustomAutocomplete',
            required: isCourierRequired,
            options: [
                { value: 'Bluedart', label: 'Bluedart' },
                { value: 'Delhivery', label: 'Delhivery' },
                { value: 'DTDC', label: 'DTDC' },
                { value: 'Others', label: 'Others' }
            ],
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            inputRef: courierInputRef,
            isOptionEqualToValue: (option, selectedValue) =>
                (option?.value || option) === (selectedValue?.value || selectedValue),
            showAdornment: true,
            inputProps: {
                onKeyPress: e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (awbInputRef.current) {
                            setTimeout(() => {
                                awbInputRef.current?.focus()
                            }, 100)
                        }
                    }
                }
            }
        },
        {
            name: 'awb_no',
            label: 'AWB No.',
            placeholder: 'eg: DS09DS9090',
            type: 'text',
            required: true,
            CustomFormInput: false,
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            inputRef: awbInputRef,
            autoComplete: 'off'
        }
    ]

    const validationSchema = z.object({
        weight: isWeightRequired
            ? z
                  .number({ invalid_type_error: 'Please enter a valid number' })
                  .min(0.01, 'Weight must be greater than 0')
                  .nullable()
                  .refine(val => val === null || val === undefined || val === '' || val >= 0.01, {
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
        dimensions: z
            .object({
                length: z
                    .union([
                        z
                            .string()
                            .trim()
                            .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                                message: 'Length must be a positive number with up to 2 decimal places'
                            }),
                        z.number().positive('Length must be a positive number')
                    ])
                    .optional(),
                breadth: z
                    .union([
                        z
                            .string()
                            .trim()
                            .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                                message: 'Breadth must be a positive number with up to 2 decimal places'
                            }),
                        z.number().positive('Breadth must be a positive number')
                    ])
                    .optional(),
                height: z
                    .union([
                        z
                            .string()
                            .trim()
                            .refine(val => val === '' || (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0), {
                                message: 'Height must be a positive number with up to 2 decimal places'
                            }),
                        z.number().positive('Height must be a positive number')
                    ])
                    .optional(),
                unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm')
            })
            .optional()
            .nullable()
            .refine(
                dimensions => {
                    if (!dimensions) return true
                    const hasValues = {
                        length: dimensions.length !== undefined && dimensions.length !== '',
                        breadth: dimensions.breadth !== undefined && dimensions.breadth !== '',
                        height: dimensions.height !== undefined && dimensions.height !== ''
                    }
                    const providedCount = Object.values(hasValues).filter(Boolean).length
                    return providedCount === 0 || providedCount === 3
                },
                {
                    message: 'Please provide all 3 dimensions (LxBxH) or leave them all empty'
                }
            ),
        courier: z
            .preprocess(
                val => (typeof val === 'object' && val !== null ? val : null),
                isCourierRequired
                    ? z
                          .object({
                              value: z.string().min(1, { message: 'Courier is required' }),
                              label: z.string()
                          })
                          .nullable()
                          .refine(val => val !== null, {
                              message: 'Courier is required'
                          })
                    : z
                          .object({
                              value: z.string(),
                              label: z.string()
                          })
                          .nullable()
            )
            .optional(),
        awb_no: z.string({ required_error: 'awb is required' })
    })

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
            dimensions: { length: '', breadth: '', height: '', unit: 'cm' },
            courier: null,
            awb_no: ''
        },
        validate,
        onSubmit: async (values, { resetForm }) => {
            onSubmit(values, { resetForm })
        },
        validateOnBlur: false,
        validateOnChange: true
    })

    const handleCustomChange = e => {
        const { name, value } = e.target
        if (['weight'].includes(name)) {
            if (value === '') {
                formik.setFieldValue(name, '')
                return
            }

            if (value === '.' || value === '0.') {
                formik.setFieldValue(name, value)
                return
            }

            if (/^(\d+(\.\d{0,2})?)$/.test(value)) {
                const numericValue = parseFloat(value)
                formik.setFieldValue(name, numericValue)
            } else if (value.endsWith('.') || /^(\d+\.\d{0,1})$/.test(value)) {
                formik.setFieldValue(name, value)
            } else {
                const numericValue = parseFloat(value)
                if (!Number.isNaN(numericValue) && numericValue >= 0) {
                    formik.setFieldValue(name, Math.max(0, parseFloat(numericValue.toFixed(2))))
                }
            }
            return
        }
        formik.handleChange(e)
    }

    useEffect(() => {
        if (isOpen) {
            formik?.resetForm()
            setTimeout(() => {
                weightInputRef.current?.focus()
            }, 100)
        }
    }, [isOpen])

    return (
        <TitleModalWrapper
            title={title}
            isOpen={isOpen}
            setIsOpen={onClose}
            boxContainerSx={{
                width: { xs: '340px', sm: '400px' }
            }}
            onClose={onClose}
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
                submitButtonText={submitButtonText}
                dividerSx={{
                    margin: '10px 0px'
                }}
                gridStyles={{
                    gap: 1.5
                }}
            />
        </TitleModalWrapper>
    )
}

export default WeightDimensionModal
