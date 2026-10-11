import { useCallback, useEffect, useMemo, useState } from 'react'
import { useGetCampaignsQuery } from '@/app/store/slices/api/campaignSlice'
import { CAMPAIGN_EVENT, campaignIdFromPath, readRememberedCampaign, rememberCampaign } from './navModel'

const CAMPAIGNS_QUERY = '?length=200'

/**
 * @description the campaign the sidebar's Destinations / Itineraries / Packages open, remembered per agency;
 * set by the picker, by opening any of those pages for a campaign, or by the campaign table's row actions
 * @param {object} user state.auth.user
 * @param {boolean} enabled the user has the Campaigns screen
 * @param {string} pathname the current address
 */
export default function useCampaignChoice(user, enabled, pathname) {
    const [chosen, setChosen] = useState(() => (enabled ? readRememberedCampaign(user) : null))
    const { data, isSuccess, isFetching } = useGetCampaignsQuery(CAMPAIGNS_QUERY, { skip: !enabled })

    const campaigns = useMemo(
        () =>
            (Array.isArray(data?.data) ? data.data : [])
                .filter(campaign => campaign && campaign.id !== undefined && campaign.id !== null)
                .map(campaign => ({ id: String(campaign.id), title: campaign.title || `Campaign ${campaign.id}` })),
        [data]
    )

    // ? another agency signed in on this browser, or Campaigns became available: read again
    useEffect(() => {
        setChosen(enabled ? readRememberedCampaign(user) : null)
    }, [enabled, user?.clientId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const onChange = event => setChosen(event.detail || null)
        window.addEventListener(CAMPAIGN_EVENT, onChange)
        return () => window.removeEventListener(CAMPAIGN_EVENT, onChange)
    }, [])

    const choose = useCallback(campaign => setChosen(rememberCampaign(user, campaign)), [user])

    // ? opening a campaign's list makes it the chosen one
    const routeCampaignId = campaignIdFromPath(pathname)
    useEffect(() => {
        if (!enabled || !routeCampaignId || routeCampaignId === chosen?.id) return
        const known = campaigns.find(campaign => campaign.id === routeCampaignId)
        choose({ id: routeCampaignId, title: known?.title || '' })
    }, [enabled, routeCampaignId]) // eslint-disable-line react-hooks/exhaustive-deps

    // ? keep the remembered title current; forget a campaign that is gone (deleted, or not this agency's)
    useEffect(() => {
        if (!enabled || !isSuccess || isFetching || !chosen) return
        const known = campaigns.find(campaign => campaign.id === chosen.id)
        if (known && known.title !== chosen.title) choose(known)
        else if (!known && campaigns.length < 200 && chosen.id !== routeCampaignId) choose(null)
    }, [enabled, isSuccess, isFetching, campaigns]) // eslint-disable-line react-hooks/exhaustive-deps

    const current = chosen
        ? { id: chosen.id, title: campaigns.find(c => c.id === chosen.id)?.title || chosen.title || `#${chosen.id}` }
        : null

    return { campaigns, loaded: isSuccess, chosen: current, choose }
}
