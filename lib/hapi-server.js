const Hapi = require('hapi')
const portfinder = require('portfinder')

module.exports = async() => {
  let port

  try {
    port = await portfinder.getPortPromise()
  } catch (err) {
    throw err
  }

  const server = Hapi.server({
    host: 'localhost',
    port
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: () => 'Good'
  })

  try {
    await server.start()
  } catch (err) {
    throw err
  }

  return server
}
