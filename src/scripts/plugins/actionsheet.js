// actionsheet.js
// ==================================================

+function($) {
  'use strict'

  var Actionsheet = function(element, options) {
    this.$element = $(element)
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop =
    this.isOpen = null
  }

  Actionsheet.prototype.toggle = function(_relatedTarget) {
    this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  Actionsheet.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('fancy:actionsheet:open', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    // dismiss handler
    this.$element.one('tap', '[data-dismiss="actionsheet"]', $.proxy(this.close, this))

    // value handle
    this.$element.one('tap', '[data-value]', $.proxy(this.select, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth // reflow
      that.$element.addClass('in')

      var e = $.Event('fancy:actionsheet:opend')

      transition ? 
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  Actionsheet.prototype.close = function(e) {
    if(e) e.preventDefault()
    e = $.Event('fancy:actionsheet:close')
    this.$element.trigger(e)

    if(!this.isOpen) return
    this.isOpen = false

    this.$element.removeClass('in')

    $.support.transition ?
      this.$element
        .one($.support.transition.end, $.proxy(this.hideActionsheet, this))
        .emulateTransitionEnd(300) :
      this.hideActionsheet()
  }

  Actionsheet.prototype.hideActionsheet = function() {
    var that = this
    this.$element.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:actionsheet:closed')
    })
  }

  Actionsheet.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if(this.isOpen) {
      var transition = $.support.transition && animate
      this.$backdrop = $('<div class="backdrop ' + animate + '"/>')
        .appendTo(this.$doc)
        .one('tap', $.proxy(this.close, this))

      if(transition) this.$backdrop[0].offsetWidth

      this.$backdrop.addClass('in')

      if(!callback) return

      transition ? this.$backdrop
        .one($.support.transition.end, callback)
        .emulateTransitionEnd(150) : callback()
    } else if(!this.isOpen && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function() {
        that.removeBackdrop()
        callback && callback()
      }

      $.support.transition && this.$backdrop.hasClass('fade') ? 
        this.$backdrop
          .one($.support.transition.end, callbackRemove)
          .emulateTransitionEnd(150) :
        callbackRemove()
    } else if(callback) {
      callback()
    }
  }

  Actionsheet.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Actionsheet.prototype.select = function(evt) {
    if(evt.target !== evt.currentTarget) return

    var $action = $(evt.target)
    var value = $action.text(),
        id = $action.data('value')
    var e = $.Event('fancy:actionsheet:selected', { id: id, val: value })

    this.close()
    this.$element.trigger(e)
  }

  var old = $.fn.actionsheet

  function Plugin(option, _relatedTarget) {
    return this.each(function() {
      var $this = $(this),
        data = $(this).data('fancy.actionsheet'),
        options = $.extend({}, $(this).data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.actionsheet', (data = new Actionsheet(this, options)))
      if(typeof option == 'string') data[option](_relatedTarget)
      else data.open(_relatedTarget)
    })
  }

  $.fn.actionsheet = Plugin
  $.fn.actionsheet.constructor = Actionsheet

  $.fn.actionsheet.noConflict = function() {
    $.fn.actionsheet = old
    return this
  }

  $(document).on('tap', '[data-toggle="actionsheet"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $target.data('fancy.actionsheet') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto)

