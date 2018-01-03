const Hapi = require('hapi')
const Path = require('path')
const childProcess = require('child_process')
const phantomjs = require('phantomjs-prebuilt')
const portfinder = require('portfinder')

module.exports = (staticDir, route, options, callback) => {
  portfinder
    .getPortPromise()
    .then(port => {
      const server = Hapi.server({
        host: 'localhost',
        port
      })

      server.route({
        method: 'GET',
        path: route,
        handler: () => 'Good'
      })

      server
        .start()
        .then(() => {
          const phantomArguments = [
            Path.join(__dirname, 'phantom-page-render.js'),
            `http://localhost:${port}${route}`,
            JSON.stringify(options)
          ]

          if (options.phantomOptions) {
            phantomArguments.unshift(options.phantomOptions)
          }

          const html = childProcess.execFileSync(
            phantomjs.path,
            phantomArguments
          )

          server.stop()
          callback(html)
        })
        .catch(err => {
          console.log(err)
        })
    })
    .catch(err => {
      console.log(err)
    })
}
