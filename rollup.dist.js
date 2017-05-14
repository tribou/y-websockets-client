import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'
var pkg = require('./package.json')

export default {
  entry: 'src/y-array.js',
  moduleName: 'y-array',
  format: 'umd',
  plugins: [
    babel(),
    uglify({
      output: {
        comments: function (node, comment) {
          var text = comment.value
          var type = comment.type
          if (type === 'comment2') {
            // multiline comment
            return /@license/i.test(text)
          }
        }
      }
    })
  ],
  dest: 'y-array.js',
  sourceMap: true,
  banner: `
/**
 * ${pkg.name} - ${pkg.description}
 * @version v${pkg.version}
 * @license ${pkg.license}
 */
`
}
