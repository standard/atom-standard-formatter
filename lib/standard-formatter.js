/*global atom*/

var pkgConfig = require('pkg-config')
var path = require('path')

module.exports = {
  style: null,
  formatters: {},
  fileTypes: ['.js', '.jsx'],

  fileSupported: function (file) {
    var ext = path.extname(file)
    return !!~this.fileTypes.indexOf(ext)
  },

  activate: function () {
    this.commands = atom.commands.add('atom-workspace', 'standard-formatter:format', this.format.bind(this))
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
    var checkStyleDevDependencies = atom.config.get('standard-formatter.checkStyleDevDependencies')
    var style
    var formatter

    if (checkStyleDevDependencies) {
      style = this.getStyleFromDevDeps()
    } else {
      style = atom.config.get('standard-formatter.style')
    }

    if (style === 'standard') {
      formatter = this.requireFormatter('standard-format')
    } else if (style === 'semi-standard') {
      formatter = this.requireFormatter('semistandard-format')
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

  getStyleFromDevDeps: function () {
    var editor = atom.workspace.getActiveTextEditor()
    var filepath = editor.getPath()
    var style = null
    var devDeps = pkgConfig(null, {
      cwd: filepath,
      root: 'devDependencies',
      cache: false
    })
    if (devDeps && (devDeps.standard || devDeps.semistandard)) {
      if (devDeps.standard) {
        style = 'standard'
      } else {
        style = 'semi-standard'
      }
    }
    return style
  },

  handleEvents: function (editor) {
    editor.getBuffer().onWillSave(function () {
      var path = editor.getPath()

      if (!path) return

      var formatOnSave = atom.config.get('standard-formatter.formatOnSave', {scope: editor.getRootScopeDescriptor()})

      if (formatOnSave && this.fileSupported(path)) {
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
      enum: ['standard', 'semi-standard']
    },
    checkStyleDevDependencies: {
      type: 'boolean',
      default: false
    }
  }
}
