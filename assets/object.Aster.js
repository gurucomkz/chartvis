function SVGAsterDrawer (input){

	var default_style={
		outter_indent: 				[ 'string', '5%'],
		inner_indent: 				[ 'string', '10%'],
		element_fill: 				[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 				['int', 4],
		border_color: 				['string',"black"],
		border_width: 				['int',1],
		inner_border_color: 		['string',"black"], //обводка внутреннего куска символизирующего число
		inner_border_width: 		['int',0],
		inner_radius: 				['string','20%'],
		total_font_multiplier: 		['string','200%'], //множитель размера шрифта числа указывающего заполнение астера.
		values_weights: 			['array',[1]], //множитель значений, влияте на ширину доли круга.
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

	//проверочный прямоугольник
	/*input.svg.append('rect')
				.attr('x',input.plot_box.x+1)
				.attr('y',input.plot_box.y+1)
				.attr('width',input.plot_box.width-2)
				.attr('height',input.plot_box.height-2)
				.attr('stroke','white')
				.attr('strike-width',1)
				.attr('fill','none')
	*/

	SVGBorderDrawer(input.plot_box);

	var date=dataset.charts[0].datesRange.max
		var data =[]
	for(var chart in dataset.charts){
		var weight=1
		if (input.style.values_weights.length>parseInt(chart)) weight = parseFloat(input.style.values_weights[parseInt(chart)])

		data.push({'label':dataset.charts[chart].chart,'order':parseInt(chart),'score':dataset.charts[chart].data[date].real,'weight':weight,'for_print':dataset.charts[chart].data[date].for_print})
	}
	_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data,index++,input.max,input.min)

	function _add_graph(main_svg,cord_x,cord_y,width,height,data,index,max,min){

		var radius = Math.min(width, height) / 2,
		    innerRadius = topc(input.style.inner_radius,radius);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d.width; });

		var arc = d3.svg.arc()
		  .innerRadius(innerRadius)
		  .outerRadius(function (d) {
			console.log(d.data.score)
			console.log(d)
		    return (radius - innerRadius) * (d.data.score / 100.0) + innerRadius;
		  });

		var outlineArc = d3.svg.arc()
		        .innerRadius(innerRadius)
		        .outerRadius(radius);

		var svg = input.svg.append("g")
		    .attr("width", width)
		    .attr("height", height)
		    .append("g")
		    .attr("transform", "translate(" + (cord_x+width / 2) + "," + (cord_y + height / 2) + ")");

		data.forEach(function(d) {
		    d.id     =  d.id;
		    d.order  = +d.order;
		    d.color  =  d.color;
		    d.weight = +d.weight;
		    d.score  = +d.score;
		    d.width  = +d.weight;
		    d.label  =  d.label;
			d.for_print  =  d.for_print;
		  });
		  // for (var i = 0; i < data.score; i++) { console.log(data[i].id) }

		var I=0
		  var path = svg.selectAll(".solidArc")
		      .data(pie(data))
		    .enter().append("path")
		      .attr("fill", function(d) { return itemcolor(d,I++); })
		      .attr("class", "solidArc")
		      .attr("stroke", input.style.inner_border_color)
			  .attr("stroke-width", input.style.inner_border_width)
		      .attr("d", arc);

			if (!input.style.values_hidden){
				var local_max =  d3.max(data, function(d) { return d.score; })
				var local_min =  d3.min(data, function(d) { return d.score; })
				var J=0
				svg.selectAll(".outlineArc")
					.data(pie(data))
					.enter()
					.append("text")
					.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
					.attr("dy", ".35em")
					.attr("class","value")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", input.style.font_color)
					.text(function(d, J) {
						console.log('in')
						if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
							var rules=input.style.values_display[index%input.style.values_display.length]
							if ( rules.indexOf( J + 1 ) > -1 ) return d.data.value.for_print;
							if (rules.indexOf( "max" ) > -1 && d.data.score==local_max) return d.data.for_print;
							if (rules.indexOf( "min" ) > -1 && d.data.score==local_min) return d.data.for_print;
							return '';
						}
						return d.data.for_print
					});
			}

		  var outerPath = svg.selectAll(".outlineArc")
		      .data(pie(data))
		    .enter().append("path")
		      .attr("fill", "none")
			  .attr("stroke", input.style.border_color)
			  .attr("stroke-width", input.style.border_width)
		      .attr("class", "outlineArc")
		      .attr("d", outlineArc);


		  // calculate the weighted mean score
		  var score =
		    data.reduce(function(a, b) {
		      //console.log('a:' + a + ', b.score: ' + b.score + ', b.weight: ' + b.weight);
		      return a + (b.score * b.weight);
		    }, 0) /
		    data.reduce(function(a, b) {
		      return a + b.weight;
		    }, 0);

		  svg.append("svg:text")
		    .attr("class", "aster-score")
		    .attr("dy", ".35em")
			.attr("font-family", input.style.font_family )
			.attr("font-size", topc(input.style.total_font_multiplier,input.style.font_size))
			.attr("font-weight", input.style.font_weight )
		    .attr("text-anchor", "middle") // text-align: right
		    .text(Math.round(score));

	}
}
