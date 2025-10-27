import { useEffect } from 'react'
import { useGetPostsQuery } from '@app/store/slices/api/postsSlice'
import { useDispatch } from '@app/store'
import { openSnackbar } from '@app/store/slices/snackbar'
import Box from '@mui/material/Box'
import { Divider, Typography } from '@mui/material'

function Posts() {
    const dispatch = useDispatch()
    const { data: posts, isLoading } = useGetPostsQuery()

    useEffect(() => {
        if (!isLoading && posts.length)
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'post refreshed!',
                    variant: 'alert',
                    anchorOrigin: { vertical: 'top', horizontal: 'right' },
                    alert: {
                        color: 'success'
                    },
                    transition: 'SlideLeft',
                    close: true
                })
            )

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts, isLoading])

    return (
        <Box sx={{ m: 4 }}>
            <Typography variant='h4'>Posts</Typography>
            {posts &&
                posts.map(post => (
                    <Box key={post.id} sx={{ mx: 2, my: 4 }}>
                        <Typography variant='h4'>{post.title}</Typography>
                        <Divider />
                        <Typography variant='p'>{post.body}</Typography>
                        <Divider />
                    </Box>
                ))}
        </Box>
    )
}

export default Posts
