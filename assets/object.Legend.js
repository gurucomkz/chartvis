function DrawLegend (svg,legend_box,colors){

	var default_style={
		vertical_indent:1.5,
		color:"Black",
		font_family:"sans-serif",
		font_size:15,
		font_weight:"normal",
		padding_left:0,
		padding_right:0,
		padding_bottom:0,
		padding_top:0}
	// Prepare values

	legend_box.style = extend(default_style, (legend_box.style || {}));

	var alignment ="vertical"
	if (legend_box.width>legend_box.height) alignment ="horisontal"

	var max_string_length = Math.round(legend_box.width/(legend_box.style.font_size*0.6))

	var max_legend_length=0
	for (var I=0; I<legend_box.items.length; I++){
		if (legend_box.items[I].length>max_legend_length) max_legend_length = legend_box.items[I].length
	}

	var rows=1
	if (alignment=="horisontal"){
		rows = Math.floor(max_string_length/(max_legend_length+2))
		if (rows==0) rows = 1
	}

	var input = {}
	input.style = legend_box.style

	input.x = legend_box.x
	input.y = legend_box.y
	input.width=legend_box.width-legend_box.style.font_size*2
	input.height=legend_box.height
	input.skip_own_container=true

	var g = svg.append("g");

	input.targetSelector=g
	input.x += legend_box.style.font_size*2

	var current_row=1

	for ( var I = 0; I<legend_box.items.length; I++ ){

		input.dataset = legend_box.items[I]
		input.editableClass = 'legend'
		input.editablePart = format("legenditem_{0}", I)

		var temp_height=SVGTextDrawer(input)
		var rect=g.append("rect")
			.attr("x",input.x-legend_box.style.font_size*1.5)
			.attr("y",input.y + ((input.style.vertical_indent-1)*legend_box.style.font_size))
			.attr("width",legend_box.style.font_size)
			.attr("height",legend_box.style.font_size)
			.attr("class","legend_element"+I)
			.attr("editablepart", input.editablePart )
			.attr("editableclass", input.editableClass )
			.attr('fill',colors[I%colors.length])
		input.y += temp_height
		if (input.y>(legend_box.y+legend_box.height) && rows>current_row){
			current_row+=1
			input.x+=(max_legend_length+2)*legend_box.style.font_size*0.6
			input.y = legend_box.y
			I=I-1
			input.container.remove()
			rect.remove()
		}
	}


		/*for (var R=0;R<rows;R++){
		var J=0



		g.selectAll("_")
		.data(legend.slice(R*max_strings,(R+1)*max_strings))
		.enter()
		.append("text")
		.attr("x",text_x+row_step*R)
		.attr("y",function(d){
			return text_y+line_step*J++})
		.attr("class","legend")
		.attr("text-anchor","start")
		.text(function(d){ return d});

		var J=0
		g.selectAll("_")
		.data(legend.slice(R*max_strings,(R+1)*max_strings))
		.enter()
		.append("rect")
		.attr("x",text_x+row_step*R-font_size*1.5)
		.attr("y",function(d){
			return text_y-font_size+line_step*J++})
		.attr("width",font_size)
		.attr("height",font_size)
		.attr("fill","white")
	}
	var J=0
	g.selectAll("rect")
	.data(box_array)
	.attr("class", function(d){if (d=="#"){return "element"+J++}
	else return "deleted"})

	g.selectAll("rect.deleted").remove()
	*/

}
