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
    var e = $.Event('switching.fancy.segmented-control')

    $this.trigger(e)

    // switch control
    $previousControl.removeClass('active')
    $this.addClass('active')

    // switch content
    $previousContent.removeClass('active')
    $target.addClass('active')
  }

  var old = $.fn.SegmentedControl

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.segmented-control')

      if(!data) $this.data('fancy.segmented-control', (data = new SegmentedControl(this)))
      if(typeof option == 'string') data[option]()
    })
  }

  $.fn.segmentedControl = Plugin
  $.fn.segmentedControl.constructor = SegmentedControl

  $.fn.segmentedControl.noConflict = function() {
    $.fn.segmentedControl = old
    return this
  }

  $(document).on('tap.fancy.segmented-control', '[data-toggle="segmented"]', function(e) {
    e.preventDefault()
    Plugin.call($(this), 'switch')
  })

}(window.Zepto || window.jQuery)