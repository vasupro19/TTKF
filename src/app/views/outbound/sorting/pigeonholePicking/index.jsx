/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useRef, useState } from 'react'
import { Box, Divider, Typography } from '@mui/material'
import { z } from 'zod'
import ScannableInputForm from '@/core/components/ScannableInputForm'
import MainCard from '@/core/components/extended/MainCard'
import { useDispatch, useSelector } from 'react-redux'
import { openSnackbar } from '@/app/store/slices/snackbar'
import InfoBar from '@/core/components/InfoBar'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import AllInboxOutlinedIcon from '@mui/icons-material/AllInboxOutlined'
import AmazonColorIcon from '@/assets/icons/channel/AmazonColorIcon'
import MyntraColorIcon from '@/assets/icons/channel/MyntraColorIcon'
import ShopifyColorIcon from '@/assets/icons/channel/ShopifyColorIcon'
import flipkartColorIcon from '@/assets/icons/channel/flipkartColorIcon.svg'
import { scanAndValidatePutwallForPicking, scanAndValidateSortBinForPicking } from '@/app/store/slices/api/sortingSlice'

// Constants
const CHANNEL_ICONS = {
    Amazon: <AmazonColorIcon />,
    Myntra: <MyntraColorIcon />,
    Shopify: <ShopifyColorIcon />,
    Flipkart: <img src={flipkartColorIcon} alt='Flipkart' style={{ height: 18, width: 18 }} />
}
// Component for marking a putwall as empty
export default function PigeonholePicking() {
    const putwallIDRef = useRef(null)
    const pickBinRef = useRef(null)
    const dispatch = useDispatch()

    const { scanAndValidatePutwallForPickingLKey, scanAndValidateSortBinForPickingLKey } = useSelector(
        state => state.loading
    )
    const [isVerified, setIsVerified] = useState({
        putwallId: false,
        pickBinId: false
    })

    const [putwallData, setPutwallData] = useState(null)
    const [orderItems, setOrderItems] = useState([])

    // Define the initial form values
    const initialValues = {
        putwallId: '',
        pickBinId: ''
    }

    // Zod schema for validating the putwall ID input
    const validationSchema = z.object({
        putwallId: z
            .string()
            .max(20, { message: 'Putwall ID must be at most 20 characters' })
            .refine(value => value.trim().length > 0, {
                message: 'Putwall ID is required'
            }),
        pickBinId: z.string().optional()
    })

    // Define form fields
    const fields = [
        {
            name: 'putwallId',
            label: 'Scan Putwall ID*',
            placeholder: 'Scan or enter Putwall ID',
            ref: putwallIDRef,
            isVerified: isVerified.putwallId,
            isDisabled: isVerified.putwallId,
            onKeyPress: async (e, formik) => {
                if (e.key === 'Enter' && e.target.value.trim().length > 0) {
                    try {
                        const { data, error: reqError } = await dispatch(
                            scanAndValidatePutwallForPicking.initiate(e.target.value)
                        )

                        if (reqError)
                            throw new Error(
                                reqError?.data?.message || reqError?.message || 'unable to verify putwall id !'
                            )

                        setPutwallData((data?.data && data.data.length && data?.data[0]) || null)
                        setIsVerified(prev => ({ ...prev, putwallId: true }))
                        setTimeout(() => {
                            pickBinRef?.current?.focus()
                        }, 100)

                        dispatch(
                            openSnackbar({
                                open: true,
                                message: data?.message || 'scan pick bin now!',
                                variant: 'alert',
                                alert: { color: 'success', icon: 'success' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                    } catch (error) {
                        dispatch(
                            openSnackbar({
                                open: true,
                                message: error?.message || 'unable to verify putwall id',
                                variant: 'alert',
                                alert: { color: 'error', icon: 'error' },
                                anchorOrigin: { vertical: 'top', horizontal: 'center' }
                            })
                        )
                    }
                    // --- Simulated logic to check putwall status ---
                    // Replace this with your actual API call to get the putwall status
                    // based on the entered putwallId.
                    // const simulatedStatuses = ['Empty', 'In progress', 'Completed']
                    // // Simulate getting a status - replace with your actual logic
                    // const putwallStatus = simulatedStatuses[Math.floor(Math.random() * simulatedStatuses.length)] // Example: Random status

                    // if (putwallStatus === 'Empty' || putwallStatus === 'Inprogress') {
                    //     // Error message if the putwall is in a status that cannot be marked empty
                    //     dispatch(
                    //         openSnackbar({
                    //             open: true,
                    //             message: `Cannot pick Putwall "${e.target.value}". Status is ${putwallStatus}.`,
                    //             variant: 'alert',
                    //             alert: { color: 'error', icon: 'error' },
                    //             anchorOrigin: { vertical: 'top', horizontal: 'center' }
                    //         })
                    //     )
                    //     // formik.setFieldValue('putwallId', '') // clear value
                    //     setTimeout(() => {
                    //         formik.setFieldError(
                    //             'putwallId',
                    //             `Cannot pick this Putwall. Status is ${putwallStatus}.`
                    //         )
                    //     }, 100)
                    // } else {
                    //     setIsVerified(prev => ({ ...prev, putwallId: true }))
                    //     setTimeout(() => {
                    //         pickBinRef?.current?.focus()
                    //     }, 100)
                    // }
                }
            },
            sx: {
                mb: 1.5
            },
            loading: scanAndValidatePutwallForPickingLKey
        },
        {
            name: 'pickBinId',
            label: 'Scan Pick Bin',
            placeholder: 'Scan or enter Pick Bin',
            ref: pickBinRef,
            isDisabled: !isVerified.putwallId
        }
    ]

    /**
     * Handles the form submission.
     * Validates the input and dispatches a snackbar message
     * based on a simulated putwall status check.
     * @param {object} values - The form values ({ putwallId: string }).
     * @param {object} formikHelpers - Formik helper functions.
     */
    const handleSubmit = async (values, { resetForm }) => {
        const { putwallId, pickBinId } = values

        const { data, error: reqError } = await dispatch(
            scanAndValidateSortBinForPicking.initiate({ pId: putwallData.id, bin: pickBinId })
        )
        if (reqError) {
            dispatch(
                openSnackbar({
                    open: true,
                    message: reqError?.data?.message || reqError?.message || 'unable to verify bin',
                    variant: 'alert',
                    alert: { color: 'success' }, // Success color
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
        } else {
            // Success message if the putwall can be marked empty
            // In a real application, you would perform the action (e.g., API call to mark as empty) here
            dispatch(
                openSnackbar({
                    open: true,
                    message: `Putwall "${putwallId}" picked successfully.`,
                    variant: 'alert',
                    alert: { color: 'success' }, // Success color
                    anchorOrigin: { vertical: 'top', horizontal: 'center' }
                })
            )
            setIsVerified({
                putwallId: false,
                pickBinId: false
            })
            setTimeout(() => {
                putwallIDRef.current?.focus()
            }, 100)
            setPutwallData([])
            // Reset form after submission attempt
            resetForm()
        }
    }

    useEffect(() => {
        setTimeout(() => {
            if (putwallIDRef) {
                // Focus on the input when the component mounts for easy scanning/typing
                putwallIDRef.current?.focus()
            }
        }, 100)
    }, []) // Empty dependency array means this runs once on mount

    useEffect(() => {
        if (putwallData) {
            setOrderItems([
                {
                    icon: <ShoppingCartOutlinedIcon />,
                    label: 'Order Id',
                    value: putwallData.order_no
                },
                {
                    icon: <AccountTreeOutlinedIcon />, // Using a placeholder icon for Channel
                    label: 'Channel',
                    value: (
                        <Typography
                            component='span'
                            sx={{
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            {putwallData.channel_code}
                            {CHANNEL_ICONS[putwallData.channel_code]}
                        </Typography>
                    )
                },
                {
                    icon: <AllInboxOutlinedIcon />,
                    label: 'Order Quantity',
                    value: putwallData.sorted_quantity
                }
            ])
        }
    }, [putwallData])

    return (
        <MainCard content={false} sx={{ marginTop: 1, borderRadius: 1 }}>
            {/* Outer Box: Used for centering the content */}
            <Box
                sx={{
                    padding: 2, // Add some padding around the centered content
                    minHeight: '88vh', // Keep min height for vertical centering
                    display: 'flex',
                    flexDirection: 'column',
                    // justifyContent: 'center', // Vertically center the content
                    // alignItems: 'center', // Horizontally center the content
                    border: '1.5px solid',
                    borderColor: 'grey.borderLight', // Keep border style
                    borderRadius: '8px',
                    width: '100%'
                }}
            >
                <InfoBar items={orderItems} />

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center', // Vertically center the content
                        alignItems: 'center', // Horizontally center the content
                        width: '100%'
                    }}
                >
                    <Box sx={{ padding: 2, paddingBottom: 0, textAlign: 'center' }}>
                        <Typography variant='body1' color='textSecondary'>
                            Scan or enter the Putwall ID below to mark it as Picked.
                        </Typography>
                    </Box>
                    {/* Inner Box: Contains the form and has the dashed border */}
                    <Box
                        sx={{
                            width: { lg: '440px', sm: '440px', xs: '360px' },
                            padding: 1, // Increased padding inside the border
                            borderRadius: 2,
                            my: 2,
                            border: '2px solid', // Dashed border style (increased thickness slightly)
                            borderColor: 'grey.300', // Using a neutral grey for the dashed border
                            bgcolor: 'background.paper', // Add a background color
                            boxShadow: 3 // Add a subtle shadow for depth
                        }}
                    >
                        {' '}
                        <Typography variant='h4' gutterBottom>
                            {/* Added gutterBottom for spacing */} Scan Or Enter Putwall ID{' '}
                        </Typography>
                        <Divider sx={{ borderColor: 'primary.main', marginBottom: 1 }} />{' '}
                        {/* Increased bottom margin */}
                        <ScannableInputForm
                            initialValues={initialValues}
                            validationSchema={validationSchema}
                            handleSubmit={handleSubmit}
                            fields={fields}
                            scannerEnabled={false} // Assuming scanning is handled by input focus and external scanner
                            submitButtonText='Pick Items' // More specific button text
                            gridProps={{ container: true }} // Use container for layout
                            showDivider
                            loading={scanAndValidateSortBinForPickingLKey}
                        />
                    </Box>
                    <Typography variant='body1' color='textSecondary'>
                        <Typography component='span' variant='body2' color='error'>
                            Note:
                        </Typography>{' '}
                        Putwalls with "Empty" or "In progress" status cannot be picked.
                    </Typography>
                </Box>
            </Box>
        </MainCard>
    )
}
