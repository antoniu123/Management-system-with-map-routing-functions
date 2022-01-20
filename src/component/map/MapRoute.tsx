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
import moment from "moment"
import {LocationPoint} from "../../model/LocationPoint";


interface RouteProps {
    centerLongitude: number
    centerLatitude: number
    start?: LocationPoint
    end?: LocationPoint
    startName?: string
    endName?: string
    zoom: number
    truckPosition: boolean
    startDate?: string 
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

const simpleMarkerSymbolCurrent = {
    type: "simple-marker",
    style: "square",
    color: [0, 0, 128],  // Navy Blue
    size: "8px"
};

const MapRoute: React.VFC<RouteProps> = ({
    centerLongitude, 
    centerLatitude, 
    start, 
    end, 
    startName, 
    endName, 
    zoom, 
    truckPosition, 
    startDate
    }) =>{
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
                zoom: zoom
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

            if (start && end ){
                
                let pointStart = {
                    ...start,
                    type: "point"  // autocasts as new Point()
                };
                let pointEnd = {
                    ...end,
                    type: "point"  // autocasts as new Point()
                };

                addGraphic(pointStart, 0)
                console.log("point start automatic=",pointStart)
                addGraphic(pointEnd, 2)
                console.log("point end automatic=",pointEnd)
                getRoute(); // Call the route service

                // view.on("click", function(event:any){
                //     view?.graphics.removeAll()                
                // });
            }
            else {
                view.on("click", function(event:any){

                    if (view?.graphics.length === 0) {
                        addGraphic(event.mapPoint, 0);
                        console.log("point start =", event.mapPoint)
                    } else if (view?.graphics.length === 1) {
                        addGraphic(event.mapPoint, 2)
                        console.log("point end =", event.mapPoint)
                        getRoute(); // Call the route service
                    } else {
                        view?.graphics.removeAll()
                        view?.ui.empty("top-right")
                        view?.ui.add(searchWidget, {
                            position: "top-right"
                        }); 
                        //addGraphic("origin",event.mapPoint);
                    }
                
                });
            }
            

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
                    directionsLanguage: "ro",
                    directionsLengthUnits: "kilometers"
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
                            const routeTitle  = document.createElement("div");
                            routeTitle.innerHTML = data.routeResults[0].routeName
                            directions.appendChild(routeTitle)
                            features.forEach(function(result:any,i: number){
                                const direction = document.createElement("li");
                                direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(3)
                                + " kilometers)";
                                directions.appendChild(direction);
                            });
                            const totalDistance = document.createElement("div");
                            totalDistance.innerHTML = "Total  = " + data.routeResults[0].directions.totalLength.toFixed(3) + 
                            " kilometers"
                            directions.appendChild(totalDistance)
                            view?.ui.empty("top-right");
                            view?.ui.add(directions, "top-right");
                            if (truckPosition){
                                let startTime = moment.utc(startDate)
                                let currentTime =  moment.utc(Date())
                                //speed agreed is 50 km/h used  below for getting time
                                let minutesDuration : number = Math.round((data.routeResults[0].directions.totalLength / 50) * 60)
                                let minutesElapsed : number = moment.duration(currentTime.diff(startTime)).asMinutes()
                                const intPoint : [number, number] [] = data.routeResults[0].route.geometry.paths[0]
                                const length :  number  = data.routeResults[0].route.geometry.paths[0].length
                                //for matching aprox position we need a fraction from length
                                //done with minutesElapsed/minutesDuration
                                let counter = Math.round(minutesElapsed * length / minutesDuration)
                                if (counter < length - 1){
                                    let point = {
                                        x: intPoint[counter][0],
                                        y: intPoint[counter][1],
                                        type: "point"  // autocasts as new Point()
                                    };
                                    addGraphic(point, 1)
                                }
                            }

                            const legend : HTMLDivElement = document.createElement("div");
                            legend.classList.add("esri-widget")
                            legend.classList.add("esri-widget--panel")
                            const title : HTMLLIElement = document.createElement("li");
                            title.innerHTML = " L E G E N D A "
                            legend.appendChild(title)
                            const subtitle : HTMLLIElement = document.createElement("li");
                            subtitle.innerHTML = "================"
                            legend.appendChild(subtitle)

                            const line1 : HTMLLIElement = document.createElement("li");
                            const elem1 = document.createTextNode("Location start - " + startName + " -> ");
                            line1.appendChild(elem1)
                            const elem1icon: HTMLImageElement = document.createElement("img");
                            elem1icon.src = "green.ico";
                            line1.appendChild(elem1icon)
                            legend.appendChild(line1);

                            const line2 : HTMLLIElement = document.createElement("li");
                            const elem2 = document.createTextNode("Location Stop - " + endName + " -> ");
                            line2.appendChild(elem2)
                            const elem2icon: HTMLImageElement = document.createElement("img");
                            elem2icon.src = "red.ico";
                            line2.appendChild(elem2icon)
                            legend.appendChild(line2);

                            if (truckPosition) {
                                const line3 : HTMLLIElement = document.createElement("li");
                                const elem3 = document.createTextNode("Truck -> ");
                                line3.appendChild(elem3)
                                const elem3icon: HTMLImageElement = document.createElement("img");
                                elem3icon.src = "truck.ico";
                                line3.appendChild(elem3icon)
                                legend.appendChild(line3);
                            }

                            const line : HTMLLIElement = document.createElement("li");
                            const elem = document.createTextNode("Route -> ");
                            line.appendChild(elem)
                            const elemicon: HTMLImageElement = document.createElement("img");
                            elemicon.src = "line.ico";
                            line.appendChild(elemicon)
                            legend.appendChild(line);

                            view?.ui.empty("bottom-left");
                            view?.ui.add(legend, "bottom-left");
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
        [centerLongitude, centerLatitude, start, end, startName, endName, zoom, truckPosition, startDate]
    );
    return <div style={{ height: 800 }} ref={mapEl} />;
}

export default MapRoute