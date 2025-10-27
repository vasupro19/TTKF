/* eslint-disable camelcase */
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { getCountry, getStatesByCountry, getCityByStateId } from '@/app/store/slices/api/geoSlice'
import { getDataFromPinCode } from '@/app/store/slices/api/vendorSlice'

// eslint-disable-next-line import/prefer-default-export
export const useGeoData = () => {
    const dispatch = useDispatch()
    const [countries, setCountries] = useState([])
    const [billingGeo, setBillingGeo] = useState({
        states: [],
        cities: [],
        pinId: ''
    })
    const [shippingGeo, setShippingGeo] = useState({
        states: [],
        cities: [],
        pinId: ''
    })

    const fetchCountries = async () => {
        const { data } = await dispatch(getCountry.initiate('?start=0&length=300'))
        if (data?.data) {
            setCountries(
                data.data.map(({ country_name, id }) => ({
                    label: country_name,
                    value: id
                }))
            )
        }
    }

    const fetchStates = async (countryId, isBilling = true) => {
        const { data } = await dispatch(getStatesByCountry.initiate(countryId))
        if (data?.data) {
            const states = data.data.map(({ state_name, id }) => ({
                label: state_name,
                value: id
            }))
            // eslint-disable-next-line no-unused-expressions
            isBilling ? setBillingGeo(prev => ({ ...prev, states })) : setShippingGeo(prev => ({ ...prev, states }))
        }
    }

    const fetchCities = async (stateId, isBilling = true) => {
        const { data } = await dispatch(getCityByStateId.initiate(stateId))
        if (data?.data) {
            const cities = data.data.map(({ city_name, id }) => ({
                label: city_name,
                value: id
            }))
            // eslint-disable-next-line no-unused-expressions
            isBilling ? setBillingGeo(prev => ({ ...prev, cities })) : setShippingGeo(prev => ({ ...prev, cities }))
        }
    }

    const handlePincodeData = async (pinCode, isBilling = true) => {
        if (!pinCode || pinCode.length !== 6) return null

        const { data } = await dispatch(getDataFromPinCode.initiate(pinCode))
        if (data?.data?.[0]) {
            const { country_id, country_name, state_id, state_name, city_id, city_name, pincode_id } = data.data[0]

            const geoUpdate = {
                states: [{ label: state_name, value: state_id }],
                cities: [{ label: city_name, value: city_id }],
                pinId: pincode_id.toString()
            }

            // eslint-disable-next-line no-unused-expressions
            isBilling
                ? setBillingGeo(prev => ({ ...prev, ...geoUpdate }))
                : setShippingGeo(prev => ({ ...prev, ...geoUpdate }))

            return {
                country: { label: country_name, value: country_id },
                state: { label: state_name, value: state_id },
                city: { label: city_name, value: city_id }
            }
        }
        return null
    }

    return {
        countries,
        billingGeo,
        shippingGeo,
        fetchCountries,
        fetchStates,
        fetchCities,
        handlePincodeData
    }
}
