import esriConfig from "@arcgis/core/config.js"
import * as locator from "@arcgis/core/rest/locator";

export const getLocationFromAddress =  async (address: string): Promise<number[]> => {

    esriConfig.apiKey = process.env.REACT_APP_API_KEY ?? ''
    const geocodeUrl = process.env.REACT_APP_ARGIS_GEOCODING_URL ?? ""

    const params = {
        address: {
            "address": address
        }
    }

    return await locator.addressToLocations(geocodeUrl, params)
        .then((results) => {
            return [results[0].location.longitude, results[0].location.latitude]
        })
        .catch((err) => {
            console.error(err)
            return [0, 0]
        })
}