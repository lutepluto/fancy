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

    if(this.options.feedback) this.$element.on('click.select.fancy.actionsheet', '.actionsheet-feedback', $.proxy(this.select, this))
  }

  Actionsheet.prototype.toggle = function(_relatedTarget) {
    return this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  Actionsheet.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('open.fancy.actionsheet', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$element.one('click.dismiss.fancy.actionsheet', '[data-dismiss="actionsheet"]', $.proxy(this.close, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth // reflow
      that.$element.addClass('in')

      var e = $.Event('opend.fancy.actionsheet')

      transition ? 
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  Actionsheet.prototype.close = function(e) {
    if(e) e.preventDefault()
    e = $.Event('close.fancy.actionsheet')
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
      that.$element.trigger('closed.fancy.actionsheet')
    })
  }

  Actionsheet.prototype.backdrop = function(callback) {
   var that = this
   var animate = this.$element.hasClass('fade') ? 'fade' : ''

   if(this.isOpen) {
    var transition = $.support.transition
    this.$backdrop = $('<div class="backdrop ' + animate + '"/>')
      .appendTo(this.$doc)
      .one('click.dismiss.fancy.actionsheet', $.proxy(this.close, this))

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

    var e = $.Event('select.fancy.actionsheet', { relateTarget: this.options.feedback })
    this.$element.trigger(e)

    var text = $(evt.target).text(),
        value = $(evt.target).data('value')
    $(this.options.feedback).val(text)
    this.options.valueback && $(this.options.valueback).val(value)

    this.$backdrop.trigger('click')
    this.$element.trigger('selected.fancy.actionsheet')
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

  $(document).on('click.fancy.actionsheet.data-api', '[data-toggle="actionsheet"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $target.data('fancy.actionsheet') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto || window.jQuery)


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

    this.$element.one('click.dismiss.fancy.fixed-selector', '[data-dismiss="fixed-selector"]', $.proxy(this.close, this))

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

    if(this.isOpen) return
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
        .one('click.dismiss.fancy.fixed-selector', $.proxy(this.close, this))

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
      $.support.transition && this.$backdrop.hasClass('in') ?
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

  $(document).on('click.fancy.fixed-selector', '[data-toggle="fixed-selector"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $this.data('fancy.fixed-selector') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto || window.jQuery)


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

    this.$element.on('tap.switch.fancy.gear-selector', '.selector-item', $.proxy(this.switchMenu, this))
  }

  GearSelector.prototype.toggle = function(_relatedTarget) {
    this.isOpen ? this.close() : this.open(_relatedTarget)
  }

  GearSelector.prototype.open = function(_relatedTarget) {
    var that = this
    var e = $.Event('open.fancy.gear-selector', { relateTarget: _relatedTarget })
    this.$element.trigger(e)

    if(this.isOpen) return
    this.isOpen = true

    this.$element.one('tap.dismiss.fancy.gear-selector', '[data-dismiss="gear-selector"]', $.proxy(this.close, this))
    this.$element.on('tap.confirm.fancy.gear-selector', '[data-confirm="gear-selector"]', $.proxy(this.confirm, this))

    this.backdrop(function() {
      var transition = $.support.transition && that.$element.hasClass('fade')
      that.$element.show()

      if(transition) that.$element[0].offsetWidth
      that.$element.addClass('in')

      var e = $.Event('opend.fancy.gear-selector')

      transition ?
        that.$element.one($.support.transition.end, function() {
          that.$element.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger('focus').trigger(e)
    })
  }

  GearSelector.prototype.close = function(e) {
    if(e) e.preventDefault()

    e = $.Event('close.fancy.gear-selector')
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
      that.$element.off('tap.confirm.fancy.gear-selector')
      that.$element.trigger('closed.fancy.gear-selector')
    })
  }

  GearSelector.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if(this.isOpen) {
      var transition = $.support.transition
      this.$backdrop = $('<div class="backdrop ' + animate + '"/>')
        .appendTo(this.$doc)
        .one('tap.dismiss.fancy.gear-selector', $.proxy(this.close, this))

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
        success: function(data) {
          // TODO json data parse
        }
      }).done(function() {
        $(submenu).addClass('active')
      })
    }
  }

  GearSelector.prototype.confirm = function() {

    var placeholder = '',
      selectAll = true

    this.$element.find('.selector-group.active').each(function() {
      var $menu = $(this)

      $($menu.data('valueback')).val($menu.find('.active').children().data('value'))
      var text = $menu.find('.active').children().text() + ' '
      if(text.trim() != 'null') {
        placeholder = placeholder.concat(text)
      } else {
        selectAll = false
        return false
      }
    })

    if(selectAll) {
      $(this.options.feedback).val(placeholder)
      this.close()
    }
  }

  var old = $.fn.GearSelector

  function Plugin(option, _relatedTarget) {
    return this.each(function() {
      var $this = $(this),
        data = $(this).data('fancy.gear-selector'),
        options = $.extend({}, $(this).data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.gear-selector', (data = new GearSelector(this, options)))
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

  $(document).on('tap.fancy.gear-selector', '[data-toggle="gear-selector"]', function() {
    var $this = $(this)
    var $target = $($this.data('target'))
    var options = $this.data('fancy.gear-selector') ? 'toggle' : $.extend({}, $target.data(), $this.data())

    Plugin.call($target, options, this)
  })

}(window.Zepto || window.jQuery)


// transition.js
// http://www.modernizr.com/
// Recommend reading http://blog.alexmaccaw.com/css-transitions
// ==================================================

+function($) {
  'use strict'

  function transitionEnd() {
    var el = document.createElement('fancy')

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd',
      'MozTransition'    : 'transitionend',
      'OTransition'      : 'oTransitionEnd otransitionend',
      'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }
  }

  $.fn.emulateTransitionEnd = function(duration) {
    var called = false, $el = this
    $(this).one($.support.transition.end, function() { called = true })
    var callback = function() { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function() {
    $.support.transition = transitionEnd()
  })
  
}(window.Zepto || window.jQuery)

