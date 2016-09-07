function SVGDrawingDrawer (input){

	var default_style={
        padding_left: [ 'float', 0 ],
        padding_right: [ 'float', 0 ],
        padding_bottom: [ 'float', 0 ],
        padding_top: [ 'float', 0 ],
        align_vertical: [ 'string', 'middle' ],
        align_horizontal: [ 'string', "center" ],
        stretch_vertical: [ 'string', 'fit' ],	//fit|stretch|none
        stretch_horizontal: [ 'string', 'fit' ], //fit|stretch|none
		fill: [ 'string', "" ]
    }
    // Prepare values

    var drawing = (input.content ? input.content.value : null) || input.dataset || "";

    input.style = extendDefaults(default_style, input.style);

	preparePars(input);

	var $svg = $(input.svg[0][0]);

	var $drawing = $(drawing).filter('svg')

	if(! $drawing.length )// invalid or empty drawing
	{
		$svg.empty();
		return;
	}


	var transform = {
		translate: [0, 0],
		scale: [1, 1]
	};

	var dWidth = parseInt($drawing.attr('width')),
		dHeight = parseInt($drawing.attr('height'));

	switch(input.style.stretch_horizontal)
	{
		case 'stretch':
			transform.scale[0] = input.width / dWidth; break;
		case 'fit':
			break;
		default:
			switch(input.style.align_horizontal)
			{
				case 'left': break;
				case 'right': transform.translate[0] = input.width - dWidth; break;
				case 'center':
					transform.translate[0] = (input.width - dWidth)/2; break;
			}
	}

	switch(input.style.stretch_vertical)
	{
		case 'stretch':
			transform.scale[1] = input.height / dHeight; break;
		case 'fit':
			break;
		default:
			switch(input.style.align_vertical)
			{
				case 'top': break;
				case 'bottom': transform.translate[1] = input.height - dHeight; break;
				case 'middle':
					transform.translate[1] = (input.height - dHeight)/2; break;
			}
	}

	$drawing.find('*').attr('id', null)

	//this shit is important to make shapes visible over image backgrounds
	var $transformRoot = $drawing.find('>g');

	if($transformRoot.length != 1)
	{
		$transformRoot = $('<g></g>').appendTo($svg)
		$transformRoot.append($drawing.contents());
	}else
		$svg.append($drawing.contents());


	$transformRoot.attr('transform',
			format("translate({0} {1}) scale({2} {3})",
				transform.translate[0],
				transform.translate[1],
				transform.scale[0],
				transform.scale[1]
			))



}
