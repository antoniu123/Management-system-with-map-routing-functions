import React, {useEffect, useRef} from "react";
import ArcGISMap from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import esriConfig from "@arcgis/core/config.js";
import MapView from "@arcgis/core/views/MapView";
import RouteParameters from "@arcgis/core/rest/support/RouteParameters";
import FeatureSet from "@arcgis/core/rest/support/FeatureSet";
import * as route from "@arcgis/core/rest/route";

interface EsriMapProps {
    xCenter: number
    yCenter: number
}

const EsriMap: React.VFC<EsriMapProps> = ({xCenter, yCenter}) =>{
    // create a ref to element to be used as the map's container
    const mapEl = useRef(null);

    // use a side effect to create the map after react has rendered the DOM
    useEffect(
        () => {
            // define the view here so it can be referenced in the clean up function
            let view: any;

            esriConfig.apiKey = process.env.REACT_APP_API_KEY ?? ''

            // then we load a web map from an id
            const map = new ArcGISMap({
                basemap: "streets-navigation-vector",
            });

            // and we show that map in a container
            view = new MapView({
                map: map,
                // use the ref as a container
                container: mapEl.current ? mapEl.current : '',
                center: [xCenter,yCenter], //Longitude, latitude
                zoom: 12
            });

            const routeUrl = process.env.REACT_APP_ARGIS_URL ?? ""

            view.on("click", function(event:any){

                if (view.graphics.length === 0) {
                    addGraphic("origin", event.mapPoint);
                } else if (view.graphics.length === 1) {
                    addGraphic("destination", event.mapPoint);
                    getRoute(); // Call the route service
                } else {
                    view.graphics.removeAll();
                    addGraphic("origin",event.mapPoint);
                }
            
            });

            function addGraphic(type:any, point: any) {
                const graphic = new Graphic({
                    symbol: {
                    color: (type === "origin") ? "white" : "black"
                    },
                    geometry: point
                });
                view.graphics.add(graphic);
            }

            function getRoute() {
                const routeParams = new RouteParameters({
                    stops: new FeatureSet({
                    features: view.graphics.toArray()
                    }),
                    returnDirections: true
                });

                route.solve(routeUrl, routeParams)
                    .then(function(data:any) {
                        data.routeResults.forEach(function(result:any) {
                            result.route.symbol = {
                            type: "simple-line",
                            color: [5, 150, 255],
                            width: 3
                            };
                            view.graphics.add(result.route);
                        })
                                // Display directions
                        if (data.routeResults.length > 0) {
                            const directions : HTMLOListElement = document.createElement("ol");
                            directions.classList.add("esri-widget esri-widget--panel esri-directions__scroller")
                            directions.style.marginTop = "0";
                            directions.style.padding = "15px 15px 15px 30px";
                            const features = data.routeResults[0].directions.features;
                            // Show each direction
                            features.forEach(function(result:any,i: number){
                                const direction = document.createElement("li");
                                direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
                                directions.appendChild(direction);
                            });

                            view.ui.empty("top-right");
                            view.ui.add(directions, "top-right");
                        }

                    }).catch(function(error:any){
                        console.log(error);
                    })
            
            }
            
            return () => {
                // clean up the map view
                if (!!view) {
                    view.destroy();
                    view = null;
                }
            };
        },
        // only re-load the map if the id has changed
        [xCenter, yCenter]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;
}

export default EsriMap