//
//		PUT MODULE EXPORT INSTRUCTIONS AT BOTTOM!!!
//
function prepareContainer(opts)
{
	var svgRoot = d3.select(opts.targetSelector || 'body').append("svg")
					.attr("xmlns","http://www.w3.org/2000/svg")
			//		.attr("xmlns:amcharts","http://amcharts.com/ammap")
			//		.attr("xmlns:xlink","http://www.w3.org/1999/xlink")
					.attr("version","1.1")
	if(opts.width)
		svgRoot.attr("width", opts.width)

	if(opts.height)
		svgRoot.attr("height", opts.height);

	var svgDefs = svgRoot.append('defs')
	if(opts.css)
		svgDefs.append("style")
			.attr("type","text/css")
			.text(opts.css)

	$(svgDefs[0][0]).append('\
		<filter id="hoverBlur" y="-10" height="20" x="-10" width="20">\
			<feOffset in="SourceAlpha" dx="0" dy="0" result="ofs2"></feOffset>\
			<feGaussianBlur in="ofs2" stdDeviation="3" result="hoverBlur"></feGaussianBlur>\
			<feMerge>\
				<feMergeNode in="hoverBlur"></feMergeNode>\
				<feMergeNode in="SourceGraphic"></feMergeNode>\
			</feMerge>\
		</filter>')

	return svgRoot;
}

function preparePars (input,flags){
	var defaults = {
		Tvpc:   				[ 'string', '0%'], //отступ графика от верхнего края
		Bvpc: 					[ 'string', '0%'], //отступ графика от нижнего края
		font_size: 				[ 'int', 12 ],
		font_family: 			[ 'string', 'sans-serif' ],
		font_weight: 			[ 'string', 'normal' ],
		font_style: 			[ 'string', 'normal' ],
		font_color: 			[ 'string', 'white' ],
		values_hidden: 			[ 'bool', false ], //скрытие значенией графика
		values_display: 		[ 'string', '' ], //ограничения для отображения значений, пример '(min,max)(1,1)'
		header_font_size: 		[ 'int', 20 ],
		header_font_weight: 	[ 'string', 'bold' ],
		header_padding_top: 	[ 'int', 30 ],
		header_padding_bottom: 	[ 'int', 30 ],
		floating_part_length:	['int', false], //позволяет ограничить либо добавить количество знаков после запятой, меняет разделитель на запятую
		groups_hidden: 			[ 'bool', true ], //отображает группы графика
		y_axis: 				['bool',false], //отображает шкалу значений
		/*separate_dates: 		['bool',false], //отображает разделители групп
		legend_font_size: 		[ 'int', 16 ],
		legend_font_family:		[ 'string', 'sans-serif' ],
		legend_font_weight: 	[ 'string', 'normal' ],
		legend_font_style: 		[ 'string', 'normal' ],
		legend_font_color: 		[ 'string', 'black' ]
		*/
	}

	input.style = extendDefaults(defaults, input.style);

	input.style.add_margin = getTextHeight('foo', input.style);

	input.targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector;

	if (!flags) flags={}

	input.x = input.x || 0;
	input.y = input.y || 0;
	input.height = input.height || 100;
	input.width = input.width || 100;

	input.svg = input.targetSelector.append("svg")
				.attr("x",input.x)
				.attr("y",input.y)
				.attr("width", input.width)
				.attr("height", input.height)

	input.svg.append("defs")
		.append("style")
		.attr("type","text/css")
		.text(input.CSS)

	//draw header

	if (!isObjectEmpty(input.style.header_text))
	{
		var hdrOpts = {
			targetSelector: input.svg,
			x: 0,
			y: 0,
			width: input.width,
			height: input.height,
			dataset: input.style.header_text,
			skip_own_container: true,
			style: optionsByPrefix(input.style, 'header_'),
			editableClass: 'header',
			editablePart: "header"
		};

		input.header_height = SVGTextDrawer(hdrOpts);
	}else
		input.header_height = 0;


	input.plot_box={
		"width":input.width,
		"x":0,
		"height":input.height-input.header_height,
		"y":0 + input.header_height
	}
	input.font_size = input.style.font_size;

	if(typeof input.dataset == 'object' && input.dataset.charts)
	{
		input.legend_box= {
			"width":input.width,
			"x":0,
			"height":input.height-input.header_height,
			"y":0+input.header_height,
			"style":optionsByPrefix(input.style, 'legend_')
		}

		if ("stacked" in flags){
			var data =[]
			var data_min=[]
			var index=0
			var real_value=0
			for (var date in input.dataset.charts[0].data){
				for(var chart in input.dataset.charts){
					if(index == data.length) data.push(0)
					data[index]+=input.dataset.charts[chart].data[date]
					data_min.push(input.dataset.charts[chart].data[date])
					real_value=input.dataset.charts[chart].data[date]
					input.dataset.charts[chart].data[date]={}
					input.dataset.charts[chart].data[date].real=real_value
					input.dataset.charts[chart].data[date].new=data[index]
				}
				index++
			}
			input.max =  d3.max(data)
			input.min =  d3.min(data_min)

		}else if ("stackedfull" in flags){
			var data =[]
			var index=0
			for (var date in input.dataset.charts[0].data){
				for(var chart in input.dataset.charts){
					if(index == data.length) data.push(0)
					data[index]+=input.dataset.charts[chart].data[date]
					var real_value=input.dataset.charts[chart].data[date]
					input.dataset.charts[chart].data[date]={}
					input.dataset.charts[chart].data[date].real=real_value
					input.dataset.charts[chart].data[date].new=data[index]
				}
				index++
			}

			var index=0
			for (var date in input.dataset.charts[0].data){
				for(var chart in input.dataset.charts){
					input.dataset.charts[chart].data[date].new=input.dataset.charts[chart].data[date].new/(data[index]/100)
				}
				index++
			}

			input.max =  100
			input.min =  0
		}
		else{
			var data =[]

			for (var date in input.dataset.charts[0].data){
				for(var chart in input.dataset.charts){
					data.push({'name':input.dataset.charts[chart].chart,'value':input.dataset.charts[chart].data[date]})

				}
			}

			input.max =  d3.max(data, function(d) { return d.value; })
			input.min =  d3.min(data, function(d) { return d.value; })
		}


		input.max += topc(input.style.Tvpc,input.max)
		input.min += topc(input.style.Bvpc,input.min)

		if (input.min>0 && !('line' in flags) && !('circle' in flags)) input.min=0

		//Создает новое значение для вывода пользователю.
		var real_value=0
		for (var date in input.dataset.charts[0].data){
			for(var chart in input.dataset.charts){
				if (typeof(input.dataset.charts[chart].data[date])!="object" || input.dataset.charts[chart].data[date]==null){
					var real_value=input.dataset.charts[chart].data[date]
					input.dataset.charts[chart].data[date]={}
					input.dataset.charts[chart].data[date].real=real_value
				}else real_value=input.dataset.charts[chart].data[date].real
				if (input.style.floating_part_length){
					real_value=real_value+""
					var splited_value=real_value.split('.')
					if (splited_value.length==2){
						input.dataset.charts[chart].data[date].for_print=splited_value[0]+","+splited_value[1].substr(0,input.style.floating_part_length)
					}
				}
				if (!('for_print' in input.dataset.charts[chart].data[date])) input.dataset.charts[chart].data[date].for_print=real_value
				if (input.dataset.charts[chart].data[date].real==null) input.dataset.charts[chart].data[date].for_print=""
			}
		}

		for (var date in input.dataset.charts[0].data){
			for(var chart in input.dataset.charts){
				data.push({'name':input.dataset.charts[chart].chart,'value':input.dataset.charts[chart].data[date]})
			}
		}

		if (input.max>Math.abs(input.min)){
			input.values_len=input.max
		}else input.values_len=input.min

		input.values_len=(""+Math.floor(input.values_len)).length+1

		//prepare array for legend element
		input.legend_box.items=[]
		if (input.style.double_pie){
			switch (input.style.ordering_logic){
				case 'by_date':
					for (var date in input.dataset.charts[0].data){
						input.legend_box.items.push(date)
					}
				break;
				case 'by_name':
					for (var chart in input.dataset.charts){
						input.legend_box.items.push(input.dataset.charts[chart].chart)
					}
				break;
			}
		}else{
			for (var chart in input.dataset.charts){
				input.legend_box.items.push(input.dataset.charts[chart].chart)
			}
		}

		var do_draw_legend=true
		switch (input.style.legend_location){
			case "left":
				input.legend_box.width=input.width*(input.style.legend_size/100)
				input.plot_box.width=(input.width-input.legend_box.width)
				input.plot_box.x=input.legend_box.width
				break;
			case "right":
				input.legend_box.width=input.width*(input.style.legend_size/100)
				input.plot_box.width=(input.width-input.legend_box.width)
				input.legend_box.x=input.plot_box.width
				break;
			case "bottom":
				input.legend_box.height=input.height*(input.style.legend_size/100)
				input.plot_box.height=input.height-input.legend_box.height-input.header_height
				input.legend_box.y=input.height-input.legend_box.height
				break;
			default:
				do_draw_legend=false
		}
		if (do_draw_legend){
			if (input.style.double_pie){
				DrawLegend(input.svg,input.legend_box,input.style.inner_pie_element_fill)
			}
			else  DrawLegend(input.svg,input.legend_box,input.style.element_fill)
		}
		//тест зоны отрисовки. #test
		/*
		input.svg.append('g')
			.attr('class','for_tests')
			.append('rect')
			.attr('x',input.plot_box.x+1)
			.attr('y',input.plot_box.y+1)
			.attr('width',input.plot_box.width-2)
			.attr('height',input.plot_box.height-2)
			.attr('stroke','white')
			.attr('stroke-width',1)
			.attr('fill','lightGreen')
			.attr('opacity',1)*/

		if (input.style.flip){
			input.max = input.max * (-1)
			input.min = input.min * (-1)
			var temp = input.max
			input.max = input.min
			input.min = temp
		}

		prepareLimits(input)
		//prepearing dates array to display
		var datesArray=[]
		for (var date in input.dataset.charts[0].data){
			datesArray.push({'date':date})
		}
		if (!input.style.groups_hidden){
			prepareGroups(input, datesArray, flags);
		}
		if (input.style.y_axis){
			prepareScaleY(input,flags)
		}
		if (!input.style.groups_hidden){
			processGroups(input, datesArray, flags);
		}
	}
}
//подготовка значений, размеров и отступов для области групп
function prepareGroups(input, data, flags){
	groups_pars={}

	var defaults = {
		groups_display: 		[ 'bool', true ],	//if given enables date display
		groups_rotation: 		[ 'float', 0 ],
		groups_order: 			[ 'string', "as-is" ],
		groups_font_size: 		[ 'int', 12 ],
		groups_color: 			['string','black'],
		groups_font_family: 	[ 'string', 'sans-serif' ],
		groups_font_weight: 	[ 'string', 'bold' ],
		groups_font_style: 		[ 'string', 'normal' ],
		groups_date_format: 	[ 'string', '%Y/%m' ],
		groups_separator_type: 	['string', 'circle'] //тип разделителя.
	}
	if (!flags) flags={}

	input.style = extendDefaults(defaults, input.style);

	if (!input.style.groups_display) return;

	groups_pars.groupMaxTextWidth = 0

	groups_pars.group_font_style = optionsByPrefix(input.style,'groups_');

		data.forEach(function(element){
		var d = new Date(element.date)
		element.date_fmt = d.strftime
							? d.strftime(input.style.groups_date_format)
							: element.date.substr(8,2)+"."+element.date.substr(5,2)+"."+element.date.substr(0,4);

		groups_pars.groupMaxTextWidth = Math.max(groups_pars.groupMaxTextWidth, getTextWidth(element.date_fmt, groups_pars.group_font_style))
	})

	if (input.style.groups_order=="ascending"){
		data.sort(function (a, b) {
			if(a.date == b.date) return 0;
			if((new Date( a.date )) > (new Date( b.date ))) return 1;
			return -1;
		});
	}else if (input.style.groups_order=="descending"){
		data.sort(function (a, b) {
			if(a.date == b.date) return 0;
			if((new Date( a.date )) < (new Date( b.date ))) return 1;
			return -1;
		});
	}

	groups_pars.angle = Math.abs( input.style.groups_rotation ) * Math.PI / 180
	var	dstrW = groups_pars.groupMaxTextWidth,
		dstrH = getTextHeight('123', groups_pars.group_font_style);
	groups_pars.dstrBottomSpan = dstrH / 3 /* font's 1/3 - is area-for-letter-tails */
	var s1 = dstrW * Math.sin( groups_pars.angle ) + dstrH * Math.cos( groups_pars.angle )
	groups_pars.dateSpan =  s1 + dstrH

	groups_pars.date_cord_y = input.plot_box.y + input.plot_box.height - groups_pars.dateSpan / 2 + groups_pars.dstrBottomSpan

	groups_pars.size=input.plot_box.width
	groups_pars.outter_indent = 0
	groups_pars.inner_indent = 0

	if ("horbar" in flags){
		groups_pars.date_cord_y = - groups_pars.dateSpan/2 - groups_pars.dstrBottomSpan
		groups_pars.size=input.plot_box.height
	}

	if ("indents" in flags){
		groups_pars.outter_indent = topc(input.style.outter_indent,input.plot_box.width)
		groups_pars.inner_indent = topc(input.style.inner_indent)
	}

	if ("horbar" in flags){
		input.plot_box.width =input.plot_box.width - groups_pars.dateSpan
		input.plot_box.x+=groups_pars.dateSpan
		input.plot_box.dateSpan=groups_pars.dateSpan
	}else input.plot_box.height -= groups_pars.dateSpan
	input.groups_pars=groups_pars
}

//отрисовка области групп
function processGroups(input, data, flags){

	if (!flags) flags={}

	var groups_pars = input.groups_pars

	groups_pars.size=input.plot_box.width
	if ("horbar" in flags) groups_pars.size=input.plot_box.height

	var x = d3.scale.ordinal()
				.rangePoints([0 + groups_pars.outter_indent, groups_pars.size - groups_pars.outter_indent],1 + groups_pars.inner_indent);
	x.domain(data.map(function(d) { return d.date; }));

	input.svg.append("g")
		.attr("class","for_dates")
		.attr("transform", "translate("+input.plot_box.x+","+input.plot_box.y+")")
		.selectAll("_")
			.data(data)
			.enter().append("g")
					.attr("transform",function(d) {
						if ("horbar" in flags){
							return "translate("+(groups_pars.date_cord_y)+"," + (x(d.date)) +") rotate(90)"
						}else return "translate("+(x(d.date))+"," + groups_pars.date_cord_y +")";
					})
					.append("text")
						.attr("x", function(d){
							if ("horbar" in flags){
								return -getTextWidth(d.date_fmt, groups_pars.group_font_style)/2
							} return -getTextWidth(d.date_fmt, groups_pars.group_font_style)/2})
						.attr("y",function(d){return groups_pars.dstrBottomSpan * Math.sin( groups_pars.angle )})
						.attr("editablepart",function(d, I){ return format("groupvalue_{0}", I) })
						.attr("editableclass", "groupvalues")
						.attr('font-size', input.style.groups_font_size)
						.attr('font-family', input.style.groups_font_family)
						.attr('font-weight', input.style.groups_font_weight)
						.attr('font-style', input.style.groups_font_style)
						.attr('fill',input.style.groups_color)
						.attr("transform", "rotate("+input.style.groups_rotation+")")
						//.attr("text-anchor","middle")
						.text(function(d) {return d.date_fmt })

	if ("separate_dates" in input.style){
		var separator_shift=0, last=data.length, curindex=1

		input.svg.append("g")
			.attr("transform", "translate("+input.plot_box.x+", "+input.plot_box.y+")")
			.attr("class","separators")
			.selectAll("_")
				.data(data)
				.enter().append("g")
				.attr("transform",function(d) {
					if ("horbar" in flags){
						if (!separator_shift){
							separator_shift=x(d.date)-groups_pars.outter_indent-x(d.date)*(groups_pars.inner_indent)/2
						}
						return "translate("+ (groups_pars.date_cord_y+input.style.groups_font_size/3) + "," + (x(d.date)+separator_shift) +") rotate(90)"
					}
					if (!separator_shift){
						separator_shift=x(d.date)-groups_pars.outter_indent-x(d.date)*(groups_pars.inner_indent)/2
					}
					return "translate("+ (x(d.date) + separator_shift) +","+ (groups_pars.date_cord_y-input.style.groups_font_size/3) +")";
				})

				input.svg.select("g.separators")
				.selectAll("g")
				.each(function(d, I){
					if(I>=data.length-1) return;
					if (input.style.groups_separator_type=='circle') this.innerHTML = ('<circle r="'+input.style.groups_font_size/3+'" fill="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='rect') this.innerHTML = ('<rect x="-'+input.style.groups_font_size/3+'" y="-'+input.style.groups_font_size/3+'" width="'+input.style.groups_font_size/1.5+'" height="'+input.style.groups_font_size/1.5+'" fill="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='slash') this.innerHTML = ('<line x1="-'+input.style.groups_font_size/3+'" y1="-'+input.style.groups_font_size/3+'" x2="'+input.style.groups_font_size/3+'" y2="'+input.style.groups_font_size/3+'" stroke-width="'+input.style.groups_font_size/6+'" stroke="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='backslash') this.innerHTML = ('<line x1="'+input.style.groups_font_size/3+'" y1="-'+input.style.groups_font_size/3+'" x2=-"'+input.style.groups_font_size/3+'" y2="'+input.style.groups_font_size/3+'" stroke-width="'+input.style.groups_font_size/6+'" stroke="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='vertline') this.innerHTML = ('<line  y1="-'+input.style.groups_font_size/3+'" y2="'+input.style.groups_font_size/3+'" stroke-width="'+input.style.groups_font_size/6+'" stroke="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='line') this.innerHTML = ('<line x1="-'+input.style.groups_font_size/3+'" x2="'+input.style.groups_font_size/3+'" stroke-width="'+input.style.groups_font_size/6+'" stroke="'+input.style.groups_color+'" class="" />')
					if (input.style.groups_separator_type=='star') this.innerHTML = ('<text x="'+0+'" y="'+input.style.groups_font_size+'" fill="'+input.style.groups_color+'" text-anchor="middle" font-size="'+input.style.groups_font_size*2+'" class="">*</text>')
					if (input.style.groups_separator_type=='smallstar') this.innerHTML = ('<text x="'+0+'" y="'+input.style.groups_font_size/2+'" fill="'+input.style.groups_color+'" text-anchor="middle" font-size="'+input.style.groups_font_size+'" class="">*</text>')

				})
	}
}

function prepareCSS (input,flags){
	var CSS=""

	if ('line' in flags){

		var real_lenght=input.style.element_fill.length
		for (var I=real_lenght;I<input.dataset.points; I++){
			input.style.element_fill.push(input.style.element_fill[I%real_lenght])
		}

		real_lenght=input.style.line_fill.length
		for (var I=real_lenght;I<input.dataset.points; I++){
			input.style.line_fill.push(input.style.line_fill[I%real_lenght])
		}

		for (var I=0;I<input.style.line_fill.length; I++){
			CSS+=".line"+I+" {stroke:"+input.style.line_fill[I]+"; stroke-width:"+input.style.line_width+"; font: "+input.style.value_font+"; font-weight:"+input.style.value_weight+"; text-anchor:middle;}\n"
		}
	}
	if ('pie' in flags){

		var real_lenght=input.style.element_fill.length
		for (var I=real_lenght;I<input.dataset.points; I++){
			input.style.element_fill.push(input.style.element_fill[I%real_lenght])
		}
		CSS+=".labels {font-size:"+input.style.legend_font_size+"px; font-family:"+input.style.legend_font_family+";"+
		 "font-style:"+input.style.legend_font_style+"; font-weight:"+input.style.legend_font_weight+"; text-anchor:start; fill:"+input.style.legend_font_color+";}\n"

	}

	for (var I=0;I<input.style.element_fill.length; I++){
		CSS+=".element"+I+" {fill:"+input.style.element_fill[I]+"; radius:"+input.style.point_size+"; font: "+input.style.value_font+"; font-weight:"+input.style.value_weight+"; text-anchor:middle;}\n"
	}

	CSS+=".axis path, .axis line {stroke: #000;}\n"

	CSS+=".value {font-size:"+input.style.font_size+"px; font-family:"+input.style.font_family+";"+
	 "font-style:"+input.style.font_style+"; font-weight:"+input.style.font_weight+"; text-anchor:middle; fill:"+input.style.font_color+";}\n"

	//для пирожка
	CSS+=".arc path{stroke:"+input.style.border_color+";stroke-width:"+input.style.border_width+"}"

	CSS+=".axis path, .axis line {stroke: #000;}\n"

	input.CSS=CSS
}

//Функция подготавливающая шкалу Y

function prepareScaleY(input,flags){

	var defaults = {
		y_axis_rotation: 		[ 'float', 0 ],
		y_axis_font_size: 		[ 'int', 12 ],
		y_axis_font_family: 	[ 'string', 'sans-serif' ],
		y_axis_font_weight: 	[ 'string', 'bold' ],
		y_axis_font_style: 		[ 'string', 'normal' ],
		y_axis_format: 			[ 'string', '' ],
		//properties for displaying tuning
		y_axis_ticks: 			[ 'int', 10 ],
		y_axis_labels_shift: 	[ 'int', 10 ],
		y_axis_lines_length: 	[ 'string', '100%' ],
		y_axis_lines_width: 	[ 'int', 1 ],
		y_axis_path_width: 		[ 'int', 1 ],
		scale_minz : 			['bool',false], // позволяет изменить вид шкалы на "минзурку"
		y_axis_top_indent: 		['float',0], //используется для создания отступа в 3D графиках
	}
	if (!flags) flags={}


	input.style = extendDefaults(defaults, input.style);
	style = optionsByPrefix(input.style,'y_axis_');

	style.sizes={
		x : input.plot_box.x,
		y : input.plot_box.y,
		width : input.plot_box.width,
		height : input.plot_box.height,
	}

	if ('horbar' in flags){
		if ('line_width' in input.style){
			style.sizes.x+=input.style.line_width-(style.lines_width)
			style.sizes.width-=input.style.line_width
		}
			var MaxTextHeight = style.font_size*1.3

			//Сдвиги области в связи с добавлением шкалы
			style.sizes.x += (style.lines_width/2)
			style.sizes.y+=style.path_width/2
			if ('stacked' in flags){
				style.MaxTextWidth = getTextWidth(0, style),

				style.MaxTextWidth = Math.max(style.MaxTextWidth, getTextWidth(100, style))
				style.MaxTextWidth = Math.max(style.MaxTextWidth, getTextWidth(100/style.ticks, style))
			}else{
				style.MaxTextWidth = getTextWidth(input.min, style),

				style.MaxTextWidth = Math.max(style.MaxTextWidth, getTextWidth(input.max, style))
				style.MaxTextWidth = Math.max(style.MaxTextWidth, getTextWidth(input.max/style.ticks, style))

			}

			style.MaxTextHeight=MaxTextHeight
			input.y_axis=style

			//Сдвиги области в связи с добавлением шкалы

			input.plot_box.y += MaxTextHeight*1.3 + style.labels_shift + style.path_width
			input.plot_box.height -= (MaxTextHeight*1.3 + style.labels_shift + style.path_width)
	}else{
		if ('line_width' in input.style){
			style.sizes.height=style.sizes.height-input.style.line_width
		}

		var MaxTextWidth = getTextWidth(input.min+"", style),

		MaxTextWidth = Math.max(MaxTextWidth, getTextWidth(input.max+"1", style))
		MaxTextWidth = Math.max(MaxTextWidth, getTextWidth(input.max/style.ticks+"1", style))

		if ('stackedfull' in flags){
			MaxTextWidth = Math.max(MaxTextWidth, getTextWidth(input.max+"1%", style))
			MaxTextWidth = Math.max(MaxTextWidth, getTextWidth(input.max/style.ticks+"1%", style))
		}

		//input.style.add_margin+=style.lines_width/2
		//Сдвиги области в связи с добавлением шкалы
		if (input.style.values_hidden){
			style.sizes.y += 1
			style.sizes.height = style.sizes.height
		}else{
			style.sizes.y += (style.lines_width/2 + style.font_size/3+ input.style.add_margin) + style.lines_width
			style.sizes.height = style.sizes.height - (style.lines_width/2 + style.font_size/3 + input.style.add_margin)
		}

		if ('line' in flags){

			style.sizes.height=input.plot_box.height
			style.sizes.y=input.plot_box.y

			style.sizes.height-=input.style.point_size
			style.sizes.y+=input.style.point_size/2

			var value_margin = input.style.font_size*1.3
			if (!input.style.values_hidden){
				if (input.style.value_location=="top" && input.style.vmax==null){
					style.sizes.height -= input.style.value_padding + value_margin
					style.sizes.y += input.style.value_padding + value_margin
				}
				else if (input.style.vmin==null){
					style.sizes.height -= input.style.value_padding + value_margin
				}
			}

		}

		style.MaxTextWidth=MaxTextWidth
		input.y_axis=style

		//Сдвиги области в связи с добавлением шкалы
		input.plot_box.x += MaxTextWidth + style.labels_shift + style.path_width
		input.plot_box.width = input.plot_box.width - (MaxTextWidth + style.labels_shift + style.path_width)
	}

}

//Функция отрисовывающая шкалу Y
function processScaleY(input,flags){

	if (!flags) flags={}
	var style = input.y_axis
	var path_width = 0
	if ('3D' in flags){
		if ('horbar' in flags){
			var height = input.style.y_axis_top_indent
			var y = d3.scale.ordinal()
						.rangeRoundBands([topc(input.style.outter_indent,height), height-topc(input.style.outter_indent,height)], topc(input.style.inner_indent));
			var arr = [];
			for (var i=0;i<input.dataset.points;i++) arr.push('a'+i)
			y.domain(arr);
			path_width = topc(input.style.side_width,y.rangeBand())
		}else{
			var width = input.style.y_axis_top_indent
			var x = d3.scale.ordinal()
						.rangeRoundBands([topc(input.style.outter_indent,width), width-topc(input.style.outter_indent,width)], topc(input.style.inner_indent));
			var arr = [];
			for (var i=0;i<input.dataset.points;i++) arr.push('a'+i)
			x.domain(arr);
			path_width = topc(input.style.side_width,x.rangeBand())
			style.sizes.y += path_width
		}
	}

	if ('horbar' in flags){
		style.sizes.width = style.sizes.width - (path_width)
		if (input.min>=0)
		{
			if ('stacked' in flags){ drawScale(0,style.sizes.width - ((input.style.values_hidden)? 0 : input.dataMaxTextWidth),100,0,style.ticks,flags)
			}else drawScale(0,style.sizes.width - ((input.style.values_hidden)? 0 : input.dataMaxTextWidth),input.max,input.min,style.ticks,flags)
		}else{

			var sub_width=style.sizes.width
			var negative_value_shift=0
			if (!input.style.values_hidden){
				sub_width=sub_width-input.dataMaxTextWidth
			}

			if (input.min>0){
				input.min=0
			}else if (input.min<0){sub_width=sub_width-input.dataMaxTextWidth
				negative_value_shift=input.dataMaxTextWidth
			}

			var coef=sub_width/(input.max+Math.abs(input.min)),
				positive_width=input.max*coef,
				negative_width=-input.min*coef

			drawScale(negative_width + negative_value_shift, style.sizes.width- ((input.style.values_hidden)? 0 : input.dataMaxTextWidth),input.max,0,style.ticks/2,flags)
			var gy = drawScale(input.dataMaxTextWidth - input.style.line_width +1, negative_width + negative_value_shift - input.style.line_width +1, 0,input.min,style.ticks/2,flags)
			gy[0].selectAll("text.y_axis_label"+(gy[1]))
			.remove()
		}
	}else{
		if (input.min>=0)
		{
			if ('stacked' in flags){ drawScale(-1,style.sizes.height - path_width,0,100,style.ticks,flags)
			}else drawScale(0,style.sizes.height - path_width,input.min,input.max,style.ticks,flags)
		}else{
			if (input.style.values_hidden){
				style.sizes.height = style.sizes.height - (style.lines_width/2)

			}else{
				style.sizes.height = style.sizes.height - (style.lines_width/2 + input.style.add_margin*1.3)
			}

			var coef=style.sizes.height/(input.max+Math.abs(input.min)),
				positive_height=(input.max*coef) - path_width,
				negative_height=-input.min*coef
			drawScale(0,positive_height,0,input.max,style.ticks/2,flags)
			var gy = drawScale((positive_height + input.style.line_width - style.lines_width-1),(positive_height + negative_height + input.style.line_width - style.lines_width-1),input.min,0,style.ticks/2,flags)
			gy[0].selectAll("text.y_axis_label"+(gy[1]))
			.remove()
		}
	}

	function drawScale(start,end,min,max,ticks,flags){
		if (input.style.flip){
			if (min!=0) min=min*(-1)
			if (max!=0) max=max*(-1)
		}

		var y = d3.scale.linear()
		.domain([max, min])
		.range([start, end]);
		if ('horbar' in flags){
			var res_width=style.sizes.height;
			if (input.style.scale_minz) res_width=(style.labels_shift + style.path_width + style.MaxTextHeight);

			var yAxis = d3.svg.axis()
			.scale(y)
			.ticks(ticks)
			.tickSize(topc(style.lines_length,res_width),style.path_width) //можно использовать любое значение
			.tickFormat(formatCreator) //function that returns tick string
			.orient((input.style.scale_minz)?"top":"bottom"); //'left'
			var last=[]
			var gy = input.svg.append("g")
							.attr("transform","translate("+style.sizes.x+","+((input.style.scale_minz)?(style.sizes.y+res_width):style.sizes.y)+")")
							.attr("class", "y axis")
							.call(yAxis)
							.call(customAxis,last);
			return (input.style.flip)? [gy,last.shift()]: [gy,last.pop()];
		}else{
			var res_width=input.plot_box.width+(style.MaxTextWidth + style.labels_shift + style.path_width);
			if (input.style.scale_minz) res_width=(style.MaxTextWidth + style.labels_shift);
			var yAxis = d3.svg.axis()
			.scale(y)
			.ticks(ticks)
			.tickSize(topc(style.lines_length,res_width),style.path_width) //можно использовать любое значение
			.tickFormat(formatCreator) //function that returns tick string
			.orient((input.style.scale_minz)?"left":"right"); //'left'
			var last=[]
			var gy = input.svg.append("g")
							.attr("transform","translate("+((input.style.scale_minz)?(style.sizes.x+res_width + style.path_width/2):style.sizes.x)+","+(style.sizes.y)+")")
							.attr("class", "y axis")
							.call(yAxis)
							.call(customAxis,last);
			return (input.style.flip)? [gy,last.shift()]: [gy,last.pop()];
		}
	}
	function customAxis(g,last) {

		var dy=0
		var dx=0
		if ('horbar' in flags){
			dy=style.MaxTextHeight
			dx=style.MaxTextWidth/(('stackedfull' in flags ||'stacked' in flags)?1:2)
			console.log(dx)
			if (input.style.scale_minz){
				dy=topc(style.lines_length,style.MaxTextHeight) - style.path_width/2
				dx=style.MaxTextWidth
			}
			if (input.style.values_hidden){
				dx=-style.MaxTextWidth*0.9
			}
		}else{
			dy=-style.font_size*0.3
			dx=style.MaxTextWidth/2 + style.path_width - (('stackedfull' in flags ||'stacked' in flags)? getTextWidth("%",style)/2: 0)
			if (input.style.scale_minz){
				dy=-style.font_size*0.3
				dx=-(style.MaxTextWidth)/2 - style.path_width + (('stackedfull' in flags ||'stacked' in flags)? getTextWidth("%",style)/2: 0)
			}
			if (input.style.values_hidden || input.style.value_location == 'bottom'){
				dy=style.font_size*1.3
			}
		}

		g.selectAll("text")
			.attr('class',function(d,i){ last.push(i)
			return 'y_axis_label'+i})
		.attr("x", dx)
		.attr("dy", dy)
		.attr('text-anchor','middle')
		.attr('style','')
		.attr('font-size',style.font_size)
		.attr('font-family',style.font_family)
		.attr('font-weight',style.font_weight)
		.attr('font-style',style.font_style);

		if (input.style.scale_minz){
		g.selectAll("text")
				.attr('class',function(d,i){ last.push(i)
				return 'y_axis_label'+i})
			.attr("x", dx)
			.attr("dy", dy)
			.attr('text-anchor','middle')
			.attr('style','')
		}else if ('horbar' in flags){
			g.selectAll("text")
				.attr('class',function(d,i){ last.push(i)
				return 'y_axis_label'+i})
			.attr("y", 0)
		}

		g.selectAll('line')
			.attr('stroke', 'black')
			.attr('stroke-width',style.lines_width)
			.attr("stroke-dasharray","2,2")
	}

	function formatCreator(d){
		if ('stackedfull' in flags) return d+"%"
		if ('stacked' in flags) return (d/1)+"%"
		return d
	}
}

//Функции расчета оптимальных размеров обасти для отрисовки графов
function create_optsizes(len,available_width,available_height){
    var multipliers=[]
    multipliers = get_proportions(len,Math.round(len/10),multipliers)

    required_value = available_width / available_height
    min_difference=len
    pos_min_difference=-1
    for (var I=0;I<multipliers.length;I++){
        if(Math.abs(multipliers[I][3]-required_value)<min_difference){
            min_difference = Math.abs(multipliers[I][3]-required_value)
            pos_min_difference = I
        }
    }
    //расчет размеров области для отрисовки элементов

    available_width = available_width/multipliers[pos_min_difference][1]
    available_height = available_height/multipliers[pos_min_difference][2]

    return [available_width,available_height,multipliers[pos_min_difference][2],multipliers[pos_min_difference][1]]

}

function get_proportions(len,steps,multipliers){
    if (!steps && steps!=0){
        steps=1
    }
    for (var multiplier_1=1;multiplier_1<=len;multiplier_1++){
        multiplier_2=len/multiplier_1
        if(0==(multiplier_2%1)) multipliers.push([len,multiplier_1,multiplier_2,multiplier_1/multiplier_2])
    }
    if (multipliers.length==2 && len>2){
        len+=1
        steps-=1
        multipliers=get_proportions(len,0,multipliers)
    }
    while (steps>0){
        len+=1
        steps-=1
        multipliers=get_proportions(len,0,multipliers)
    }

    return multipliers
}

//Функции перевода входной строки в проценты (.01) или из процентов в пикселы в процентах от данного числа
// и функция перевода входной строки в пикселы (15)

function topx(input){
	pos=input.indexOf('px')
	if (pos>0){
		return input.substr(0,pos)
	}
}

function topc(input,max){
	if (max){
		pos=input.indexOf('%')
		if (pos>0){
			return input.substr(0,pos)*0.01*max
		}
	}
	pos=input.indexOf('%')
	if (pos>0){
		return input.substr(0,pos)*0.01
	}
}

function prepareLimits(input){
	if (typeof(input.style.values_display)=="string"){
		var rules=input.style.values_display.split(")")
		if (typeof(rules)=="object"){
			rules.pop()
			for (var I in rules){
				rules[I]=rules[I].slice(1)
				rules[I]=rules[I].split(",")
			}
			input.style.values_display = rules
		}
	}
}
/*
	returns new markup with proper percent and absolute values
*/
function fixMarkup(markup, startX, startY, parentWidth, parentHeight, orientation, zIndex, parentId)
{
	var result = [],
		prevSizes = 0,
		orients = {'v':'h','h':'v'};
	startX = startX || 0;
	startY = startY || 0;
	if(typeof zIndex == 'undefined')
		zIndex = 0;
	if(!orientation)
		orientation = 'v';
	if(!parentId) parentId = '';
	//collect sizes

	fixSizes(markup, orientation == 'v' ? parentHeight : parentWidth);

	for(var x in markup)
	{
		var o = markup[x],
			key = o.content? 'content':'cells',
			list = o[key],
			me = {
				key:x,
				id: 'rect'+parentId+'_'+x,
				parent: parentId,
				type: "rect",
				x: orientation == 'v' ? startX : startX+prevSizes,
				y: orientation == 'h' ? startY : startY+prevSizes,
				width: orientation == 'v' ? parentWidth : o.pixelSize,
				height: orientation == 'h' ? parentHeight : o.pixelSize,
				style: o.style || {},
				source: o,
				zIndex: zIndex
			};
		me.cntX = me.x + (me.style.padding_left || 0);
		me.cntY = me.y + (me.style.padding_top || 0);
		me.cntWidth = me.width - (me.style.padding_left || 0) - (me.style.padding_right || 0);
		me.cntHeight = me.height - (me.style.padding_top || 0) - (me.style.padding_bottom || 0);

		//borders
		var b;
		if(b = parseBorder(me.style.border_left||''))
		{
			me.cntX += b.size
			me.cntWidth -= b.size
		}
		if(b = parseBorder(me.style.border_top||''))
		{
			me.cntY += b.size
			me.cntHeight -= b.size
		}
		if(b = parseBorder(me.style.border_right||''))
			me.cntWidth -= b.size
		if(b = parseBorder(me.style.border_bottom||''))
			me.cntHeight -= b.size

		var	subMarkup = [];

		result.push(me);
		if(list && list.length && (typeof list == 'array' || typeof list == 'object'))
			subMarkup = fixMarkup(list, me.cntX, me.cntY, me.cntWidth, me.cntHeight, orients[orientation], zIndex+1, parentId+'_'+x);
		else if(typeof list != 'undefined')
			me.content = list;

		if(subMarkup.length)
			result = result.concat(subMarkup);
		prevSizes += o.pixelSize;

	}
	//sort by z-index
	result = result.sort(function(a,b){
		if(a.zIndex == b.zIndex) return 0;
		return a.zIndex < b.zIndex ? -1 : 1;
	})
	return result;
}

function parseBorder(s)
{
	if(!s || !s.length) return false;
	var size = parseInt(((s.match(/(\d+)px/i) || [])[1]) || 0);
	if(!size) return false;
	var style = ((s.match(/(solid|dashed|dotted)/i) || [])[1]) || 'solid';
	var color = ((s.match(/(#[0-9a-f]{6})/i) || [])[1]) || '#000000';

	return {size: size, style:style, color: color};
}

function parseFont(s)
{
	var m = (s || "").match(/(?:(italic|underlined|normal)\s)?(?:(normal|bold|bolder|lighter|[1-9]00)\s)?(\d+)px (\w+|".+")/) || [],
		name = (m[4] || 'Calibri').replace(/"(.*)"/,'$1'),
		style = m[1] || 'normal',
		weight = m[2] || 'normal',
		size = m[3] || 12;

	return {size: size, style:style, name: name, weight: weight};
}

function fixSizes(markup, parentSize)
{
	var sizes = [];
	for(var x in markup)
		sizes.push(parseFloat(markup[x].size || 0));
	var pcSizes = getCorrectSizes(sizes),
		pxSizes = sz2px(pcSizes,parentSize);

	for(var x in markup)
	{
	//	console.log(x + " size = "  +pcSizes[x])
	//	console.log(x + " pixelSize = "  +pxSizes[x])
		markup[x].pixelSize = pxSizes[x];
		markup[x].size = pcSizes[x];
	}
	//return markup;
}

function collectDataSources(objectList)
{
	var result = {};
	if(!Array.prototype.isPrototypeOf(objectList))
		objectList = [ objectList ];
	for(var y in objectList)
	{
		var o = objectList[y];
		if(o.content && o.content.link && o.content.link.url)
		{
			/*
			for(var z in o.content.link) //ANTI-PYTHON
			{
				if(typeof o.content.link[z] === 'string')
					o.content.link[z] = o.content.link[z].replace(/\/\//g,'/')
			}
			*/
			result[y] = o.content.link;
		}
	}
	return result;
}

/*
1)	всем задана ширина
	Решение: проверяем на сумму ширин
	1.1) если сумма == 100% -> всем ставим, как указано
	1.2) если сумма != 100% -> сумму вычитаем из 100% и добавляем каждому по этой разнице, деленной на количество элементов (получится равномерное растяжение/сужение)
2)	задана ширина только некоторым
	Решение: берем нераспределенный остаток и делим поровну между оставшимися элементами
3)	не задана никому ИЛИ некоторым ширина задана и сумма заданных => 100
	Решение: ширина родителя делится поровну
*/
function getCorrectSizes(arrSizes)
{
	if(!arrSizes.length) return [100];

	var result = [], sum = 0, df, zeros=[], allocated=[];
	for(var x in arrSizes)
	{
		sum += parseFloat(arrSizes[x]);
		(arrSizes[x]<=0 ? zeros : allocated).push(parseInt(x));
	}

	df = sum-100;

	if(!zeros.length)
	{
		if(!df)//case 1.1
			return arrSizes;

		//case 1.2
		var cf = 100/sum;
		for(var x in arrSizes)
			result.push(arrSizes[x]*cf)
	}else
	//case 3
	if(sum >= 100 || !allocated.length)
	{
		for(var x in arrSizes)
			result.push(100/arrSizes.length)
	}
	else
	{
	//case 2
		var unallocated = 100 - sum;

		//duplicate
		for(var x in arrSizes)
			result.push(arrSizes[x] || unallocated/zeros.length)

	}
	return result;
}

function sz2px(arrSizes, max)
{
	var ret = []
	for(var x in arrSizes)
		ret.push((arrSizes[x]/100)*max);
	return ret;
}

function isObjectEmpty(o)
{
	if(typeof o === 'undefined') return true;
	if(typeof o === 'string') return !o.length;
	if(typeof o === 'array')  return !o.length;

	if(typeof o === 'object')
	{
		var proto = Object.getPrototypeOf(o)
		for(var x in o)
		{
			if(!proto.hasOwnProperty(x)) return false;
		}
		return true;
	}
	return !o;
}

function datesRange(start, end)
{
	var d = new Date(start),
		end = new Date(end),
		ret = [];
	if(d>end)
		return ret;
	do{
		ret.push(_fdkey(d));
		d.setMonth(d.getMonth()+1);
	}while(d < end);
	return ret;
}

function addZero(i) { return (i < 10)? "0" + i: i; }

function _fdkey(dt){
	return dt.getFullYear()+'/'+addZero(dt.getMonth()+1)+'/'+addZero(dt.getDate());
}

function extend()
{
	var result = {},
		args = Array.prototype.slice.call(arguments)
	for(var a = 0; a< args.length; a++)
	{
		var source = args[a];
		if((typeof source =='undefined') || !Object.prototype.isPrototypeOf(source))
			continue;
		var	proto = Object.getPrototypeOf(source);
		for(var x in source)
		{
			if(proto.hasOwnProperty(x)) continue;
			result[x] = source[x];
		}
	}
	return result
}

function extendDefaults(defaults, input)
{
	if(typeof input != 'object') input = {};
	var result = {};
	//sanitize
	var	proto = Object.getPrototypeOf(input);
	for(var x in input)
	{
		if(proto.hasOwnProperty(x)) continue;
		var pre = input[x]
		if(defaults[x])
		{
			var prefType = defaults[x][0],
				prefValue = defaults[x][1];
			try{
				switch(prefType)
				{
					case 'string':
						pre = pre.toString(); break;
					case 'int':
						if(typeof pre == 'number')
							pre = parseInt(pre)
						else
						if(typeof pre == 'boolean')
							pre = pre ? 1 : 0;
						else
						if(typeof pre == 'string') {
							pre = pre.replace(/[^\d\.-]/,'');
							pre = pre.length ? parseInt(pre) : prefValue;
						}
						else
							pre = prefValue;
						break;
					case 'float':
						if(typeof pre == 'number')
							pre = parseFloat(pre)
						else
						if(typeof pre == 'boolean')
							pre = pre ? 1 : 0;
						else
						if(typeof pre == 'string') {
							pre = pre.replace(/[^\d\.-]/,'');
							pre = pre.length ? parseFloat(pre) : prefValue;
						}
						else
							pre = prefValue;
						break;
					case 'array':
						if(typeof pre != 'object')
							pre = [ pre ];
						else
						if(pre.length)
							pre = Array.prototype.slice.call(pre);
						else
							pre = prefValue
						break;
					case 'bool':
						if(typeof pre == 'boolean') break;
						if(typeof pre == 'number')
							pre = !!pre;
						else
						if(typeof pre == 'object')
							pre = prefValue;
						else{ //string
							pre = pre.toString().toLowerCase()
							if(pre == 'true')
								pre = true;
							else if(pre == 'false')
								pre == false
							else{
								pre = pre.replace(/[^\d]/ig)
								if(pre.length)
									pre = !!parseInt(pre)
								else
									pre = prefValue;
							}
						}
						break;
				}
			}catch(e){
				pre = prefValue;
			}
		}
		result[x] = pre;
	}

	//fullfill
	var	proto = Object.getPrototypeOf(defaults);
	for(var x in defaults)
	{
		if(proto.hasOwnProperty(x)) continue;
		if(typeof result[x] == 'undefined')
			result[x] = defaults[x][1]
	}
	return result;
}
function propsCount(o)
{
	var i = 0;
	for(var x in o)
	{
		var	proto = Object.getPrototypeOf(o);
		if(!proto.hasOwnProperty(x)) i++;
	}
	return i;
}

function format(s)
{
	var args = Array.prototype.slice.call(arguments),
		result = ''+arguments[0];
	for(var a = 1; a< args.length; a++)
	{
		var re = new RegExp("\\{"+(a-1)+"\\}",'ig')
		result = result.replace(re,args[a])
	}
	return result;
}

function ajaxDo(options){
	var req
	if(!options.url) return;
    var callBackFunc = function(){
		if (req.readyState == 4 && options.success && typeof options.success == 'function')
			options.success(req.responseText)
		delete req;
	}
    if (window.XMLHttpRequest){
    	req = new XMLHttpRequest();
		req.onreadystatechange = callBackFunc;
		req.open(options.method || 'get', options.url, true);
		req.send(null);
	}else if (window.ActiveXObject){
		req = new ActiveXObject("Microsoft.XMLHTTP");
		if(req){
			req.onreadystatechange = callBackFunc;
			req.open( options.method || 'get', options.url, true);
			req.send();
		}
	}
}

function splitText(tx, maxLen, bbs)
{
	var data = tx.split("\n");
	bbs = !!bbs
	for (var I = 0; I < data.length; I++){
        if (data[I].length > maxLen){
			var pos;
			if(bbs)
			{
				pos = legend[I].substring(0,max_string_length).lastIndexOf(" ")
				if (pos==0 || pos==-1) pos = maxLen
			}else pos = maxLen;
            data.splice(I, 1, data[I].substring(0, pos), data[I].substring(pos));
        }
    }
	return data;
}

function optionsByPrefix(o, prefix)
{
	var ret = {};
	for(var x in o)
	{
		if(x.indexOf(prefix)) continue;
		ret[x.replace(prefix,'')] = o[x];
	}
	return ret;
}
function objectKeys(o)
{
	var ret = [];
	//fullfill
	var	proto = Object.getPrototypeOf(o);
	for(var x in o)
	{
		if(proto.hasOwnProperty(x)) continue;
		ret.push = x
	}
	return ret;
}
function getTextWidth(tx, style)
{
	if(!window.document || !window.$) return tx.length*(style.font_size || 12) * 0.6;
	var tx = $('<span></span>').appendTo($('body'))
		.css({
			'font-family': style.font_family || 'sans-serif',
			'font-size': style.font_size || 12,
			'font-weight': style.font_weight || 'normal'
		})
		.text(tx)
	sz = tx.width();
	tx.remove();
	return sz
}

function getTextHeight(tx, style)
{
	if(!window.document || !window.$) return tx.length*(style.font_size || 12) * 0.7;
	var tx = $('<span></span>').appendTo($('body'))
		.css({
			'font-family': style.font_family || 'sans-serif',
			'font-size': style.font_size || 12,
			'font-weight': style.font_weight || 'normal'
		})
		.text(tx)
	sz = tx.height();
	tx.remove();
	return sz
}
function getImageSize(data)
{
	var img = $('<img>')
				.attr('src',data)
				.appendTo($('body'))
	var ret = {
		width: img.width(),
		height: img.height()
	}
	img.remove();
	return ret;
}

var newUUID = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  };
})();

function rrItemIn(index, list)
{
	return list[index%list.length];
}

function PrepareCSS(){
console.log(" HEY! PrepareCSS is still used somewhere ");
}

function convertPcSizes(obj, parent)
{
	obj.x = obj.x && obj.x.toString().match(/%$/) ? parseFloat(obj.x)/100*parent.width : parseFloat(obj.x);
	obj.y = obj.y && obj.y.toString().match(/%$/) ? parseFloat(obj.y)/100*parent.height : parseFloat(obj.y);
	obj.width = obj.width && obj.width.toString().match(/%$/) ? parseFloat(obj.width)/100*parent.width : parseFloat(obj.width);
	obj.height = obj.height && obj.height.toString().match(/%$/) ? parseFloat(obj.height)/100*parent.height : parseFloat(obj.height);
}
//nodejs module exports
if(typeof module !== 'undefined')
{
	module.exports.fixMarkup = fixMarkup;
	module.exports.newUUID = newUUID;
	module.exports.collectDataSources = collectDataSources;
	module.exports.sz2px = sz2px;
	module.exports.isObjectEmpty = isObjectEmpty
	module.exports.datesRange = datesRange
	module.exports.addZero = addZero
	module.exports._fdkey = _fdkey
	module.exports.extend = extend
	module.exports.convertPcSizes = convertPcSizes
}

//end
