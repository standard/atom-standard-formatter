/*global atom*/

module.exports = {
  formatter: function () {
    if (!this.standardFormat) {
      this.standardFormat = require('standard-format')
    }
    return this.standardFormat
  },
  activate: function () {
    this.commands = atom.commands.add('atom-workspace', 'standard-formatter:format', this.format.bind(this))
    this.editorObserver = atom.workspace.observeTextEditors(this.handleEvents.bind(this))
  },
  deactivate: function () {
    this.commands.dispose()
    this.editorObserver.dispose()
  },
  format: function () {
    var editor = atom.workspace.getActivePaneItem()
    var text = editor.getText()
    var transformed = this.formatter().transform(text)
    editor.setText(transformed)
  },
  handleEvents: function (editor) {
    editor.getBuffer().onWillSave(function () {
      var path = editor.getPath()

      if (!path) return

      var ext = path.substring(path.length - 3)
      var formatOnSave = atom.config.get('standard-formatter.formatOnSave', {scope: editor.getRootScopeDescriptor()})

      if (ext === '.js' && formatOnSave) {
        this.format()
      }
    }.bind(this))
  },
  config: {
    formatOnSave: {
      type: 'boolean',
      default: false
    }
  }
}
