/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Cancel, Print } from '@mui/icons-material'
import CerebrumBrain from '@/assets/images/cerebrumBrain.jpg'
// import { DownloadAnimIcon } from '@/assets/icons/DownloadAnimIcon'
import { Box, Divider, Typography, Stack, Button, Tooltip } from '@mui/material'
import { QRCode } from 'react-qrcode-logo'
// import jsPDF from 'jspdf'
import GlobalModal from './GlobalModal'
import CustomButton from '../extended/CustomButton'

export default function QrCodeModalWrapper({
    closeOnBackdropClick = true,
    setIsOpen,
    isOpen,
    disableEscapeKeyDown = false,
    boxContainerSx = {},
    showCancelButton = true,
    children,
    title = '',
    onClose,
    id = '', // ID to be encoded in the QR code
    logoUrl = CerebrumBrain, // Optional logo for the QR code
    companyName = 'Company' // Company name for PDF header
}) {
    const [isLoading, setIsLoading] = useState(false)

    // QR code configuration
    const qrCodeValue = useMemo(
        () =>
            // You can customize what data to encode in the QR code
            // For example, it could be a URL with the ID as a parameter
            id || '',
        [id]
    )

    // Use useMemo to optimize the box styling
    const boxStyles = useMemo(
        () => ({
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90wh',
            maxHeight: '70vh',
            backgroundColor: '#fff',
            boxShadow: 24,
            p: 1,
            borderRadius: '8px',
            outline: 'none',
            overflowY: { sm: 'hidden', xs: 'auto' },
            overflowX: 'hidden',
            ...boxContainerSx
        }),
        [boxContainerSx]
    )

    // Use useMemo for cancel button styles
    const cancelButtonStyles = useMemo(
        () => ({
            mt: 2,
            position: 'absolute',
            top: '-20px',
            right: '-14px',
            '&:hover': {
                backgroundColor: 'transparent',
                boxShadow: 'none'
            },
            '&:focus': {
                backgroundColor: 'transparent',
                boxShadow: 'none'
            }
        }),
        []
    )

    // Handler for downloading the QR code as PDF
    // const handleDownload = () => {
    //     if (!id) return

    //     setIsLoading(true)

    //     try {
    //         // Create a new PDF document
    //         // eslint-disable-next-line new-cap
    //         const doc = new jsPDF({
    //             orientation: 'portrait',
    //             unit: 'mm',
    //             format: 'a4'
    //         })

    //         // Add company header
    //         doc.setFontSize(16)
    //         doc.text(companyName, 105, 20, { align: 'center' })

    //         // Add ID information
    //         doc.setFontSize(12)
    //         doc.text(`ID: ${id}`, 105, 30, { align: 'center' })

    //         // Get the QR code canvas
    //         const qrCodeElement = document.getElementById('qr-code-element')

    //         if (qrCodeElement) {
    //             // Convert canvas to image data
    //             const qrCodeImage = qrCodeElement.toDataURL('image/png')

    //             // Add QR code to PDF
    //             doc.addImage(qrCodeImage, 'PNG', 65, 40, 80, 80)

    //             // Add verification instructions
    //             doc.setFontSize(10)
    //             doc.text('Scan this QR code to verify authenticity', 105, 130, { align: 'center' })

    //             // Save the PDF
    //             doc.save(`QR-Code-${id}.pdf`)
    //         }
    //     } catch (error) {
    //         console.error('Error generating PDF:', error)
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    // Handler for printing the QR code
    const handlePrint = () => {
        if (!id) return

        setIsLoading(true)

        try {
            // Create a new window for printing
            const printWindow = window.open('', '_blank')

            // Get the QR code canvas
            const qrCodeElement = document.getElementById('qr-code-element')

            if (qrCodeElement && printWindow) {
                // Convert canvas to image data
                const qrCodeImage = qrCodeElement.toDataURL('image/png')

                // Create print content
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>QR Code - ${id}</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    padding: 20px;
                                }
                                .container {
                                    max-width: 500px;
                                    margin: 0 auto;
                                }
                                img {
                                    max-width: 250px;
                                    margin: 20px 0;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <p>ID: ${id}</p>
                                <img src="${qrCodeImage}" alt="QR Code" />
                                <p>Scan this QR code to verify authenticity</p>
                            </div>
                            <script>
                                window.onload = function() {
                                    setTimeout(function() {
                                        window.print();
                                        window.close();
                                    }, 500);
                                };
                            </script>
                        </body>
                    </html>
                `)

                printWindow.document.close()
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error printing QR code:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <GlobalModal
            closeOnBackdropClick={closeOnBackdropClick}
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            disableEscapeKeyDown={disableEscapeKeyDown}
            onClose={onClose}
        >
            <Box sx={boxStyles}>
                {title && (
                    <>
                        <Typography variant='h4'>{title}</Typography>
                        <Divider sx={{ borderColor: 'primary.main', marginBottom: 2 }} />
                    </>
                )}

                {showCancelButton && (
                    <CustomButton
                        onClick={() => {
                            setIsOpen(false)
                            onClose?.()
                        }}
                        customStyles={cancelButtonStyles}
                        variant='text'
                        disableRipple
                        tooltip='Close'
                        showTooltip
                        type='button'
                    >
                        <Cancel />
                    </CustomButton>
                )}

                {/* QR Code Display */}
                {id && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                        <Typography variant='body1' gutterBottom>
                            Scan this QR code to verify ID: {id}
                        </Typography>

                        <Box sx={{ my: 2 }}>
                            <QRCode
                                id='qr-code-element'
                                value={qrCodeValue}
                                size={200}
                                logoImage={logoUrl || undefined}
                                logoWidth={logoUrl ? 40 : 0}
                                logoHeight={logoUrl ? 40 : 0}
                                qrStyle='dots'
                                ecLevel='H'
                            />
                        </Box>

                        <Stack direction='row' spacing={2} sx={{ mt: 2 }}>
                            {/* <Tooltip title='Download as PDF'>
                             <CustomButton
                                    variant='clickable'
                                    color='primary'
                                    startIcon={<DownloadAnimIcon />}
                                    shouldAnimate
                                    onClick={handleDownload}
                                    disabled={isLoading || !id}
                                >
                                    Download
                                </CustomButton>
                            </Tooltip> */}

                            <Tooltip title='Print QR Code'>
                                <Button
                                    variant='outlined'
                                    color='primary'
                                    startIcon={<Print />}
                                    onClick={handlePrint}
                                    disabled={isLoading || !id}
                                >
                                    Print
                                </Button>
                            </Tooltip>
                        </Stack>
                    </Box>
                )}

                {children}
            </Box>
        </GlobalModal>
    )
}

// Define PropTypes for type checking
QrCodeModalWrapper.propTypes = {
    closeOnBackdropClick: PropTypes.bool,
    setIsOpen: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
    disableEscapeKeyDown: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    boxContainerSx: PropTypes.object,
    showCancelButton: PropTypes.bool,
    children: PropTypes.node,
    title: PropTypes.string,
    onClose: PropTypes.func,
    id: PropTypes.string,
    logoUrl: PropTypes.string,
    companyName: PropTypes.string
}
