export default {
  calc: {
    oz_gm: x => x * 28.35,
    '℃_℉': x => (x * 1.8) + 32,
    '℉_℃': x => ((x - 32) * (5 / 9)),
    cup_ml: x => x * 284,
    ml_floz: x => x * 0.0352
  },
  map: {
    f: '℉',
    c: '℃'
  }
}
