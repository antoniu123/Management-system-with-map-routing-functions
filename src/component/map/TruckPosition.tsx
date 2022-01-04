import React, {useLayoutEffect, useRef, useState} from "react"
import ArcGISMap from "@arcgis/core/Map"
import Graphic from "@arcgis/core/Graphic"
import esriConfig from "@arcgis/core/config.js"
import MapView from "@arcgis/core/views/MapView"
import RouteParameters from "@arcgis/core/rest/support/RouteParameters"
import FeatureSet from "@arcgis/core/rest/support/FeatureSet"
import * as route from "@arcgis/core/rest/route"
import Search from "@arcgis/core/widgets/Search"
import Locate from "@arcgis/core/widgets/Locate"


interface LocationPoint {
    x: number
    y: number
}
interface TruckPositionProps {
    centerLongitude: number
    centerLatitude: number
    start: LocationPoint
    end: LocationPoint
}

const simpleMarkerSymbolOrigin = {
    type: "simple-marker",
    color: [0, 255, 0],  // Green
    outline: {
        color: [255, 255, 255], // White
        width: 1
    }
};

const simpleMarkerSymbolCurrent = {
    type: "simple-marker",
    style: "square",
    color: [0, 0, 0],  // Black
    size: "8px"
};

const simpleMarkerSymbolDestination = {
    type: "simple-marker",
    color: [255, 0, 0],  // Red
    outline: {
        color: [255, 255, 255], // White
        width: 1
    }
};

const TruckPosition: React.VFC<TruckPositionProps> = (
    {
     centerLongitude,
     centerLatitude,
     start,
     end
}) =>{
    // create a ref to element to be used as the map's container
    const mapEl = useRef(null);

    const [counter, setCounter] = useState(0);


    // use a side effect to create the map after react has rendered the DOM
    useLayoutEffect(
        () => {
            let view: MapView | undefined;

            const interval = setInterval(() => {
                setCounter(counter + 5);
                // define the view here so it can be referenced in the clean up function

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
                    center: [centerLongitude, centerLatitude], //Longitude, latitude of the center position
                    zoom: 13
                });

                const searchWidget = new Search({
                    view: view
                });

                const locateBtn = new Locate({
                    view: view
                });

                view.ui.add(searchWidget, {
                    position: "top-right"
                });

                view.ui.add(locateBtn, {
                    position: "top-left"
                });

                const routeUrl = process.env.REACT_APP_ARGIS_URL ?? ""

                let pointStart = {
                    ...start,
                    type: "point"  // autocasts as new Point()
                };
                let pointEnd = {
                    ...end,
                    type: "point"  // autocasts as new Point()
                };

                addGraphic(pointStart, 0)
                console.log("point start automatic=", pointStart)
                addGraphic(pointEnd, 2)
                console.log("point end automatic=", pointEnd)
                getRoute(); // Call the route service

                view.on("click", function (event: any) {
                    view?.graphics.removeAll()
                });

                function addGraphic(point: any, position: number) {
                    const graphic = new Graphic({
                        symbol: position === 0 ?
                            simpleMarkerSymbolOrigin : position === 2 ? simpleMarkerSymbolDestination : simpleMarkerSymbolCurrent,
                        geometry: point
                    });
                    view?.graphics.add(graphic);
                }

                function getRoute() {
                    const routeParams = new RouteParameters({
                        stops: new FeatureSet({
                            features: view?.graphics.toArray()
                        }),
                        returnDirections: true,
                        directionsLanguage: "ro", //in romanian language
                        directionsLengthUnits: "kilometers" //when that is not present we have default as miles
                    });

                    route.solve(routeUrl, routeParams)
                        .then(function (data: any) {
                            data.routeResults.forEach(function (result: any) {
                                result.route.symbol = {
                                    type: "simple-line",
                                    color: [5, 150, 255],
                                    width: 3
                                };
                                view?.graphics.add(result.route);
                            })
                            // Display directions
                            if (data.routeResults.length > 0) {
                                const intPoint : [number, number] [] = data.routeResults[0].route.geometry.paths[0]
                                const length :  number  = data.routeResults[0].route.geometry.paths[0].length
                                if (counter < length - 1){
                                    console.log("counter = " ,counter, " intermediar point longitude = ", intPoint[counter][0], ': latitude = ', intPoint[counter][1])
                                    let point = {
                                        x: intPoint[counter][0],
                                        y: intPoint[counter][1],
                                        type: "point"  // autocasts as new Point()
                                    };
                                    addGraphic(point, 1)
                                }
                            }

                        }).catch(function (error: any) {
                        console.log(error);
                    })

                }
            },30000)
            return () => {
                // clean up the map view
                if (!!view) {
                    view.destroy();
                    view = undefined;
                }
                clearInterval(interval)
            };
        },
        // only re-load the map if the id has changed
        [centerLongitude, centerLatitude, start, end, counter]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;
}

export default TruckPosition