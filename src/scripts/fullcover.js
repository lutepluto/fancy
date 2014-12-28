// fullcover.js
// ==================================================

+function($) {
  'use strict'

  var Fullcover = function(element, options) {
    this.$element = $(element)
    this.target = this.$element.data('target') || this.$element.attr('href')
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop = null
    this.$target = null
    this.isOpen = null
  }

  Fullcover.DEFAULTS = {

  }

  Fullcover.prototype.toggle = function() {
    this.isOpen ? this.close() : this.open()
  }

  Fullcover.prototype.open = function() {
    var that = this
    var e = $.Event('fancy:fullcover:open')
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    var transition = $.support.transition

    var cover = '<div id="' + this.target.substring(1) + '" class="full-cover fade"></div>'
    this.$target = $(cover).appendTo(this.$doc)

    this.$element.trigger('fancy:fullcover:opening')

    if(transition) this.$target[0].offsetWidth // reflow
    this.$target.addClass('in')

    e = $.Event('fancy:fullcover:opend')

    transition ? 
      this.$target.one($.support.transition.end, function() {
        that.$target.trigger(e)
      }).emulateTransitionEnd(300) : that.$target.trigger(e)
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
    this.$target.remove()
    this.$element.trigger('fancy:fullcover:closed')
    callback && callback()
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