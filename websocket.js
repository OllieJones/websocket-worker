'use strict'
// noinspection JSUnusedLocalSymbols
/* eslint-disable no-unused-vars */
/* global  Worker, MessageEvent, Event, CloseEvent, setTimeout */

window.WebSocketWorker = (function () {
  /**
   *
   * @param {string} url
   * @param {object} options
   * @constructor
   */
  function WebSocketWorker (url, options) {
    var wsw = this

    wsw._worker = new Worker('/websocket-worker.js')
    wsw.url = url
    /**
     * websocket's readystate
     * @type {number}
     */
    wsw.readyState = -1
    /**
     *
     * @type {string} 'blob' | 'arraybuffer'
     */
    wsw.binaryType = null

    wsw.bufferedAmount = 0
    wsw.extensions = ''
    wsw.protocol = ''

    wsw.onmessage = null
    wsw.onopen = null
    wsw.onerror = null
    wsw.onclose = null

    wsw._updateInterval = null
    if (options && typeof options.updateInterval === 'number') {
      wsw._updateInterval = options.updateInterval
      delete options.updateInterval
    }

    wsw._worker.onmessage = function (e) {
      var event = null
      if (e.data && !e.data.cmd) {
        /* no "cmd" item: transferable data payload */
        event = new Event('message')
        // noinspection JSUnresolvedVariable
        event.data = e.data
        if (typeof wsw.onmessage === 'function') wsw.onmessage(event)
      } else {
        var data = e.data
        if (!data || typeof data.cmd !== 'string') {
          throw (new Error('unexpected message content'))
        }
        var cmd = data.cmd
        wsw.bufferedAmount = data.bufferedAmount
        wsw.extensions = data.extensions
        wsw.protocol = data.protocol
        wsw.readyState = data.readyState
        switch (cmd) {
          case 'new':
            break

          case 'onopen' :
            event = new Event('open')
            if (typeof wsw.onopen === 'function') wsw.onopen(event)
            break

          case 'onclose' :
            event = new Event('close')
            event.code = data.code
            event.reason = data.reason
            event.wasClean = data.wasClean
            if (typeof wsw.onclose === 'function') wsw.onclose(event)
            wsw._worker.terminate()
            break

          case 'statusupdate' :
            break

          case 'onerror' :
            event = new Event('error')
            if (typeof wsw.onerror === 'function') wsw.onerror(event)
            break

          case 'exception':
            console.error('websocket-exception', data)
            event = new Event('websocket-exception')
            event.request = data.request
            event.diagnostic = data
            break

          default:
            console.error('websocket-unexpected-message', e)
            break
        }
      }
    }

    /* tell the worker to open the WebSocket,
     * next time through the loop (to pick up binaryType) */
    setTimeout(function () {
      wsw._worker.postMessage(
        {
          cmd: 'new',
          url: wsw.url,
          binaryType: wsw.binaryType,
          updateInterval: wsw._updateInterval
        })
    }, 0)

    return this
  }

  WebSocketWorker.prototype = {
    send: function (payload) {
      /* use transferable data if possible */
      if (payload.buffer) this._worker.postMessage(payload.buffer, [payload.buffer])
      else this._worker.postMessage(payload)
    },
    close: function () {
      this._worker.postMessage(
        {
          cmd: 'close'
        })
    }
  }

  return WebSocketWorker
})()
