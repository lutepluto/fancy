// drawerselector.js
// ==================================================

+function($) {
  'use strict'

  var Drawerselector = function(element, options) {
    this.$element = $(element)
    this.$target = $(this.$element.data('target') || this.$element.attr('href'))
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop = 
    this.isOpen = null
  }

  Drawerselector.DEFAULTS = {

  }

  Drawerselector.prototype.toggle = function() {
    this.isOpen ? this.close() : this.open()
  }

  Drawerselector.prototype.open = function() {

    var that = this
    var e = $.Event('fancy:drawerselector:open')
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$target.find('input[type="radio"]').on('change', $.proxy(this.select, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$target.hasClass('fade')
      that.$target.show()

      if(transition) that.$target[0].offsetWidth // reflow
      that.$target.addClass('in')

      var e = $.Event('fancy:drawerselector:opend')

      transition ? 
        that.$target.one($.support.transition.end, function() {
          that.$target.trigger(e)
        }).emulateTransitionEnd(300) : that.$target.trigger(e)
    })
  }

  Drawerselector.prototype.close = function(callback) {
    var e = $.Event('fancy:drawerselector:close')
    this.$element.trigger(e)

    if(!this.isOpen) return
    this.isOpen = false

    this.$target.removeClass('in')

    $.support.transition ?
      this.$target
        .one($.support.transition.end, $.proxy(this.hideDrawer, this, callback))
        .emulateTransitionEnd(300) :
      this.hideDrawer(callback)
  }

  Drawerselector.prototype.hideDrawer = function(callback) {
    var that = this
    this.$target.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:drawerselector:closed')
      callback && callback()
    })
  }

  Drawerselector.prototype.backdrop = function(callback) {
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

  Drawerselector.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Drawerselector.prototype.select = function(e) {
    if(e.currentTarget !== e.target) return

    var that = this
    var id = e.target.value
    var value = $(e.target).parents('.item-radio').text()

    var e = $.Event('fancy:drawerselector:selected', { id: id, val: value })

    this.close(function() {
      that.$element.trigger(e)
    })
  }

  var old = $.fn.drawerselector

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.drawerselector')
      var options = $.extend({}, Drawerselector.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.drawerselector', (data = new Drawerselector(this, options)))
      if(typeof option == 'string') data[option]()
      else data.open()
    })
  }

  $.fn.drawerselector = Plugin
  $.fn.drawerselector.constructor = Drawerselector

  $.fn.drawerselector.noConflict = function() {
    $.fn.drawerselector = old
    return this
  }

  $(document).on('tap.fancy.drawerselector', '[data-toggle="drawerselector"]', function(e) {
    var $this = $(this)
    var option = $this.data('fancy.drawerselector') ? 'toggle' : $.extend({}, $this.data())

    Plugin.call($this, option)
  })

}(window.Zepto)