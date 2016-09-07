function SVGBorderDrawer (input, propPrefix){

	var targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector;

	propPrefix = propPrefix || '';

	var default_style = {
		margin_top: [ 'float', 0 ],
		margin_bottom: [ 'float', 0 ],
		margin_left: [ 'float', 0 ],
		margin_right: [ 'float', 0 ],
		padding_top: [ 'float', 0 ],
		padding_bottom: [ 'float', 0 ],
		padding_left: [ 'float', 0 ],
		padding_right: [ 'float', 0 ],

	};
//sanitize
	input.x = parseFloat(input.x || 0)||0;
	input.y = parseFloat(input.y || 0)||0;
	input.width = parseFloat(input.width || 0)||0;
	input.height = parseFloat(input.height || 0)||0;

	if(input._borderProcessed) {
		console.log("Border double processing!!")
		return;
	}
	input._borderProcessed = true;

	// Prepare values
	input.style = extendDefaults(default_style, input.style);

	// Draw object

	var original = {
		x: input.x, y: input.y,
		width: input.width, height: input.height
	};

	input.x += input.style.margin_left
	input.y += input.style.margin_top
	input.width -= input.style.margin_left + input.style.margin_right;
	input.height -= input.style.margin_top + input.style.margin_bottom;

	var b;
	if(b = parseBorder(input.style[propPrefix + 'border_left']))
	{
		mkline(input.x + b.size/2, input.y,
				input.x + b.size/2, input.y + input.height,
				b)
		input.x += b.size
		input.width -= b.size
	}

	if(b = parseBorder(input.style[propPrefix + 'border_top']))
	{
		mkline(input.x, input.y + b.size/2,
				input.x + original.width , input.y + b.size/2,
				b)
		input.y += b.size
		input.height -= b.size
	}

	if(b = parseBorder(input.style[propPrefix + 'border_right']))
	{
		mkline(original.x + original.width - b.size/2, input.y,
			original.x + original.width - b.size/2, input.y + input.height,
				b)
		input.width -= b.size
	}

	if(b = parseBorder(input.style[propPrefix + 'border_bottom']))
	{
		mkline(original.x, original.y + original.height - b.size/2,
				input.x + input.width, original.y + original.height - b.size/2,
				b)
		input.height -= b.size
	}

	//background
	if(!isObjectEmpty(input.style[propPrefix + 'background_color']))
	{
		var b_string = input.style[propPrefix + 'background_color'].toString(),
			b_color = ((b_string.match(/^\s*(#[0-9a-f]{6})\s*$/i) || [])[1]) || false;
		if(b_color)
		{
			targetSelector.append("rect")
				.attr("x", input.x)
				.attr("y", input.y)
				.attr("width", input.width)
				.attr("height", input.height)
				.attr('fill', b_color)
		}
	}
	if(!isObjectEmpty(input.style[propPrefix + 'background_image']))
	{
		console.log('HAVE background_image')
		var b_string = input.style[propPrefix + 'background_image'].toString(),
			b_pic = ((b_string.match(/^(data:image.*)/i) || [])[1]) || false;
		if(b_pic)
		{
			// stretch|repeat|none vertical|horizontal|full left|top|middle bottom|right|center
			var bgPos = {},
				bgPosByGrp = { style: 'none', orientation: 'full', hAlign: 'center', vAlign:'middle' },
				_trMap = {left:'Min',top:'Min',middle:'Mid',center:'Mid',right:'Max',bottom:'Max'},
				_grpMap = { stretch: 'style', repeat:'style', none:'style',
							vertical:'orientation', horizontal:'orientation', full:'orientation',
				 			left:'hAlign',right:'hAlign',center:'hAlign',
							bottom:'vAlign',top:'vAlign',middle:'vAlign'}

			if(!isObjectEmpty(input.style[propPrefix + 'background_position']))
			{

				var bp_string = input.style[propPrefix + 'background_position'].toString().toLowerCase(),
					bp_tmp = bp_string.split(/\s+/g);
				$.each(bp_tmp,function(_i,_k){
					bgPos[_k] = true;
					bgPosByGrp[_grpMap[_k]] = _k;
				})
			}

			var sizes = getImageSize(b_string),
				imageCanvas = targetSelector.append('svg')
								.attr("x", input.x)
								.attr("y", input.y)
								.attr("width", input.width)
								.attr("height", input.height)

			switch(bgPosByGrp.style)
			{
				case 'repeat':
					var hRepeats = bgPos.vertical ? 1 : Math.ceil(input.width/sizes.width),
						vRepeats = bgPos.horizontal ? 1 : Math.ceil(input.height/sizes.height),
						hStart = 0, vStart = 0;

					if(bgPos.vertical)
						switch(bgPosByGrp.hAlign)
						{
							case 'right': hStart = input.width - sizes.width; break;
							case 'center': hStart = (input.width - sizes.width)/2; break;
						}
					if(bgPos.horizontal)
						switch(bgPosByGrp.vAlign)
						{
							case 'bottom': vStart = input.height - sizes.height; break;
							case 'middle': vStart =  (input.height - sizes.height)/2; break;
						}

					for(var _hor = 0; _hor < hRepeats; _hor++)
					{
						for(var _ver = 0; _ver < vRepeats; _ver++)
						{
							var i = imageCanvas.append("image")
								.attr("x", hStart + sizes.width*_hor)
								.attr("y", vStart + sizes.height*_ver)
								.attr("width", sizes.width)
								.attr("height", sizes.height)
								.attr('xlink:href', b_string)
						}
					}
					break;
				case 'stretch':
					var i = imageCanvas.append("image")
						.attr("width", input.width)
						.attr("height", input.height)
						.attr('xlink:href', b_string)
						.attr('preserveAspectRatio','none')
					if(bgPos.vertical || bgPos.horizontal)
						i.attr('preserveAspectRatio',
								format('x{1}Y{2} slice', _trMap[bgPosByGrp.hAlign], _trMap[bgPosByGrp.vAlign]))
					break;
				case 'none':
				default:
					var i = imageCanvas.append("image")
						.attr("width", sizes.width)
						.attr("height", sizes.height)
						.attr('xlink:href', b_string)
					switch(bgPosByGrp.hAlign)
					{
						case 'right': i.attr('x', input.width - sizes.width); break;
						case 'center': i.attr('x', (input.width - sizes.width)/2); break;
					}
					switch(bgPosByGrp.vAlign)
					{
						case 'bottom': i.attr('y', input.height - sizes.height); break;
						case 'middle': i.attr('y', (input.height - sizes.height)/2); break;
					}
					break;
			}

		}

	}

	input.x += input.style.padding_left
	input.y += input.style.padding_top
	input.width -= input.style.padding_left + input.style.padding_right;
	input.height -= input.style.padding_top + input.style.padding_bottom;

	if(typeof input.cntX != 'undefined') input.cntX = input.x;
	if(typeof input.cntY != 'undefined') input.cntY = input.y;
	if(typeof input.cntWidth != 'undefined') input.cntWidth = input.width;
	if(typeof input.cntHeight != 'undefined') input.cntHeight = input.height;


	function mkline(x,y,tox,toy,s)
	{
		var l = targetSelector.append("line")
				.attr("x1", x)
				.attr("y1", y)
				.attr("x2", tox)
				.attr("y2", toy)
				.attr('stroke-width', s.size)
				.attr('stroke', s.color)
		if(s.style == 'dotted')
			l.attr('stroke-dasharray', s.size+","+s.size);
		if(s.style == 'dashed')
			l.attr('stroke-dasharray', s.size*3+","+s.size);
	}


}
