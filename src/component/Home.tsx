import React from "react";
import MapView from "./map/MapView";

const Home: React.VFC = () => {
    return(
        <>
            {/*<EsriMap id="e691172598f04ea8881cd2a4adaa45ba" />*/}
            <MapView basemap={"streets"} x={26.09} y={44.43} height={700} zoom={4}/>
            {/*<SceneView basemap={"streets"} ground={"world-elevation"} scale={50000000} x={-101.17} y={21.78} height={700} />*/}
        </>
    )
}
export default Home