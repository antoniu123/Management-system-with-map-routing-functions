import React, {useEffect, useRef} from "react"
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
interface RouteProps {
    centerLongitude: number
    centerLatitude: number
    start?: LocationPoint
    end?: LocationPoint
    startName?: string
    endName?: string
}

const simpleMarkerSymbolOrigin = {
    type: "simple-marker",
    color: [0, 255, 0],  // Green
    outline: {
        color: [255, 255, 255], // White
        width: 1
    }
};

const simpleMarkerSymbolDestination = {
    type: "simple-marker",
    color: [255, 0, 0],  // Red
    outline: {
        color: [255, 255, 255], // White
        width: 1
    }
};

const MapRoute: React.VFC<RouteProps> = ({centerLongitude, centerLatitude, start, end, startName, endName}) =>{
    // create a ref to element to be used as the map's container
    const mapEl = useRef(null);

    // use a side effect to create the map after react has rendered the DOM
    useEffect(
        () => {
            // define the view here so it can be referenced in the clean up function
            let view: MapView | undefined;

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
                zoom: 12
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

            if (start && end ){ //we have start and end position so we don't need click behavior
                
                let pointStart = {
                    ...start,
                    type: "point"  // autocasts as new Point()
                };
                let pointEnd = {
                    ...end,
                    type: "point"  // autocasts as new Point()
                };

                addGraphic("origin", pointStart, true)
                console.log("point start automatic=",pointStart)
                addGraphic("destination", pointEnd, false)
                console.log("point end automatic=",pointEnd)
                getRoute(); // Call the route service

                view.on("click", function(event:any){
                    view?.graphics.removeAll()                
                });
            }
            else { //we have click pattern
                view.on("click", function(event:any){

                    if (view?.graphics.length === 0) { //first click so origin added
                        addGraphic("origin", event.mapPoint, true);
                        console.log("point start =", event.mapPoint)
                    } else if (view?.graphics.length === 1) { //second click so destination added
                        addGraphic("destination", event.mapPoint, false)
                        console.log("point end =", event.mapPoint)
                        getRoute(); // Call the route service
                    } else { //third click so we remove the graphic and put again search widget
                        view?.graphics.removeAll()
                        view?.ui.empty("top-right")
                        view?.ui.add(searchWidget, {
                            position: "top-right"
                        }); 
                        //addGraphic("origin",event.mapPoint);
                    }
                
                });
            }
            

            function addGraphic(type: string, point: any, isStart: boolean) {
                const graphic = new Graphic({
                    symbol: isStart ? simpleMarkerSymbolOrigin : simpleMarkerSymbolDestination,
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
                    .then(function(data:any) {
                        data.routeResults.forEach(function(result:any) {
                            result.route.symbol = {
                            type: "simple-line",
                            color: [5, 150, 255],
                            width: 3
                            };
                            view?.graphics.add(result.route);
                        })
                        // Display directions
                        if (data.routeResults.length > 0) {
                            data.routeResults[0].routeName = startName && endName ? startName + " -> " + endName : "my route"
                            const directions : HTMLOListElement = document.createElement("ol");
                            directions.classList.add("esri-widget")
                            directions.classList.add("esri-widget--panel")
                            directions.classList.add("esri-directions__scroller")
                            directions.style.marginTop = "0";
                            directions.style.padding = "15px 15px 15px 30px";
                            const features = data.routeResults[0].directions.features;
                            // Show each direction
                            const routeTitle: HTMLDivElement  = document.createElement("div");
                            routeTitle.innerHTML = "===" + data.routeResults[0].routeName + "==="
                            directions.appendChild(routeTitle)
                            features.forEach(function(result:any,i: number){
                                const direction: HTMLLIElement = document.createElement("li");
                                direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(3)
                                + " kilometers)";
                                directions.appendChild(direction);
                            });
                            data.routeResults[0].route.geometry.paths[0].forEach((p:any)=>{
                                console.log("intermediar point longitude = ",p[0], ': latitude = ', p[1])
                                // let point = {
                                //     x: p[0],
                                //     y: p[1],
                                //     type: "point"  // autocasts as new Point()
                                // };
                                // addGraphic("destination", p, false)
                            })
                            const totalDistance: HTMLDivElement = document.createElement("div");
                            totalDistance.innerHTML = "Total  = " + data.routeResults[0].directions.totalLength.toFixed(3) + 
                            " kilometers"
                            directions.appendChild(totalDistance)
                            view?.ui.empty("top-right");
                            view?.ui.add(directions, "top-right");
                        }

                    }).catch(function(error:any){
                        console.log(error);
                    })
            
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
        [centerLongitude, centerLatitude, start, end, startName, endName]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;
}

export default MapRoute