// alert.js
// ==================================================
// This is a just most simple and ineffecient way to 
// diplay alert on document and it should be rewritten
// using a more advanced skill like react animation.

+function (window, document) {
  'use strict'

  var utils = (function() {
    var me = {}

    me.animation = (function animationEnd() {
      var _elementStyle = document.createElement('div').style
      var animations = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
      }

      for(var key in animations) {
        if(_elementStyle[key] !== undefined) {
          return { end: animations[key] }
        }
      }
    }())

    me.extend = function() {
      var objects = Array.prototype.slice.call(arguments).slice(1)
      var target = arguments[0]
      for(var index in objects) {
        var obj = objects[index]
        for(var key in obj) {
          if(obj.hasOwnProperty(key)) {
            target[key] = obj[key]
          }
        }
      }

      return target
    }

    me.hasClass = function(el, className) {
      var re = new RegExp('(^|\\s)' + className + '(\\s|$)')
      return re.test(el.className)
    }

    me.addClass = function(el, className) {
      if(className && !me.hasClass(el, className)) {
        var newclass = el.className.split(' ')
        newclass.push(className)
        el.className = newclass.join(' ')
      }
    }

    me.removeClass = function(el, className) {
      if(me.hasClass(el, className)) {
        var re = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g')
        el.className = el.className.replace(re, ' ')
      }
    }

    return me
  }())

  var defaults = {
    duration: 240,
    wait: 2000,
    type: 'danger'
  }

  var Alert = function(options) {
    this.options = utils.extend({}, defaults, options)

    if(this._requestTransition()) {
      this.el = this._build()
      this.transitionIn()
    }
  }

  Alert.prototype._build = function() {
    var el = document.createElement('div')
    utils.addClass(el, 'alert')
    utils.addClass(el, this.options.type)
    el.textContent = this.options.content
    document.body.appendChild(el)
    return el
  }

  Alert.prototype._requestTransition = function() {
    return document.querySelectorAll('.alert').length === 0
  }

  Alert.prototype.transitionIn = function() {

    var endListener = function(e) {
      if(e && e.target !== this.el) {
        return
      }
      utils.removeClass(this.el, 'alert-in')
      this.el.removeEventListener(utils.animation.end, endListener)

      setTimeout(this.transitionOut.bind(this), this.options.wait)
    }

    utils.addClass(this.el, 'alert-in')
    this.el.addEventListener(utils.animation.end, endListener.bind(this), false)
  }

  Alert.prototype.transitionOut = function() {

    var endListener = function(e) {
      if(e && e.target !== this.el) {
        return
      }

      this.el.removeEventListener(utils.animation.end, endListener)
      if(this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el)
      }
    }

    utils.addClass(this.el, 'alert-out')
    this.el.addEventListener(utils.animation.end, endListener.bind(this), false)
  }

  Alert.utils = utils

  window.FancyAlert = Alert

}(window, document)