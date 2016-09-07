function SVGAreaDrawer (input){
	return SVGStackedAreaDrawer(input,true);
}
function SVGStackedAreaFullDrawer (input){
	SVGStackedAreaDrawer (input, false, true)
}

function SVGStackedAreaDrawer (input, notstacked, isFull){

	var default_style={
		element_fill: 	[ 'array', ["steelblue","red","green","yellow","purple"] ],
		point_size: 	[ 'int', 10 ],
		line_fill: 		[ 'array', ["yellow","purple","steelblue","red","green"] ],
		line_width: 	[ 'int', 1 ],
		fill_opacity: 	[ 'float', 0.3 ],
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
	var ppOpts = {};
	if(!notstacked)
	{
		if(isFull)
			ppOpts = {stackedfull:true,line:true}
		else
			ppOpts = {stacked:true}
	}
	preparePars(input, ppOpts )

	// Draw objects

	input.svg = input.svg.append("g")

	input.plot_box.targetSelector = input.svg
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');

	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		processScaleY(input)
	}
	//prepare data
	var lowerYs = [], prevData = [], allData = [], allLowerYs = [];
	for (var chart in input.dataset.charts){
		var data =[]
		chart = parseInt(chart)
		for(var date in input.dataset.charts[0].data){
			lowerYs.push(0)
			var de = input.dataset.charts[chart];
			data.push({
					'name':de.chart,
					'value':de.data[date].real,
					'posValue':de.data[date][isFull?'new':'real']
									- (!isFull || !chart?0:input.dataset.charts[chart-1].data[date].new),
					'for_print':de.data[date].for_print,
					'date':date})
		}
		allData.push(data)
		allLowerYs.push([]);
	}

	var sub_height = input.plot_box.height - input.style.point_size / 2

	input.plot_box.y += input.style.point_size / 2

	var value_margin = input.style.font_size
	if (input.style.value_location=="top" && input.style.vmax==null){
		sub_height -= input.style.value_padding + value_margin + input.style.point_size
		input.plot_box.y += input.style.value_padding + value_margin + input.style.point_size/2
	}
	else if (input.style.vmin==null){
		sub_height -= input.style.value_padding + value_margin + input.style.point_size
	}

	var x = d3.scale.ordinal().rangePoints([0, input.plot_box.width], 1);
	var y = d3.scale.linear().range([sub_height,0]);

	var svg = input.svg.append("g")
				.attr("transform", "translate("+input.plot_box.x+","+input.plot_box.y+")");

	x.domain(data.map(function(d) { return d.date; }));
	y.domain([input.min,input.max]);

	var pathData = [];

	_calc()


	for(var I in allData)
		_add_areas(svg,I)

	if (input.style.line_width > 0)
		for(var I = allData.length-1; I>=0; I--)
			_add_lines(svg,I)

	if(input.style.point_size > 0)
		for(var I in allData)
			_add_points(svg,allData[I],I)

	if (!input.style.values_hidden)
		for(var I in allData)
			_add_values(svg,input.max,input.min,allData[I],I)


	function _calc()
	{
		function lowerY(i,no){ return sub_height - lowerYs[i] - input.style.line_width*!no }
		for(var index in allData)
		{
			var I = 0, endY, beginY, beginI, prevData = allData[index-1], myLowerYs = allLowerYs[index],
				myPaths = { paths: [], areas: [] },
				data = allData[index];
			function havePrevNisNull(I){ return prevData && prevData[I] && prevData[I].posValue == null}
			pathData.push(myPaths);
			while( I < data.length )
			{
				while(data[I].posValue == null && I < data.length)
					myLowerYs[I++] = null;
				beginI = I;
				var path = [ ]

				if(I && (data[I-1].posValue == null || havePrevNisNull(I) || !parseInt(index)))
					path.push(format('M{0} {1}', x(data[I-1].date), I ? lowerY(I-1,1) : sub_height ))

				path.push(format('{0}{1} {2}', path.length?'L':'M', x(data[I].date), beginY = y(data[I].posValue)-(lowerYs[I]) ))
				myLowerYs[I] = beginY;
				for (++I; I < data.length && data[I].posValue != null; I++)
				{
					path.push( format('L{0} {1}', x(data[I].date), endY = y(data[I].posValue)-(lowerYs[I]) ))
					myLowerYs[I] = endY;
				}

				if((I < data.length - 1) && data[I].posValue == null)//next data present && is null
					path.push( format('L{0} {1}', x(data[I].date), lowerY(I,1) ))

				myPaths.paths.push(path);

				var area = path.slice(0);
				//go back
				for (var rI = I-1 ;rI >= beginI; rI--)
				{
					area.push( format('L{0} {1}', x(data[rI].date), lowerY(rI,1) ))
				}
				area.push('Z')
				myPaths.areas.push(area);
			}
			if(!notstacked)
			for(var _yIter = 0; _yIter<lowerYs.length; _yIter++)
				if(myLowerYs[_yIter] != null)
					lowerYs[_yIter] = sub_height-myLowerYs[_yIter]
		}

	}
	function _add_areas(svg,index)
	{
		for(var A in pathData[index].areas)
			svg.append("path")
				.attr("d", pathData[index].areas[A].join(' ') )
				.attr("editablepart", format("line_{0}", index) )
				.attr("editableclass","areas")
				.attr("stroke-width", 0)
				.attr("fill", rrItemIn(index, input.style.line_fill) )
				.attr("fill-opacity", input.style.fill_opacity )
	}
	function _add_lines(svg,index)
	{
		for(var A in pathData[index].paths)
			svg.append("path")
				.attr("d", pathData[index].paths[A].join(' ')
							+ ' m 10 10 m -10 -10' /*issue #391*/ )
				.attr("editablepart", format("line_{0}", index) )
				.attr("editableclass","lines")
				.attr("stroke-width", input.style.line_width)
				.attr("fill", "none" )
				.attr("stroke", rrItemIn(index, input.style.line_fill) )
	}

	function _add_points(svg,data,index)
	{
		var myLowerYs = allLowerYs[index];
		svg.selectAll("_")
			.data(data)
			.enter().append("circle")
				.attr("editablepart",function(d, I){ return format("point_{0}_{1}", index, I) })
				.attr("editableclass", "points")
				.attr("cx", function(d) {return x(d.date); })
				.attr("r", input.style.point_size/2)
				.attr("fill", rrItemIn(index, input.style.element_fill) )
				.attr("cy",function(d,I) { return myLowerYs[I];})
				.attr('class',function(d){if (d.value==null) return 'delete'})

		svg.selectAll("circle.delete")
			.remove()
	}

	function _add_values(svg,max,min,data,index)
	{
		var myLowerYs = allLowerYs[index];
		var local_max =  d3.max(data, function(d) { return d.value; })
		var local_min =  d3.min(data, function(d) { return d.value; })
		var yShift = Math.max(input.style.point_size, input.style.line_width)
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
				.attr("y",function(d,I) {
						if (input.style.value_location=="top")
							return myLowerYs[I]-input.style.value_padding - yShift;
						return myLowerYs[I] + yShift*2 + input.style.value_padding;
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
