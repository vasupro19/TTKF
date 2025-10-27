/* eslint-disable */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import {
    Box,
    Grid,
    Divider,
    TextField,
    Typography,
    Chip,
    TableContainer,
    Table,
    TableBody,
    TableRow,
    TableCell
} from '@mui/material'

// ** import core components
import FormComponent from '@core/components/forms/FormComponent'
import MainCard from '@core/components/extended/MainCard'
import MyTabs from '@core/components/CapsuleTabs'
import IdentityCard from '@core/components/IdentityCard'
import InboundPutAwayDetails from '@/app/views/tables/inboundPutAwayDetails'

// ** import from redux
import { useDispatch } from 'react-redux'
import { openSnackbar } from '@app/store/slices/snackbar'
import { CheckCircle, Description, Extension, Info, Inventory, Warning } from '@mui/icons-material'
import IdCardContainer from '@/core/components/IdCardContainer'
import ManageCreateJobsTable from '@/app/views/tables/ManageCreateJobs'
import ManageJobsCreateBinForm from '@/app/views/forms/putAway/ManageJobsCreateBinForm'
import ManageJobsCreatePieceForm from '@/app/views/forms/putAway/ManageJobsCreatePieceForm'

const tabsFields = [
    {
        label: 'Bin',
        icon: <Inventory />,
        disabled: false // You can set it to true if you want to disable a tab
    },
    {
        label: 'Piece',
        icon: <Extension />,
        disabled: false // You can set it to true if you want to disable a tab
    }
]

function Index() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(0)
    const [userName, setUserName] = useState(null)

    // Simplify tab change handling without validation
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue)
    }

    const data = [
        { label: 'Put Away No', value: 'PT001' },
        { label: 'GRN Number', value: 'GRN001' },
        { label: 'GRN Number', value: 'GRN001' },
        { label: 'GRN Number', value: 'GRN001' },
        { label: 'GRN Number', value: 'GRN001' }

        // Add more fields as needed
    ]

    // Sample log info data (for Tab 2)
    const logInfoData = [
        { label: 'Company', value: 'ABC Corp' },
        { label: 'Put Away Status', value: 'Completed' }
    ]

    const customSx = {
        '& input': {
            backgroundColor: '#fff',
            padding: '10px 6px',
            height: '20px' // Decrease input height
        },
        '& .MuiInputBase-root.MuiOutlinedInput-root': {
            backgroundColor: 'white' // Apply the white background to the root element
        },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'gray' // Optional: change border color if needed
        },
        flexGrow: 1
    }

    // Example data for display
    const rows = [
        { label: 'User Name', text: 'John Doe' },
        { label: 'Bin Count', text: '1' },
        { label: 'Assigned Qty', text: '30' },
        { label: 'Pending Qty', text: '' }
    ]

    const initialBinFormValues = {
        user: userName,
        bin: null,
        location: null
    }
    const initialPieceFormValues = {
        user: userName,
        location: null,
        itemIds: ''
    }

    return (
        <MainCard sx={{ py: '1px' }} contentSX={{ px: '2px', py: 1.5 }}>
            <Grid
                container
                gap={4}
                sx={{
                    border: '1px solid',
                    borderColor: 'grey.borderLight',
                    px: 1,
                    py: 1,
                    borderRadius: '8px'
                }}
            >
                <Grid container xs={12} md={3.6} spacing={2}>
                    <Grid item xs={12} md={6} lg={12} sx={{ marginBottom: 2 }}>
                        <IdCardContainer>
                            {/* {(GRNBinId || mode == 'Job') && !isModalOpen ? (
                                <> */}
                            <Typography variant='h5' sx={{ wordBreak: 'break-word', fontWeight: 'bold' }}>
                                Job Details (Job-1929)
                            </Typography>
                            <Divider sx={{ borderColor: 'primary.main', marginTop: 0.5 }} />

                            <TableContainer>
                                <Table size='small' aria-label='compact details table'>
                                    <TableBody>
                                        {rows.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell
                                                    sx={{
                                                        padding: '4px',
                                                        fontWeight: 'bold',
                                                        borderBottom: 'none'
                                                    }}
                                                >
                                                    {row.label}
                                                </TableCell>
                                                <TableCell sx={{ padding: '4px', borderBottom: 'none' }}>
                                                    {row.text || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {/* </>
                            ) : (
                                <Typography variant='caption' textAlign='center' width='100%'>
                                    No Data
                                </Typography>
                            )} */}
                        </IdCardContainer>
                    </Grid>
                </Grid>
                <Grid md={8.3} container spacing={1} sx={{ px: '4px' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
                        <MyTabs activeTab={activeTab} handleTabChange={handleTabChange} tabsFields={tabsFields} />

                        <Box sx={{ padding: 1, paddingTop: 1 }}>
                            <Grid container spacing={2}>
                                {/* Conditionally render General Info or Log Info based on activeTab */}
                                {activeTab === 0
                                    ? (<ManageJobsCreateBinForm initialValues={initialBinFormValues} setUserName={setUserName}/>)
                                    : (<ManageJobsCreatePieceForm initialValues={initialPieceFormValues} setUserName={setUserName} />)}
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} lg={12}>
                    <Divider
                        sx={{
                            marginTop: '-2rem',
                            borderColor: '#BCC1CA',
                            marginBottom: '1rem',
                            boxShadow: '1px 1px 4px #00000054'
                        }}
                    />
                    <ManageCreateJobsTable />
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Index
