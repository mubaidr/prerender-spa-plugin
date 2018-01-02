const FS = require('fs')
const Path = require('path')
const mkdirp = require('mkdirp')
const compileToHTML = require('./lib/compile-to-html')

function SimpleHtmlPrecompiler (staticDir, paths, options) {
  this.staticDir = staticDir
  this.paths = paths
  this.options = options || {}
}

// eslint-disable-next-line
SimpleHtmlPrecompiler.prototype.apply = function(compiler) {
  compiler.plugin('after-emit', (compilation, done) => {
    Promise.all(
      this.paths.map(
        outputPath =>
          new Promise((resolve, reject) => {
            compileToHTML(
              this.staticDir,
              outputPath,
              this.options,
              prerenderedHTML => {
                let prerenderedHTMLProcessed
                if (this.options.postProcessHtml) {
                  prerenderedHTMLProcessed = this.options.postProcessHtml({
                    html: prerenderedHTML,
                    route: outputPath
                  })
                }
                const folder = Path.join(
                  this.options.outputDir || this.staticDir,
                  outputPath
                )
                mkdirp(folder, error => {
                  if (error) {
                    return reject(error)
                  }
                  const file = Path.join(folder, 'index.html')
                  FS.writeFile(file, prerenderedHTMLProcessed, err => {
                    if (err) {
                      return reject(err)
                    }
                    return resolve()
                  })
                  return true
                })
              }
            )
          })
      )
    )
      .then(done)
      .catch(error => {
        // setTimeout prevents the Promise from swallowing the throw
        setTimeout(() => {
          throw error
        })
      })
  })
}

module.exports = SimpleHtmlPrecompiler
