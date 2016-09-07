function SVGPie3DDrawer (input){

	function asc (a, b) {
		if (a.value.real > b.value.real) {
			return 1;
		}
		if (a.value.real < b.value.real) {
			return -1;
		}
		// a must be equal to b
		return 0;
	}

	function desc (a, b) {
		if (a.value.real > b.value.real) {
			return -1;
		}
		if (a.value.real < b.value.real) {
			return 1;
		}
		// a must be equal to b
		return 0;
	}

	var targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector,
	emptyStyle = !input.style || isObjectEmpty(input.style);

	var default_style={
		border_color: 				['string',"black"],
		border_width: 				['int',1],
		value_order: 				['string',''],
		element_fill: 				['array',["steelblue","red","green","yellow","purple"]],
		inner_radius: 				['string',"20%"], //in %
		side_height:  				['string',"20%"],
	}

// Prepare values

	var dataset = input.dataset || "";

	input.style = extendDefaults(default_style, input.style);

	prepareCSS(input,{'pie':true})

	preparePars(input)

	// Prepere CSS

	// Draw object

	input.svg = input.svg.append("g")

	input.plot_box.targetSelector = input.svg
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');

	var len=0
	for (var v in dataset.charts[0].data){
		len++
	}

	var flip=1
	if (input.style.bar_flip){
		flip=-1
	}

	var data =[]
	var flip=1
	if (input.style.bar_flip){
		flip=-1
	}

	var sum=0

	for (var date in dataset.charts[0].data){
		for(var chart in dataset.charts){
			sum+=dataset.charts[chart].data[date]*flip
		}
		data.push({value:sum})
		sum=0
	}

	data=[]
	date=dataset.charts[0].datesRange.max
	for (var pos in dataset.charts){
		data.push({"name":dataset.charts[pos].chart,"value":dataset.charts[pos].data[date],"index":pos})
	}
	if (input.style.value_order=="ascending"){
		data.sort(asc);
	}else if (input.style.value_order=="descending"){
		data.sort(desc);
	}
	_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data)


	function _add_graph(main_svg,cord_x,cord_y,width,height,data){
		var Donut3D={};
		var radius = (Math.min(width, height)/ 2)*0.99;

		var names=[]
		for (var pos in data){
			names.push(data[pos].name)
		}
		var color = d3.scale.ordinal()
			.range(input.style.element_fill)
			.domain(names)

		function pieTop(d, rx, ry, ir ){
			if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
			var sx = rx*Math.cos(d.startAngle),
				sy = ry*Math.sin(d.startAngle),
				ex = rx*Math.cos(d.endAngle),
				ey = ry*Math.sin(d.endAngle);

			var ret =[];
			ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
			ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
			return ret.join(" ");
		}

		function pieOuter(d, rx, ry, h ){
			var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
			var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);

			var sx = rx*Math.cos(startAngle),
				sy = ry*Math.sin(startAngle),
				ex = rx*Math.cos(endAngle),
				ey = ry*Math.sin(endAngle);

				var ret =[];
				ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
				return ret.join(" ");
		}

		function pieInner(d, rx, ry, h, ir ){
			var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
			var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);

			var sx = ir*rx*Math.cos(startAngle),
				sy = ir*ry*Math.sin(startAngle),
				ex = ir*rx*Math.cos(endAngle),
				ey = ir*ry*Math.sin(endAngle);

				var ret =[];
				ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
				return ret.join(" ");
		}

		function getText(d){
			return d.data.value.for_print;
		}

		Donut3D.draw=function( data, rx/*radius x*/, ry/*radius y*/, h/*height*/, ir/*inner radius*/){

			var _data = d3.layout.pie().sort(null).value(function(d) {return d.value.real;})(data);

			var slices = main_svg.append("g")
							.attr("transform", "translate(" + (cord_x+radius) + "," + (cord_y+radius) + ")")
							.attr("class", "slices");

			slices.selectAll(".innerSlice").data(_data).enter().append("path").attr("class", "innerSlice")
				.style("fill", function(d) { return d3.hsl(color(d.data.name)).darker(0.7); })
				.attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);})
				.attr('stroke-width',input.style.border_width)
				.attr('stroke',input.style.border_color)
				.each(function(d){this._current=d;});

			slices.selectAll(".topSlice").data(_data).enter().append("path").attr("class", "topSlice")
				.style("fill", function(d) { return color(d.data.name); })
				.attr('stroke-width',input.style.border_width)
				.attr('stroke',input.style.border_color)
				.attr("d",function(d){ return pieTop(d, rx, ry, ir);})
				.each(function(d){this._current=d;});

			slices.selectAll(".outerSlice").data(_data).enter().append("path").attr("class", "outerSlice")
				.style("fill", function(d) { return d3.hsl(color(d.data.name)).darker(0.7); })
				.attr("d",function(d){ return pieOuter(d, rx-.5,ry-.5, h);})
				.attr('stroke-width',input.style.border_width)
				.attr('stroke',input.style.border_color)
				.each(function(d){this._current=d;});

			slices.selectAll(".percent")
					.data(_data)
					.enter()
					.append("text")
					.attr("class","value")
					.attr("x",function(d){ return 0.6*rx*Math.cos(0.5*(d.startAngle+d.endAngle));})
					.attr("y",function(d){ return 0.6*ry*Math.sin(0.5*(d.startAngle+d.endAngle));})
					.text(getText).each(function(d){this._current=d;});
		}
		var side_height = topc(input.style.side_height,radius)
		Donut3D.draw(data, radius, radius-side_height, side_height, topc(input.style.inner_radius));
	}
}
