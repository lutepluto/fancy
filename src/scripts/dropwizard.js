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
    this.$target = $(this.$element.data('target') || this.$element.attr('href'))
    this.$drop = $(this.$element.data('drop'))
    this.$body = $(document.body)
    this.options = options
    this.backdrop = new window.Backdrop()
    this.isShown = null

    this.$target.on('tap.direct.fancy.dropwizard', '[data-direct]', $.proxy(this.direct, this))
    this.$target.on('tap.confirm.fancy.dropwizard', '[data-confirm]', $.proxy(this.confirm, this))
  }

  Dropwizard.DEFAULTS = {}

  Dropwizard.prototype.toggle = function() {
    this.isShown ? this.hide() : this.show()
  }

  Dropwizard.prototype.show = function() {
    var e = $.Event('show:fancy:dropwizard')
    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    // If there exists active wizard, then hide the active wizard 
    var $activeWizard = this.$drop.find('.active > [data-toggle="dropwizard"]')
    if (!!$activeWizard.length) $activeWizard.dropwizard('hide')

    var that = this
    this.isShown = true

    // Open backdrop and wizard
    this.backdrop.open(this.$element[0], function() {
      
      that.$element.parent().addClass('active')
      that.$target.addClass('active')

      that.$element.trigger($.Event('shown:fancy:dropwizard'))

    })
  }

  Dropwizard.prototype.hide = function() {
    var e = $.Event('hide:fancy:dropwizard')
    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    // Go to hide
    this.isShown = false
    this.$element.parent().removeClass('active')
    this.$target.removeClass('active')

    var that = this
    this.backdrop.close(function() {
      that.$element.trigger('hidden:fancy:dropwizard')
    })
  }

  Dropwizard.prototype.direct = function(e) {
    e.preventDefault()

    var $direct = $(e.target),
      $directTarget = $($direct.data('direct'))

    // Trigger direct event
    e = $.Event('direct:fancy:dropwizard', { relatedTarget: $direct[0] })
    this.$element.trigger(e)

    if (e.isDefaultPrevented() || $directTarget.hasClass('active')) return

    var $menu = $direct.closest('ul'),
      $activeDirect = $menu.find('.active')

    if (!!$activeDirect.length) {
      $($activeDirect
          .removeClass('active')
          .children()
          .data('direct'))
        .removeClass('active')
    }

    $direct.parent().addClass('active')
    $directTarget.addClass('active')

    this.$element.trigger($.Event('directed:fancy:dropwizard', {
      relatedTarget: $direct[0]
    }))
  }

  Dropwizard.prototype.confirm = function(e) {
    e.preventDefault()

    var $item = $(e.target),
      text = $item.text().trim()

    // Trigger confirm event
    e = $.Event('confirm:fancy:dropwizard', { relatedTarget: e.target })
    this.$element.trigger(e)

    if (e.isDefaultPrevented() || $item.parent().hasClass('active')) return

    // Deactive all active item of current active wizard
    this.$target.find('.menu .active').each(function() {
      if ($(this).children().data('confirm')) {
        $(this).removeClass('active')
      }
    })

    $item.parent().addClass('active')

    // Change confirmed label text of current wizard
    this.$drop
      .find('.active > [data-toggle="dropwizard"] > span')
      .text(text.length > this.options.maxTextLength ?
        text.substring(0, this.options.maxTextLength - 1) + '...' :
        text
      )

    this.hide()
    this.$element.trigger($.Event('confirmed:fancy:dropwizard', {
      relatedTarget: $item[0]
    }))
  }

  // DROPWIZARD PLUGIN DEFINITION
  // ============================
  
  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy:dropwizard')
      var options = $.extend({}, Dropwizard.DEFAULTS, $this.data(), typeof option === 'object' && option)

      if (!data) $this.data('fancy:dropwizard', (data = new Dropwizard(this, options)))
      if (typeof option === 'string') data[option]()
      else data.toggle()
    })
  }

  var old = $.fn.dropwizard

  $.fn.dropwizard = Plugin
  $.fn.dropwizard.Constructor = Dropwizard

  // DROPWIZARD NO CONFLICT
  // ======================
  
  $.fn.dropwizard.noConflict = function() {
    $.fn.dropwizard = old
    return this
  }

  $(document).on('tap', '[data-toggle="dropwizard"]', function(e) {
    e.preventDefault()
    Plugin.call($(this), 'toggle')
  })

}(window.Zepto);
