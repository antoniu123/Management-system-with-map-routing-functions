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
            if (results.length >0 && results[0].location && results[0].location.longitude && results[0].location.longitude){
                if (Number(results[0].location.longitude) < -19 || Number(results[0].location.longitude) > 42) {
                    console.error('Out of Europe at longitude')
                    return [0, 0]
                }
                if (Number(results[0].location.latitude) < 36 || Number(results[0].location.latitude) > 70) {
                    console.error('Out of Europe at latitude')
                    return [0, 0]
                }
                return [results[0].location.longitude, results[0].location.latitude]
            }
            return [0, 0]
        })
        .catch((err) => {
            console.error(err)
            return [0, 0]
        })
}