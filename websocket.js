'use strict'
// noinspection JSUnusedLocalSymbols
/* eslint-disable no-unused-vars */
/* global  Worker, MessageEvent, Event, CloseEvent */

window.WebSocketWorker = (function () {
  /**
   *
   * @param {string} url
   * @param {object} options  {binaryType:'blob'|'arraybuffer'}
   * @constructor
   */
  function WebSocketWorker (url, options) {
    this._worker = new Worker('/websocket-worker.js')
    /**
     * websocket's readystate
     * @type {number}
     */
    this.readyState = -1
    /**
     *
     * @type {string} 'blob' | 'arraybuffer'
     */
    this.binaryType = (options && typeof options.binaryType === 'string') ? options.binaryType : 'blob'

    this.onmessage = null
    this.onopen = null
    this.onerror = null
    this.onclose = null

    this._socketSerial = -1
    /* support for event delivery */
    this._em = document.createDocumentFragment()
    this._eventListenerCounts = []

    this._worker.onmessage = function (e) {
      var event = null
      var data = e.data
      if (!data || typeof data.cmd !== 'string') {
        throw (new Error('unexpected message content'))
      }
      var cmd = data.cmd
      this.readyState = data.readyState
      if (this._socketSerial) {
        if (this._socketSerial !== Number(data.socketSerial)) {
          throw (new Error('socketSerial mismatch'))
        }
      } else this._socketSerial = Number(data.socketSerial)
      switch (cmd) {
        case 'new':
          break

        case 'onopen' :
          event = new Event('open')
          if (typeof this.onopen === 'function') this.onopen(event)
          break

        case 'onclose' :
          event = new CloseEvent('close')
          if (typeof this.onclose === 'function') this.onclose(event)
          break

        case 'onerror' :
          event = new Event('error')
          if (typeof this.onerror === 'function') this.onerror(event)
          break

        case 'onmessage' :
          event = new MessageEvent('message')
          event.data = data.payload
          if (typeof this.onmessage === 'function') this.onmessage(event)
          break

        case 'error' :
          console.error('websocket-error', data)
          event = new Event('websocket-error')
          event.request = data.request
          event.diagnostic = data.diagnostic
          if (typeof this.onerror === 'function') this.onerror(event)
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
      if (event) this.dispatchEvent(event)
    }
    this._worker.postMessage({ cmd: 'new', url: url, options: options })

    return this
  }

  WebSocketWorker.prototype = {
    send: function (payload) {
      this._worker.postMessage(
        {
          cmd: 'send',
          socketSerial: this._socketSerial,
          payload: payload
        })
    },
    close: function () {
      this._worker.postMessage(
        {
          cmd: 'close',
          socketSerial: this._socketSerial
        })
    },
    /**
     * Add listener for specified event type.
     *
     * @param {"open"|"close"|"message"|"error"}
     * type Event type.
     * @param {function} listener The listener function.
     *
     * @return {undefined}
     *
     * @example
     * recorder.addEventListener('dataavailable', function (e) {
     *   audio.src = URL.createObjectURL(e.data)
     * })
     */
    addEventListener: function addEventListener () {
      const name = arguments[0]
      if (typeof name === 'string') {
        this._eventListenerCounts[name] = (typeof this._eventListenerCounts[name] === 'number')
          ? this._eventListenerCounts[name] + 1
          : 1
      }
      this._em.addEventListener.apply(this._em, arguments)
    },

    /**
     * Remove event listener.
     *
     * @param {"open"|"close"|"message"|"error"}
     * type Event type.
     * @param {function} listener The same function used in `addEventListener`.
     *
     * @return {function} the removed function
     */
    removeEventListener: function removeEventListener () {
      const name = arguments[0]
      if (typeof name === 'string') {
        this._eventListenerCounts[name] = (typeof this._eventListenerCounts[name] === 'number')
          ? this._eventListenerCounts[name] - 1
          : 0
      }

      return this._em.removeEventListener.apply(this._em, arguments)
    },

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {Event} event The event object.
     *
     * @return {boolean} Is event was no canceled by any listener.
     */
    dispatchEvent: function dispatchEvent () {
      this._em.dispatchEvent.apply(this._em, arguments)
    }
  }

  return WebSocketWorker
})()
