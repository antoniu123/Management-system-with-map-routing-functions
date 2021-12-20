import esriConfig from "@arcgis/core/config.js"
import * as locator from "@arcgis/core/rest/locator";

export const getLocationFromAddress =  (address: string) : [number, number] => {

    esriConfig.apiKey = process.env.REACT_APP_API_KEY ?? ''
    const geocodeUrl = process.env.REACT_APP_ARGIS_GEOCODING_URL ?? ""

    const params = {
        address: {
            "address": address
        }
    }

    let rezX : number = 0
    let rezY : number = 0

    locator.addressToLocations(geocodeUrl, params).then((results) => {
        rezX = results[0].location.longitude
        rezY = results[0].location.latitude
    }).catch((err)=> console.error(err));

  return [rezX ,rezY]
}