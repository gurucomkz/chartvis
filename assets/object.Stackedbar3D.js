function SVGStackedbar3DDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 	['int', 4],
		line_color: 		['string','black'],
		side_width:  		['string',"20%"],
		border_width: 		['int',1],
		border_color: 		['string','black'],
		negative_void:      ['bool',false],
		ver_angle: 			['float',1],
		hor_angle: 			['float',1],

		//flag [ 'string',''] stackedfull stacked позволяет изменить вид графика
	}

// Prepare values

	var dataset = input.dataset || {};

	input.style = extendDefaults(default_style, input.style);

	var flags={stacked:true,indents:true}
	if (input.style.flag=="stackedfull") var flags={stackedfull:true,indents:true}
	preparePars(input,flags)

	// Draw object

	var add_margin = getTextHeight('foo', input.style);

	var len=0
	for (var v in dataset.charts[0].data){
		len++
	}

	var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

	var index = 0;

	// это группировка только по датам
	// а нам так же надо уметь группировать и по именам
	// но processGroups так пока не умеет
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');
	input.plot_box.targetSelector = input.svg;
	var data=[]
	for (var date in dataset.charts[0].data){
		data.push(date)
	}

	var outter_indent_px=topc(input.style.outter_indent,input.plot_box.width)
	var x_domain = d3.scale.ordinal()
				.rangeRoundBands([outter_indent_px, input.plot_box.width-outter_indent_px], topc(input.style.inner_indent));
	x_domain.domain(data);

	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		input.style.y_axis_top_indent = input.plot_box.width
		flags['3D'] =true
		processScaleY(input,flags)
	}

	for (var date in dataset.charts[0].data){
		data =[]
		for(var chart in dataset.charts){
			data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
		}

		var sub_plot_box = {
			x: input.plot_box.x,
			y: input.plot_box.y,
			height: input.plot_box.height,
			style: input.plot_box.style
		}
		_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,input.plot_box.width,sub_plot_box.height,data,index++,input.max,input.min)
	}


	function _add_graph(main_svg,cord_x,cord_y,width,height,data,index,max,min){
		var sub_height=height-input.style.line_width

		if (!input.style.values_hidden){
			sub_height=sub_height-add_margin*1.3
			cord_y+= add_margin*1.3
		}

		if (min>0){
			min=0
		}

		var x = x_domain

		var path_width = topc(input.style.side_width,x.rangeBand())

		height -= path_width * input.style.ver_angle
		sub_height -= path_width * input.style.ver_angle
		cord_y += path_width * input.style.ver_angle

		var coef=sub_height/(max+Math.abs(min)),
			positive_height=max*coef

		function _as_is(d){
			return d.value.new*coef
		}

		var y = d3.scale.linear()
					.range([sub_height,0]);
		y.domain([0,sub_height]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");

		var prev=0
		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("width", x.rangeBand())
				.attr("x", function(d) {return x(d.date) - path_width/2 * input.style.hor_angle; })
				.attr("y",function(d) {
					return y(_as_is(d))
				})
				.attr("height", function(d) {
					var value = y(_as_is(d))-prev
					prev += value - sub_height
					return sub_height - value;
				})
				.attr('stroke',input.style.border_color)
				.attr('stroke-width',input.style.border_width);;

		var prev=0
		function calcHeight(d,prev) {
			var value = y(_as_is(d))-prev
			prev += value - sub_height
			return [sub_height - value, prev];
		}

		var color = '';

		svg.selectAll("_")
			.data(data)
			.enter().append("path")
			.attr("fill", function(d,I) {
				color = d3.hsl(rrItemIn(I, input.style.element_fill));
				return color.darker(0.7); } )
			.attr('d',function(d){
				var height=calcHeight(d,prev)
				prev = height[1]
				height = height[0]
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;
				var last = path_width;
				if (d.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) last = 0;
				var value = y(d.value.real)
				if (d.value.real<0){
					value = positive_height+input.style.line_width;
				}else{ value = height-value;}
				return ('M '+(x(d.date)+x.rangeBand()- path_width/2 * input.style.hor_angle)+' '+(y(_as_is(d)))+' V '+(y(_as_is(d))+height)+
				' L '+(x(d.date)+x.rangeBand() + path_width/2 * input.style.hor_angle)+' '+(y(_as_is(d))+height - path_width * ver_angle)+' V '+(y(_as_is(d))-path_width * ver_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		var element = data[data.length-1]

		svg.append("path")
			.attr("fill", color.brighter(0.7) )
			.attr('d',function(){
				if (element.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) return ;
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;
				var value = y(element.value.real)
				if (element.value.real<0){
					value = positive_height+input.style.line_width;
				}else{ value = height-value;}
				return ('M '+(x(element.date) - path_width/2 * input.style.hor_angle)+' '+(y(_as_is(element)))+' H '+(x(element.date) +x.rangeBand() - path_width/2 * input.style.hor_angle)+
				' L'+(x(element.date) +x.rangeBand() + path_width/2 * input.style.hor_angle)+' '+(y(_as_is(element))- path_width * ver_angle)+' H '+(x(element.date) + path_width/2 * input.style.hor_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		svg.append("g")
			.attr("class", "x axis")
			.attr("stroke", "#000")
			.attr("transform", "translate(0," + sub_height + ")")
				.append("line")
				.attr("x1",0)
				.attr("y1",(input.style.line_width/2))
				.attr("x2",width*1.01)
				.attr("y2",(input.style.line_width/2))
				.attr("stroke",input.style.line_color)
				.attr("stroke-width",input.style.line_width);

		if (!input.style.values_hidden){
			var local_max =  d3.max(data, function(d) { return d.value.real; })
			var local_min =  d3.min(data, function(d) { return d.value.real; })
			var I=0
			svg.selectAll("_")
				.data(data)
				.enter().append("text")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", itemcolor )
					.attr("x",function(d) {return x(d.date)+x.rangeBand()/2 - path_width/2 * input.style.hor_angle; })
					.attr("y",function(d) {
						I++;
						var shift = (I==data.length)? path_width * input.style.ver_angle:0;
						var value =y(_as_is(d))
						return (value-add_margin*.3 - shift);
					})
					.text(function(d, J) {
						if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
							var rules=input.style.values_display[index%input.style.values_display.length]
							if ( rules.indexOf( J + 1 ) > -1 ) return d.value;
							if (rules.indexOf( "max" ) > -1 && d.value.real==local_max) return d.value.for_print;
							if (rules.indexOf( "min" ) > -1 && d.value.real==local_min) return d.value.for_print;
							return '';
						}
						return d.value.for_print
					})
			}
	}
}
