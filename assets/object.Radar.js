function SVGRadarDrawer (input){

	var targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector,
	emptyStyle = !input.style || isObjectEmpty(input.style);

	var default_style={
		indent:.1,
		bar_flip: false,
		bar_fill:["steelblue","red","green","yellow","purple"],
		value_font:"12px sans-serif",
		value_weight:"normal",
		values_display:1,
		header_font:"12px bold sans-serif",
		header_weight:"bold",
		header_color:"black",
		header_padding:30,
		header_align_horisontal:0,
		legend_location:0,
		legend_size:40,
		legend_font:"12px bold sans-serif",
		legend_weight:"bold",
		line_width:4
	}

// Prepare values

	var cord_x = input.x || 0;
	var cord_y = input.y || 0;
	var height = input.height || 100;
	var width = input.width || 100;

	var dataset = input.dataset || "";

	var style = extend(default_style, (input.style || {}));
	style.width = input.width;
	style.height = input.height;

	// Prepere CSS
	var CSS="\
		.level {stroke: grey;stroke-width: 0.5;}\
		.axis line {stroke: grey;stroke-width: 1;}\
		.axis .legend {font-family: sans-serif;font-size: 10px;}\
		.axis .legend.top {dy:1em;}\
		.axis .legend.left {text-anchor: start;}\
		.axis .legend.middle {text-anchor: middle;}\
		.axis .legend.right {text-anchor: end;}\
		.tooltip {font-family: sans-serif;font-size: 13px;opacity: 1;}\
		\
		 .area {stroke-width: 2;fill-opacity: 0.5;}\
		.circle {fill-opacity: 0.9;}\
		";

	// prepare data
	var data = [],
		legendRows = [];
	if(style.bar_flip)
	{
		//ray-is-a-date
		var dates = datesRange(dataset.datesRange.min, dataset.datesRange.max);
		for(var _di in dates)
		{
			var _d = dates[_di],
				part = [];
			legendRows.push(_d)
			for(var _ci in dataset.charts)
			{
				var thechart = dataset.charts[_ci]
				part.push({axis: thechart.chart, value: thechart.data[_d]})
			}
			data.push(part)
		}
	}else{
		//ray-is-a-chart
		for(var _ci in dataset.charts)
		{
			var thechart = dataset.charts[_ci],
				part = [];

			legendRows.push(thechart.chart)
			for(var _d in thechart.data){
				part.push({axis: _d, value: thechart.data[_d]})
			}
			data.push(part)
		}
	}

	//placeholder
	var margin = {
		top: style.margin_top||0,
		right: style.margin_right||0,
		bottom: (style.margin_bottom||0),
		left: style.margin_left||0
	};

	width = width - margin.left - margin.right;
	height = height - margin.top - margin.bottom;

	var svg = targetSelector.append("svg")
				.attr("x",cord_x + margin.left)
				.attr("y",cord_y + margin.top)
				.attr("width", width + margin.right)
				.attr("height", height + margin.bottom)

	svg.append("defs")
		.append("style")
		.attr("type","text/css")
		.text(CSS)

	RadarChart.draw(svg, data, style);
}
