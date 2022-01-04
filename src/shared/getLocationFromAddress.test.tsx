import {getLocationFromAddress} from "./getLocationFromAddress";


test('geocoding Cora Lujerului test', async () => {
  const coraCoordinates = await getLocationFromAddress('Cora Lujerului')
  expect(coraCoordinates[0]).toBe(26.036710000000028)
  expect(coraCoordinates[1]).toBe(44.43321000000003)
});
