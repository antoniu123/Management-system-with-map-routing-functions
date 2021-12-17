import React, {useEffect, useRef} from "react";
import {loadModules} from "esri-loader";

interface EsriMapProps {
    id: string
}

const EsriMap: React.VFC<EsriMapProps> = ({ id }) =>{
    // create a ref to element to be used as the map's container
    const mapEl = useRef(null);

    // use a side effect to create the map after react has rendered the DOM
    useEffect(
        () => {
            // define the view here so it can be referenced in the clean up function
            let view: any;
            // the following code is based on this sample:
            // https://developers.arcgis.com/javascript/latest/sample-code/webmap-basic/index.html
            // first lazy-load the esri classes
            loadModules(["esri/views/MapView", "esri/WebMap"], {
                css: true
            }).then(([MapView, WebMap]) => {
                // then we load a web map from an id
                const webmap = new WebMap({
                    // autocasts as new PortalItem()
                    portalItem: {
                        // get item id from the props
                        id
                    }
                });

                // and we show that map in a container
                view = new MapView({
                    map: webmap,
                    // use the ref as a container
                    container: mapEl.current
                });
            });
            return () => {
                // clean up the map view
                if (!!view) {
                    view.destroy();
                    view = null;
                }
            };
        },
        // only re-load the map if the id has changed
        [id]
    );
    return <div style={{ height: 600 }} ref={mapEl} />;
}

export default EsriMap