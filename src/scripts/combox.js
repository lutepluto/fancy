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
                        '<span class="icon icon-chevron-down icon-small combox-menu-indicator">' +
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
      that.$element.trigger(e)
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

      var e = $.Event('fancy:combox:opend')
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
