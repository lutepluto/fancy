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
