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


// combox.js
// ==================================================
// Author: lute
// Last modified: 2015-02-24
// ==================================================

+function($) {
  'use strict';

  var Combox = function(element, options) {
    this.$element = $(element)
    this.$container = null
    this.$optionContainer = null
    this.$backdrop = null
    this.options = options
    this.menuOpen = false
  }

  Combox.DEFAULTS = {
    placeholder   : '请选择',
    clazz         : '',
    columns       : 3,
    optionIconSize: 48
  }

  Combox.prototype.init = function() {
    this.$element.css({ display: 'none', opacity: 0 })

    var container = '<div class="combox-container">' +
                      '<a href="javascript: void(0)" class="combox-current ' + this.options.clazz + '" data-role="currentOption">' +
                        '<span class="combox-chosen">' + this.options.placeholder + '</span>' +
                        '<span class="icon icon-chevron-down combox-menu-indicator">' +
                      '</a>' + 
                      '<div class="option-container fade"></div>' +
                    '</div>'

    this.$container = $(container).insertAfter(this.$element)
    this.$optionContainer = this.$container.find('.option-container')

    // construct option sudoku
    var $lis = this.$element.find('li')
    var rowCount = Math.ceil($lis.length / this.options.columns)
    var makeup = rowCount * this.options.columns - $lis.length

    for(var i = 1; i <= rowCount; i++) {
      $('<div class="combox-option-row" />').appendTo(this.$optionContainer)

      var row = $lis.slice((i - 1) * this.options.columns, i * this.options.columns)
      for(var j = 0; j < row.length; j++) {
        var $option = $(row[j]).children()
        $(this.constructOption($option)).appendTo(this.$container.find('.combox-option-row').last())
      }
    }

    for(var k = 0; k < makeup; k++) {
      $(this.constructOption()).appendTo(this.$container.find('.combox-option-row').last())
      if(k === 0) this.$container.find('.combox-option').last().append('<i class="option-horizontal-dots"></i>')
    }

    var that = this
    this.$container.on('tap', '[data-role="currentOption"]', $.proxy(this.toggle, this))
    this.$container.on('tap', '[data-role="comboxOption"]', function() {
      var currentIndex = $('.combox-option').index($(this))
      var $currentTarget = $(that.$element.find('li')[currentIndex]).children()
      var e = $.Event('fancy:combox:choose', { relatedTarget: $currentTarget[0] })

      // close menu
      that.closeMenu()
      // switch combox chosen text
      that.$container.find('.combox-chosen').text($(this).text())
      // tigger menu chosen event
      that.trigger(e)
    })
  }

  Combox.prototype.constructOption = function(option) {
    var anchor = ''
    if(option) {
      var icon = option.data('icon') ?
        '<img src="' + option.data('icon') + '" style="' +
          'width: ' + this.options.optionIconSize + 'px;' +
          'height: ' + this.options.optionIconSize + 'px;' +
          'display: block;' +
        '">' : ''
      var text = option.text()
      var disabled = option.data('disabled')

      if(disabled) anchor = '<a href="javascript: void(0)" class="combox-option" disabled>' +
                              icon + text + '</a>'
      else anchor = '<a href="javascript: void(0)" class="combox-option" data-role="comboxOption" data-target="' +
                      option.attr('href') + '">' + icon + text + '</a>'

    } else {
      anchor = '<a href="javascript: void(0)" class="combox-option" disabled></a>'
    }
    return anchor
  }

  Combox.prototype.toggle = function() {
    this.menuOpen ? this.closeMenu() : this.showMenu()
  }

  Combox.prototype.showMenu = function() {
    var that = this
    var e = $.Event('fancy:combox:open')
    this.$element.trigger(e)

    if(this.menuOpen || e.isDefaultPrevented()) return
    this.menuOpen = true

    this.$container.addClass('combox-menu-open')

    this.backdrop(function() {
      var transition = $.support.transition && that.$optionContainer.hasClass('fade')
      that.$optionContainer.show()

      // calculate sudoku cell width
      var width = that.$optionContainer[0].offsetWidth / that.options.columns
      that.$container.find('.combox-option').each(function() {
        $(this).css('width', width + 'px')
      })

      if(transition) that.$optionContainer[0].offsetWidth  // force reflow
      that.$optionContainer.addClass('in')

      var e = $.Event("fancy:combox:opend")
      transition ?
        that.$optionContainer.one($.support.transition.end, function() {
          that.$element.trigger(e)
        }).emulateTransitionEnd(150) : that.$optionContainer.trigger(e)
    })
  }

  Combox.prototype.closeMenu = function(e) {
    if(e) e.preventDefault()

    e = $.Event('fancy:combox:close')
    this.$element.trigger(e)

    if(!this.menuOpen || e.isDefaultPrevented()) return

    this.menuOpen = false
    this.$container.removeClass('combox-menu-open')
    this.$optionContainer.removeClass('in')

    $.support.transition && this.$optionContainer.hasClass('fade') ?
      this.$optionContainer.one($.support.transition.end, $.proxy(this.hideMenu, this))
                           .emulateTransitionEnd(150) :
      this.hideMenu()
  }

  Combox.prototype.hideMenu = function() {
    var that = this
    this.$optionContainer.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:combox:closed')
    })
  }

  Combox.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$container.find('.option-container').hasClass('fade') ? 'fade' : ''
    if(this.menuOpen) {
      var doAnimate = $.support.transition && animate
      this.$backdrop = $('<div class="backdrop ' + animate + '" />')
        .appendTo($(document.body))
      this.$backdrop.one('tap', $.proxy(this.closeMenu, this))

      if(doAnimate) this.$backdrop[0].offsetWidth  // force reflow
      this.$backdrop.addClass('in')

      if(!callback) return

      doAnimate ?
        this.$backdrop
          .one($.support.transition.end, callback)
          .emulateTransitionEnd(150) :
        callback()
    } else if(!this.menuOpen && this.$backdrop) {
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

  Combox.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var options = $.extend({}, Combox.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var data = $this.data('fancy.combox')

      if(!data) $this.data('fancy.combox', (data = new Combox(this, options)))
      data.init()
    })
  }

  var old = $.fn.combox

  $.fn.combox = Plugin
  $.fn.combox.Constructor = Combox

  $.fn.combox.noConflict = function() {
    $.fn.combox = old
    return this
  }

}(window.Zepto);

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

    this.$target.find('input[type="radio"]').one('change', $.proxy(this.select, this))

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

    e = $.Event('fancy:drawerselector:selected', { id: id, val: value })

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

  $(document).on('tap', '[data-toggle="drawerselector"]', function() {
    var $this = $(this)
    var option = $this.data('fancy.drawerselector') ? 'toggle' : $.extend({}, $this.data())

    Plugin.call($this, option)
  })

}(window.Zepto)
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


// modal.js
// ==================================================

+function($) {
  'use strict'

  var Modal = function(element, options) {
    this.$element = $(element)
    this.$target = $(this.$element.data('target') || this.$element.attr('href'))
    this.$doc =$(document.body)
    this.options = options
    this.$backdrop = 
    this.isOpen = null
  }

  Modal.DEFAULTS  = {

  }

  Modal.prototype.toggle = function() {
    this.isOpen ? this.close() : this.open()
  }

  Modal.prototype.open = function() {
    var that = this
    var e = $.Event('fancy:modal:open')
    this.$element.trigger(e)
    
    if(this.isOpen || e.isDefaultPrevented()) return
    
    this.isOpen = true
    this.$doc.addClass('modal-open')
    
    this.$target.one('tap', '[data-dismiss="modal"]', $.proxy(this.close, this))
    
    this.backdrop(function() {
      var transition = $.support.transition && that.$target.hasClass('fade')
      that.$target.show().scrollTop(0)
      
      if(transition) that.$target[0].offsetWith // reflow
      that.$target.addClass('in')
      
      var e = $.Event('fancy:modal:opend')
      
      transition ? 
        that.$target.find('.modal-dialog').one($.support.transition.end, function() {
          that.$target.trigger('focus').trigger(e)
        }).emulateTransitionEnd(300) : that.$target.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.close = function(e) {
    if(e) e.preventDefault()
    
    e = $.Event('fancy:modal:close')
    this.$element.trigger(e)
    
    if(!this.isOpen || e.isDefaultPrevented()) return

    this.isOpen = false
    this.$doc.removeClass('modal-open')
    this.$target.removeClass('in')
    
    $.support.transition && this.$target.hasClass('fade') ? 
      this.$target.one($.support.transition.end, $.proxy(this.hideDialog, this)).emulateTransitionEnd(300) :
      this.hideDialog()
  }

  Modal.prototype.hideDialog = function() {
    var that = this
    this.$target.hide()
    this.backdrop(function() {
      that.$element.trigger('fancy:modal:hidden')
    });
  }

  Modal.prototype.backdrop = function(callback) {
    var that = this
    var animate = this.$target.hasClass('fade') ? 'fade' : ''

    if (this.isOpen) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="backdrop ' + animate + '" />')
        .appendTo(this.$doc)
      
      this.$target.one('tap', $.proxy(function(e) {
        if(e.target !== e.currentTarget) return
        this.close.call(this)
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth; // force reflow
      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one($.support.transition.end, callback)
          .emulateTransitionEnd(150) :
        callback()

    } else if (!this.isOpen && this.$backdrop) {
      this.$backdrop.removeClass('in')
      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$backdrop.hasClass('fade') ?
        this.$backdrop
          .one($.support.transition.end, callbackRemove)
          .emulateTransitionEnd(150) :
        callbackRemove()
    } else if (callback) {
      callback()
    }
  };
  
  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  };

  var old = $.fn.modal

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.modal')
      var options = $.extend({}, $this.data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.modal', (data = new Modal(this, options)))
      if(typeof option == 'string') data[option]()
      else data.open()
    })
  }

  $.fn.modal = Plugin
  $.fn.modal.noConflict = function() {
    $.fn.modal = old
    return this
  }

  $(document).on('tap', '[data-toggle="modal"]', function() {
    var $this = $(this)
    var option = $this.data('fancy.modal') ? 'toggle' : $.extend({}, $this.data())

    Plugin.call($this, option)
  })

}(window.Zepto)


// segmented-control.js
// ==================================================

+function($) {
  'use strict'

  var SegmentedControl = function(element) {
    this.$element = $(element)
  }

  SegmentedControl.prototype.switch = function() {
    
    var $this = this.$element
    var $controlContainer = $this.closest('.segmented-control')
    var $target = $($this.data('target') || $this.attr('href'))
    var $contentContainer = $target.closest('.segmented-content')

    // if tab the active control, do nothing
    if($this.hasClass('active')) return

    var $previousControl = $controlContainer.find('.active')
    var $previousContent = $contentContainer.find('.active')
    var e = $.Event('fancy:segmentedcontrol:switching')

    $this.trigger(e)

    // switch control
    $previousControl.removeClass('active')
    $this.addClass('active')

    // switch content
    $previousContent.removeClass('active')
    $target.addClass('active')

    $this.trigger('fancy:segmentedcontrol:switched')
  }

  var old = $.fn.SegmentedControl

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.segmentedcontrol')

      if(!data) $this.data('fancy.segmentedcontrol', (data = new SegmentedControl(this)))
      if(typeof option == 'string') data[option]()
    })
  }

  $.fn.segmentedControl = Plugin
  $.fn.segmentedControl.constructor = SegmentedControl

  $.fn.segmentedControl.noConflict = function() {
    $.fn.segmentedControl = old
    return this
  }

  $(document).on('tap', '[data-toggle="segmented"]', function(e) {
    e.preventDefault()
    Plugin.call($(this), 'switch')
  })

}(window.Zepto)
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
  
}(window.Zepto)

