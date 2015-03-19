// dropwizard.js
// ==================================================
// Author        : lute
// Last modified : 2015-03-13 10:33
// Style         : ../scss/plugins/_dropwizard.scss
// Dependency    : tabs style
// ==================================================

+function($) {
  'use strict';

  var Dropwizard = function(element, options) {
    this.$element = $(element)
    this.$target = $($(element).data('target') || $(element).attr('href'))
    this.$ul = $(element).closest('ul')
    this.$backdrop = null
    this.options = options
    this.isOpen = null

    this.$target.on('tap', '[data-direct]', $.proxy(this.direct, this))
    this.$target.on('tap', '[data-confirm="dropwizard"]', $.proxy(this.confirm, this))
  }

  Dropwizard.DEFAULTS = {
    maxTextLength: 6
  }

  Dropwizard.prototype.toggle = function() {
    this.isOpen ? this.close() : this.open()
  }

  Dropwizard.prototype.open = function() {
    var $this = this.$element
    var that = this

    var e = $.Event('fancy:dropwizard:open')
    $this.trigger(e)
    if(e.isDefaultPrevented()) return

    // Checking sibling menu open
    var previous = this.$ul.find('.open > a')[0]
    if(previous) this.switchOpen(previous)

    this.isOpen = true
    this.backdrop(function() {
      var transition = $.support.transition && that.$target.hasClass('fade')
      that.$element.parent().addClass('open')
      that.$target.addClass('active')

      if(transition) that.$target[0].offsetWidth  // force reflow
      that.$target.addClass('in')

      var e = $.Event('fancy:dropwizard:opend', { relatedTarget: that.$target[0] })
      transition ?
        that.$target
          .one($.support.transition.end, function() { that.$element.trigger(e) })
          .emulateTransitionEnd(150) :
        that.$element.trigger(e)
    })
  }

  Dropwizard.prototype.close = function() {
    var e = $.Event('fancy:dropwizard:close')
    this.$element.trigger(e)

    if(e.isDefaultPrevented()) return
    this.isOpen = false
    this.$element.parent().removeClass('open')
    this.$target.removeClass('in')
    $('.dropwizard-backdrop').remove()

    $.support.transition && this.$target.hasClass('fade') ?
      this.$target
        .one($.support.transition.end, $.proxy(this.hideDropwizardMenu, this))
        .emulateTransitionEnd(300) :
      this.hideDropwizardMenu()
  }

  Dropwizard.prototype.hideDropwizardMenu = function() {
    var that = this
    this.$target.removeClass('active')
    this.backdrop(function() {
      that.$element.trigger('fancy:dropwizard:closed')
    })
  }

  Dropwizard.prototype.switchOpen = function(el) {
    var $prev = $(el)
    var $prevTarget = $($prev.data('target') || $prev.attr('href'))

    $prev.parent().removeClass('open')
    $prev.data('fancy.dropwizard').isOpen = false
    $prevTarget.removeClass('in')

    $.support.transition && $prevTarget.hasClass('fade') ?
      $prevTarget
        .one($.support.transition.end, function() { $(this).removeClass('active') })
        .emulateTransitionEnd(300) :
      $prevTarget.removeClass('active')
  }

  Dropwizard.prototype.direct = function(e) {
    e.preventDefault()

    var $this = $(e.target)
    var $direct = $($this.data('direct'))
    e = $.Event('fancy:dropwizard:direct', { relatedTarget: $direct[0] })
    $this.trigger(e)

    if($direct.hasClass('active')) return
    var $menu = $this.closest('ul')
    var $active = $menu.find('.active')

    if($active.length) $($active.removeClass('active').children().data('direct')).removeClass('active')
    $this.parent().addClass('active')
    $direct.addClass('active')

    e = $.Event('fancy:dropwizard:directed', { relatedTarget: $direct[0] })
    $this.trigger(e)
  }

  Dropwizard.prototype.confirm = function(e) {
    var $this = $(e.target)
    var text = $this.text().trim()

    // deactive all uls' active li in current dropwizar-menu
    $this.closest('.dropwizard-menu').find('.menu li.active').each(function() {
      if($(this).children().data('confirm')) $(this).removeClass('active')
    })
    $this.parent().addClass('active')

    this.$ul
      .find('.open > a > span')
      .text(text.length > this.options.maxTextLength ?
        text.substring(0, this.options.maxTextLength - 1) + '...' :
        text
      )

    this.$ul.find('.open > a').trigger('tap').trigger('fancy:dropwizard:confirm')
  }

  Dropwizard.prototype.backdrop = function(callback) {
    var that = this

    if(this.isOpen) {

      // Check backdrop existence for dorpdown menu switch
      if(!$('.backdrop.dropwizard-backdrop').length) {
        this.$backdrop = $('<div class="backdrop fade in dropwizard-backdrop" />')
          .appendTo($(document.body))

        this.$backdrop.one('tap', function(e) {
          if(e.target !== e.currentTarget) return
          that.$ul.find('.open > a').trigger('tap')
        })
      }

      if(!callback) return
      callback()
    } else if(callback) {
      callback()
    }
  }

  Dropwizard.prototype.removeBackdrop = function() {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  var old = $.fn.dropwizard

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.dropwizard')
      var options = $.extend({}, Dropwizard.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if(!data) $this.data('fancy.dropwizard', (data = new Dropwizard(this, options)))
      if(typeof option == 'string') data[option]()
    })
  }

  $.fn.dropwizard = Plugin
  $.fn.dropwizard.noConflict = function() {
    $.fn.dropwizard = old
    return this
  }

  $(document).on('tap', '[data-toggle="dropwizard"]', function(e) {
    e.preventDefault()
    Plugin.call($(this), 'toggle')
  })

}(window.Zepto);
