function SVGLineDrawer (input){

	input.targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector;

	var default_style={
		element_fill: 	[ 'array', ["steelblue","red","green","yellow","purple"] ],
		point_size: 	[ 'int', 10 ],
		line_fill: 		[ 'array', ["yellow","purple","steelblue","red","green"] ],
		line_width: 	[ 'int', 1 ],
		values_hidden: 	[ 'bool', false ],
		values_display: [ 'string', '' ],
		value_location: [ 'string', "top" ], //"top", "bottom"
		value_padding: 	[ 'int', 0 ],
		legend_location:[ 'string', 'none' ], //"left","right","bottom"
		legend_size: 	[ 'float', 40 ]
	}

	// Prepare values

	input.dataset = input.dataset || {};

	input.style = extendDefaults(default_style, input.style);

	var pointColor = function(d,I){ return rrItemIn(I, input.style.element_fill)}
	var lineColor = function(d,I){ return rrItemIn(I, input.style.line_fill)}

	// Prepere CSS

	prepareCSS(input,{'line':true})

	preparePars(input,{'line':true})

	// Draw objects

	input.svg = input.svg.append("g")

	input.plot_box.targetSelector = input.svg
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');

	SVGBorderDrawer(input.plot_box);

	input.plot_box.height-=input.style.point_size
	input.plot_box.y+=input.style.point_size/2

	var value_margin = input.style.font_size*1.3

	if (!input.style.values_hidden){
		if (input.style.value_location=="top" && input.style.vmax==null){
			input.plot_box.height -= input.style.value_padding + value_margin
			input.plot_box.y += input.style.value_padding + value_margin
		}
		else if (input.style.vmin==null){
			input.plot_box.height -= input.style.value_padding + value_margin
		}
	}

	if (input.style.y_axis){
		processScaleY(input,{'line':true})
	}

	for (var chart in input.dataset.charts){
		data =[]
		for(var date in input.dataset.charts[0].data){
			data.push({'name':input.dataset.charts[chart].chart,'value':input.dataset.charts[chart].data[date].real,'for_print':input.dataset.charts[chart].data[date].for_print,'date':date})
		}
		//dates ordering moved to processGroups


		_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,input.max,input.min,data,chart)
	}

	function _add_graph(main_svg,cord_x,cord_y,width,height,max,min,data,index){

		var coef=height/(max+Math.abs(min))

		var x = d3.scale.ordinal()
					.rangePoints([0, width],1);
		var y = d3.scale.linear()
					.range([height,0]);

		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");

		x.domain(data.map(function(d) { return d.date; }));
		y.domain([min,max]);

		if (input.style.line_width > 0)
		{
			var I = 0;
			while( I < data.length )
			{
				while(data[I].value == null && I < data.length)
					I++;
				var path = [ format('M{0} {1}', x(data[I].date), y(data[I].value) ) ]

				for (++I; I < data.length && data[I].value != null; I++)
					path.push( format('L{0} {1}', x(data[I].date), y(data[I].value) ))

				if(path.length > 1)
					svg.append("path")
						.attr("d", path.join(' ')
									+ ' m 10 10 m -10 -10' /*issue #391*/)
						.attr("editablepart", format("line_{0}", index) )
						.attr("editableclass","lines")
						.attr("stroke-width", input.style.line_width)
						.attr("fill", "none")
						.attr("stroke", rrItemIn(index, input.style.line_fill) )
			}

		}

		if(input.style.point_size > 0)
		svg.selectAll("_")
			.data(data)
			.enter().append("circle")
				.attr("editablepart",function(d, I){ return format("point_{0}_{1}", index, I) })
				.attr("editableclass", "points")
				.attr("cx", function(d) {return x(d.date); })
				.attr("r", input.style.point_size/2)
				.attr("fill", rrItemIn(index, input.style.element_fill) )
				.attr("cy",function(d) { return y(d.value);})
				.attr('class',function(d){if (d.value==null) return 'delete'})

		svg.selectAll("circle.delete")
			.remove()

		if (!input.style.values_hidden){
			var local_max =  d3.max(data, function(d) { return d.value; })
			var local_min =  d3.min(data, function(d) { return d.value; })
			svg.selectAll("_")
				.data(data)
				.enter().append("text")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", rrItemIn(index, input.style.element_fill)  )
					.attr("editablepart",function(d,I){ return format("value_{0}_{1}", index, I) })
					.attr("editableclass", "values")
					.attr("x",function(d) {return x(d.date)})
					.attr("y",function(d) {
							if (input.style.value_location=="top")
								return y(d.value)-input.style.value_padding - input.style.point_size;
							return y(d.value)+input.style.point_size + input.style.value_padding + input.style.point_size;
						})
					.text(function(d, J) {
						if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
							var rules=input.style.values_display[index%input.style.values_display.length]
							if ( rules.indexOf( J + 1 ) > -1 ) return d.for_print;
							if (rules.indexOf( "max" ) > -1 && d.value==local_max) return d.for_print;
							if (rules.indexOf( "min" ) > -1 && d.value==local_min) return d.for_print;
							return '';
						}
						return d.for_print
					})
		}

	}
}

window.SVGLinesDrawer = SVGLineDrawer
