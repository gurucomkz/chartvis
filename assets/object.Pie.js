function SVGPieDrawer (input){

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
		border_color: 				['string',"white"],
		border_width: 				['int',1],
		value_order: 				['string',''],
		element_fill: 				['array',["steelblue","red","green","yellow","purple"]],
		inner_pie_element_fill: 	['array',["#111111","#333333","#555555","#777777","#999999","#bbbbbb"]],
		inner_radius: 				['string',"0%"], //in %
		double_pie: 				['bool',false],
		ordering_logic: 			['string','by_date'], //может принимать значения by_date, by_name
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
	if (!input.style.double_pie){
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
	}else {
		var data1=[]
		var data2=[]
		switch (input.style.ordering_logic){
			case 'by_name':
				for (var pos in dataset.charts){
					var I=0
					var summ=0
					var data_temp=[]
					for (var date in dataset.charts[0].data){
						data_temp.push({"name":dataset.charts[pos].chart,"value":dataset.charts[pos].data[date],"index":I++})
						summ+=dataset.charts[pos].data[date].real
					}
					if (input.style.value_order=="ascending"){
						data_temp.sort(asc);
					}else if (input.style.value_order=="descending"){
						data_temp.sort(desc);
					}
					for (var el in data_temp) data1.push(data_temp[el])
					data2.push({"name":dataset.charts[pos].chart,"value":{'real':summ,'for_print':parseInt(summ)},"index":pos})
				}
				_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data1)
				_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data2,true)

			break;
			case 'by_date':
				var I=0
				for (var date in dataset.charts[0].data){
					var summ=0
					var data_temp=[]
					for (var pos in dataset.charts){
						data_temp.push({"name":dataset.charts[pos].chart,"value":dataset.charts[pos].data[date],"index":pos})
						summ+=dataset.charts[pos].data[date].real
					}
					if (input.style.value_order=="ascending"){
						data_temp.sort(asc);
					}else if (input.style.value_order=="descending"){
						data_temp.sort(desc);
					}
					for (var el in data_temp) data1.push(data_temp[el])
					data2.push({"name":date,"value":{'real':summ,'for_print':parseInt(summ)},"index":I++})
				}
				_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data1)
				_add_graph(input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,data2,true)

			break;
		}
	}

	function _add_graph(main_svg,cord_x,cord_y,width,height,data,double){
		var radius = Math.min(width, height)/ 2;
		var names=[]
		for (var pos in data){
			names.push((input.style.double_pie)? data[pos].index : data[pos].name)
		}
		var color = d3.scale.ordinal()
			.range( (double)? input.style.inner_pie_element_fill : input.style.element_fill)
			.domain(names)

		var arc = d3.svg.arc()
			.outerRadius( (double)? topc(input.style.inner_radius,radius) : radius*0.99)
			.innerRadius( (input.style.double_pie)? 0 : radius*topc(input.style.inner_radius));

		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.value.real; });

		var pies_g=main_svg.append("g")
					.attr("transform", "translate(" + (cord_x)  + "," + (cord_y)  + ")")
					.append("g")
					.attr("transform", "translate(" + (width/2)  + "," + (height/2)  + ")");

		var g = pies_g.selectAll(".arc")
			.data(pie(data))
			.enter().append("g")
			.attr("class", "arc");

		g.append("path")
			.attr("d", arc)
			.attr("fill", function(d) { return color((input.style.double_pie)? d.data.index : d.data.name); });
		var yap=true;

		if (input.style.double_pie && !double){
			yap=false
		}

		if (!input.style.values_hidden && yap){
			var local_max =  d3.max(data, function(d) { return d.value.real; })
			var local_min =  d3.min(data, function(d) { return d.value.real; })
			var J=0

			g.append("text")
				.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
				.attr("dy", ".35em")
				.attr("class","value")
				.style("text-anchor", "middle")
				.text(function(d, J) {
					if (typeof(input.style.values_display)=="object" && input.style.values_display.length){
						var rules=input.style.values_display[index%input.style.values_display.length]
						if ( rules.indexOf( J + 1 ) > -1 ) return d.data.value.for_print;
						if (rules.indexOf( "max" ) > -1 && d.data.value.real==local_max) return d.data.value.for_print;
						if (rules.indexOf( "min" ) > -1 && d.data.value.real==local_min) return d.data.value.for_print;
						return '';
					}
					return d.data.value.for_print
				});
		}

	}
}
