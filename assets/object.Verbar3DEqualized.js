function SVGVerbar3DEqualizedDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 		['int', 0],
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

	preparePars(input)

	// Draw object

	var len=0
	for (var v in dataset.charts[0].data){
		len++
	}

	var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

	var sub_bar_width=input.plot_box.width/len
	var sub_bar_x=0
	var index = 0;

	// это группировка только по датам
	// а нам так же надо уметь группировать и по именам
	// но processGroups так пока не умеет
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');
	input.plot_box.targetSelector = input.svg;

	//проверочный прямоугольник
	/*input.svg.append('rect')
				.attr('x',input.plot_box.x+1)
				.attr('y',input.plot_box.y+1)
				.attr('width',input.plot_box.width-2)
				.attr('height',input.plot_box.height-2)
				.attr('stroke','white')
				.attr('strike-width',1)
				.attr('fill','none')
	*/

	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		input.style.y_axis_top_indent = sub_bar_width
		processScaleY(input,{'3D':true})
	}

	for (var date in dataset.charts[0].data){
		var data =[]
		for(var chart in dataset.charts){
			if (input.style.flip && dataset.charts[chart].data[date].real) dataset.charts[chart].data[date].real = dataset.charts[chart].data[date].real*(-1)
			data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
		}

		var sub_plot_box = {
			x: input.plot_box.x + sub_bar_x,
			y: input.plot_box.y,
			width: sub_bar_width,
			height: input.plot_box.height,
			style: input.plot_box.style
		}


		_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,sub_plot_box.width,sub_plot_box.height,data,index++,input.max,input.min)
		sub_bar_x += sub_bar_width
	}


	function _add_graph(main_svg,cord_x,cord_y,width,height,data,index,max,min){
		height=input.plot_box.height-input.style.line_width

		if (!input.style.values_hidden){
			height=height-input.style.add_margin*1.3
			cord_y+= input.style.add_margin*1.3
			if (input.min<0)height=height-input.style.add_margin*1.3
		}

		var coef=height/(max+Math.abs(min)),
			positive_height=max*coef,
			negative_height=-min*coef

		var x = d3.scale.ordinal()
					.rangeRoundBands([topc(input.style.outter_indent,width), width-topc(input.style.outter_indent,width)], topc(input.style.inner_indent));

		x.domain(data.map(function(d) { return d.name; }));

		var path_width = topc(input.style.side_width,x.rangeBand())

		height -= path_width * input.style.ver_angle
		positive_height -= path_width * input.style.ver_angle
		cord_y += path_width * input.style.ver_angle

		y = d3.scale.linear()
					.range([0, height]);
		y.domain([min,max]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");



		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("width", x.rangeBand())
				.attr("x", function(d) {return x(d.name) - path_width/2 * input.style.hor_angle; })
				.attr("y",function(d) {
					var value =y(d.value.real)
					if (d.value.real<0){
						return positive_height - value + input.style.line_width;
					}else{ return height - value}//return positive_height-value;}
				})
				.attr("height", function(d) {
					var value =y(d.value.real)
					if (d.value.real==null) return ;
					if (d.value.real<0){
						return negative_height - value;
					}else{ return value - negative_height;}
				})
				.attr('stroke',input.style.border_color)
				.attr('stroke-width', 0 ); //input.style.border_width);
				/*.attr('comment',function(d) {
					var value = y(d.value.real)
					return [d.value.real,value,itemcolor]
				});*/

		function calcHeight(d) {
			var value =y(d.value.real)
			if (d.value.real==null) return ;
			if (d.value.real<0){
				return negative_height - value;
			}else{ return value - negative_height;}
		}
		svg.selectAll("_")
			.data(data)
			.enter().append("path")
			.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).darker(0.7); } )
			.attr('d',function(d){
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;
				var last = path_width;
				if (d.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) last = 0;
				var value = y(d.value.real)
				if (d.value.real<0){
					value = positive_height+input.style.line_width;
				}else{ value = height-value;}
				return ('M '+(x(d.name) - path_width/2 * hor_angle  + x.rangeBand())+' '+(value)+' V '+(value + calcHeight(d))+' L '+(x(d.name) + x.rangeBand() + path_width/2 * hor_angle)+' '+
				(value + calcHeight(d) - path_width * ver_angle)+' V '+(value - last * ver_angle)+' Z')
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
				var value = y(d.value.real)
				if (d.value.real<0){
					value = positive_height+input.style.line_width;
				}else{ value = height-value;}
				return ('M '+(x(d.name) - path_width/2 * hor_angle)+' '+value+' H '+(x(d.name) - path_width/2 * hor_angle + x.rangeBand())+' L'+(x(d.name) + x.rangeBand() + path_width/2 * hor_angle)+' '+(value - path_width * ver_angle)+' H '+(x(d.name) + path_width/2 * hor_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		svg.append("g")
			.attr("class", "x axis")
			.attr("stroke", "#000")
			.attr("transform", "translate(0," + positive_height + ")")
				.append("line")
				.attr("x1",0)
				.attr("y1",(input.style.line_width/2))
				.attr("x2",width*1.01)
				.attr("y2",(input.style.line_width/2))
				.attr("stroke",input.style.line_color)
				.attr("stroke-width",input.style.line_width)

		if (!input.style.values_hidden){
			var local_max =  d3.max(data, function(d) { return d.value.real; })
			var local_min =  d3.min(data, function(d) { return d.value.real; })
			svg.selectAll("_")
				.data(data)
				.enter().append("text")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", itemcolor )
					.attr("x",function(d) {return x(d.name) + x.rangeBand()/2 - path_width/2 * input.style.hor_angle; })
					.attr("y",function(d) {
						var value =y(d.value.real)
						if (d.value.real<0){
							return height-value+input.style.line_width+input.style.add_margin*1;

						}else{ return height-value-input.style.add_margin*.3 - path_width * input.style.ver_angle;}
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
