/* global atom */

var pkgConfig = require('pkg-config')
var path = require('path')
var minimatch = require('minimatch')
var findRoot = require('find-root')
var allowUnsafeNewFunction = require('loophole').allowUnsafeNewFunction
var format = {
  'standard-format': 'standard-format',
  'semi-standard': 'semistandard-format',
  'happiness': 'happiness-format'
}

function syncLintText (text) {
  try {
    opts = this.parseOpts({ fix: true }).eslintConfig
    var engine = new this.eslint.CLIEngine(opts)
    return engine.executeOnText(text).results[0].output
  } catch (err) {
    console.log('Error transforming using standard:', e)
    return text
  }
}

module.exports = {
  style: null,
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
      this.setStyle()
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
    try {
      if (this.style === 'standard') {
        return allowUnsafeNewFunction(function () {
          return syncLintText.call(require('standard'), text)
        })
      } else if (format.hasOwnProperty(this.style)) {
        return require(format[this.style]).transform(text)
      }
    } catch (e) {}
    return text
  },

  setStyle: function () {
    var checkStyleDevDependencies = atom.config.get('standard-formatter.checkStyleDevDependencies')

    if (checkStyleDevDependencies) {
      this.style = this.getStyleFromDevDeps()
    } else {
      this.style = atom.config.get('standard-formatter.style')
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

    if (this.style === 'semi-standard') {
      options.root = 'semistandard'
    } else if (this.style === 'happiness') {
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

      this.setStyle()

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
    style: {
      type: 'string',
      default: 'standard',
      title: 'Style Formatter',
      description: 'The module to use for automatically fixing style issues',
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
