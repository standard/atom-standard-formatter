/* global atom */

var pkgConfig = require('pkg-config')
var path = require('path')
var minimatch = require('minimatch')
var findRoot = require('find-root')
var allowUnsafeNewFunction = require('loophole').allowUnsafeNewFunction
var standard = allowUnsafeNewFunction(function () {
  return require('standard')
})
var standardFormat = require('standard-format')
var semiStandardFormat = require('semistandard-format')
var happinessFormat = require('happiness-format')
var deasync = require('deasync')
var standardLintTextSync = deasync(standard.lintText.bind(standard))

module.exports = {
  style: null,
  formatters: {},
  fileTypes: ['.js', '.jsx'],

  fileSupported: function (file) {
    // Check package settings to see if this file should be ignored based on globs.
    var honorPackageConfig = atom.config.get('standard-formatter.honorPackageConfig')
    if (honorPackageConfig) {
      var packageConfig = this.getPackageConfig()
      if (packageConfig && packageConfig.ignore) {
        var matches = packageConfig.ignore.some(function (pattern) {
          return minimatch(file, pattern)
        })
        if (matches) {
          return false
        }
      }
    }

    // Ensure file is a supported file type.
    var ext = path.extname(file)
    return !!~this.fileTypes.indexOf(ext)
  },

  activate: function () {
    this.commands = atom.commands.add('atom-workspace', 'standard-formatter:format', function () {
      this.setFormatter()
      this.format()
    }.bind(this))

    this.editorObserver = atom.workspace.observeTextEditors(this.handleEvents.bind(this))
  },

  deactivate: function () {
    this.commands.dispose()
    this.editorObserver.dispose()
  },

  format: function (options) {
    if (options === undefined) {
      options = {}
    }
    var selection = typeof options.selection === 'undefined' ? true : !!options.selection
    var editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      // Return if the current active item is not a `TextEditor`
      return
    }
    var selectedText = selection ? editor.getSelectedText() : null
    var text = selectedText || editor.getText()
    var cursorPosition = editor.getCursorScreenPosition()
    var transformed = this.transformText(text)

    if (selectedText) {
      editor.setTextInBufferRange(editor.getSelectedBufferRange(), transformed)
    } else {
      editor.setText(transformed)
    }
    editor.setCursorScreenPosition(cursorPosition)
  },

  transformText: function (text) {
    var formatter
    if (this.formatter === 'standard') {
      return allowUnsafeNewFunction(function () {
        try {
          var res = standardLintTextSync(text, {fix: true})
          var fixed = res.results[0].output
          return fixed === undefined ? text : fixed
        } catch (e) {
          console.log('Error transforming using standard:', e)
          return text
        }
      })
    } else if (this.formatter === 'standard-format') {
      formatter = standardFormat
    } else if (this.formatter === 'semi-standard') {
      formatter = semiStandardFormat
    } else if (this.formatter === 'happiness') {
      formatter = happinessFormat
    } else {
      return text
    }

    try {
      return formatter.transform(text)
    } catch (e) {
      // Failed to transform, likely due to syntax error in `text`
      return text
    }
  },

  setFormatter: function () {
    var checkStyleDevDependencies = atom.config.get('standard-formatter.checkStyleDevDependencies')

    if (checkStyleDevDependencies) {
      var style = this.getStyleFromDevDeps()
      if (style === 'standard') {
        this.formatter = 'standard'
      } else if (style === 'semi-standard') {
        this.formatter = 'semistandard-format'
      } else if (style === 'happiness') {
        this.formatter = 'happiness-format'
      }
    } else {
      this.formatter = atom.config.get('standard-formatter.formatter')
    }
  },

  getStyleFromDevDeps: function () {
    var editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      // Return if the current active item is not a `TextEditor`
      return
    }
    var filepath = editor.getPath()
    var style = null
    var devDeps = pkgConfig(null, {
      cwd: filepath,
      root: 'devDependencies',
      cache: false
    })
    if (devDeps && (devDeps.standard || devDeps.semistandard || devDeps.happiness)) {
      if (devDeps.standard) {
        style = 'standard'
      } else if (devDeps.semistandard) {
        style = 'semi-standard'
      } else {
        style = 'happiness'
      }
    }
    return style
  },

  getPackageConfig: function () {
    var editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      // Return if the current active item is not a `TextEditor`
      return
    }
    var filepath = editor.getPath()
    var options = { cwd: filepath, cache: false }

    if (this.formatter === 'semistandard-format') {
      options.root = 'semistandard'
    } else if (this.formatter === 'happiness-format') {
      options.root = 'happiness'
    } else {
      options.root = 'standard'
    }

    return pkgConfig(null, options)
  },

  handleEvents: function (editor) {
    editor.getBuffer().onWillSave(function () {
      var path = editor.getPath()
      if (!path) return

      if (!editor.getBuffer().isModified()) return

      var formatOnSave = atom.config.get('standard-formatter.formatOnSave', {scope: editor.getRootScopeDescriptor()})
      if (!formatOnSave) return

      this.setFormatter()

      // Set the relative path based on the file's nearest package.json.
      // If no package.json is found, use path verbatim.
      var relativePath
      try {
        var projectPath = findRoot(path)
        relativePath = path.replace(projectPath, '').substring(1)
      } catch (e) {
        relativePath = path
      }

      if (this.fileSupported(relativePath)) {
        this.format({selection: false})
      }
    }.bind(this))
  },

  config: {
    formatOnSave: {
      type: 'boolean',
      default: false
    },
    formatter: {
      type: 'string',
      default: 'standard',
      description: 'The module to use for formatting your JS',
      enum: ['standard', 'standard-format', 'semi-standard', 'happiness']
    },
    checkStyleDevDependencies: {
      type: 'boolean',
      default: false
    },
    honorPackageConfig: {
      type: 'boolean',
      description: 'Honor standard/semi-standard/happiness ignore configuration in package.json',
      default: true
    }
  }
}
