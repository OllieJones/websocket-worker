'use strict'
/* globals WebSocket */

var debug = false

debug && console.log('in raw worker')

var echoWebSocketServer = 'wss://echo.websocket.org'

var wss = new WebSocket(echoWebSocketServer)
// wss.binaryType = 'blob'
wss.onmessage = function (event) {
  debug && console.log(event)
  debug && console.log('Received', event.data)
  wss.close()
}
wss.onopen = function () {
  debug && console.log('opened')
  wss.send('Hello, Websocket World')
}
wss.onclose = function () {
  debug && console.log('closed')
}
wss.onerror = function (event) {
  debug && console.log('error', event)
}
