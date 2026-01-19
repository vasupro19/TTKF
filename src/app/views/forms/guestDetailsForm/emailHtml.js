/**
 * Generates the full HTML content for the guest itinerary email.
 * @param {Array} selectedPackage - The array of daily itinerary items.
 * @param {Array} stayBreakdown - The array calculated by calculateStayBreakdown.
 * @returns {string} The HTML content ready for email body.
 */
const generateItineraryEmailHtml = (selectedPackage, stayBreakdown) => {
    // --- 1. Calculate Summary ---
    const totalNights = stayBreakdown.reduce((sum, stay) => sum + stay.nights, 0)
    const totalDays = selectedPackage.length

    // --- 2. Build Stay Breakdown Chips ---
    const breakdownChips = stayBreakdown
        .map(
            stay => `
        <span style="display: inline-block; padding: 4px 12px; margin-right: 8px; margin-bottom: 8px; border-radius: 20px; background: #E8F0FE; color: #1A73E8; font-weight: 600; font-size: 14px;">
            ${stay.destination}: ${stay.nights} Night${stay.nights > 1 ? 's' : ''}
        </span>
    `
        )
        .join('')

    // --- 3. Build Day-by-Day Itinerary ---
    const itineraryDaysHtml = selectedPackage
        .map((item, index) => {
            const destinationName = (item?.destination || '').toUpperCase()

            // Conditional logic for Hotel section (Matching your JSX logic)
            // Check if destination is NOT overnight/fresh up/day journey
            const showHotels =
                destinationName !== 'OVERNIGHT JOURNEY' &&
                destinationName !== 'FRESH UP' &&
                destinationName !== 'DAY JOURNEY'

            const hotelSection = showHotels
                ? `
            <h5 style="margin: 20px 0 8px 0; font-size: 16px; color: #333333;">Recommended Hotels (for ${item.destination} stay)</h5>
            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                    ${item.hotels?.deluxe ? `<td style="width: 25%; padding: 8px; border: 1px solid #d0ddff; background-color: #f1f5ff; text-align: center;"><strong>Deluxe</strong><br><span style="font-size: 12px; color: #1a73e8; word-break: break-word;">${item.hotels.deluxe}</span></td>` : ''}
                    ${item.hotels?.superDeluxe ? `<td style="width: 25%; padding: 8px; border: 1px solid #d0ddff; background-color: #f1f5ff; text-align: center;"><strong>Super Deluxe</strong><br><span style="font-size: 12px; color: #1a73e8; word-break: break-word;">${item.hotels.superDeluxe}</span></td>` : ''}
                    ${item.hotels?.premium ? `<td style="width: 25%; padding: 8px; border: 1px solid #d0ddff; background-color: #f1f5ff; text-align: center;"><strong>Premium</strong><br><span style="font-size: 12px; color: #1a73e8; word-break: break-word;">${item.hotels.premium}</span></td>` : ''}
                    ${item.hotels?.luxury ? `<td style="width: 25%; padding: 8px; border: 1px solid #d0ddff; background-color: #f1f5ff; text-align: center;"><strong>Luxury</strong><br><span style="font-size: 12px; color: #1a73e8; word-break: break-word;">${item.hotels.luxury}</span></td>` : ''}
                </tr>
            </table>
        `
                : ''

            return `
            <div style="margin-bottom: 30px; border: 1px solid #e3e7ef; border-radius: 12px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                        <td style="width: 100px; vertical-align: top; text-align: center;">
                            <div style="width: 60px; height: 60px; border-radius: 50%; background: #1a73e8; color: #fff; font-size: 18px; line-height: 60px; font-weight: 700; display: inline-block;">
                                Day ${index + 1}
                            </div>
                        </td>
                        <td style="padding-left: 20px;">
                            <h3 style="margin: 0; font-size: 24px; color: #1d1d1d;">${item?.title || 'Itinerary Title'}</h3>
                            <p style="margin: 8px 0 12px 0; font-size: 15px; color: #444;">
                                ${item?.description || 'No description provided.'}
                            </p>
                            
                            <span style="display: inline-block; padding: 6px 15px; background: #e8f0fe; color: #1a73e8; border-radius: 30px; font-weight: 600; font-size: 14px;">
                                Destination: ${item?.destination || 'N/A'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding-top: 20px;">
                            ${item.image ? `<img src="${item.image}" alt="Destination Image" width="100%" style="max-width: 500px; height: auto; border-radius: 10px; object-fit: cover;">` : ''}
                            ${hotelSection}
                        </td>
                    </tr>
                </table>
            </div>
        `
        })
        .join('')

    // --- 4. Assemble Final HTML Structure ---
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Custom Tour Itinerary</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0;">
            <center>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; padding: 20px;">
                    
                    <tr>
                        <td align="center" style="padding-bottom: 20px; border-bottom: 2px solid #1a73e8;">
                            <h1 style="color: #1a73e8; margin: 0; font-size: 28px;">Your Tour Itinerary (${totalDays} Days)</h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding-top: 20px; padding-bottom: 30px;">
                            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 12px; padding: 15px;">
                                <h3 style="color: #1a73e8; margin: 0 0 10px 0; font-size: 20px;">Total Stays: ${totalNights} Nights</h3>
                                <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">Breakdown of hotel stays:</p>
                                ${breakdownChips}
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td>
                            ${itineraryDaysHtml}
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding-top: 30px; border-top: 1px solid #e3e7ef;">
                            <p style="font-size: 12px; color: #888;">Thank you for choosing us for your travel plans.</p>
                        </td>
                    </tr>
                </table>
            </center>
        </body>
        </html>
    `
}
module.exports = {
    generateItineraryEmailHtml
}
