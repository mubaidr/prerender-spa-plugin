const FS = require('fs')
const Path = require('path')
const mkdirp = require('mkdirp')
const compileToHTML = require('./lib/compile-to-html')
const hapiServer = require('./lib/hapi-server.js')

function SimpleHtmlPrecompiler (staticDir, routes, options) {
  this.staticDir = staticDir
  this.routes = routes
  this.options = options || {}

  if (!this.options.outputDir) {
    this.options.outputDir = Path.join(staticDir, '../', 'dist-pre-rendered')
  }
}

// eslint-disable-next-line
SimpleHtmlPrecompiler.prototype.apply = async function() {
  const server = await hapiServer()

  this.routes.forEach(route => {
    const url = `${server.info.uri}${route}`
    const folder = Path.join(this.options.outputDir, route)
    const file = Path.join(folder, 'index.html')

    let html = compileToHTML(
      this.staticDir,
      url,
      this.options,
      server.info.port
    )

    if (this.options.postProcessHtml) {
      html = this.options.postProcessHtml({
        html,
        route
      })
    }

    mkdirp.sync(folder)
    FS.writeFileSync(file, html)

    // debug
    console.log('Phantom output: ', html)
  })

  setTimeout(() => {
    server.stop()
  }, 1000)
}

// Debug code start
new SimpleHtmlPrecompiler('../gh-pages/dist', ['/']).apply()
// Debug code end
