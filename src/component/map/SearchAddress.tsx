import React from "react";
import { Map } from "@esri/react-arcgis";
import Search from "@arcgis/core/widgets/Search"

const SearchAddress:React.VFC = () => {

    const handleMapLoad = function (map:any, view:any) {
        const searchWidget = new Search({
            view: view
        });
        view.ui.add(searchWidget, {
            position: "top-right"
        });
    };

    return (
        <Map
            mapProperties={{ basemap: "streets-vector" }}
            viewProperties={{ center: [26.09, 44.43 ]}}
            loaderOptions={{ version: "4.17", css: true }}
            onLoad={handleMapLoad}
        />
    );
}

export default SearchAddress