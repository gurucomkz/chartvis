function renderChart(opts)
{
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
		width = opts.width - margin.left - margin.right,
		height = opts.height - margin.top - margin.bottom,
		data = opts.dataset;

	var parseDate = d3.time.format("%d-%b-%y").parse;

	var x = d3.time.scale()
					.range([0, width]);

	var y = d3.scale.linear()
					.range([height, 0]);

	var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom");

	var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");

	var line = d3.svg.line()
					.x(function(d) { return x(d.date); })
					.y(function(d) { return y(d.value); });

	var svgRoot = d3.select(opts.targetSelector).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.attr("xmlns","http://www.w3.org/2000/svg")
					.attr("xmlns:amcharts","http://amcharts.com/ammap")
					.attr("xmlns:xlink","http://www.w3.org/1999/xlink")
					.attr("version","1.1")
	var svgDefs = svgRoot.append('defs')
	if(opts.style)
		svgDefs.append("style")
			.attr("type","text/css")
			.text(opts.style)

	var svg = svgRoot.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	data.forEach(function(d) {
		d.date = parseDate(d.date);
		d.value = +d.value;
	});

	x.domain(d3.extent(data, function(d) { return d.date; }));
	y.domain(d3.extent(data, function(d) { return d.value; }));

	svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

	svg.append("g")
					.attr("class", "y axis")
					.call(yAxis)
					.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", ".71em")
					.style("text-anchor", "end")
					.text("Price ($)");

	svg.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line);

}
