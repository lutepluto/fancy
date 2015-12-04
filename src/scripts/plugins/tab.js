// tab.js
// ==================================================
// Author: lute
// Last modified: 2015-02-25
// ==================================================

+function($) {
  'use strict';

  var Tab = function(element) {
    this.$element = $(element)
  }

  Tab.prototype.show = function() {
    var $this = this.$element
    var $ul = $this.closest('ul')
    var target = $this.data('target') || $this.attr('href')

    if($this.parent('li').hasClass('active')) return

    var $previous = $ul.find('.active a')
    var hideEvent = $.Event('fancy:tab:hide', {
      relatedTarget: $this[0]
    })
    var showEvent = $.Event('fancy:tab:show', {
      relatedTarget: $previous[0]
    })

    $previous.trigger(hideEvent)
    $this.trigger(showEvent)

    if(showEvent.isDefaultPrevented() || hideEvent.isDefaultPrevented()) return

    var $target = $(target)

    this.activate($this.closest('li'), $ul)
    this.activate($target, $target.parent(), function() {
      $previous.trigger('fancy:tab:hidden', {
        relatedTarget: $this[0]
      })
      $this.trigger('fancy:tab:shown', {
        relatedTarget: $previous[0]
      })
    })
  }

  Tab.prototype.activate = function(element, container, callback) {
    var $active = container.find('> .active')
    var transition = callback &&
      $.support.transition &&
      (($active.length && $active.hasClass('fade')) || !!container.find('> .fade').length)

    function next() {
      $active
        .removeClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', false)

      element
        .addClass('active')
        .find('[data-toggle="tab"]')
          .attr('aria-expanded', true)

      if(transition) {
        element[0].offsetWith  // force reflow
        element.addClass('in')
      } else {
        element.removeClass('fade')
      }

      callback && callback()
    }

    $active.length && transition ?
      $active
        .one($.support.transition.end, next)
        .emulateTransitionEnd(150) :
      next()

    $active.removeClass('in')
  }

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.tab')

      if(!data) $this.data('fancy.tab', (data = new Tab(this)))
      if(typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tab

  $.fn.tab = Plugin
  $.fn.tab.Constructor = Tab

  $.fn.tab.noConflict = function() {
    $.fn.tab = old
    return this
  }

  $(document).on('tap', '[data-toggle="tab"]', function(e) {
    e.preventDefault()
    Plugin.call($(this), 'show')
  })

  // temporary fix for ios click event delay
  $(document).on('click', '[data-toggle="tab"]', function(e) {
    e.preventDefault()
  })

}(window.Zepto);
