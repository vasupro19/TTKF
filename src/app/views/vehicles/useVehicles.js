import { useMemo } from 'react'
import { useGetVehiclesQuery } from '@/app/store/slices/api/vehicleSlice'
import { vehicleLists } from './vehicleFacts'

const NONE = []

/**
 * The vehicles the forms offer: the agency's own list, or the built-in one until the server has it. The list is fetched once and
 * shared by every form that asks for it.
 * @returns {{ ready: boolean, names: string[], choices: { value: string, label: string }[] }}
 */
export default function useVehicles() {
    const { data } = useGetVehiclesQuery()
    const list = Array.isArray(data?.data) ? data.data : NONE
    const ready = data?.summary?.ready === true
    return useMemo(() => vehicleLists(list, ready), [list, ready])
}
