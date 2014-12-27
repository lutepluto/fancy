// fixed-selector.js
// ==================================================

+function($) {
  'use strict'

  var FixedSelector = function(element, options) {
    this.$element = $(element)
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop = 
    this.isOpen = null

    this.$element.on('tap', '.selector-item', $.proxy(this.selectMenu, this))
  }

  FixedSelector.DEFAULTS = {

  }

  FixedSelector.prototype.toggle = function(_relatedTarget) {
    this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  FixedSelector.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('fancy:fixedselector:open', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$element.one('tap', '[data-dismiss="fixedselector"]', $.proxy(this.close, this))
    this.$element.one('tap', '[data-confirm="fixedselector"]', $.proxy(this.confirm, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth
      that.$element.addClass('in')

      var e = $.Event('fancy:fixedselector:opend')

      transition ?
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  FixedSelector.prototype.close = function(e) {
    if(e) e.preventDefault()

    e = $.Event('fancy:fixedselector:close')
    this.$element.trigger(e)

    if(!this.isOpen) return
    this.isOpen = false

    this.$element.removeClass('in')

    $.support.transition ?
      this.$element
        .one($.support.transition.end, $.proxy(this.hideSelector, this))
        .emulateTransitionEnd(300) :
      this.hideSelector()
  }

  FixedSelector.prototype.hideSelector = function() {
    var that = this
    this.$element.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:fixedselector:closed')
    })
  }

  FixedSelector.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

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
        callback()
    } else if(callback) {
      callback()
    }
  }

  FixedSelector.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  FixedSelector.prototype.selectMenu = function(evt) {
    if(evt.target !== evt.currentTarget) return

    var $menu = $(evt.target)
    $menu.closest('.selector-group').find('.active').removeClass('active')
    $menu.parent().addClass('active')
  }

  FixedSelector.prototype.confirm = function() {
    var valueStack = []

    this.$element.find('.selector-group').each(function() {
      var $menu = $(this)

      valueStack.push({id:$menu.find('.active').children().data('value'), val: $menu.find('.active').children().text() })
    })

    this.close()
    var e = $.Event('fancy:fixedselector:confirm', { values: valueStack })
    this.$element.trigger(e)
  }

  var old = $.fn.FixedSelector

  function Plugin(option, _relatedTarget) {
    return this.each(function() {
      var $this = $(this),
        data = $(this).data('fancy.fixedselector'),
        options = $.extend({}, $(this).data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.fixedselector', (data = new FixedSelector(this, options)))
      if(typeof option == 'string') data[option](_relatedTarget)
      else data.open(_relatedTarget)
    })
  }

  $.fn.fixedSelector = Plugin
  $.fn.fixedSelector.constructor = FixedSelector

  $.fn.fixedSelector.noConflict = function() {
    $.fn.fixedSelector = old
    return this
  }

  $(document).on('tap', '[data-toggle="fixedselector"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $this.data('fancy.fixedselector') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto)

