import React from "react";
import {useMap} from "esri-loader-hooks";


interface MapViewProps {
    basemap: string
    x: number
    y: number
    height: number
    zoom: number
}

const MapView: React.VFC<MapViewProps> = ({basemap, x, y, height, zoom}) => {
    // takes initial map and view properties as POJOs
    const map = {
        basemap: basemap
    };
    const view = {
        center: [x, y],
        zoom: zoom
    };
    // returns a ref you can use to assign a container DOM node
    const [ref] = useMap(map, { view });
    return <div style={{ height: height }} ref={ref} />;
}

export default MapView;