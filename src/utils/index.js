export const batch = (new Array(512)).fill(0)

export const addToBatch = (channel, value) => {
  batch[channel] = value
}

export const clearBatch = () => {
  batch.fill(0)
}

export const fixtureBatch = {}

export const addToFixtureBatch = (fixtureId, properties) => {
  fixtureBatch[fixtureId] = fixtureBatch[fixtureId] || { properties: {} }
  Object.assign(fixtureBatch[fixtureId].properties, properties)
}

export const clearFixtureBatch = () => {
  Object.keys(fixtureBatch).forEach(key => { delete fixtureBatch[key] })
}

export const clearFixtureInBatch = fixtureId => {
  if (fixtureBatch[fixtureId] !== undefined) {
    fixtureBatch[fixtureId].properties = {}
  }
}

export const colors = {
  modv: {
    average: [0, 0, 0]
  }
}

export const modvcolor = color => {
  colors['modv'] = color
}
