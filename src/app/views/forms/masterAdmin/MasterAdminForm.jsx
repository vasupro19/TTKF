import React, { useState, useEffect } from 'react'
import { Box, Stack, IconButton, Tooltip } from '@mui/material'
import Edit from '@mui/icons-material/Edit'
import Delete from '@mui/icons-material/Delete'
import MainCard from '@core/components/extended/MainCard'
import CSVExpo from '@core/components/extended/CreateCSV'
import DataTable from '@core/components/extended/table/Table'
import FormComponent from '@core/components/forms/FormComponent'
import CustomButton from '@core/components/extended/CustomButton'
import { IosShare } from '@mui/icons-material'

import { z } from 'zod'
import { useFormik } from 'formik'
// Mock data fetch
const fetchAdmins = async () => [
    { id: 1, contactName: 'Chandan Gond', email: 'chandan.gond@coderootz.com' },
    { id: 2, contactName: 'Rizwan', email: 'mohd.rizwan@holisollogistics.com' },
    { id: 3, contactName: 'Pradeep Kumar', email: 'pradeep.kumar@coderootz.com' },
    { id: 4, contactName: 'Aayush Goel', email: 'aayush.goel@bajajfinserv.in' },
    { id: 5, contactName: 'Ishaan Tiwari', email: 'ishaan.tiwari@holisollogistics.com' },
    { id: 6, contactName: 'Pankaj Singh', email: 'pankaj.singh1@holisollogistics.com' }
]

const formSchema = z.object({
    contactName: z
        .string()
        .trim()
        .min(1, 'Required')
        .max(50, 'Max 50 characters')
        .regex(/^[A-Za-z\s]+$/, 'Alphabets only'),
    email: z.string().trim().email('Invalid email').max(100, 'Max 100 characters'),
    number: z
        .string()
        .trim()
        .regex(/^[0-9]{10}$/, '10-digit number required'),
    password: z
        .string()
        .min(6, 'Min 6 characters')
        .max(20, 'Max 20 characters')
        .regex(
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{6,20}$/,
            'Must include uppercase, lowercase, number, and special character'
        )
})

function MasterAdminPage() {
    const [excelHandler, setExcelHandler] = useState(false)
    const [formData, setFormData] = useState([])
    const [csvHeaders] = useState([
        { label: 'S No', key: 'sno' },
        { label: 'Master Admin Name', key: 'contactName' },
        { label: 'Master Admin Email', key: 'email' }
    ])
    const [csvData, setCsvData] = useState([])

    // Form fields with grid properties to ensure 2 items per row
    const formFields = [
        { name: 'contactName', label: 'Contact Name', type: 'text', grid: { xs: 12, sm: 6, md: 6 }, size: 'small' },
        { name: 'number', label: 'Number', type: 'text', grid: { xs: 12, sm: 6, md: 6 }, size: 'small' },
        { name: 'email', label: 'Email', type: 'text', grid: { xs: 12, sm: 6, md: 6 }, size: 'small' },
        { name: 'password', label: 'Password', type: 'password', grid: { xs: 12, sm: 6, md: 6 }, size: 'small' }
    ]

    const handleExcelClick = () => {
        setExcelHandler(true)
        setTimeout(() => setExcelHandler(false), 1000)
    }

    useEffect(() => {
        const loadAdmins = async () => {
            const admins = await fetchAdmins()
            setFormData(admins)
        }
        loadAdmins()
    }, [])

    useEffect(() => {
        setCsvData(
            formData.map((row, index) => ({
                sno: index + 1,
                contactName: row.contactName,
                email: row.email
            }))
        )
    }, [formData])

    const handleFormSubmit = values => {
        setFormData([...formData, { ...values, id: formData.length + 1 }])
    }

    const handleDelete = id => {
        const newData = formData.filter(row => row.id !== id)
        setFormData(newData)
    }

    const handleEdit = id => {
        console.log('Edit row', id)
    }

    const columns = [
        { id: 'sno', label: 'S No', key: 'sno', align: 'left' },
        { id: 'contactName', label: 'Master Admin Name', key: 'contactName', align: 'left' },
        { id: 'email', label: 'Master Admin Email', key: 'email', align: 'left' }
    ]

    const formik = useFormik({
        initialValues: {
            contactName: '',
            number: '',
            email: '',
            password: ''
        },
        formSchema,
        onSubmit: values => {
            console.log('values', values)
        }
    })

    return (
        <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 2 }}>
            {/* Form Section */}
            <MainCard title='Add Master Admin'>
                <FormComponent fields={formFields} onSubmit={handleFormSubmit} formik={formik} />
            </MainCard>

            {/* Table Section */}
            {formData.length > 0 && (
                <MainCard
                    title='Master Admin Details'
                    secondary={
                        <Stack direction='row' spacing={2} alignItems='center'>
                            <CSVExpo
                                data={csvData}
                                filename={`MasterAdminData_${new Date().toISOString().split('T')[0]}.csv`}
                                headers={csvHeaders}
                            />
                            <CustomButton variant='clickable' onClick={handleExcelClick}>
                                Export CSV
                                <IosShare sx={{ marginLeft: '0.2rem', fontSize: '18px', color: 'text.paper' }} />
                            </CustomButton>
                        </Stack>
                    }
                >
                    <DataTable
                        data={formData.map((row, index) => ({ ...row, sno: index + 1 }))}
                        columns={columns}
                        rows={10}
                        addExcelQuery={excelHandler}
                        rowsPerPageOptions={[10, 25, 50]}
                        renderAction={row => (
                            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <IconButton
                                    sx={{ color: 'success.main' }}
                                    size='small'
                                    aria-label='edit row'
                                    onClick={() => handleEdit(row.id)}
                                >
                                    <Tooltip title='Edit'>
                                        <Edit />
                                    </Tooltip>
                                </IconButton>
                                <IconButton
                                    sx={{ color: 'error.main' }}
                                    size='small'
                                    aria-label='delete row'
                                    onClick={() => handleDelete(row.id)}
                                >
                                    <Tooltip title='Delete'>
                                        <Delete />
                                    </Tooltip>
                                </IconButton>
                            </Box>
                        )}
                        headerCellSX={{
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold'
                        }}
                        rowCellSX={{
                            padding: '12px'
                        }}
                    />
                </MainCard>
            )}
        </Box>
    )
}

export default MasterAdminPage
