import esriConfig from "@arcgis/core/config.js"
import { LocationPoint } from "../model/LocationPoint";
import * as route from "@arcgis/core/rest/route"
import RouteParameters from "@arcgis/core/rest/support/RouteParameters";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";

export const getDistanceBetweenPoints =  async (start: LocationPoint, stop: LocationPoint): Promise<number> => {

   
    esriConfig.apiKey = process.env.REACT_APP_API_KEY ?? ''
    const routeUrl = process.env.REACT_APP_ARGIS_URL ?? ""


    const routeParams = new RouteParameters({
        stops: new FeatureSet({
            features: [
                new Graphic({
                  geometry: new Point({
                    x: start.x,
                    y: start.y
                  })
                }),
                new Graphic({
                  geometry: new Point({
                    x: stop.x,
                    y: stop.y
                  })
                })
            ]
        }),
        returnDirections: true,
        directionsLanguage: "ro",
        directionsLengthUnits: "kilometers"
    });

    return await route.solve(routeUrl, routeParams)
        .then(function(data:any) {
            if (data.routeResults.length > 0) {
                return data.routeResults[0].directions.totalLength.toFixed(3)
            }

        }).catch(function(error:any){
            console.log(error);
            return 0;
        })
}