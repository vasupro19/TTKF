/* eslint-disable */
import { useDispatch } from '@app/store';
import { openSnackbar } from '@app/store/slices/snackbar';
import { Button, Stack } from '@mui/material';

function ProcessToasters() {
    const dispatch = useDispatch();

    const showToaster = (message, color, icon, transition = 'SlideUp') => {
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: { color, icon },
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, // Updated position
                transition,
            })
        );
    };

    return (
        <Stack direction="row" spacing={2}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => showToaster('Upload started: File1.pdf', 'info', 'info', 'SlideLeft')}
            >
                Upload Started
            </Button>
            <Button
                variant="contained"
                color="success"
                onClick={() => showToaster('Upload successful: File1.pdf', 'success', 'info', 'SlideLeft')}
            >
                Upload Successful
            </Button>
            <Button
                variant="contained"
                color="error"
                onClick={() => showToaster('Upload failed: File1.pdf', 'error', 'error', 'SlideLeft')}
            >
                Upload Failed
            </Button>
            <Button
                variant="contained"
                color="primary"
                onClick={() => showToaster('Download started: Report.zip', 'info', 'info', 'SlideLeft')}
            >
                Download Started
            </Button>
            <Button
                variant="contained"
                color="success"
                onClick={() => showToaster('Download successful: Report.zip', 'success', 'info', 'SlideLeft')}
            >
                Download Successful
            </Button>
        </Stack>
    );
}

export default ProcessToasters;
