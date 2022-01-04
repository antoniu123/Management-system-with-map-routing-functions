import { getDistanceBetweenPoints } from "./getDistanceBetweenPoints";


test('get distance between IDM Club and Cora Lujerului test', async () => {
  const distance = await getDistanceBetweenPoints({
    x: 26.049310000000048,
    y: 44.44497000000007
  }, {
    x: 26.036710000000028,
    y: 44.43321000000003
  })
  expect(Number(distance)).toBe(3.779)
});
