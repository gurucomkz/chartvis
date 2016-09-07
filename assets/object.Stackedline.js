function SVGStackedlineDrawer (input){

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
		legend_size: 	[ 'float', 40 ],
		flag: 			['string', 'stacked'] //"stacked", "stackedfull"
		}

	// Prepare values

	input.dataset = input.dataset || {};

	input.style = extendDefaults(default_style, input.style);

	// Prepere CSS

	prepareCSS(input,{line:true})
	var flags={stacked:true,line:true}
	if (input.style.flag=="stackedfull") var flags={stackedfull:true,line:true}
	preparePars(input,flags)

	// Draw object

	input.svg=input.svg.append("g")

	input.plot_box.targetSelector = input.svg
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');

	SVGBorderDrawer(input.plot_box);

	input.plot_box.height-=input.style.point_size/2
	input.plot_box.y+=input.style.point_size/2

	var value_margin = input.style.font_size
	if (input.style.value_location=="top" && input.style.vmax==null){
		input.plot_box.height -= input.style.value_padding + value_margin + input.style.point_size
		input.plot_box.y += input.style.value_padding + value_margin + input.style.point_size/2
	}
	else if (input.style.vmin==null){
		input.plot_box.height -= input.style.value_padding + value_margin + input.style.point_size
	}

	if (input.style.y_axis){
		processScaleY(input)
	}

	console.log(input.plot_box)
	for (var chart in input.dataset.charts){
		data =[]
		for(var date in input.dataset.charts[0].data){
			data.push({'name':input.dataset.charts[chart].chart,'value':input.dataset.charts[chart].data[date],'date':date,"class":"point"+chart,"line_class":"line"+chart})
		}
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


		if (input.style.line_width>0){
			for (var I=0;I<data.length-1; I++){
				svg.append("line")
					.attr("class",data[I].line_class)
					.attr("editablepart", format("line_{0}_{1}", index, I) )
					.attr("editableclass","lines")
					.attr("x1",x(data[I].date))
					.attr("y1",function(){return y(data[I].value.new);})
					.attr("x2",x(data[I+1].date))
					.attr("y2",function(){return y(data[I+1].value.new);})
			}
		}

		svg.selectAll("_")
			.data(data)
			.enter().append("circle")
				.attr("class", function(d) { return d.class; })
				.attr("editablepart",function(d, I){ return format("point_{0}_{1}", index, I) })
				.attr("editableclass", "points")
				.attr("cx", function(d) {return x(d.date); })
				.attr("r", input.style.point_size/2)
				.attr("cy",function(d) { return y(d.value.new);})

			if (!input.style.values_hidden){
				var local_max =  d3.max(data, function(d) { return d.value.real; })
				var local_min =  d3.min(data, function(d) { return d.value.real; })
				var J=0
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
									return y(d.value.new)-input.style.value_padding - input.style.point_size;
								return y(d.value.new)+input.style.point_size + input.style.value_padding + input.style.point_size;
							})
						.text(function(d) {
							J++;
							if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
								var rules=input.style.values_display[index%input.style.values_display.length]
								if ( rules.indexOf( J ) > -1 ) return d.value.for_print;
								if (rules.indexOf( "max" ) > -1 && d.value.real==local_max) return d.value.for_print;
								if (rules.indexOf( "min" ) > -1 && d.value.real==local_min) return d.value.for_print;
								return '';
							}
							return d.value.for_print
						})
			}
	}
}

window.SVGStackedLinesDrawer = SVGStackedlineDrawer
