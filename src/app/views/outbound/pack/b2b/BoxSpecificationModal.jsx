/* eslint-disable react/prop-types */
import React, { useRef, useEffect } from 'react'
import { useFormik } from 'formik'
import { z } from 'zod'
import FormComponent from '@/core/components/forms/FormComponent'
import TitleModalWrapper from '@/core/components/TitleModalWrapper'
import { getCustomSx } from '@/utilities'

const formInputSx = getCustomSx()

function BoxSpecificationModal({
    isOpen,
    onClose,
    onSubmit,
    title = 'Enter Weight & Dimensions',
    isWeightRequired = false,
    autoCalculateWeight = false,
    isBoxSpecAllowed = false,
    defaultDimensions = null
}) {
    const weightIpRef = useRef(null)
    const dimensionIpRef = useRef(null)

    const fields = [
        {
            name: 'weight',
            label: 'Weight',
            type: 'number',
            grid: { xs: 12 },
            size: 'small',
            customSx: formInputSx,
            endAdornment: <b>KG</b>,
            showEndAdornment: true,
            inputRef: weightIpRef,
            autoComplete: 'off',
            CustomFormInput: false,
            required: isWeightRequired,
            inputProps: {
                onKeyPress: e => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        if (dimensionIpRef.current) {
                            setTimeout(() => {
                                dimensionIpRef.current?.focus()
                            }, 100)
                        }
                    }
                }
            }
        },
        {
            name: 'dimensions',
            label: isBoxSpecAllowed ? 'Dimension*' : 'Dimension',
            type: 'dimensions',
            required: isBoxSpecAllowed,
            grid: { xs: 12 },
            size: 'regular',
            inputRef: dimensionIpRef,
            outerLabel: false
        }
    ]

    const validationSchema = z.object({
        weight: isWeightRequired
            ? z
                  .number({
                      required_error: 'Weight is required',
                      invalid_type_error: 'Please enter a valid number'
                  })
                  .min(0.01, 'Weight must be greater than 0')
            : z.preprocess(
                  val => (val === '' || val === null ? undefined : Number(val)),
                  z
                      .number({
                          invalid_type_error: 'Please enter a valid number'
                      })
                      .optional()
              ),
        dimensions: isBoxSpecAllowed
            ? z.object(
                  {
                      length: z.union([
                          z
                              .string()
                              .trim()
                              .min(1, 'Length is required')
                              .refine(val => /^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0, {
                                  message: 'Length must be a positive number with up to 2 decimal places'
                              }),
                          z.number().positive('Length must be a positive number')
                      ]),
                      breadth: z.union([
                          z
                              .string()
                              .trim()
                              .min(1, 'Breadth is required')
                              .refine(val => /^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0, {
                                  message: 'Breadth must be a positive number with up to 2 decimal places'
                              }),
                          z.number().positive('Breadth must be a positive number')
                      ]),
                      height: z.union([
                          z
                              .string()
                              .trim()
                              .min(1, 'Height is required')
                              .refine(val => /^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) > 0, {
                                  message: 'Height must be a positive number with up to 2 decimal places'
                              }),
                          z.number().positive('Height must be a positive number')
                      ]),
                      unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm')
                  },
                  {
                      required_error: 'Dimensions are required'
                  }
              )
            : z
                  .object({
                      length: z.string().optional(),
                      breadth: z.string().optional(),
                      height: z.string().optional(),
                      unit: z.enum(['cm', 'm', 'in', 'ft']).default('cm').optional()
                  })
                  .optional()
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
            dimensions: {
                length: isBoxSpecAllowed ? defaultDimensions.length : '',
                breadth: isBoxSpecAllowed ? defaultDimensions.breadth : '',
                height: isBoxSpecAllowed ? defaultDimensions.height : '',
                unit: isBoxSpecAllowed ? defaultDimensions.unit : 'cm'
            }
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
                weightIpRef.current?.focus()
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
                fields={fields}
                formik={formik}
                handleCustomChange={handleCustomChange}
                customStyle={{
                    backgroundColor: 'none'
                }}
                submitButtonSx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    '& button': {
                        width: 'max-content',
                        height: '2rem'
                    }
                }}
                showSeparaterBorder
                submitButtonText='Confirm and Next'
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

export default BoxSpecificationModal
