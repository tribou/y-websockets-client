/* global Y, global */
'use strict'

// socket.io requires utf8. This package checks if it is required by requirejs.
// If window.require is set, then it will define itself as a module. This is erratic behavior and
// results in socket.io having a "bad request".
// This is why we undefine global.define (it is set by requirejs) before we require socket.io-client.
var define = global.define
global.define = null
var io = require('socket.io-client')
// redefine global.define
global.define = define

function extend (Y) {
  class Connector extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      options.role = 'slave'
      super(y, options)
      this.options = options
      options.url = options.url || 'https://yjs.dbis.rwth-aachen.de:5074'
      var socket = io(options.url)
      this.socket = socket
      var self = this

      this._onConnect = function joinRoom () {
        socket.emit('joinRoom', options.room)
        self.userJoined('server', 'master')
      }

      socket.on('connect', this._onConnect)
      if (socket.connected) {
        this._onConnect()
      } else {
        socket.connect()
      }

      this._onYjsEvent = function (message) {
        if (message.type != null) {
          if (message.type === 'sync done') {
            self.setUserId(socket.id)
          }
          if (message.room === options.room) {
            self.receiveMessage('server', message)
          }
        }
      }
      socket.on('yjsEvent', this._onYjsEvent)

      this._onDisconnect = function (peer) {
        self.userLeft('server')
      }
      socket.on('disconnect', this._onDisconnect)
    }
    disconnect () {
      this.socket.emit('leaveRoom', this.options.room)
      this.socket.disconnect()
      super.disconnect()
    }
    destroy () {
      this.disconnect()
      this.socket.off('disconnect', this._onDisconnect)
      this.socket.off('yjsEvent', this._onYjsEvent)
      this.socket.off('connect', this._onConnect)
      this.socket.destroy()
      this.socket = null
    }
    reconnect () {
      this.socket.connect()
      super.reconnect()
    }
    send (uid, message) {
      message.room = this.options.room
      this.socket.emit('yjsEvent', message)
    }
    broadcast (message) {
      message.room = this.options.room
      this.socket.emit('yjsEvent', message)
    }
    isDisconnected () {
      return this.socket.disconnected
    }
  }
  Y.extend('websockets-client', Connector)
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}
