function SVGStackedbarDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 	['int', 4]
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

	var sub_bar_width=input.plot_box.width/len
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
		}else if (min<0)sub_height=sub_height-add_margin*1

		var coef=sub_height/(max+Math.abs(min)),
			positive_height=max*coef,
			negative_height=-min*coef

		var x = x_domain
		var y = d3.scale.linear()
					.range([positive_height,0]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");

		function _as_is(d){
			return d.value.new*coef
		}


		y.domain([0,positive_height]);

		var bars_g=svg.append("g")
			.attr("class", "x axis")
			.attr("stroke", "#000")
			.attr("transform", "translate(0," + positive_height + ")");

		bars_g.append("line")
				.attr("x1",0)
				.attr("y1",(input.style.line_width/2))
				.attr("x2",width*1.01)
				.attr("y2",(input.style.line_width/2))
				.attr("stroke","#000000")
				.attr("stroke-width",input.style.line_width)

		var prev=0
		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("width", x.rangeBand())
				.attr("x", function(d) {return x(d.date); })
				.attr("y",function(d) {
					var value =y(_as_is(d))
					return value;
				})
				.attr("height", function(d) {
					var value = y(_as_is(d))-prev
					prev += value - positive_height
					return positive_height - value;
				});
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
					.attr("x",function(d) {return x(d.date)+x.rangeBand()/2; })
					.attr("y",function(d) {
						var value =y(_as_is(d))
						return value-add_margin*.3;
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
