const Hapi = require('hapi')
const Path = require('path')
const Phantom = require('phantomjs-prebuilt')
const ChildProcess = require('child_process')
const portfinder = require('portfinder')
const fs = require('fs')

module.exports = (staticDir, route, options, callback) => {
  // console.log(staticDir, route, options)

  const indexPath = options.indexPath
    ? options.indexPath
    : Path.join(staticDir, 'index.html')

  portfinder.getPort((error, port) => {
    if (error) throw error

    const server = Hapi.server({
      host: 'localhost',
      port
    })

    server.route({
      method: 'GET',
      path: route,
      handler: () => {
        return 'Good'
      }
    })

    /*
    server.route({
      method: 'GET',
      path: '/{param*}',
      handler: (request, reply) => {
        console.log(' ----- -----', request, reply)
      }
    })
    */

    // eslint-disable-next-line
    async function start() {
      try {
        await server.start()
      } catch (err) {
        console.log(err)
        process.exit(1)
      }

      const maxAttempts = options.maxAttempts || 5
      let attemptsSoFar = 0

      const phantomArguments = [
        Path.join(__dirname, 'phantom-page-render.js'),
        `http://localhost:${port}${route}`,
        JSON.stringify(options)
      ]

      if (options.phantomOptions) {
        phantomArguments.unshift(options.phantomOptions)
      }

      function capturePage() {
        attemptsSoFar += 1

        ChildProcess.execFile(
          Phantom.path,
          phantomArguments,
          {
            maxBuffer: 1048576
          },
          // eslint-disable-next-line
          (err, stdout, stderr) => {
            if (err || stderr) {
              // Retry if we haven't reached the max number of capture attempts
              if (attemptsSoFar <= maxAttempts) {
                capturePage()
              } else {
                throw err || stderr
              }
            }
            callback(stdout)
            server.stop()
          }
        )
      }

      capturePage()
    }

    // Start the server
    start()
  })
}
