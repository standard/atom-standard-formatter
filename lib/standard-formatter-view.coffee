module.exports =
class StandardFormatterView
  constructor: (serializedState) ->
    # Create root element
    @element = document.createElement('div')
    @element.classList.add('standard-formatter')

    # Create message element
    message = document.createElement('div')
    message.textContent = "Use standard-formatter:format to format your JS using Javascript Standard Style"
    message.classList.add('message')
    @element.appendChild(message)

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    @element
