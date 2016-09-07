function SVGStackedHorbar3DDrawer (input){

	var default_style={
		outter_indent: 		[ 'string', '5%'],
		inner_indent: 		[ 'string', '10%'],
		element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
		line_width: 		['int', 4],
		flag: 				[ 'string','stacked'], //stackedfull stacked позволяет изменить вид графика
		line_color: 		['string','black'],
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

	var flags={stacked:true}
	if (input.style.flag=="stackedfull") var flags={stackedfull:true}
	flags.horbar=true
	preparePars(input,flags)

	// Draw object


	var len=0
	for (var v in dataset.charts[0].data){
		len++
	}

	var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

	var sub_bar_height=input.plot_box.height/len
	var index = 0;

	// это группировка только по датам
	// а нам так же надо уметь группировать и по именам
	// но processGroups так пока не умеет
	input.plot_box.style = optionsByPrefix(input.style, 'plot_');
	input.plot_box.targetSelector = input.svg;

	var dataMaxTextWidth=0
	for (var date in dataset.charts[0].data){
		for(var chart in dataset.charts){
			dataMaxTextWidth = Math.max(dataMaxTextWidth, getTextWidth(dataset.charts[chart].data[date].for_print+"0", input.style.font_size))
		}
	}
	input.dataMaxTextWidth=dataMaxTextWidth
	var data=[]
	for (var date in dataset.charts[0].data){
		data.push(date)
	}
	var y_domain = d3.scale.ordinal()
					.rangeRoundBands([topc(input.style.outter_indent,input.plot_box.height), input.plot_box.height-topc(input.style.outter_indent,input.plot_box.height)], topc(input.style.inner_indent));

	y_domain.domain(data);

	SVGBorderDrawer(input.plot_box);
	if (input.style.y_axis){
		input.style.y_axis_top_indent = input.plot_box.height
		flags['3D'] =true
		processScaleY(input,flags)
	}

	for (var date in dataset.charts[0].data){
		data =[]
		for(var chart in dataset.charts){
			data.push({'name':dataset.charts[chart].chart,'value':dataset.charts[chart].data[date], 'date': date})
		}

		var sub_plot_box = {
			y: input.plot_box.y,
			x: input.plot_box.x ,
			width: input.plot_box.width,
			style: input.plot_box.style
		}


		_add_graph(input.svg,sub_plot_box.x,sub_plot_box.y,input.plot_box.height,sub_plot_box.width,data,index++,input.max,input.min)

	}


	function _add_graph(main_svg,cord_x,cord_y,height,width,data,index,max,min){

		var y = y_domain;
		var sub_width=width-input.style.line_width

		if (!input.style.values_hidden){
			sub_width=sub_width-dataMaxTextWidth
		}

		if (min>0){
			min=0
		}

		var path_height = topc(input.style.side_width,y.rangeBand())

		sub_width -= path_height * input.style.hor_angle

		var coef=sub_width/(max+Math.abs(min)),
			positive_width=max*coef;

		var x = d3.scale.linear()
					.range([positive_width,0]);



		var svg = main_svg.append("g")
					.attr("transform", "translate("+cord_x+","+cord_y+")");

		function _as_is(d){
			return d.value.new*coef
		}

		x.domain([max,min]);

		var prev=0, res=0, res2=0, prev2=0

		svg.selectAll("_")
			.data(data)
			.enter().append("rect")
				.attr("fill", itemcolor )
				.attr("height", y.rangeBand())
				.attr("y", function(d) {return y(d.date) - path_height/2 * input.style.ver_angle; })
				.attr("x",function(d) {
					res=prev
					prev=x(d.value.new)
					return res+input.style.line_width;
				})
				.attr("width", function(d) {
					res2=prev2
					prev2=_as_is(d)
					return _as_is(d)-res2;
				});

		var prev=0, res=0, res2=0, prev2=0;

		function calcX(d){
			res=prev
			prev=x(d.value.new)
			return res+input.style.line_width;
		}
		function calcWidth(d) {
			res2=prev2
			prev2=_as_is(d)
			return _as_is(d)-res2;
		}

		var curr_x = 0, curr_width = 0, last_name='';

		svg.selectAll("_")
			.data(data)
			.enter().append("path")
			.attr("fill", function(d,I) { return d3.hsl(rrItemIn(I, input.style.element_fill)).darker(0.7); } )
			.attr("comment",function(d){return " "+input.style.negative_void+" "+d.value.real})
			.attr('d',function(d){
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;
				var last = 0;
				if (d.value.real==null) return ;
				if (input.style.negative_void && d.value.real<0) last = path_height;
				curr_x = calcX(d);
				curr_width = calcWidth(d);
				last_name = d.date;
				return ('M '+(curr_x)+' '+(y(d.date) + y.rangeBand() - path_height/2 * input.style.ver_angle)+' H '+(curr_x + curr_width) + ' L ' + (curr_x + curr_width + (path_height - last) * input.style.hor_angle)+
				' '+(y(d.date) + y.rangeBand() + path_height/2 * input.style.ver_angle)+' H '+(curr_x + (path_height) * input.style.hor_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);

		svg.append("path")
			.attr("fill", function() { return d3.hsl(rrItemIn(data.length-1, input.style.element_fill)).brighter(0.7); } )
			.attr('d',function(){
				var ver_angle = input.style.ver_angle;
				var hor_angle = input.style.hor_angle;

				return ('M '+(curr_x + curr_width)+' '+(y(last_name) - path_height/2 * input.style.ver_angle)+' V '+(y(last_name) + y.rangeBand() - path_height/2 * input.style.ver_angle)+' L '+(curr_x + curr_width + path_height * input.style.hor_angle)+
				' '+(y(last_name) + y.rangeBand() + path_height/2 * input.style.ver_angle)+' V '+(y(last_name) + path_height/2 * input.style.ver_angle)+' Z')
				})
			.attr('stroke',input.style.border_color)
			.attr('stroke-width',input.style.border_width);


		svg.append("g")
			.attr("class", "x axis")
			.attr("stroke", "#000")
				.append("line")
				.attr("y1",0)
				.attr("x1",(input.style.line_width/2))
				.attr("y2",height)
				.attr("x2",(input.style.line_width/2))
				.attr("stroke","#000000")
				.attr("stroke-width",input.style.line_width)

		if (!input.style.values_hidden){
			var local_max =  d3.max(data, function(d) { return d.value.real; })
			var local_min =  d3.min(data, function(d) { return d.value.real; })
			prev=0
			svg.selectAll("_")
				.data(data)
				.enter().append("text")
					.attr("font-family", input.style.font_family )
					.attr("font-size", input.style.font_size )
					.attr("font-weight", input.style.font_weight )
					.attr("text-anchor", "middle")
					.attr("fill", itemcolor )
					.attr("y",function(d) {
						var values_vertical_shift=input.style.font_size/3
						if (y.rangeBand()/2<values_vertical_shift) values_vertical_shift=y.rangeBand()/2
						return y(d.date)+y.rangeBand()/2+values_vertical_shift; })
					.attr("x",function(d) {
						res=prev
						prev=x(d.value.new)
						return input.style.line_width+_as_is(d)+dataMaxTextWidth/2 + path_height * input.style.ver_angle;
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
