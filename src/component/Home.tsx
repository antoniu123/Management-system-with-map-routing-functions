import React from "react";
import MapView from "./map/MapView";

const Home: React.VFC = () => {
    return(
        <>
            <MapView basemap={"streets"} x={26.09} y={44.43} height={700} zoom={4}/>
        </>
    )
}
export default Home