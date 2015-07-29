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


// alert.js
// ==================================================
// This is a just most simple and ineffecient way to 
// diplay alert on document and it should be rewritten
// using a more advanced skill like react animation.

+function (window, document) {
  'use strict'

  var utils = (function() {
    var me = {}

    me.animation = (function animationEnd() {
      var _elementStyle = document.createElement('div').style
      var animations = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
      }

      for(var key in animations) {
        if(_elementStyle[key] !== undefined) {
          return { end: animations[key] }
        }
      }
    }())

    me.extend = function() {
      var objects = Array.prototype.slice.call(arguments).slice(1)
      var target = arguments[0]
      for(var index in objects) {
        var obj = objects[index]
        for(var key in obj) {
          if(obj.hasOwnProperty(key)) {
            target[key] = obj[key]
          }
        }
      }

      return target
    }

    me.hasClass = function(el, className) {
      var re = new RegExp('(^|\\s)' + className + '(\\s|$)')
      return re.test(el.className)
    }

    me.addClass = function(el, className) {
      if(className && !me.hasClass(el, className)) {
        var newclass = el.className.split(' ')
        newclass.push(className)
        el.className = newclass.join(' ')
      }
    }

    me.removeClass = function(el, className) {
      if(me.hasClass(el, className)) {
        var re = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g')
        el.className = el.className.replace(re, ' ')
      }
    }

    return me
  }())

  var defaults = {
    duration: 240,
    wait: 2000,
    type: 'danger'
  }

  var Alert = function(options) {
    this.options = utils.extend({}, defaults, options)

    if(this._requestTransition()) {
      this.el = this._build()
      this.transitionIn()
    }
  }

  Alert.prototype._build = function() {
    var el = document.createElement('div')
    utils.addClass(el, 'alert')
    utils.addClass(el, this.options.type)
    el.textContent = this.options.content
    document.body.appendChild(el)
    return el
  }

  Alert.prototype._requestTransition = function() {
    return document.querySelectorAll('.alert').length === 0
  }

  Alert.prototype.transitionIn = function() {

    var endListener = function(e) {
      if(e && e.target !== this.el) {
        return
      }
      utils.removeClass(this.el, 'alert-in')
      this.el.removeEventListener(utils.animation.end, endListener)

      setTimeout(this.transitionOut.bind(this), this.options.wait)
    }

    utils.addClass(this.el, 'alert-in')
    this.el.addEventListener(utils.animation.end, endListener.bind(this), false)
  }

  Alert.prototype.transitionOut = function() {

    var endListener = function(e) {
      if(e && e.target !== this.el) {
        return
      }

      this.el.removeEventListener(utils.animation.end, endListener)
      if(this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el)
      }
    }

    utils.addClass(this.el, 'alert-out')
    this.el.addEventListener(utils.animation.end, endListener.bind(this), false)
  }

  Alert.utils = utils

  window.FancyAlert = Alert

}(window, document)
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

// calendar.js
// ==================================================
// The original idea comes from Baidu GMU calendar
// See http://gmu.baidu.com/demo/#calendar
// For simplicity, this calendar has the least functionality
// to work with.

+function($) {
  'use strict'

  var Calendar = function(element, options) {
    this.$element = $(element)
    this.options = options
    this.isOpen = false
    // create backdrop of self
    this.backdrop = new window.Backdrop()

    this.isInput = this.$element.is('input')

    this.viewDate = new Date()
    this.date = new Date()

    // Construct calendar html
    this.$picker = $(tpl.calendar).appendTo($(document.body))
    this._buildCalendarHead()

    // process calendar options
    this._processOptions()
    // build calendar events
    this._buildEvents()
    // build calendar body
    this._buildCalendarBody()
  }

  Calendar.DEFAULTS = {
    format: 'yyyy-mm-dd',
    weekStart: 0,
    startDate: -Infinity,
    endDate: Infinity,
    datesDisabled: undefined
  }

  // Build the calendar head html
  Calendar.prototype._buildCalendarHead = function() {
    var count = this.options.weekStart
    var html = '<tr>'

    while(count < this.options.weekStart + 7) {
      // using ['zh'] is for future internalization
      html += '<th>' + dates['zh'].daysShort[(count++) % 7] + '</th>'
    }
    html += '</tr>'
    this.$picker.find('.calendar thead').append(html)
  }

  Calendar.prototype._processOptions = function() {
    // Parse format
    // this.options.format = parseFormat(this.options.format)

    // Parse start/end date from string to Date object
    if(this.options.startDate !== -Infinity) {
      if(!!this.options.startDate) {
        if(!(this.options.startDate instanceof Date)) {
          this.options.startDate = parseDate(this.options.startDate, this.options.format)
        }
      } else {
        this.options.startDate = -Infinity
      }
    }
    if(this.options.endDate !== Infinity) {
      if(!!this.options.endDate) {
        if(!(this.options.endDate instanceof Date)) {
          this.options.endDate = parseDate(this.options.endDate, this.options.format)
        }
      } else {
        this.options.endDate = Infinity
      }
    }

    // If element is input, make it readonly for in case
    if(this.isInput) {
      this.$element.attr('readonly', 'readonly')
    }

    // Parse dates disabled
    if(this.options.datesDisabled) {

      var datesDisabledMap = {}

      if(typeof this.options.datesDisabled === 'string') {
        datesDisabledMap[this.options.datesDisabled] = 
          parseDate(this.options.datesDisabled, this.options.format).getTime()
      } else if (this.options.datesDisabled instanceof Array) {
        var that = this
        this.options.datesDisabled.forEach(function(dateString) {
          datesDisabledMap[dateString] = parseDate(dateString, that.options.format).getTime()
        })
      } else {
        throw new Error('Invalid dates disabled! It should be only a single date string or Array of date strings.')
      }

      this.options.datesDisabled = datesDisabledMap
    } else {
      this.options.datesDisabled = {}
    }

    // By default, do not set input value of current date
    // if the input value is empty when scaffolding calendar.
    // So following code is commented.
    // ========================================================
    // if(this.isInput) {
    //   this.$element.val() ||
    //     this.$element.val(parseDateToString(this.date, this.options.format))
    // } else {
    //   this.$element.data('viewDate') ||
    //     this.$element.data('viewDate', parseDateToString(this.date, this.options.format))
    // }

    // Before initilizing calendar, this.viewDate is **TODAY**(new Date()).
    // But we need to consider if **TODAY** is not in the range bewteen
    // this.options.startDate and this.options.endDate.
    // If it is not, we should consider to set this.viewDate to be the first
    // date or last date in the range so that when calendar displays, the 
    // active date will not be set to the wrong date.
    if(this.viewDate < this.options.startDate) {
      this.viewDate = this.options.startDate
    }

    if(this.viewDate > this.options.endDate) {
      this.viewDate = this.options.endDate
    }

    // Determine which day is the active date.
    // Here, it's not necessary to get the value of input for
    // the input date because we never care about the previous
    // picked day is owing to the calendar state is stable(UI
    // is not destroyed) after picking a day and hiding the
    // calendar.
    // Therefore, the active date is only significant when the
    // calendar is initialized for the first time. If the input
    // has a value for the active date, we name it. Otherwise,
    // we just leave it alone.
    if(this.isInput && this.$element.val()) {
      this.activeDate = parseDate(this.$element.val(), this.options.format)
    } else if(!this.isInput && this.$element.data('activeDate').trim()) {
      this.activeDate = parseDate(this.$element.data('activeDate').trim(), this.options.format)
    }

    // TODO process other options
  }

  Calendar.prototype._buildEvents = function() {
    // Interesting things here is that in Zepto, the native
    // event like `tap`, `click` can have its event namespace
    // separated by dot(.) like following code.
    // However, when developers want to create their own customized
    // event such as I did in this snippet of code `open:fancy:calendar`,
    // developers have to using colon(:) to separate event namepsace,
    // for instance, `open:fancy:calendar`. Otherwise, the customized
    // event will never triggered.
    // I found this strange phenomenon by using both dot and colon to
    // create customized event but resulted that only colon works.
    // In my impression, jQuery can regonize dot separated event namespace
    // for customized event and everything else about it works nice.

    // TODO
    // Thus, this is strange thing need to be researched deeply by reading
    // Zepto source code in the future.

    this.$picker.on('tap.fancy.calendar.confirm', '[data-confirm="calendar"]', $.proxy(this.confirm, this))
    this.$picker.on('tap.fancy.calendar.dismiss', '[data-dismiss="calendar"]', $.proxy(this.close, this))
    this.$picker.on('tap.fancy.calendar.flip', '[data-flip]', $.proxy(this.flip, this))
    this.$picker.on('tap.fancy.calendar.pick', 'a[data-value]', $.proxy(this.pickDay, this))
  }

  // Build the calendar body UI
  Calendar.prototype._buildCalendarBody = function() {
    var year = this.viewDate.getFullYear(),
      month = this.viewDate.getMonth()

    var prevMonthDate = getPrevMonth(this.viewDate),
      nextMonthDate = getNextMonth(this.viewDate),
      currentDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0, 0),
      monthStartDate = new Date(year, month, 1, 0, 0, 0, 0)

    var prevMonth = prevMonthDate.getMonth(),
      nextMonth = nextMonthDate.getMonth()

    var calendarStartDate,    // the day of week that the calendar will display
      // calculate the day of week of the first day of the current displayed month
      monthStartDay = monthStartDate.getDay() - this.options.weekStart,
      prevMonthDayNumber = getDaysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth())

    // Calculate the first date of current display month in the calendar.
    // The first date of the calendar is often in previous month.
    // For instance, the first day on the calendar of July, 2015 is June 28th, 2015.
    // Be careful that there's a chance that the calendar's first display date is 
    // the same day with the first date of current month. And at the same time,
    // current month is January so that previous month is Decemeber of previous year.
    // Therefore, this **EDGE CASE** should be considered when calculate variable
    // `prevMonthDate` in the following code.
    if(monthStartDay < 0) {
      calendarStartDate = prevMonthDayNumber - (6 + monthStartDay)    // prevMonthDayNumber - (7 + monthStartDay) + 1
    } else if(monthStartDay > 0) {
      calendarStartDate = prevMonthDayNumber - monthStartDay + 1
    } else {
      calendarStartDate = 1
      prevMonthDate.setMonth(month)

      // This line of code is to prevent the **EDGE CASE** mentioned above.
      prevMonthDate.setFullYear(year)
    }

    prevMonthDate.setDate(calendarStartDate)

    var d = prevMonthDate,    // iterate day
      html = [],    // html for constructing every day UI
      x = 0    // Using x for loop count in case infinite loop

    while(true) {

      // The first day of the calendar is the start day of a week
      if(d.getDay() === this.options.weekStart) {
        html.push('<tr>')
      }

      var className = ''
      if(d.getMonth() === prevMonth) {
        // If the day is in previous month
        // set class name to `old` for appearance
        className = 'prev'
      } else if(d.getMonth() === nextMonth) {
        // If the day is in next month,
        // set class name to `new` for appearance
        className = 'next'
      } else {
        // Otherwise, the day is in `current month`,
        // set class name to `now`
        className = 'now'
      }
      if(d < this.options.startDate ||
        d > this.options.endDate ||
        this.options.datesDisabled[parseDateToString(d, this.options.format)] === d.getTime()) {
        // If the iterated day exceeds the date range, or the it is
        // in the disabeld dates option, add disabled to class name
        className += ' disabled'
      }
      // If the iterated day is today, add class name `current`
      if(d.getTime() === currentDate.getTime()) {
        className += ' current'
      }
      // If the iterated day is the currently active day,
      // add class name `active`
      if(this.activeDate instanceof Date && d.getTime() === this.activeDate.getTime()) {
        className += ' active'
      }

      var dataValue = 'data-value="' + parseDateToString(d, this.options.format) + '"'
      html.push(
        '<td class="' + className + '">' +
          '<a href="javascript: void(0)" ' + (d < this.options.startDate || d > this.options.endDate ? '' : dataValue) + '>' +
            d.getDate() +
          '</a>' +
        '</td>'
      )
      // Determine the iterated day is the last day of a week
      if(d.getDay() === (this.options.weekStart === 0 ? 6 : this.options.weekStart - 1)) {
        html.push('</tr>')
      }

      // Add the date by 1 for another iteration
      d.setDate(d.getDate() + 1)
      // If the next iterate day is the first day of a week and is in next month, then stop iteration.
      // Because the whole calendar month ui html has been finish constructing.
      if((d.getDay() === this.options.weekStart) && (d.getMonth() === nextMonth)) {
        break
      }

      x++
      if(x > 99) {
        throw new Error('Infinite loop. There must be some errors...')
        return
      }
    }

    // refresh calendar body
    this.$picker.find('.calendar-body tbody').empty().append(html.join(''))

    this._refrehCalendarHead()
  }

  Calendar.prototype._refrehCalendarHead = function() {
    // update calendar head title
    var headString = this.viewDate.getFullYear() + dates['zh'].yearSuffix + dates['zh'].months[this.viewDate.getMonth()]
    this.$picker.find('.calendar-body .current-month').text(headString)

    var prevMonthLastDate = getPrevMonthLastDate(this.viewDate)
    var nextMonthDate = getNextMonth(this.viewDate)

    // Check and update calendar `prev` and `next` button
    if(prevMonthLastDate < this.options.startDate) {
      this.$picker.find('[data-flip="prev"]').hide()
    } else {
      this.$picker.find('[data-flip="prev"]').show()
    }

    if(nextMonthDate > this.options.endDate) {
      this.$picker.find('[data-flip="next"]').hide()
    } else {
      this.$picker.find('[data-flip="next"]').show()
    }
  }

  Calendar.prototype.open = function() {
    var that = this
    var e = $.Event('open:fancy:calendar', { _relatedTarget: this.$picker[0] })
    this.$element.trigger(e)

    if(this.isOpen || e.isDefaultPrevented()) {
      return
    }

    this.isOpen = true
    // open backrop
    this.backdrop.open(this.$picker[0], function() {
      var transition = $.support.transition && that.$picker.hasClass('fade')

      that.$picker.show()
      if(transition) {
        that.$picker[0].offsetWidth    // force reflow
      }
      that.$picker.addClass('in')

      var e = $.Event('opened:fancy:calendar', { _relatedTarget: that.$picker[0] })
      transition ?
        that.$picker.one($.support.transition.end, function() {
          that.$element.trigger(e)
        }).emulateTransitionEnd(300) : that.$element.trigger(e)
    })
  }

  Calendar.prototype.close = function(e) {
    if(e) {
      e.preventDefault()
    }
    e = $.Event('close:fancy:calendar')
    this.$element.trigger(e)

    // If calendar is closed or the close action is interrupted,
    // just stop close action and return
    if(!this.isOpen || e.isDefaultPrevented()) {
      return
    }

    this.isOpen = false
    // do close actions
    this.$picker.removeClass('in')
    $.support.transition ?
      this.$picker
        .one($.support.transition.end, $.proxy(this.hideCalendar, this))
        .emulateTransitionEnd(300) : this.hideCalendar()
  }

  Calendar.prototype.pickDay = function(e) {
    var $target = $(e.target)
    var $cell = $target.parent()

    // If the picked day is in current month as
    // well as not disabled, active it directly
    if($cell.hasClass('now') && !$cell.hasClass('disabled')) {
      // deactive previous active day
      this.$picker.find('table td.active').removeClass('active')

      $target.closest('td').addClass('active')

      // Synchronize active date
      this.activeDate = parseDate($target.data('value'), this.options.format)
    } else if(!$cell.hasClass('disabled')) {
      // Or, the picked day is not disabled, which means
      // it must be in previous month or next month.
      // Beacause any enabeld current month days has been
      // filtered out.

      // deactive previous active day
      this.$picker.find('table td.active').removeClass('active')

      // When user pick a previous or next month day, we refresh
      // current calendar to redirect to previous/next month and
      // active the picked day.
      var that = this
      // Save the picked day for future pick after refresh calendar
      var pickedDay = $target.data('value')

      // Synchronize active date
      this.activeDate = parseDate(pickedDay, this.options.format)

      // Bind event once the calendar fliped
      this.$element.one('flip:fancy:calendar', function() {
        that.$picker
          .find('table a[data-value="' + pickedDay + '"]')
          .trigger('tap')
      })
      // trigger calendar to flip
      this.$picker
        .find('[data-flip="' + $cell.attr('class').trim() + '"]')
        .trigger('tap')
    }
  }

  Calendar.prototype.flip = function(e) {
    var $button = $(e.target)
    var direction = $button.data('flip')

    if(direction === 'next') {
      this.viewDate = getNextMonth(this.viewDate)
    } else {
      this.viewDate = getPrevMonth(this.viewDate)
    }

    // rebuild calendar body
    this._buildCalendarBody()

    this.$element.trigger('flip:fancy:calendar')
  }

  Calendar.prototype.confirm = function() {
    var $activeDay = this.$picker.find('table td.active')
    if($activeDay.length) {
      if(this.isInput) {
        this.$element.val($activeDay.children().data('value'))
      } else {
        this.$element.data('viewDate', $activeDay.children.data('value'))
      }

      this.close()
    }
  }

  Calendar.prototype.hideCalendar = function() {
    var that = this
    this.$picker.hide()
    this.backdrop.close(function() {
      that.$element.trigger($.Event('closed:fancy:calendar', {
        _relatedTarget: that.$picker[0]
      }))
    })
  }

  // Utitly function to parse string to Date.
  // Currently this function can only parse string.
  // And the format should always separated by '-'.
  function parseDate(dateString, format) {
    if(dateString instanceof Date) return dateString
    if(typeof dateString !== 'string') {
      throw new Error('Invalid date string')
    }

    var dateParams = dateString.split('-')
    var formatParams = format.split('-')

    var date = new Date()
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)

    for(var key in formatParams) {
      var value = dateParams[key]
      if(formatParams[key] === 'yyyy') date.setFullYear(value)
      else if(formatParams[key] === 'mm') date.setMonth(value - 1)
      else if(formatParams[key] === 'dd') date.setDate(value)
    }

    return date
  }

  // Utility function to determine whether the given year is leap year
  // Leap year is the year which can be divided by 4 but not by 100 or
  // can be divided by 400 directly.
  function isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)
  }

  // Utitly function to parse Date object to string in the format
  function parseDateToString(date, format) {
    var templateParts = {
      dd: (date.getDate() < 10 ? '0' : '') + date.getDate(),
      mm: (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1),
      yyyy: date.getFullYear()
    }

    var dateString = format
    for(var key in templateParts) {
      var value = templateParts[key]
      dateString = dateString.replace(key, value)
    }
    return dateString
  }

  // Utility function to get previous month of given date 
  function getPrevMonth(date) {
    var year = date.getFullYear()
    var month = date.getMonth()

    if(month > 0) {
      return new Date(year, month - 1, 1, 0, 0, 0, 0)
    } else {
      return new Date(year - 1, 11, 1, 0, 0, 0, 0)
    }
  }

  // Utility function to get next month of given date
  function getNextMonth(date) {
    var year = date.getFullYear()
    var month = date.getMonth()

    if(month < 11) {
      return new Date(year, month + 1, 1, 0, 0, 0, 0)
    } else {
      return new Date(year + 1, 0, 1, 0, 0, 0, 0)
    }
  }

  function getPrevMonthLastDate(date) {
    var prevMonthFirstDate = getPrevMonth(date)

    var year = prevMonthFirstDate.getFullYear()
    var month = prevMonthFirstDate.getMonth()

    var daysInMonth = getDaysInMonth(year, month)
    return new Date(year, month, daysInMonth, 0, 0, 0, 0)
  }

  // Utility function to get the number of days in a certain month
  function getDaysInMonth(year, month) {
    return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
  }

  var tpl = {
    header: '<thead>' +
              '<tr>' +
                '<th><a href="javascript: void(0)" class="icon icon-small icon-chevron-left" data-flip="prev"></a></th>' +
                '<th colspan="5" class="current-month"></th>' +
                '<th><a href="javascript: void(0)" class="icon icon-small icon-chevron-right" data-flip="next"></a></th>' +
              '</tr>' +
            '</thead>'
  }

  tpl.calendar = '<div class="calendar fade">' +
                   '<div class="calendar-head">' +
                     '<a href="javascript: void(0)" class="button pull-left" data-dismiss="calendar">取消</a>' +
                     '<a href="javascript: void(0)" class="button pull-right" data-confirm="calendar">确定</a>' +
                   '</div>' +
                   '<div class="calendar-body">' +
                     '<table>' +
                       tpl.header +
                       '<tbody></tbody>' +
                     '</table>' +
                   '</div>' +
                 '</div>'

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var data = $this.data('fancy.calendar')

      if(!data) {
        var options = $.extend({}, Calendar.DEFAULTS, $this.data(), typeof option === 'object' && option)
        $this.data('fancy.calendar', (data = new Calendar(this, options)))
      }

      if(typeof option === 'string') {
        data[option]()
      } else {
        // it's the initialization of calendar, call open automatically
        data.open()
      }
    })
  }

  var old = $.fn.calendar
  $.fn.calendar = Plugin

  // This is just a coding convention.
  // See http://stackoverflow.com/questions/10525600/
  $.fn.calendar.Constructor = Calendar

  var dates = $.fn.calendar.dates = {
    zh: {
      days: [ "周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日" ],
      daysShort: [ "日", "一", "二", "三", "四", "五", "六", "日" ],
      months: [ "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月" ],
      monthsShort: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
      meridiem: [ "am", "pm" ],
      suffix: [ "st", "nd", "rd", "th" ],
      today: "今天",
      yearSuffix: '年'
    }
  }

  $.fn.noConflict = function() {
    $.fn.calendar = old
    return this
  }

  // Default plugin trigger
  $(document).ready(function() {
    $('[data-toggle="calendar"]').on('tap.fancy.calendar', function() {
      var $this = $(this)
      var options = $this.data('fancy.calendar') ? 'open' : $this.data()
      Plugin.call($this, options)
    })
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


/**
 * validate.js
 * ==================================================
 * Author: lute
 * Last modified: 2015-03-25 17:11
 * ==================================================
 * Validate form on mobile, fired when input unfocus 
 * or form submit. Imitate wanring style of Wechat app
 */

+function($) {
  'use strict'

  var Validate = function(element, options) {
    this.$form = $(element)
    this.options = options

    this.$form.on('submit', $.proxy(this.submit, this))
  }

  Validate.DEFAULTS = {

  }

  Validate.FN = {
    'required' : function(value) { return (value  !== null) && (value !== '') },
    'email' : function(value) { return /^[a-z0-9-_\.]+@[a-z0-9-_\.]+\.[a-z]{2,4}$/.test(value) },
    'www' : function(value) { return /^(http:\/\/)|(https:\/\/)[a-z0-9\/\.-_]+\.[a-z]{2,4}$/.test(value) },
    'date' : function(value) { return /^[\d]{2}\/[\d]{2}\/[\d]{4}$/.test(value) },
    'time' : function(value) { return /^[\d]{2}:[\d]{2}(:{0,1}[\d]{0,2})$/.test(value) },
    'datetime' : function(value) { return /^[\d]{2}\/[\d]{2}\/[\d]{4} [\d]{2}:[\d]{2}:{0,1}[\d]{0,2}$/.test(value) },
    'integer' : function(value) { return /^[+-]?\d+$/.test(value) },
    'float' : function(value) { return /^[+-]?\d+\.\d+$/.test(value) },
    'number' : function(value) { return /^[+-]?(\d+)|(\d+\.\d+)$/.test(value) },
    'equal' : function(value, eqValue) { return (value == eqValue); },
    'match' : function(value, input) { return (value == $(input).val());},
    'min' : function(value, min) { return Number(value) >= min },
    'max' : function(value, max) { return Number(value) <= max },
    'between' : function(value, min, max) { return (Number(value) >= min) && (Number(value) <= max) },
    'length': function(value, length) { return value.length == length },
    'length_min' : function(value, min) { return value.length >= min },
    'length_max' : function(value, max) { return value.length <= max },
    'length_between' : function(value, min, max) { return (value.length >= min) && (value.length <= max) }
  }

  Validate.MESSAGES = {
    'required' : '{alias}不能为空！',
    'email' : '请输入正确的email格式！',
    'www' : 'The value is not valid http string',
    'date' : 'The value is not valid date',
    'time' : 'The value is not valid time',
    'datetime' : 'The value is not valid datetime',
    'integer' : '{alias}的输入值必须为整数！',
    'float' : '{alias}的输入值必须为小数！',
    'number' : '{alias}的输入值必须是数字格式！',
    'equal' : '{alias}输入值与{param1}不匹配！',
    'match' : '{alias}输入值与{param1}不匹配！',
    'min' : '{alias}输入值必须大于{param1}',
    'max' : '{alias}输入值必须小于{param1}',
    'between' : 'The value must be between {param1} and {param2}',
    'length' : '{alias}的长度为{param1}',
    'length_min' : '{alias}的输入值长度必须大于{param1}',
    'length_max' : '{alias}的输入值长度必须小于{param1}',
    'length_between' : 'The length of the value must be between {param1} and {param2}'
  }

  Validate.prototype.validate = function(el) {
    var $el = $(el)
    var validateParams = $el.data('validate').split('|')
    var messages = []

    for(var i in validateParams) {
      var validateParam = validateParams[i].split(',')
      var validateFunctionName = validateParam[0]
      validateParam[0] = $el.val().trim()

      var fn = Validate.FN[validateFunctionName]
      var result = fn.apply($el, validateParam)

      if(!result) {
        // assemble error message
        var message = Validate.MESSAGES[validateFunctionName]
        if($el.data('validate-' + validateFunctionName + '-message')) {
          message = $el.data('validate-' + validateFunctionName + '-message')
        } else {
          var templateData = {}
          templateData.alias = $el.data('alias') ?
            $el.data('alias') : $el.attr('name')
          for(var j = 1; j < validateParam.length; j++) {
            if(/^[#\.\[]/.test(validateParam[j])) {
              var paramAlias = $(validateParam[j]).data('alias')
              templateData['param' + j] = paramAlias ? paramAlias : $(validateParam[j]).attr('name')
            } else {
              templateData['param' + j] = validateParam[j]
            }
          }

          messages.push(compileTemplate(message, templateData))
        }
        break
      }
    }

    if(messages.length !== 0) {
      new window.FancyAlert({
        content: messages.pop()
      })
      return false
    }
    return true
  }

  Validate.prototype.submit = function() {
    var that = this
    var result = true
    this.$form.find('input[data-validate], select[data-validate], textarea[data-validate]').each(function() {
      result = that.validate(this)
      if(!result) return result
    })
    return result
  }

  var old = $.fn.validate

  function Plugin(option) {
    return this.each(function() {
      var $this = $(this)
      var options = $.extend({}, Validate.DEFAULTS, typeof option == 'object' && option)
      var data = $this.data('fancy.validate')
      if(!data) $this.data('fancy.validate', (data = new Validate(this, options)))
    })
  }
  
  $.fn.validate = Plugin
  $.fn.validate.Constructor = Validate

  $.fn.validate.noConflict = function() {
    $.fn.validate = old
    return this
  }

  function compileTemplate(template, data) {
    if((typeof data).toLowerCase() !== 'object') return template
    return template.replace(/\{(.*?)\}/g, function(match, index) {
      return data[index] ? data[index] : ''
    })
  }

  $(document).ready(function() {
    $('form[data-validate="true"]').each(function() {
      var $form = $(this)
      Plugin.call($form, $form.data())
    })
  })

  $('form[data-validate="true"]').on('blur', '[data-validate]', function() {
    var $this = $(this)
    var $form = $this.parents('form[data-validate="true"]')
    if($this.is('input') || $this.is('select') || $this.is('textarea')) {
      var params = $this.data('validate')
      if(params.trim()) $form.data('fancy.validate').validate(this)
    }
  })

}(window.Zepto);
