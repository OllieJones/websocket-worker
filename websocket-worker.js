'use strict'
/* globals WebSocket */

// noinspection ES6ConvertVarToLetConst
var socketSerial = 0
var socketList = {}

var hasOwn = Object.prototype.hasOwnProperty

/**
 * post a message to the webworker's invoker.
 * @param {string} cmd  'new'|'send'|'close'|'onmessage'|'error'|'exception'
 * @param {EventTarget} ws the particular websocket instance
 * @param {object} options additional parameters to send
 */
function postResult (cmd, ws, options) {
  var msg = { cmd: cmd }
  msg.socketSerial = (ws && ws.socketSerial) ? ws.socketSerial : -1
  msg.readyState = ws ? ws.readyState : -1
  if (options) {
    for (var key in options) {
      if (!hasOwn.call(options, key)) continue
      msg[key] = options[key]
    }
  }
  // eslint-disable-next-line no-undef
  postMessage(msg)
}

/**
 * websocket onopen handler
 * @param {Event} event
 */
function onopen (event) {
  postResult('onopen', event.target, null)
}

/**  websocket onmessage handler
 * @param {MessageEvent} event
 */
function onpayload (event) {
  postResult('onmessage', event.target, { data: event.data })
}

/** websocket onerror handler
 * @param {Event} event
 */
function onerror (event) {
  postResult('onerror', event.target, null)
}

/** websocket onclose handler
 * @param {CloseEvent} event
 */
function onclose (event) {
  var options = {}
  options.code = event.code
  options.reason = event.reason
  options.wasClean = event.wasClean
  postResult('onclose', event.target, options)
  var socketSerial = event.target.socketSerial
  delete socketList[socketSerial]
}

// eslint-disable-next-line no-unused-vars
function onmessage (e) {
  console.log(e.data)
  var cmd = e.data.cmd
  var ws
  var serial
  switch (cmd) {
    case 'new' :
      try {
        ws = new WebSocket(e.data.url)
        var options = e.data.options
        if (options) {
          for (var key in options) {
            if (!hasOwn.call(options, key)) continue
            ws[key] = options[key]
          }
        }
        socketSerial += 1
        ws.socketSerial = socketSerial
        socketList[socketSerial] = ws

        ws.onopen = onopen
        ws.onmessage = onpayload
        ws.onerror = onerror
        ws.onclose = onclose
        postResult(cmd, ws, null)
      } catch (error) {
        error.request = 'new'
        postResult('exception', null, error)
      }
      break
    case 'send':
      try {
        serial = e.data.socketSerial
        if (socketList[serial]) {
          ws = socketList[serial]
          ws.send(e.data.data)
        } else {
          postResult('error', null, { request: 'send', diagnostic: 'no such WebSocket' })
        }
      } catch (error) {
        error.request = 'send'
        postResult('exception', null, error)
      }
      break
    case 'close':
      try {
        serial = e.data.socketSerial
        if (socketList[serial]) {
          ws = socketList[serial]
          ws.close()
        } else {
          postResult('error', null, { request: 'close', diagnostic: 'no such WebSocket' })
        }
      } catch (error) {
        error.request = 'close'
        postResult('exception', null, error)
      }
      break
  }
}
