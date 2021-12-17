// hooks allow us to create a map component as a function
import React from "react";
import {useScene} from "esri-loader-hooks";

interface SceneViewProps {
    basemap: string
    ground: string
    scale: number
    x: number
    y: number
    height: number
}

const SceneView: React.VFC<SceneViewProps> = (
    {   basemap,
        ground,
        scale,
        x,
        y,
        height
    }) => {
    // takes initial map and view properties as POJOs
    const map = {
        basemap: basemap,
        ground: ground
    };
    const view = {
        scale: scale, // Sets the initial scale to 1:50,000,000
        center: [x, y] // Sets the center point of view with lon/lat
    };
    // returns a ref you can use to assign a container DOM node
    const [ref] = useScene(map, {view});
    return <div style={{height: height}} ref={ref}/>;
}

export default SceneView;