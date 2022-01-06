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
  zoom: number
  addresses: string[]
}

const simpleMarkerSymbolOrigin = {
    type: "simple-marker",
    style: "square",
    color: [0, 0, 128], //navy blue
    size: "12px"
};

const Geocode: React.VFC<GeocodeProps> = ({centerX, centerY, zoom, addresses }) =>{

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
                zoom: zoom
            });

            for (const addressName of addresses){
              const params = {
                  address: {
                    "address": addressName
                  }
              }

              locator.addressToLocations(geocodeUrl, params).then((results) => {
                  console.log("longitude = ", results[0].location.longitude, 
                  " latitude = ", results[0].location.latitude)
                  showResult(results);
              });
            }           

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
                        title: "{addressName}",
                        content: result.address + "<br><br>longitude:" + result.location.longitude + "-latitude:" + result.location.latitude
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
        [centerX, centerY, zoom, addresses]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;

}

export default Geocode