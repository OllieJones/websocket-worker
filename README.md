# Websocket via WebWorker

Encapsulate [WebSockets] in a [WebWorker]. Doing this can free up the browser's UI event loop.

```js
function onmessage (event) {
  var buf = event.data
}

var wsw = new WebsocketWorker (url, {binaryType:'blob'})
wsw.onmessage = onmessage
wsw.onopen = function () {
  wsw.send ('Hello websocket webworker world')
}
```

## Limitations

* `binaryType` must be passed to the ctor in an options object. If you don't provide it, the default is '`blo Setting it after using the ctor doesn't work.

[WebSockets]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[WebWorker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API