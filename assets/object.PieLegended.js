function SVGPieLegendedDrawer (input){

	var targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector,
	emptyStyle = !input.style || isObjectEmpty(input.style);

	var default_style={
		border_color: 			['string', "white"],
		border_width: 			[ 'int', 1 ],
		value_order: 			['string', ""], //порядок сордировки ascending descending
		element_fill: 			[ 'array', ["steelblue","red","green","yellow","purple","white","gray"]],
		line_color: 			['string', "#000000"],
		line_width: 			[ 'int', 3 ],
		legend_font_size: 		[ 'int', 16 ],
		legend_font_family:		[ 'string', 'sans-serif' ],
		legend_font_weight: 	[ 'string', 'normal' ],
		legend_font_style: 		[ 'string', 'normal' ],
		legend_font_color: 		[ 'string', 'black' ],
		legend_max_length: 		[ 'int', 0 ], //позмоляет обрезать легенду до указанной длины.
		split_legend: 			['bool',false] //позволяет разбить легенду на несколько строк длиной legend_max_length
	}

// Prepare values

	var dataset = input.dataset || "";

	input.style = extendDefaults(default_style, input.style);

	prepareCSS(input,{'pie':true})

	preparePars(input)

	// Draw object

	var len=0,
	data =[],
	sum=0;
	for (var v in dataset.charts[0].data){
		len++
	}


	data=[]
	date=dataset.charts[0].datesRange.max
	for (var pos in dataset.charts){
		data.push({"label":dataset.charts[pos].chart,"value":dataset.charts[pos].data[date].real})
	}
	if (input.style.value_order=="ascending"){
		data.sort(function (a, b) {
			if (a.value > b.value) {
				return 1;
			}
			if (a.value < b.value) {
				return -1;
			}
			// a must be equal to b
			return 0;
			});
	}else if (input.style.value_order=="descending"){
		data.sort(function (a, b) {
			if (a.value > b.value) {
				return -1;
			}
			if (a.value < b.value) {
				return 1;
			}
			// a must be equal to b
			return 0;
			});
	}
	_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data)

	function _add_graph(main_svg,cord_x,cord_y,width,height,data){
		var svg = main_svg
			.append("g")

		svg.append("g")
			.attr("class", "slices");
		svg.append("g")
			.attr("class", "labels");
		svg.append("g")
			.attr("class", "lines");

		var radius = Math.min(width, height) / 2;

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) {
				return d.value;
			});

		var arc = d3.svg.arc()
			.outerRadius(radius * 0.8)
			.innerRadius(radius * 0.4);

		var outerArc = d3.svg.arc()
			.innerRadius(radius * 0.9)
			.outerRadius(radius * 0.9);

		svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		var key = function(d){
			return d.data.label;
			};

		var names=[]
		for (var pos in data){
			names.push(data[pos].label)
		}

		var color = d3.scale.category20()
			.domain(names)
			.range(input.style.element_fill);

		change(data);

		function mergeWithFirstEqualZero(first, second){
			var secondSet = d3.set(); second.forEach(function(d) { secondSet.add(d.label); });

			var onlyFirst = first
				.filter(function(d){ return !secondSet.has(d.label) })
				.map(function(d) { return {label: d.label, value: 0}; });
			return d3.merge([ second, onlyFirst ])
				.sort(function(a,b) {
					return d3.ascending(a.label, b.label);
				});
		}

		function change(data) {
			var duration = 11110;
			var data0 = svg.select(".slices").selectAll("path.slice")
				.data().map(function(d) { return d.data });
			if (data0.length == 0) data0 = data;
			var was = mergeWithFirstEqualZero(data, data0);
			var is = mergeWithFirstEqualZero(data0, data);

			/* ------- SLICE ARCS -------*/

			var slice = svg.select(".slices").selectAll("path.slice")
				.data(pie(is), key);

			slice.enter()
				.insert("path")
				.attr("class", "slice")
				.attr('stroke',input.style.border_color)
				.attr('stroke-width',input.style.border_width)
				.style("fill", function(d) { return color(d.data.label); })
				.attr("d", function(d) {
					return arc(d);
				});

			/* ------- TEXT LABELS -------*/

			var text = svg.select(".labels")
							.selectAll("text")
							.data(pie(was), key);

			var splitLegend = function(d){
				var temp_legend = [d];
				for (var index=0;index<temp_legend.length;index++){
					if (temp_legend[index].length>input.style.legend_max_length){
						var pos = temp_legend[index].substring(0,input.style.legend_max_length).lastIndexOf(" ")
						if (pos==0 || pos==-1) pos = input.style.legend_max_length
						temp_legend.splice(index,1,temp_legend[index].substring(0,pos), temp_legend[index].substring(pos));
					}
				}
				return temp_legend;
			};
			if (!input.style.split_legend){
				text.enter()
					.append("text")
					.attr("dy", input.style.legend_font_size/2)
					.text(function(d) {
						if (input.style.legend_max_length)
							return d.data.label.substring(0,input.style.legend_max_length)+"...";
						return d.data.label;})
					.attr("transform", function(d) {
							var pos = outerArc.centroid(d);
							pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
							return "translate("+ pos +")";})
					.style("text-anchor", function(d){return midAngle(d) < Math.PI ? "start":"end";});
			}else{
				text.enter()
						.append("g")
							.attr("class",'foo')
							.attr("transform", function(d) {
									var pos = outerArc.centroid(d);
									pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1);
									return "translate("+ pos +")";})
							.style("opacity", 1)
							.style("text-anchor", function(d){return midAngle(d) < Math.PI ? "start":"end";})
							.each(function(d) {
								this._current = d;
							})
							.selectAll('text')
								.data(function(d) {
									return splitLegend(d.data.label);
								})
								.enter()
									.append('text')
									.attr("dy", function(tx, wIndex, arrIndex){
										return input.style.legend_font_size * wIndex
										})
									.text(function(d,i){
										return d
										})
			}



		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

			/* ------- SLICE TO TEXT POLYLINES -------*/

			var polyline = svg.select(".lines").selectAll("polyline")
				.data(pie(is), key);

			polyline.enter()
				.append("polyline")
				.attr('fill','None')
				.attr('stroke',input.style.line_color)
				.attr('stroke-width',input.style.line_width)
				.attr("points", function(d){
					var pos = outerArc.centroid(d);
					pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
					return [arc.centroid(d), outerArc.centroid(d), pos];
				});

		};

	}
}
