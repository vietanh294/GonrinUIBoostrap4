(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD is used - Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'));
    } else {
        // Neither AMD nor CommonJS used. Use global variables.
        if (typeof jQuery === 'undefined') {
            throw 'gonrin combobox requires jQuery to be loaded first';
        }
        factory(jQuery);
    }
}(function ($) {
	'use strict';
	var ComboBox = function (element, options) {
		var gonrin = window.gonrin;
		var grobject = {},
		value,
		text,
		data, //datalist
		index = -1,
		textElement = false,
		groupElement = false,
		unset = true,
        input,
        menuTemplate = '<ul class="dropdown-menu" style="overflow-y:scroll; width: 100%;"></ul>',
        itemTemplate =  '<li class="dropdown-item"><a href="javascript:void(0)"></a></li>',
        component = false,
        helpmsg = false,
        widget = false,
        dataSourceType,
		keyMap = {
                'up': 38,
                38: 'up',
                'down': 40,
                40: 'down',
                'left': 37,
                37: 'left',
                'right': 39,
                39: 'right',
                'tab': 9,
                9: 'tab',
                'escape': 27,
                27: 'escape',
                'enter': 13,
                13: 'enter',
                'pageup': 33,
                33: 'pageup',
                'pagedown': 34,
                34: 'pagedown',
                'shift': 16,
                16: 'shift',
                'control': 17,
                17: 'control',
                'space': 32,
                32: 'space',
                //'t': 84,
                //84: 't',
                'delete': 46,
                46: 'delete'
        },
        keyState = {},
        _lastkey,
        _prev,
        _typing_timeout,
        /********************************************************************************
         *
         * Private functions
         *
         ********************************************************************************/
        renderData = function(){
			if($.isArray(data) && data.length > 0){
				$.each(data, function (idx, item) {
					var $item = $(itemTemplate);
					var val, txt;
					if (typeof item === 'object') {
						dataSourceType = 'object';
						if((options.valueField != null) && (options.textField != null)){
							val = item[options.valueField];
							
							if((!!options.template)&& (!!gonrin.template)){
								var tpl = gonrin.template(options.template);
								txt = tpl(item);
							}else{
								var $item = $(itemTemplate);
								txt = item[options.textField];
							}
						}
					}else {
						dataSourceType = 'common';
						val = item;
						txt = item;
					}
						
					$item.find('a').html(txt);
					widget.append($item);
					//
					if(options.selectionMode === "single"){
						if(value === val){
							setSingleIndex(idx);
						}
						//
						$item.bind("click", function(){
							setSingleIndex(idx);
							hideWidget();
						});
					}else if(options.selectionMode === "multiple"){
						if (($.isArray(value))&&($.inArray(val, value) > -1)){
							setMultiIndex(idx);
						}
						$item.bind("click", function(){
							setMultiIndex(idx);
						});
					}
				});
			}
			return grobject;
		},
        setupWidget = function () {
			if (!!options.dataSource) {
				//var menu = $(menuTemplate);
				widget = $(menuTemplate);
				if(!!options.headerTemplate){
					widget.prepend($("<li>").addClass("dropdown-header").html(options.headerTemplate))
				}
				
				if(component){
					component.before(widget);
				}
				
				if($.isArray(options.dataSource)){
					data = options.dataSource;
					renderData();
				}
				if($.isPlainObject(options.dataSource)){
					if(options.auto_bind){
						console.log("bind to Ajax datasource");
					}
					//getdataSource json from HTTP
					//setup_data();
				}
				
				//setup width and height
				
				widget.css("width", (options.width !== null) ? options.width : "100%"); 
				widget.css("height", (options.height !== null) ? options.height : "auto"); 
				
				widget.hide();
            }
			return grobject;
        },
        getValue = function(){
        	return value;
        },
        getText = function(){
        	return text;
        },
        getIndex = function(){
        	return index;
        },
        clearValue = function(){
        	value = null;
        	if(options.selectionMode === "single"){
        		value = null;
			}else if (options.selectionMode === "multiple"){
				value = [];
			}
        	widget.find('li').not(".dropdown-header").removeClass("active");
        	text = "";
        	if(textElement){
        		textElement.val(text);
        	};
        },
        setValue = function (val) {
        	if (value === val){
        		return;
        	}
        	if ((options.selectionMode === "multiple") && !$.isArray(val)){
        		return;
        	}
        	var oldval = value;
        	//clear select
        	clearValue();
        	//return;
        	if(data && (data.length > 0)){
        		var txt = null;
        		for(var i = 0; i < data.length; i++){
        			var item = data[i];
        			var itemval;
        			if(dataSourceType === 'object'){
        				if((options.valueField != null) && (options.textField != null)){
        					itemval = item[options.valueField];
            				//if(val == item[options.valueField]){
            				//	setSingleIndex(i);
            				//	return;
            				//}
            			}
        			}
        			else if(dataSourceType === 'common'){
        				itemval = item;
        				//if(val === item){
        				//	setSingleIndex(i);
        				//	return;
        				//}
        			};
        			
        			if(options.selectionMode === "single"){
        				if(val === itemval){
        					setSingleIndex(i);
            				return;
        				}
        			}else if (options.selectionMode === "multiple"){
        				if (($.isArray(val))&&($.inArray(itemval, val) > -1)){
							setMultiIndex(i, oldval);
						}
        			}
        		}
        	}
        },
        setIndex = function(idx){
        	if(options.selectionMode === "single"){
        		setSingleIndex(idx);
        	}else if(options.selectionMode === "multiple"){
        		setMultiIndex(idx);
        	}
        },
        setSingleIndex = function(idx){
        	if(data && (data.length > 0) && (data.length > idx) && (idx > -1)){
        		var item = data[idx];
        		var oldvalue = value;
        		var txt,val;
        		if(dataSourceType === 'object'){
        			if((options.valueField != null) && (options.textField != null)){
            			txt = item[options.textField];
            			val = item[options.valueField];
            		}else{
            			return;
            		}
        		}else if(dataSourceType === 'common'){
        			txt = item;
        			val = item;
        		}
        		if(textElement){
        			text = txt;
            		textElement.val(txt);
            	};
				index = idx;
				input.val(val);
				value = val;
				widget.find('li').not(".dropdown-header").removeClass("active");
        		$(widget.find('li').not(".dropdown-header")[idx]).addClass("active");
        		scrollToIndex(idx);
        		
        		setState(null);
        		
        		notifyEvent({
                    type: 'change.gonrin',
                    value: val,
                    oldValue: oldvalue
                });
				return;
        	}
        },
        setMultiIndex = function(idx, oldval){
        	
        	if(data && (data.length > 0) && (data.length > idx) && (idx > -1)){
        		var item = data[idx];
        		var oldvalue = value.slice(0);
        		if(!!oldval){
        			oldvalue = oldval;
        		}
        		var txt,val;
        		if(dataSourceType === 'object'){
        			if((options.valueField != null) && (options.textField != null)){
            			txt = item[options.textField];
            			val = item[options.valueField];
            		}else{
            			return;
            		}
        		}else if(dataSourceType === 'common'){
        			txt = item;
        			val = item;
        		}
        		var itemidx = $(widget.find('li').not(".dropdown-header")[idx]);
        		
        		if(itemidx.hasClass("active")){
        			itemidx.removeClass("active");
        			// value remove
        			if($.isArray(value)){
        				var found = -1;
        				for(var k = 0; k < value.length; k++){
        					if(value[k] == val){
        						found = k;
        						break;
        					}
        				}
        				if(found > -1){
        					value.splice(found, 1); 
        				}
        			}
        			
        			//text remove
        			if(text === txt){
        				text = "";
        				textElement.val(text);
        			}
        			else if(text.startsWith(txt + ",")){
        				text = text.replace(txt + ",",'');
        				textElement.val(text);
        			}else{
        				text = text.replace("," + txt,'');
        				textElement.val(text);
        			}
        		}else{
        			itemidx.addClass("active");
        			//text add
        			if($.isArray(value)){
        				value.push(val);
        			}
        			//value add
        			
        			if(textElement){
            			text = (!!text) && (text.length > 0)? text + "," + txt : txt;
                		textElement.val(text);
                	};
        		}
        		setState(null);
        		notifyEvent({
                    type: 'change.gonrin',
                    value: value,
                    oldValue: oldvalue
                });
				return;
        	}
        },
        dataToOptions = function () {
            var eData,
                data_options = {};

            if (element.is('input') || options.inline) {
                eData = element.data();
            }

            if (eData.data_options && eData.data_options instanceof Object) {
            	data_options = $.extend(true, data_options, eData.data_options);
            }
            return data_options;
        },
        
        showWidget = function () {
        	if (input.prop('disabled') || (!options.ignore_readonly && input.prop('readonly')) || widget.is(':visible')) {
                return grobject;
            };
            
            
            widget.on('mousedown', false);
            widget.show();
            
            if (options.focusOnShow && !textElement.is(':focus')) {
                textElement.focus();
            }
            
            notifyEvent({
                type: 'show.gonrin'
            });
            return grobject;
        },
        hideWidget = function(){
        	if (widget.is(':hidden')) {
                return grobject;
            }
        	//$(window).off('resize', place);
            widget.off('mousedown', false);
            widget.hide();
            
            notifyEvent({
                type: 'hide.gonrin',
                value: value
            });
            return grobject;
        },
        
        toggle = function () {
            /// <summary>Shows or hides the widget</summary>
            return (widget.is(':hidden') ? showWidget() : hideWidget());
        },
        notifyEvent = function (e) {
            if ((e.type === 'change.gonrin')  && (e.value && (e.value === e.oldValue))) {
                return;
            }
            element.trigger(e);
        },
        scroll = function (item) {
            if (!item) {
                return;
            }

            if (item[0]) {
                item = item[0];
            }

            var content = widget[0],
                itemOffsetTop = item.offsetTop,
                itemOffsetHeight = item.offsetHeight,
                contentScrollTop = content.scrollTop,
                contentOffsetHeight = content.clientHeight,
                bottomDistance = itemOffsetTop + itemOffsetHeight;

                if (contentScrollTop > itemOffsetTop) {
                    contentScrollTop = itemOffsetTop;
                } else if (bottomDistance > (contentScrollTop + contentOffsetHeight)) {
                    contentScrollTop = (bottomDistance - contentOffsetHeight);
                }

                content.scrollTop = contentScrollTop;
        },
        scrollToIndex = function(index) {
            var item = $(widget.find('li').not(".dropdown-header")[index])
            if (item) {
                scroll(item);
            }
        },
        
        move = function(e) {
        	if(options.selectionMode === "multiple"){
        		/*TODO: move with multiple select*/
        		e.preventDefault();
        		return;
        	}
            var key = e.keyCode;
            var down = key === keyMap.down;
            var pressed;
            var current;
            if (key === keyMap.up || down) {
                if (e.altKey) {
                    toggle();
                } else {
                	showWidget();
                	current = getIndex();
                	if (!current > -1) {
                		if(down){
                			if(current < data.length - 1){
                				setSingleIndex(current + 1);
                			}
                		} else {
                			if(current > 0){
                				setSingleIndex(current - 1);
                			}
                		}
                	}
                	
                    /*if (!that.listView.isBound()) {
                        if (!that._fetch) {
                            that.dataSource.one(CHANGE, function() {
                                that._fetch = false;
                                that._move(e);
                            });

                            that._fetch = true;
                            that._filterSource();
                        }

                        e.preventDefault();

                        return true; //pressed
                    }*/
                	
                	
                	/*current = that._focus();

                    if (!that._fetch && (!current || current.hasClass("k-state-selected"))) {
                        if (down) {
                            that._nextItem();

                            if (!that._focus()) {
                                that._lastItem();
                            }
                        } else {
                            that._prevItem();

                            if (!that._focus()) {
                                that._firstItem();
                            }
                        }
                    }

                    if (that.trigger(SELECT, { item: that.listView.focus() })) {
                        that._focus(current);
                        return;
                    }

                    that._select(that._focus(), true);

                    if (!that.popup.visible()) {
                        that._blur();
                    }*/
                }

                e.preventDefault();
                pressed = true;
            } else if (key === keyMap.enter || key === keyMap.tab) {
                /*if (that.popup.visible()) {
                    e.preventDefault();
                }

                current = that._focus();
                dataItem = that.dataItem();

                if (!that.popup.visible() && (!dataItem || that.text() !== that._text(dataItem))) {
                    current = null;
                }

                var activeFilter = that.filterInput && that.filterInput[0] === activeElement();

                if (current) {
                    if (that.trigger(SELECT, { item: current })) {
                        return;
                    }

                    that._select(current);
                } else if (that.input) {
                    that._accessor(that.input.val());
                    that.listView.value(that.input.val());
                }

                if (that._focusElement) {
                    that._focusElement(that.wrapper);
                }

                if (activeFilter && key === keys.TAB) {
                    that.wrapper.focusout();
                } else {
                    that._blur();
                }*/

                toggle();
                pressed = true;
            } else if (key === keyMap.escape) {
            	hideWidget();
                pressed = true;
            }
            return pressed;
        },
        
        keydown = function(e) {
        	
            var key = e.keyCode;
            _lastkey = key;
            clearTimeout(_typing_timeout);
            _typing_timeout = null;
            
            if (key != keyMap.tab && !move(e)) {
            	if(options.filter === false){
            		return false;
            	}
                triggerSearch();
             }
        },
        
        change = function (e) {
            var val = $(e.target).val().trim();
            /*var parsedDate = val ? parseInputDate(val) : null;
            setValue(parsedDate);*/
        	
        	//TODO: trigger search
            e.stopImmediatePropagation();
            return false;
        },
        
        search = function(word) {
            word = typeof word === "string" ? word : textElement.val();
            var length = word.length;
            var ignoreCase = options.ignoreCase;
            var filter = options.filter;
            var field = options.textField;

            clearTimeout(_typing_timeout);

            if (!length || length >= options.minLength) {
                /*that._state = "filter";
                that.listView.filter(true);
                if (filter === "none") {
                    that._filter(word);
                } else {
                    that._open = true;
                    that._filterSource({
                        value: ignoreCase ? word.toLowerCase() : word,
                        field: field,
                        operator: filter,
                        ignoreCase: ignoreCase
                    });
                }*/
            }
        },
        triggerSearch = function() {
        	if(textElement){
        		_typing_timeout = setTimeout(function() {
                    var searchvalue = textElement.val();
                    if (_prev !== searchvalue) {
                        _prev = searchvalue;
                        search(searchvalue);
                    }
                    _typing_timeout = null;
                }, options.delay);
        	}
        },
        subscribeEvents = function () {
        	unsubscribeEvents();
        	if (textElement) {
        		textElement.on({
                    'change': change,
                    'blur': options.debug ? '' : hideWidget,
                    'keydown': keydown,
                    'focus':  showWidget,
                });
        	}
            if (component) {
                component.on('click', toggle);
                component.on('mousedown', false);
            }
            if(widget){
            	
            }
          
        },
        validate = function(){
        	var ret, state, message;
        	for(var i = 0; i < options.validators.length; i++){
        		var validator = options.validators[i];
        		var ret = true;
        		
        		if (typeof validator.func === "string"){
        			if((!! gonrin) && (!! gonrin.validate)){
        				ret = gonrin.validate[validator.func](value);
        			}else{
        				ret = false;
        			}
        		}
        		if (typeof validator.func === "function"){
        			ret = validator.func(value);
        		}
        		if (ret === false){
        			state = !! validator.state ? validator.state : "error";
        			message = !! validator.message ? validator.message : null;
        			setState(state, message);
        			break;
        		}
        	}
        	if (ret === true){
        		if(options.showStateOnValidateSuccess === true){
        			setState("success");
        		}else{
        			setState(null);
        		}
        	}
        	return ret;
        	
        },
        setState = function(state, message){
        	if(state === null){
        		groupElement.removeClass("has-warning has-error has-success");
        		helpmsg.html("");
        		helpmsg.hide();
        	}else if((state === "warning") || (state === "error") || (state === "success")){
    			groupElement.addClass("has-" + state);
    			if(!!message){
        			helpmsg.html(message);
            		helpmsg.show();
            	}else{
            		helpmsg.html("");
            		helpmsg.hide();
            	}
        	}
        	
        },
        unsubscribeEvents = function () {
        	if (textElement) {
        		textElement.off({
                    'change': change,
                    'blur': options.debug ? '' : hideWidget,
                    'keydown': keydown,
                    'focus': showWidget
                });
        	}
            
            if (component) {
                component.off('click', toggle);
                component.off('mousedown', false);
            }
            if(widget){
            	
            }
            //$(document)
            //.off('click.gr.combobox.data-api', '.input-group', function (e) { e.stopPropagation() })
            //.off('click.gr.combobox.data-api', hide);
        },
        hide = function(){
        	hideWidget();
        	if(groupElement){
        		groupElement.hide();
        	}
        },
        show = function(){
        	hideWidget();
        	if(groupElement){
        		groupElement.show();
        	}
        }
        ;

		/********************************************************************************
        *
        * Public API functions
        * =====================
        *
        * Important: Do not expose direct references to private objects or the options
        * object to the outer world. Always return a clone when returning values or make
        * a clone when setting a private variable.
        *
        ********************************************************************************/
       
		grobject.destroy = function () {
            ///<summary>Destroys the widget and removes all attached event listeners</summary>
			hideWidget();
            unsubscribeEvents();
            widget.remove();
            component.remove();
            helpmsg.remove();
            textElement.remove();
            element.removeData('gonrin');
        };
        grobject.show = show;
        grobject.hide = hide;
        grobject.toggle = toggle;
        grobject.showWidget = showWidget;
        grobject.hideWidget = hideWidget;
        grobject.setValue = setValue;
        grobject.getValue = getValue;
        grobject.getText = getText;
        grobject.setIndex = setIndex;
        //grobject.select = setSingleIndex;
        //grobject.getIndex = getIndex;
        grobject.validate = validate;
        grobject.setState = setState;
        
        
        grobject.disable = function () {
            ///<summary>Disables the input element, the component is attached to, by adding a disabled="true" attribute to it.
            ///If the widget was visible before that call it is hidden. Possibly emits dp.hide</summary>
        	hideWidget();
            if (component && component.hasClass('btn')) {
                component.addClass('disabled');
            }
            if (textElement){
            	textElement.prop('disabled', true);
            }
            input.prop('disabled', true);
            return grobject;
        };

        grobject.enable = function () {
            ///<summary>Enables the input element, the component is attached to, by removing disabled attribute from it.</summary>
            if (component && component.hasClass('btn')) {
                component.removeClass('disabled');
            }
            if (textElement){
            	textElement.prop('disabled', false);
            }
            input.prop('disabled', false);
            return grobject;
        };
        
        grobject.readonly = function () {
            ///<summary>Disables the input element, the component is attached to, by adding a disabled="true" attribute to it.
            ///If the widget was visible before that call it is hidden. Possibly emits dp.hide</summary>
        	hideWidget();
            if (component && component.hasClass('btn')) {
                component.addClass('disabled');
            }
            if (textElement){
            	textElement.prop('readonly', true);
            }
            return grobject;
        };
        
        grobject.options = function (newOptions) {
            if (arguments.length === 0) {
                return $.extend(true, {}, options);
            }

            if (!(newOptions instanceof Object)) {
                throw new TypeError('options() options parameter should be an object');
            }
            $.extend(true, options, newOptions);
            return grobject;
        };
        
        // initializing element and component attributes
        if ((element.is('input')) || (element.is('select')) ) {
            input = element;
            //value = input.val();
        
            var inputGroupEl;
            var parentEl = element.parent();
            
            
            if(parentEl.is('div') && parentEl.hasClass('input-group') && parentEl.hasClass('combobox-control')){
            	inputGroupEl = parentEl;
            }else{
            	element.wrap( '<div class="input-group combobox-control"></div>' );
                inputGroupEl = element.parent();
            }
            
            
            var parentInputGroupEl = inputGroupEl.parent();
            if(parentInputGroupEl.is('div') && parentInputGroupEl.hasClass('combobox-group')){
            	groupElement = parentInputGroupEl;
            }else{
            	inputGroupEl.wrap( '<div class="combobox-group"></div>' );
            	groupElement = inputGroupEl.parent();
            }
            
            //component
            var componentButton = element.nextAll('span:first');
            
            if((componentButton.length == 0 ) || !($(componentButton[0]).hasClass('input-group-addon'))){
            	componentButton = $('<span class="input-group-addon dropdown-toggle" data-dropdown="dropdown">').html('<span class="caret"></span><span class="glyphicon glyphicon-remove" style="display:none;"></span>');
                inputGroupEl.append(componentButton);
            }
            
            component = componentButton;
            
            var widgetEl = element.nextAll('ul:first');
            if(widgetEl.length > 0 ){
            	widgetEl.remove();
            }
            
            var prevEl = element.prev('input');
            if((prevEl.length == 0 ) || !($(prevEl[0]).hasClass('form-control'))){
            	prevEl = $('<input class="form-control" type="text">');
                element.before(prevEl);
            }
            textElement = prevEl;
            
            var helpEl = inputGroupEl.next('div');
            if((helpEl.length == 0 ) || !($(helpEl[0]).hasClass('help-block'))){
            	helpEl = $('<div class="help-block">');
            	inputGroupEl.after(helpEl);
            }
            helpmsg = helpEl;
            helpmsg.hide();
            element.css("display", "none");
        } else {
            throw new Error('Cannot apply to non input, select element');
        }

        $.extend(true, options, dataToOptions());
        grobject.options(options);
        
        if(options.selectionMode === "single"){
        	value =  (options.value !== null) ? options.value : ((input.val().trim().length !== 0) ? input.val().trim(): null);
        }else if(options.selectionMode === "multiple"){
        	try {
        		value = (options.value !== null) ? options.value : ((input.val().trim().length !== 0) ? $.parseJSON(input.val().trim()): []);
			} catch (error) {
				value = [];
			}
        }
        if(!!options.groupSize){
        	inputGroupEl.addClass("input-group-" + options.groupSize);
        }
        
    	setupWidget();
    	
    	if(!options.placeholder){
    		options.placeholder = input.attr("placeholder");
    	}
    	if(textElement && options.placeholder){
    		textElement.attr("placeholder", options.placeholder);
    	}
    	
    	if(options.valueField != null){
			if (options.textField === null){
				options.textField = options.valueField;
			}
    	}
    	
    	//if((options.index) && (options.index > -1)){
    	//	grobject.setSingleIndex(options.index);
    	//}
    	
        subscribeEvents();
        if (input.prop('disabled')) {
            grobject.disable();
        }
        if (input.prop('readonly')) {
            grobject.readonly();
        }
        
        return grobject;
		
	};
	
/*****************************************/
	
	$.fn.combobox = function (options) {
		
        return this.each(function () {
            var $this = $(this);
            options.refresh = options.refresh || false;
            if ($this.data('gonrin') && options.refresh){
            	$this.data('gonrin', null);
            }
            if (!$this.data('gonrin')) {
                // create a private copy of the defaults object
                options = $.extend(true, {}, $.fn.combobox.defaults, options);
                $this.data('gonrin', ComboBox($this, options));
            }
        });
    };

    $.fn.combobox.defaults = {
    	/*autobind: Controls whether to bind the widget to the data source on initialization.*/
    	autobind: true,
    	/*cascadeFrom: Use it to set the Id of the parent ComboBox widget.*/
    	cascadeFrom: null,
    	/*Defines the field to be used to filter the data source.*/
    	cascadeFromField: null,
    	/**/
    	placeholder: null,
    	readonly: false,
    	debug: false,
    	/*The delay in milliseconds between a keystroke and when the widget displays the popup.*/
    	delay: 200,
    	textField: null,
        valueField: null,
        /*dataSource: The data source of the widget which is used to display a list of values. 
         * Can be a JavaScript object which represents a valid data source configuration, a JavaScript array 
         * or an existing kendo.data.DataSource instance.*/
        dataSource: null,
        enable:true,
        //index: -1,
        /*filter: The filtering method used to determine the suggestions for the current value. Filtration is turned off by default. The supported filter values are startswith, endswith and contains.*/
        filter: false,
        height: "auto",
        /*If set to false case-sensitive search will be performed to find suggestions. The widget performs case-insensitive searching by default.*/
        ignoreCase: false,
        /*If set to true the widget will automatically use the first suggestion as its value.*/
        suggest: false,
        /*The minimum number of characters the user must type before a search is performed. Set to higher value than 1 if the search could match a lot of items.*/
        minLength: 1,
        /*Specifies a static HTML content, which will be rendered as a header of the popup element.*/
        headerTemplate: false,
        /*The template used to render the items. By default the widget displays only the text of the data item (configured via textField).*/
        template: false,
        /*The text of the widget used when the auto_bind is set to false.*/
        text: "",
        /*The value of the widget.*/
        value: null,
        focusOnShow: true,
        validators:[],
        selectionMode: "single",
        groupSize: null,
        showStateOnValidateSuccess: false
    };
}));