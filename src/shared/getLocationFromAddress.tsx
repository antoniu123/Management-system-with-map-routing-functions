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

    let rezX: number
    let rezY: number

    return await locator.addressToLocations(geocodeUrl, params)
        .then((results) => {
            rezX = results[0].location.longitude
            rezY = results[0].location.latitude
            return Promise.resolve([rezX, rezY])
        })
        .catch((err) => {
            console.error(err)
            return Promise.resolve([0, 0])
        })
}