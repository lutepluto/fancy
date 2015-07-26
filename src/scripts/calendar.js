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
