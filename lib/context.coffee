fs   = require 'fs'
path = require 'path'
util = require 'util'

exports.find = (editor) ->
  root = closestPackage editor.getPath()
  if root
    standardBinary = path.join root, 'node_modules', '.bin', 'standard'
    if not fs.existsSync standardBinary
      standardBinary = 'standard'
    root: root
    test: path.relative root, editor.getPath()
    standard: standardBinary
  else
    root: path.dirname editor.getPath()
    test: path.basename editor.getPath()
    standard: 'standard'

closestPackage = (folder) ->
  pkg = path.join folder, 'package.json'
  if fs.existsSync pkg
    folder
  else if folder is '/'
    null
  else
    closestPackage path.dirname(folder)
