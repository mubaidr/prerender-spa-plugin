const Hapi = require('hapi')
const Inert = require('inert')
const Path = require('path')
const Phantom = require('phantomjs-prebuilt')
const ChildProcess = require('child_process')
const portfinder = require('portfinder')

module.exports = (staticDir, route, options, callback) => {
  portfinder.getPort((error, port) => {
    if (error) throw error
    const Server = new Hapi.Server({
      connections: {
        routes: {
          files: {
            relativeTo: staticDir
          }
        }
      }
    })

    Server.connection({
      port
    })

    // eslint-disable-next-line
    Server.register(Inert, error => {
      if (error) throw error
      const indexPath = options.indexPath
        ? options.indexPath
        : Path.join(staticDir, 'index.html')

      Server.route({
        method: 'GET',
        path: route,
        handler: (request, reply) => {
          reply.file(indexPath)
        }
      })

      Server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
          directory: {
            path: '.',
            redirectToSlash: true,
            index: true,
            showHidden: true
          }
        }
      })

      Server.start(err => {
        // If port is already bound, try again with another port
        if (err) throw err

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

        function capturePage () {
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
                  return capturePage()
                }
                throw err || stderr
              }
              callback(stdout)
              Server.stop()
            }
          )
        }

        capturePage()
      })
    })
  })
}
