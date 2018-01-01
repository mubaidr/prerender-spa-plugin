var FS = require('fs')
var Path = require('path')
var mkdirp = require('mkdirp')
var compileToHTML = require('./lib/compile-to-html')

function SimpleHtmlPrecompiler(staticDir, paths, options) {
  this.staticDir = staticDir
  this.paths = paths
  this.options = options || {}
}

SimpleHtmlPrecompiler.prototype.apply = compiler => {
  compiler.plugin('after-emit', (compilation, done) => {
    Promise.all(
      this.paths.map(outputPath => {
        return new Promise((resolve, reject) => {
          compileToHTML(
            this.staticDir,
            outputPath,
            this.options,
            prerenderedHTML => {
              if (this.options.postProcessHtml) {
                prerenderedHTML = this.options.postProcessHtml({
                  html: prerenderedHTML,
                  route: outputPath
                })
              }
              var folder = Path.join(
                this.options.outputDir || this.staticDir,
                outputPath
              )
              mkdirp(folder, error => {
                if (error) {
                  return reject(
                    'Folder could not be created: ' + folder + '\n' + error
                  )
                }
                var file = Path.join(folder, 'index.html')
                FS.writeFile(file, prerenderedHTML, error => {
                  if (error) {
                    return reject(
                      'Could not write file: ' + file + '\n' + error
                    )
                  }
                  resolve()
                })
              })
            }
          )
        })
      })
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
