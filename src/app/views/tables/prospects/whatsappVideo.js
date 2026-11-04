/**
 * Sending the demo video itself to an agency on WhatsApp.
 *
 * A wa.me link can only carry text. Where the browser can share files (phones, Safari and Chrome on a Mac, Edge and
 * Chrome on Windows), the screen hands the video file and the message to the system's share sheet instead: pick
 * WhatsApp, then the agency, and it goes as a video with the message under it. Elsewhere the message goes through
 * wa.me as before, with the video page's link in it, and WhatsApp shows the preview picture.
 *
 * Sharing must happen inside the click, so the video is fetched ahead of time (prefetchVideo) and kept for the visit.
 */

let cache = { url: '', file: null, loading: null }

/** @description true when this browser can share a video file (through navigator.share) */
export const canShareVideo = () => {
    try {
        if (
            typeof navigator === 'undefined' ||
            typeof navigator.canShare !== 'function' ||
            typeof File === 'undefined'
        ) {
            return false
        }
        return navigator.canShare({ files: [new File([new Blob(['x'])], 'demo.mp4', { type: 'video/mp4' })] })
    } catch (error) {
        return false
    }
}

const fileName = name => {
    const clean = String(name || 'Travelytics demo')
        .replace(/[^\w .()-]+/g, '')
        .trim()
    return /\.(mp4|mov|webm)$/i.test(clean) ? clean : `${clean || 'Travelytics demo'}.mp4`
}

/** @description fetches the video once and keeps it as a File, ready to share; resolves to the File or null */
export const prefetchVideo = (url, name) => {
    if (!url) return Promise.resolve(null)
    if (cache.url === url && (cache.file || cache.loading))
        return cache.file ? Promise.resolve(cache.file) : cache.loading
    const loading = fetch(url)
        .then(response => (response.ok ? response.blob() : null))
        .then(blob => {
            if (!blob || cache.url !== url) return null
            cache.file = new File([blob], fileName(name), { type: blob.type || 'video/mp4' })
            return cache.file
        })
        .catch(() => null)
        .finally(() => {
            if (cache.url === url) cache.loading = null
        })
    cache = { url, file: null, loading }
    return loading
}

/** @description the video when it has arrived, else null */
export const readyVideo = url => (cache.url === url ? cache.file : null)

/** @description the message inside a wa.me link */
export const messageOf = whatsappUrl => {
    try {
        return new URL(whatsappUrl).searchParams.get('text') || ''
    } catch (error) {
        return ''
    }
}

/**
 * @description shares the video and the message (call it straight from a click). Also copies the message, since some
 * phones drop the text when a video is shared.
 * @returns {Promise<'shared' | 'cancelled' | 'failed'>}
 */
export const shareVideo = async (file, text) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {})
    try {
        await navigator.share({ files: [file], text })
        return 'shared'
    } catch (error) {
        return error?.name === 'AbortError' ? 'cancelled' : 'failed'
    }
}

/**
 * @description WhatsApp for one agency, from a click: the video and the message through the share sheet when the video
 * is ready and the browser can share it (`withVideo`), else wa.me with the message (and the video page's link in it)
 * @returns {Promise<'shared' | 'opened' | 'cancelled' | 'failed'>}
 */
export const sendOnWhatsapp = async ({ whatsappUrl, video, withVideo = true }) => {
    const file = withVideo && video?.url && canShareVideo() ? readyVideo(video.url) : null
    if (file) return shareVideo(file, messageOf(whatsappUrl))
    // ? opened in the click itself, or the browser blocks the new tab
    window.open(whatsappUrl, '_blank', 'noopener')
    return 'opened'
}
