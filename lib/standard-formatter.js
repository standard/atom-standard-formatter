/*global atom*/

var pkgConfig = require('pkg-config')
var path = require('path')
var minimatch = require('minimatch')
var findRoot = require('find-root')

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
      this.setStyle()
      this.format()
    }.bind(this))

    this.editorObserver = atom.workspace.observeTextEditors(this.handleEvents.bind(this))
  },

  deactivate: function () {
    this.commands.dispose()
    this.editorObserver.dispose()
  },

  requireFormatter: function (pkg) {
    if (this.formatters[pkg]) {
      return this.formatters[pkg]
    }
    this.formatters[pkg] = require(pkg)
    return this.formatters[pkg]
  },

  format: function (options) {
    if (options === undefined) {
      options = {}
    }
    var selection = typeof options.selection === 'undefined' ? true : !!options.selection
    var editor = atom.workspace.getActivePaneItem()
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

    if (this.style === 'standard') {
      formatter = this.requireFormatter('standard-format')
    } else if (this.style === 'semi-standard') {
      formatter = this.requireFormatter('semistandard-format')
    } else if (this.style === 'happiness') {
      formatter = this.requireFormatter('happiness-format')
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
      enum: ['standard', 'semi-standard', 'happiness']
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
