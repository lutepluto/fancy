// backdrop.js
// ==================================================
// This is the universal common backdrop shared by
// other plugins, which is inspired by amazeui dimmer
// but patched some customerized modifications.
// See https://github.com/allmobilize/amazeui/blob/master/js/ui.dimmer.js.

+function (window, document) {
  'use strict'

  var Backdrop = function () {
    // empty so far
    // this.used = []
  }

  Backdrop.prototype.open = function (relatedTarget, callback) {
    var $relatedTarget = $(relatedTarget)
    var animate = $relatedTarget.hasClass('fade') ? 'fade' : ''
    var transition = $.support.transition && animate

    // if (relatedTarget) {
    //   this.used.push(relatedTarget)
    // }

    this.$element = $('<div class="backdrop ' + animate + '"></div>')
      .appendTo($(document.body))
      //.one('tap', $.proxy($relatedTarget.close, $relatedTarget))

    // Is there necessary to trigger force refolw ???
    // According to visual comparison, it seems force reflow can make
    // backdrop fade more smooth.
    if(transition) this.$element[0].offsetWidth    // force reflow
    this.$element.addClass('in')

    if (!callback) {
      return this
    }

    transition ? this.$element
      .one($.support.transition.end, callback)
      .emulateTransitionEnd(150) : callback()

    return this
  }

  Backdrop.prototype.close = function (callback) {
    if (this.$element) {
      this.$element.removeClass('in')

      var that = this
      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }

      $.support.transition && this.$element.hasClass('fade') ?
        this.$element
          .one($.support.transition.end, callbackRemove)
          .emulateTransitionEnd(150) :
        callbackRemove()
    }
    return this
  }

  Backdrop.prototype.removeBackdrop = function () {
    this.$element && this.$element.remove()
    this.$element = null
  }

  window.Backdrop = Backdrop

}(window, document)
