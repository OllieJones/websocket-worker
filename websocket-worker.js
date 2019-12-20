'use strict'
/* globals WebSocket, postMessage */

var debug = false
var webSocket = null
var updateInterval = 10000
var updateIntervalTimer = null

/* don't want to rely on options dictionary actually being an Object */
var hasOwn = Object.prototype.hasOwnProperty

// eslint-disable-next-line no-unused-vars,no-undef
onmessage = function (e) {
  debug && console.log(e)
  if (!e.data.cmd) {
    /* No 'cmd' property. This may be transferable data: pure send payload */
    try {
      debug && console.log(typeof e.data, e.data)
      webSocket.send(e.data)
      postResult('statusupdate', null)
    } catch (error) {
      error.request = 'send'
      postResult('exception', error)
    }
  } else {
    var cmd = e.data.cmd
    switch (cmd) {
      case 'new' :
        if (e.data && typeof e.data.updateInterval === 'number') {
          updateInterval = e.data.updateInterval
        }
        try {
          webSocket = new WebSocket(e.data.url)
          var options = e.data.options
          if (options) {
            for (var key in options) {
              if (!hasOwn.call(options, key)) continue
              webSocket[key] = options[key]
            }
          }
          var binaryType = typeof e.data.binaryType === 'string' ? e.data.binaryType : null
          if (binaryType && typeof binaryType === 'string' && binaryType.length > 0) webSocket.binaryType = binaryType
          webSocket.onopen = onopen
          webSocket.onmessage = onpayload
          webSocket.onerror = onerror
          webSocket.onclose = onclose
          postResult(cmd, null)
        } catch (error) {
          error.request = 'new'
          postResult('exception', error)
        }
        break

      case 'close':
        try {
          webSocket.close()
        } catch (error) {
          error.request = 'close'
          postResult('exception', error)
        }
        break

      case 'statusupdate':
        postResult('statusupdate', null)
        break
    }
  }
}

/**
 * post a message to the webworker's invoker.
 * @param {string} cmd  'new'|'send'|'close'|'onmessage'|'error'|'exception'
 * @param {object} options additional parameters to send
 */
function postResult (cmd, options) {
  var msg = {
    cmd: cmd,
    bufferedAmount: webSocket.bufferedAmount,
    extensions: webSocket.extensions,
    protocol: webSocket.protocol,
    readyState: webSocket.readyState
  }
  if (options) {
    for (var key in options) {
      if (!hasOwn.call(options, key)) continue
      msg[key] = options[key]
    }
  }
  postMessage(msg)
}

/**
 * websocket onopen handler
 * @param {Event} event
 */
function onopen (event) {
  postResult('onopen', null)
  startStatusUpdates()
}

/**  websocket onmessage handler
 * @param {MessageEvent} event
 */
function onpayload (event) {
  debug && console.log(event)
  /* use transferable data if possible */
  if (event.data instanceof ArrayBuffer) postMessage(event.data, [event.data])
  else postMessage(event.data)
  postResult('statusupdate', null)
}

/** websocket onerror handler
 * @param {Event} event
 */
function onerror (event) {
  postResult('onerror', null)
}

/** websocket onclose handler
 * @param {CloseEvent} event
 */
function onclose (event) {
  var options = {}
  options.code = event.code
  options.reason = event.reason
  options.wasClean = event.wasClean
  postResult('onclose', options)
  stopStatusUpdates()
  webSocket = null
}

function startStatusUpdates () {
  if (!updateIntervalTimer && updateInterval) {
    updateIntervalTimer = setInterval(function () {
      postResult('statusupdate', null)
    }, updateInterval)
  }
}

function stopStatusUpdates () {
  if (updateIntervalTimer) clearInterval(updateIntervalTimer)
}
