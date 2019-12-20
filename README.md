# Websocket via WebWorker

Encapsulate [WebSocket]s in a [WebWorker]. Doing this can free up the browser's UI event loop.

```js
function onmessage (event) {
  var buf = event.data
}

var wsw = new WebsocketWorker (url)
wsw.binaryType = 'blob' // or 'arraybuffer'
wsw.onmessage = onmessage
wsw.onopen = function () {
  wsw.send ('Hello websocket webworker world')
}
```

## Limitations

* In the standard WebSocket interface, the `onmessage` event handler receives a [MessageEvent]. In this interface it receives an [Event]. Likewise, the `onerror` and `onclose` event handlers receive [Event]s, not [ErrorEvent]s or [CloseEvent]s.

* [ArrayBuffer]s and related objects are [transferrable] from web page to worker and back again, to get high performance for large objects.  This interface uses that feature, so if you do something like this the myBuffer object you sent is no longer usable.

```js
    myBuffer = Uint8Array.from([1, 2, 4, 5, 6, 7, 8, 9, 10])
    wsw.send(myBuffer.buffer)
``` 

* [Blob]s aren't transferrable. If you have to send a lot of large Blobs, you should consider using the standard WebSocket interface instead of this one, because the transfer overhead is considerable.



[WebSocket]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
[WebWorker]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
[MessageEvent]: https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
[ErrorEvent]: https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
[CloseEvent]: https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
[Event]: https://developer.mozilla.org/en-US/docs/Web/API/Event
[ArrayBuffer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
[transferrable]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Passing_data_by_transferring_ownership_transferable_objects
[Blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob