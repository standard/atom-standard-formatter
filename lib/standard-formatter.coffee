standardFormat = require('standard-format')

module.exports =
  activate: ->
    atom.commands.add 'atom-workspace', "standard-formatter:format", => @format()

  format: ->
    editor = atom.workspace.getActivePaneItem()
    text = editor.getText()
    transformed = standardFormat.transform(text)
    editor.setText transformed
