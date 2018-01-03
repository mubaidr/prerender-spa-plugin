const FS = require('fs')
const Path = require('path')
const mkdirp = require('mkdirp')
const compileToHTML = require('./lib/compile-to-html')

function SimpleHtmlPrecompiler (staticDir, routes, options) {
  this.staticDir = staticDir
  this.routes = routes
  this.options = options || {}

  if (!this.options.outputDir) {
    this.options.outputDir = Path.join(staticDir, '../', 'dist-pre-rendered')
  }
}

// eslint-disable-next-line
SimpleHtmlPrecompiler.prototype.apply = function() {
  this.routes.forEach(route => {
    compileToHTML(this.staticDir, route, this.options, html => {
      const folder = Path.join(this.options.outputDir, route)
      const file = Path.join(folder, 'index.html')
      let htmlProcessed = html

      if (this.options.postProcessHtml) {
        htmlProcessed = this.options.postProcessHtml({
          html,
          route
        })
      }

      mkdirp.sync(folder)
      FS.writeFileSync(file, htmlProcessed)
    })
  })
}

// Debug code start
new SimpleHtmlPrecompiler('../gh-pages/dist', ['/']).apply()
// Debug code end
