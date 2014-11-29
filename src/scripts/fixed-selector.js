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

    this.$element.on('tap.select.fancy.fixed-selector', '.selector-item', $.proxy(this.selectMenu, this))
  }

  FixedSelector.prototype.toggle = function(_relatedTarget) {
    this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  FixedSelector.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('open.fancy.fixed-selector', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$element.one('tap.dismiss.fancy.fixed-selector', '[data-dismiss="fixed-selector"]', $.proxy(this.close, this))
    this.$element.on('tap.confirm.fancy.fixed-selector', '[data-confirm="fixed-selector"]', $.proxy(this.confirm, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth
      that.$element.addClass('in')

      var e = $.Event('opend.fancy.fixed-selector')

      transition ?
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  FixedSelector.prototype.close = function(e) {
    if(e) e.preventDefault()

    e = $.Event('close.fancy.fixed-selector')
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
      that.$element.off('tap.confirm.fancy.fixed-selector')
      that.$element.trigger('closed.fancy.fixed-selector')
    })
  }

  FixedSelector.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if(this.isOpen) {
      var transition = $.support.transition
      this.$backdrop = $('<div class="backdrop ' + animate + '"/>')
        .appendTo(this.$doc)
        .one('tap.dismiss.fancy.fixed-selector', $.proxy(this.close, this))

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
    var placeholder = ''

    this.$element.find('.selector-group').each(function() {
      var $menu = $(this)

      $($menu.data('valueback')).val($menu.find('.active').children().data('value'))
      placeholder = placeholder.concat($menu.find('.active').children().text() + ' ')
    })

    $(this.options.feedback).val(placeholder)
    this.close()
  }

  var old = $.fn.FixedSelector

  function Plugin(option, _relatedTarget) {
    return this.each(function() {
      var $this = $(this),
        data = $(this).data('fancy.fixed-selector'),
        options = $.extend({}, $(this).data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.fixed-selector', (data = new FixedSelector(this, options)))
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

  $(document).on('tap.fancy.fixed-selector', '[data-toggle="fixed-selector"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $this.data('fancy.fixed-selector') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto || window.jQuery)

