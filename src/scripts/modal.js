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
      that.$element.trigger('fancy:modal:closed')
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

