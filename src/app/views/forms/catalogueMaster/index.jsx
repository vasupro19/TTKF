import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
// ** import forms and validation
import { z } from 'zod'

// ** import redux
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import usePrompt from '@hooks/usePrompt'
import { getSkuCustomProps, getSkuById } from '@/app/store/slices/api/catalogueSlice'

// Importing formResources
import { getObjectKeys } from '@/utilities'
import { customTextSx, customSx, customInputSx, formFields } from './formResources'
import ChildForm from './ChildForm'

function CatalogueMasterForm() {
    const { id } = useParams()
    usePrompt()
    const dispatch = useDispatch()
    const [customFields, setCustomFields] = useState([])
    const [tabsFields, setTabsFields] = useState([])
    const [validationSchema, setValidationSchema] = useState([])
    const [initialValues, setInitialValues] = useState({})
    const [editImages, setEditImages] = useState([])
    const [renderOk, setRenderOk] = useState(false)

    // Group fields by section
    const groupeFields = fields =>
        fields.reduce((acc, item) => {
            // Convert section to a proper string with spaces and title case
            const formattedSection = item.section
                .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before uppercase letters
                .replace(/^\w/, c => c.toUpperCase()) // Capitalize the first letter

            const section = acc[formattedSection] || []
            section.push({
                name: item.name,
                label: item.label,
                type: item.type === 'dropDown' ? 'CustomAutocomplete' : item.type,
                required: item.isMandatory,
                ...(item.type === 'dropDown' && {
                    options: item.options,
                    customInputSx,
                    customTextSx,
                    showAdornment: item.options?.length > 5
                }),
                placeholder: `Enter ${item.label}`,
                CustomFormInput: false,
                grid: { xs: 12, sm: 6, md: item.type !== 'imageUrls' ? 4 : 4 },
                size: 'small',
                customSx
            })
            acc[formattedSection] = section
            return acc
        }, {})

    const makeFields = (preDefinedFields, fields) => {
        const newFields = [...preDefinedFields]

        Object.keys(fields).forEach(key => {
            fields[key].forEach(item => {
                const newItem = {
                    label: item.name,
                    name: item.name,
                    isMandatory: !!item.required,
                    type: item.type,
                    section: item.section
                }
                if (item.type === 'dropDown') newItem.options = JSON.parse(item.value)
                newFields.push(newItem)
            })
        })
        setCustomFields(newFields)
        return newFields
    }

    const makeValidation = fields => {
        if (validationSchema && validationSchema.length) return validationSchema
        const groupedFieldsForValidation = fields.reduce((acc, item) => {
            const section = acc[item.section] || []
            section.push({
                label: item.label,
                name: item.name,
                isMandatory: item.isMandatory,
                type: item.type
            })
            acc[item.section] = section
            return acc
        }, {})
        const validations = Object.values(groupedFieldsForValidation).map(item =>
            z.object(
                item.reduce((schema, field) => {
                    if (field.type === 'number') {
                        schema[field.name] = z
                            .union([z.number(), z.string()])
                            .refine(
                                val => {
                                    if (field.isMandatory && val === '') return false
                                    if (val !== '') {
                                        const num = Number(val)
                                        // eslint-disable-next-line no-restricted-globals
                                        return !isNaN(num) && num >= 0
                                    }
                                    return true
                                },
                                {
                                    message: field.isMandatory
                                        ? `${field.label} is required and must be a non-negative number`
                                        : `${field.label} must be a non-negative number`
                                }
                            )
                            .transform(val => (val === '' ? null : Number(val)))
                    } else if (field.isMandatory) {
                        if (field.type === 'number') {
                            schema[field.name] = z.number().nonnegative(`${field.label} must be a non-negative number`)
                        } else if (field.type === 'checkbox') {
                            schema[field.name] = z.boolean({ required_error: `${field.label} is required` })
                        } else if (field.type === 'alphaNumeric') {
                            schema[field.name] = z
                                .string()
                                .min(1, `${field.label} is required and must be alphanumeric`)
                                .refine(value => value === '' || /^[a-zA-Z0-9]+$/.test(value), {
                                    message: `${field.label} must be alphanumeric`
                                })
                        } else {
                            // Fix: Allow string field but don't error on null if optional dropdown
                            schema[field.name] = z
                                .union([z.string(), z.null()])
                                .refine(val => val !== null && val !== '', {
                                    message: `${field.label} is required`
                                })
                        }
                    } else {
                        /* eslint-disable */
                        if (field.type === 'number') {
                            schema[field.name] = z
                                .union([z.number(), z.string()])
                                .refine(val => val === '' || !isNaN(Number(val)), {
                                    message: `${field.label} must be a number`
                                })
                                .transform(val => (val === '' ? null : Number(val)))
                                .nullable()
                                .optional()
                        } else if (field.type === 'checkbox') {
                            schema[field.name] = z.boolean().optional()
                        } else if (field.type === 'alphaNumeric') {
                            schema[field.name] = z
                                .string()
                                .refine(value => value === '' || /^[a-zA-Z0-9]+$/.test(value), {
                                    message: `${field.label} must be alphanumeric`
                                })
                                .optional()
                        } else {
                            schema[field.name] = z.union([z.string(), z.null()]).optional()
                        }
                        /* eslint-enable */
                    }

                    return schema
                }, {})
            )
        )

        setValidationSchema(validations)
        return validations
    }

    const getEditData = async editId => {
        const { data: response } = await dispatch(getSkuById.initiate(editId))
        if (!response?.data?.item) return {}

        const propKeys = getObjectKeys(response.data.properties)
        const UserDefinedData = {}
        propKeys.flatMap(key =>
            response.data.properties[key].map(item => {
                UserDefinedData[item.propertyname] = item.propertymappingvalue

                return {
                    label: item.propertyname,
                    key: item.propertyname
                }
            })
        )

        return { ...response.data.item, ...UserDefinedData }
    }

    // eslint-disable-next-line no-nested-ternary
    const parseIfNumber = (value, type) => (type === 'number' ? (value ? parseFloat(value) : 0) : value)

    const makeForm = async data => {
        const fields = makeFields(formFields, data)

        const groupedFields = groupeFields(fields)
        // Transform into tabsFields
        setTabsFields(
            Object.keys(groupedFields).map(section => ({
                label: section,
                fields: groupedFields[section]
            }))
        )
        let newInitialValues = {}
        if (parseInt(id, 10) >= 0) {
            newInitialValues = await getEditData(id)
            if (newInitialValues?.image && newInitialValues.image.length)
                setEditImages(newInitialValues.image.map(url => ({ id: `row-${Date.now()}`, url })))

            delete newInitialValues.created_at
            delete newInitialValues.created_by
            delete newInitialValues.updated_at
            newInitialValues = {
                ...newInitialValues,
                ...Object.fromEntries(
                    fields.map(field => [field.name, parseIfNumber(newInitialValues[field.name] ?? '', field.type)])
                ),
                image: '',
                lot_reqd: newInitialValues.lot_reqd ? 'Yes' : 'No',
                expiry_reqd: newInitialValues.expiry_reqd ? 'Yes' : 'No',
                manufacturing_reqd: newInitialValues.manufacturing_reqd ? 'Yes' : 'No',
                dual_mrp: newInitialValues.dual_mrp ? 'Yes' : 'No',
                mrp_price: newInitialValues.mrp_price ? parseFloat(newInitialValues.mrp_price) : undefined,
                unit_price: newInitialValues.unit_price ? parseFloat(newInitialValues.unit_price) : undefined,
                breadth: newInitialValues.breadth ? parseFloat(newInitialValues.breadth) : undefined,
                height: newInitialValues.height ? parseFloat(newInitialValues.height) : undefined,
                length: newInitialValues.length ? parseFloat(newInitialValues.length) : undefined,
                net_weight: newInitialValues.net_weight ? parseFloat(newInitialValues.net_weight) : undefined,
                hsn_code: newInitialValues.hsn_code || ''
            }
        } else {
            fields.forEach(field => {
                // Initialize each field with default values
                if (field.type === 'number' && field.isMandatory === false) {
                    newInitialValues[field.name] = 0 // Numbers default to 0
                } else if (field.type === 'dropDown') {
                    newInitialValues[field.name] = '' // Dropdown defaults to empty string
                } else if (field.type === 'imageUrl') {
                    newInitialValues[field.name] = [] // Images default to null
                } else if (field.type === 'checkbox') {
                    newInitialValues[field.name] = false // Strings default to empty string
                } else {
                    newInitialValues[field.name] = '' // Strings default to empty string
                }
            })
        }

        setInitialValues(newInitialValues)
        makeValidation(fields)
        setRenderOk(true) // this renders the form
    }

    const getData = async () => {
        try {
            if (customFields && customFields.length) return
            const { data: response } = await dispatch(getSkuCustomProps.initiate('', { meta: { disableLoader: true } }))
            if (!response?.data) return
            await makeForm(response.data.properties)
        } catch (error) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'unable to get custom properties!',
                    variant: 'alert',
                    alert: { color: 'error' },
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        }
    }

    useEffect(() => {
        getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    if (renderOk)
        return (
            <ChildForm
                tabsFields={tabsFields}
                validationSchema={validationSchema}
                initialValues={initialValues}
                isEdit={parseInt(id, 10) >= 1}
                editImages={editImages}
            />
        )
}
export default CatalogueMasterForm
