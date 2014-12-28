// fullcover.js
// ==================================================

+function($) {
  'use strict'

  var Fullcover = function(element, options) {
    this.$element = $(element)
    this.$target = $(this.$element.data('target') || this.$element.attr('href'))
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop = null
    this.isOpen = null
  }

  Fullcover.DEFAULTS = {

  }

  Fullcover.prototype.open = function() {

    var that = this
    var e = $.Event('fancy:fullcover:open')
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.backdrop(function() {
      var transition = $.support.transition && that.$target.hasClass('fade')
      that.$target.show()

      if(transition) that.$target[0].offsetWidth // reflow
      that.$target.addClass('in')

      var e = $.Event('fancy:fullcover:opend')

      transition ? 
        that.$target.one($.support.transition.end, function() {
          that.$target.trigger(e)
        }).emulateTransitionEnd(300) : that.$target.trigger(e)
    })
  }

  Fullcover.prototype.close = function(callback) {
    var e = $.Event('fancy:fullcover:close')
    this.$element.trigger(e)

    if(!this.isOpen) return
    this.isOpen = false

    this.$target.removeClass('in')

    $.support.transition ?
      this.$target
        .one($.support.transition.end, $.proxy(this.hideCover, this, callback))
        .emulateTransitionEnd(300) :
      this.hideCover(callback)
  }

  Fullcover.prototype.hideCover = function(callback) {
    var that = this
    this.$target.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:fullcover:closed')
      callback && callback()
    })
  }

  Fullcover.prototype.backdrop = function(callback) {
   var that = this
   var animate = this.$target.hasClass('fade') ? 'fade' : ''

   if(this.isOpen) {
    var transition = $.support.transition
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

  Fullcover.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    
  }

  var old = $.fn.fullcover

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.fullcover')
      var options = $.extend({}, Fullcover.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.fullcover', (data = new Fullcover(this, options)))
      if(typeof option == 'string') data[option]()
      else data.open()
    })
  }

  $.fn.fullcover = Plugin

  $.fn.fullcover.noConflict = function() {
    $.fn.fullcover = old
    return this
  }

  $(document).on('tap', '[data-toggle="fullcover"]', function() {
    var $this = $(this)
    var options = $this.data('fancy.fullcover') ? 'toggle' : $.extend({}, $this.data())

    Plugin.call($this, options)
  })

}(window.Zepto)