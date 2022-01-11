import React from "react";
import MapView from "./map/MapView";

const Home: React.VFC = () => {
    return(
        <>
            <MapView basemap={"streets"} x={26.09} y={44.43} height={800} zoom={5.5}/>
        </>
    )
}
export default Home