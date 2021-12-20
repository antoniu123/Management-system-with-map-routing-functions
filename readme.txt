https://developers.arcgis.com/javascript/latest/typescript-setup/
https://developers.arcgis.com/javascript/latest/api-reference/esri-rest-route.html

steps for running

1.Install node 16.13.0 (check with node --version)
2.Install npm 8.1.0 (check with npm --version)
3.go in terminal into argis-app directory
4.run npm install
5.start json-server with npm run json-server or from gutter in package.json
6.start application ui with npm run start or from gutter in package.json

pending: {
  invoke: {
    src: (ctx, event) => Promise.all([
      /* all services */
    ]),
    onDone: 'final'
  }
}