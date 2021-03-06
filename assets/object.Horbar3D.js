function SVGHorbar3DDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 		['int', 4],
		line_color: 		['string','black'],
		flip: 				['bool', false], //отвечает за переворот значений графика.
		side_width:  		['string',"20%"],
		border_width: 		['int',1],
		border_color: 		['string','black'],
		negative_void:      ['bool',false],
		ver_angle: 			['float',1],
		hor_angle: 			['float',1],

	}

// Prepare values

	var dataset = input.dataset || {};

	input.style = extendDefaults(default_style, input.style);

	preparePars(input,{horbar:true})

	// Draw object

	var add_margin = getTextHeight('foo', input.style);

	var len=0
	for (var v in dataset.charts[0].data){
		len++
	}

	var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

	var sub_bar_height=input.plot_box.height/len
	var sub_bar_y=0
	var index = 0;

	// это группировка только по датам
	// а нам так же надо уметь группировать и по именам
	// но processGroups так пока не умеет
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');
	input.plot_box.targetSelector = input.svg;

	var dataMaxTextWidth=0
	for (var date in dataset.charts[0].data){
		for(var chart in dataset.charts){

			dataMaxTextWidth = Math.max(dataMaxTextWidth, getTextWidth(dataset.charts[chart].data[date].real, input.style.font_size))
		}
	}
	input.dataMaxTextWidth=dataMaxTextWidth
	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		input.style.y_axis_top_indent = sub_bar_height
		processScaleY(input,{horbar:true,'3D':true})
	}

	for (var date in dataset.charts[0].data){
		var data =[]
		for(var chart in dataset.charts){
			if (input.style.flip && dataset.charts[chart].data[date].real) dataset.charts[chart].data[date].real = dataset.charts[chart].data[date].real*(-1)
			data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
		}

		var sub_plot_box = {
			y: input.plot_box.y + sub_bar_y,
			x: input.plot_box.x ,
			width: input.plot_box.width,
			height: sub_bar_height,
			style: input.plot_box.style
		}


		_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,sub_plot_box.height,sub_plot_box.width,data,index++,input.max,input.min,dataMaxTextWidth)
		sub_bar_y += sub_bar_height
	}


	function _add_graph(main_svg,cord_x,cord_y,height,width,data,index,max,min){

		var y = d3.scale.ordinal()
					.rangeRoundBands([topc(input.style.outter_indent,height), height-topc(input.style.outter_indent,height)], topc(input.style.inner_indent));


		y.domain(data.map(function(d) { return d.name; }));

		var path_height = topc(input.style.side_width,y.rangeBand())

		width -= path_height * input.style.hor_angle

		var sub_width=width-input.style.line_width
		var negative_value_shift=0
		if (!input.style.values_hidden){
			sub_width=sub_width-dataMaxTextWidth
		}

		if (min>0){
			min=0
		}else if (min<0){sub_width=sub_width-dataMaxTextWidth
			negative_value_shift=dataMaxTextWidth
		}

		var coef=sub_width/(max+Math.abs(min)),
			positive_width=max*coef,
			negative_width=-min*coef

		var x = d3.scale.linear()
					.range([0,sub_width]);

		x.domain([min,max]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+(negative_width + negative_value_shift + cord_x)+","+cord_y+")");

		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("height", y.rangeBand())
				.attr("y", function(d) {return y(d.name) - path_height/2 * input.style.ver_angle; })
				.attr("x",function(d) {
					var value =x(d.value.real)
					if (d.value.real<0){
						return -(negative_width-(value));
					}else{ return input.style.line_width;}
				})
				.attr("width", function(d) {
					var value =x(d.value.real)
					if (d.value.real<0){
						return  (negative_width-(value));
					}else{ return value - negative_width ;}
				})
				.attr('stroke',input.style.border_color)
				.attr('stroke-width',input.style.border_width);;

		function calcX(d){
			var value =x(d.value.real)
			if (d.value.real<0){
				return -(negative_width-(value));
			}else{ return input.style.line_width;}
		}
		function calcWidth(d) {
			var value =x(d.value.real)
			if (d.value.real<0){
				return  (negative_width-(value));
			}else{ return value - negative_width ;}
		}

		svg.selectAll("_")
			.data(data)
			.enter().append("path")
			.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).darker(0.7); } )
			.attr("comment",function(d){return " "+input.style.negative_void+" "+d.value.real})
			.attr('d',function(d){
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;
				var last = 0;
				if (d.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) last = path_height;

				return ('M '+(calcX(d))+' '+(y(d.name) + y.rangeBand() - path_height/2 * input.style.ver_angle)+' H '+(calcX(d) + calcWidth(d)) + ' L ' + (calcX(d) + calcWidth(d) + (path_height - last) * input.style.hor_angle)+
				' '+(y(d.name) + y.rangeBand() + path_height/2 * input.style.ver_angle)+' H '+(calcX(d) + (path_height) * input.style.hor_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		svg.selectAll("_")
			.data(data)
			.enter().append("path")
			.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).brighter(0.7); } )
			.attr('d',function(d){
				if (d.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) return ;
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;

				return ('M '+(calcX(d) + calcWidth(d))+' '+(y(d.name) - path_height/2 * input.style.ver_angle)+' V '+(y(d.name) + y.rangeBand() - path_height/2 * input.style.ver_angle)+' L '+(calcX(d) + calcWidth(d) + path_height * input.style.hor_angle)+
				' '+(y(d.name) + y.rangeBand() + path_height/2 * input.style.ver_angle)+' V '+(y(d.name) + path_height/2 * input.style.ver_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		svg.append("g")
			.attr("class", "x axis")
			.append("line")
				.attr("y1",0)
				.attr("x1",(input.style.line_width/2))
				.attr("y2",height*1.01)
				.attr("x2",(input.style.line_width/2))
				.attr("stroke","#000000")
				.attr("stroke-width",input.style.line_width)

		if (!input.style.values_hidden){
			var local_max =  d3.max(data, function(d) { return d.value.real; })
			var local_min =  d3.min(data, function(d) { return d.value.real; })

			svg.append("g")
				.selectAll("_")
				.data(data)
				.enter().append("text")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", itemcolor )
					.attr("y",function(d) {
						var values_vertical_shift=input.style.font_size/3
						if (y.rangeBand()/2<values_vertical_shift) values_vertical_shift=y.rangeBand()/2
						return y(d.name)+y.rangeBand()/2+values_vertical_shift; })
					.attr("x",function(d) {
						var value =x(d.value.real)
						if (d.value.real<0){
							return -(negative_width-(value))-dataMaxTextWidth/2;
						}else{ return input.style.line_width + value + dataMaxTextWidth/2 - negative_width + path_height * input.style.hor_angle}
					})
					.text(function(d, J) {
						if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
							var rules=input.style.values_display[index%input.style.values_display.length]
							if ( rules.indexOf( J + 1 ) > -1 ) return d.value.for_print;
							if (rules.indexOf( "max" ) > -1 && d.value.real==local_max) return d.value.for_print;
							if (rules.indexOf( "min" ) > -1 && d.value.real==local_min) return d.value.for_print;
							return '';
						}
						return d.value.for_print
					})
			}
	}
}
