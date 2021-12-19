import React, { useEffect, useRef } from 'react'
import esriConfig from "@arcgis/core/config.js"
import MapView from "@arcgis/core/views/MapView"
import ArcGISMap from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import AddressCandidate from "@arcgis/core/rest/support/AddressCandidate";
import * as locator from "@arcgis/core/rest/locator"

interface GeocodeProps{
  centerX: number
  centerY: number
  address: string
  city?: string
}

const simpleMarkerSymbolOrigin = {
    type: "simple-marker",
    color: [0, 255, 0],  // Green
    outline: {
        color: [255, 255, 255], // White
        width: 1
    }
};

const Geocode: React.VFC<GeocodeProps> = ({centerX, centerY, address, city}) =>{

   // create a ref to element to be used as the map's container
    const mapEl = useRef(null);

    // use a side effect to create the map after react has rendered the DOM
    useEffect(
        () => {
            // define the view here so it can be referenced in the clean up function
            let view: MapView | undefined;

            esriConfig.apiKey = process.env.REACT_APP_API_KEY ?? ''

            const geocodeUrl = process.env.REACT_APP_ARGIS_GEOCODING_URL ?? ""

            const map = new ArcGISMap({
                basemap: "arcgis-navigation"
            });
          
            view = new MapView({
                container: mapEl.current ? mapEl.current : '',
                map: map,
                center: [centerX,centerY],
                zoom: 12
            });

            const params = {
                address: {
                  "address": address
                }
            }

            locator.addressToLocations(geocodeUrl, params).then((results) => {
                console.log("longitude = ", results[0].location.longitude.toFixed(5), 
                " latitude = ", results[0].location.latitude.toFixed(5))
                showResult(results);
            });

            function showResult(results:AddressCandidate[]) {
                if (view && results.length) {
                  const result = results[0];
                  console.log(result.address)
                  view.graphics.add(new Graphic({
                      symbol: simpleMarkerSymbolOrigin,
                      geometry: result.location,
                      attributes: {
                        title: "Address",
                        address: result.address,
                        score: result.score
                      },
                      popupTemplate: {
                        title: "{title}",
                        content: result.address + "<br><br>" + result.location.longitude.toFixed(5) + "," + result.location.latitude.toFixed(5)
                      }
                    }
                  ));
                  if (results.length) {
                    const g = view.graphics.getItemAt(0);
                    view.popup.open({
                      features: [g],
                      location: g.geometry
                    });
                  }
                  view.goTo({
                    target: result.location,
                    zoom: 13
                  });
                }
            }
            
            return () => {
                // clean up the map view
                if (!!view) {
                    view.destroy();
                    view = undefined;
                }
            };
        },
        // only re-load the map if the id has changed
        [centerX, centerY, address, city]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;

}

export default Geocode