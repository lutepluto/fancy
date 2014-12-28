// gear-selector.js
// ==================================================

+function($) {
  'use strict'

  var GearSelector = function(element, options) {
    this.$element = $(element)
    this.$doc = $(document.body)
    this.options = options
    this.$backdrop = 
    this.isOpen = null

    this.$element.on('tap', '.selector-item', $.proxy(this.switchMenu, this))
  }

  GearSelector.DEFAULTS = {

  }

  GearSelector.prototype.toggle = function(_relatedTarget) {
    this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  GearSelector.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('fancy:gearselector:open', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$element.one('tap', '[data-dismiss="gearselector"]', $.proxy(this.close, this))
    this.$element.one('tap', '[data-confirm="gearselector"]', $.proxy(this.confirm, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth
      that.$element.addClass('in')

      var e = $.Event('fancy:gearselector:opend')

      transition ?
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  GearSelector.prototype.close = function(e) {
    if(e) e.preventDefault()

    e = $.Event('fancy:gearselector:close')
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

  GearSelector.prototype.hideSelector = function() {
    var that = this
    this.$element.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:gearselector:closed')
    })
  }

  GearSelector.prototype.backdrop = function(callback) {
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

  GearSelector.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  GearSelector.prototype.switchMenu = function(evt) {
    if(evt.target !== evt.currentTarget) return

    var $menu = $(evt.target),
      submenu = $(evt.target).data('submenu')

    // deactive previous active menu
    var $prev = $menu.closest('.selector-group').find('.active')
    if($prev.length) {
      $prev.removeClass('active')
      var $temp = $prev
      while($temp && $temp.children().data('submenu')) {
        var $next = $($temp.children().data('submenu')).removeClass('active')
        $next.children('.active').length ?
          $temp = $next.children('.active').removeClass('active') : $temp = null
      }
    }

    $menu.parent().addClass('active')
    if(!submenu) return

    // active current menu
    if($(submenu).length) $(submenu).addClass('active')
    else if(this.options.navigation) {
      var url = this.options.navigation,
        params = $menu.data('params')

      $.ajax({
        url: url,
        data: params,
        type: 'GET',
        success: function() {
          // TODO json data parse
        }
      }).done(function() {
        $(submenu).addClass('active')
      })
    }
  }

  GearSelector.prototype.confirm = function() {

    var selectAll = true,
      valueStack = []

    this.$element.find('.selector-group.active').each(function(index) {
      var $menu = $(this)
      var id = $menu.find('.active').children().data('value'),
        value = $menu.find('.active').children().text()

      if(value.trim() != 'null') {
        valueStack.push({ index: index, id: id, val: value })
      } else {
        selectAll = false
        return false
      }
    })

    if(selectAll) {
      this.close()

      var e = $.Event('fancy:gearselector:confirm', { values: valueStack })
      this.$element.trigger(e)
    }
  }

  var old = $.fn.GearSelector

  function Plugin(option, _relatedTarget) {
    return this.each(function() {
      var $this = $(this),
        data = $(this).data('fancy.gearselector'),
        options = $.extend({}, $(this).data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.gearselector', (data = new GearSelector(this, options)))
      if(typeof option == 'string') data[option](_relatedTarget)
      else data.open(_relatedTarget)
    })
  }

  $.fn.gearSelector = Plugin
  $.fn.gearSelector.constructor = GearSelector

  $.fn.gearSelector.noConflict = function() {
    $.fn.gearSelector = old
    return this
  }

  $(document).on('tap', '[data-toggle="gearselector"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $this.data('fancy.gearselector') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto)

