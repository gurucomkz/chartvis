function SVGVerbar3DSepVerticDrawer (input){

		var default_style={
			outter_indent: 		[ 'string', '5%'],
			inner_indent: 		[ 'string', '30%'],
			element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
			line_width: 		['int', 4],
			line_color: 		['string','black'],
			flip: 				['bool', false], //отвечает за переворот значений графика.
			side_width:  		['string',"20%"],
			border_width: 		['int',1],
			border_color: 		['string','black'],
			negative_void:      ['bool',false],
			ver_angle: 			['float',1],
			hor_angle: 			['float',1],
		}

	// Prepare values

		var dataset = input.dataset || {};

		input.style = extendDefaults(default_style, input.style);

		preparePars(input)

		// Draw object

		var add_margin = getTextHeight('foo', input.style);

		var len=0
		for (var v in dataset.charts[0].data){
			len++
		}

		var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

		var sub_bar_height=input.plot_box.height/len
		var sub_bar_y=0
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
				if (input.style.flip && dataset.charts[chart].data[date].real) dataset.charts[chart].data[date].real = dataset.charts[chart].data[date].real*(-1)
				data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
			}

			var sub_plot_box = {
				y: input.plot_box.y + sub_bar_y,
				x: input.plot_box.x ,
				width: input.plot_box.width,
				height: sub_bar_height,
				style: input.plot_box.style
			}


			_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,sub_plot_box.height,sub_plot_box.width,data,index++,input.max,input.min)
			sub_bar_y += sub_bar_height
		}


		function _add_graph(main_svg,cord_x,cord_y,height,width,data,index,max,min){
			height=height-input.style.line_width
			if (!input.style.values_hidden){
				height=height-add_margin*1.3
				cord_y+= add_margin*1.3
			}

			max =  d3.max(data, function(d) { return d.value.real; })
			min =  d3.min(data, function(d) { return d.value.real; })

			if (min>0){
				min=0
			}else height=height-add_margin*1

			var coef=height/(max+Math.abs(min)),
				positive_height=max*coef,
				negative_height=-min*coef

			var x = d3.scale.ordinal()
						.rangeRoundBands([topc(input.style.outter_indent,width), width-topc(input.style.outter_indent,width)], topc(input.style.inner_indent));
			var y = d3.scale.linear()
						.range([positive_height,0]);
			var yAxis = d3.svg.axis()
						.scale(y)
						.orient("left")
						.ticks(10, "%");

			var svg = main_svg.append("g")
						.attr("transform", "translate("+cord_x+","+cord_y+")");

			function _as_is(d){
				return d.value.real*coef
			}


			x.domain(data.map(function(d) { return d.name; }));

			var path_width = topc(input.style.side_width,x.rangeBand())

			y.domain([0,positive_height+path_width]);

			svg.selectAll("_")
				.data(data)
				.enter().append("rect")
					.attr("fill", itemcolor )
					.attr("width", x.rangeBand())
					.attr("x", function(d) {return x(d.name) - path_width/2; })
					.attr("y",function(d) {
						var value =y(_as_is(d))
						if (d.value.real==null) return ;
						if (d.value.real<0){
							return positive_height+input.style.line_width;
						}else{ return value;}
					})
					.attr("height", function(d) {
						var value =y(_as_is(d))
						if (d.value.real<0){
							return value - positive_height;
						}else{ return positive_height - value;}
					})
					.attr('stroke',input.style.border_color)
					.attr('stroke-width',input.style.border_width);;

			function calcHeight(d) {
				var value =y(_as_is(d))
				if (d.value.real==null) return ;
				if (d.value.real<0){
					return positive_height+input.style.line_width;
				}else{ return value;}
			}

			svg.selectAll("_")
				.data(data)
				.enter().append("path")
				.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).darker(0.7); } )
				.attr('d',function(d){
					var ver_angle = input.style.ver_angle;
					var hor_angle = input.style.hor_angle;
					var last = path_width;
					if (d.value.real==null) return ;
					if (input.style.negative_void && d.value.real<0) last = 0;
					var value =y(_as_is(d))
					if (d.value.real<0){
						value = value - positive_height;
					}else{ value = positive_height - value;}
					return ('M '+(x(d.name) - path_width/2 * hor_angle  + x.rangeBand())+' '+(calcHeight(d))+' V '+(calcHeight(d) + value)+' L '+(x(d.name) + x.rangeBand() + path_width/2 * hor_angle)+' '+
					(value + calcHeight(d) - path_width * ver_angle)+' V '+(calcHeight(d) - last * ver_angle)+' Z')
					})
				.attr('stroke',input.style.border_color)
				.attr('stroke-width',input.style.border_width);

			svg.selectAll("_")
				.data(data)
				.enter().append("path")
				.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).brighter(0.7); } )
				.attr('d',function(d){
					if (d.value.real==null) return ;
					if (input.style.negative_void && d.value.real<0) return ;
					var ver_angle = input.style.ver_angle;
					var hor_angle = input.style.hor_angle;
					var value =y(_as_is(d))
					if (d.value.real<0){
						value = value - positive_height;
					}else{ value = positive_height - value;}
					return ('M '+(x(d.name) - path_width/2 * hor_angle)+' '+(calcHeight(d))+' H '+(x(d.name) - path_width/2 * hor_angle + x.rangeBand())+' L'+(x(d.name) + x.rangeBand() + path_width/2 * hor_angle)+' '+(calcHeight(d) - path_width * ver_angle)+' H '+(x(d.name) + path_width/2 * hor_angle)+' Z')
					})
				.attr('stroke',input.style.border_color)
				.attr('stroke-width',input.style.border_width);

			svg.append("g")
				.attr("class", "x axis")
				.attr("stroke", "#000")
				.attr("transform", "translate(0," + positive_height + ")")
					.append("line")
					.attr("x1",0)
					.attr("y1",(input.style.line_width/2))
					.attr("x2",width*1.01)
					.attr("y2",(input.style.line_width/2))
					.attr("stroke",input.style.line_color)
					.attr("stroke-width",input.style.line_width)


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
						.attr("x",function(d) {return x(d.name)+x.rangeBand()/2 - path_width/2; })
						.attr("y",function(d) {
							var value =y(_as_is(d))
							if (d.value.real<0){
								return input.style.line_width + value + add_margin*1;

							}else{ return value - path_width -add_margin*.3;}
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
