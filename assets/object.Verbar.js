function SVGVerbarDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 	['int', 4]
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

	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		processScaleY(input)
	}

	for (var date in dataset.charts[0].data){
		var data =[]
		for(var chart in dataset.charts){
			data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
		}

		var sub_plot_box = {
			x: input.plot_box.x + sub_bar_x,
			y: input.plot_box.y,
			width: sub_bar_width,
			height: input.plot_box.height,
			style: input.plot_box.style
		}


		_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,sub_plot_box.width,sub_plot_box.height,data,date,index++)
		sub_bar_x += sub_bar_width
	}


	function _add_graph(main_svg,cord_x,cord_y,width,height,data,label,index){
		var sub_height=height-input.style.line_width
		if (!input.style.values_hidden){
			sub_height=sub_height-input.style.add_margin*1.3
			cord_y+= input.style.add_margin*1.3


		}

		var max =  d3.max(data, function(d) { return d.value.real; })
		var min =  d3.min(data, function(d) { return d.value.real; })

		if (min>0){
			min=0
		}

		if (min<0)sub_height=sub_height-input.style.add_margin*1.3

		var coef=sub_height/(max+Math.abs(min)),
			positive_height=max*coef,
			negative_height=-min*coef

		var x = d3.scale.ordinal()
					.rangeRoundBands([topc(input.style.outter_indent,width), width-topc(input.style.outter_indent,width)], topc(input.style.inner_indent));
		var y = d3.scale.linear()
					.range([positive_height,0]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");

		function _as_is(d){
			return d.value.real*coef
		}

		x.domain(data.map(function(d) { return d.name; }));
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

		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("width", x.rangeBand())
				.attr("x", function(d) {return x(d.name); })
				.attr("y",function(d) {
					var value =y(_as_is(d))
					if (d.value.real<0){
						return positive_height+input.style.line_width;
					}else{ return value;}
				})
				.attr("height", function(d) {
					var value =y(_as_is(d))
					if (d.value.real<0){
						return value - positive_height;
					}else{ return positive_height - value;}
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
					.attr("x",function(d) {return x(d.name)+x.rangeBand()/2; })
					.attr("y",function(d) {
						var value =y(_as_is(d))
						if (d.value.real<0){
							return input.style.line_width+value+input.style.add_margin*1;

						}else{ return value-input.style.add_margin*.3;}
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
