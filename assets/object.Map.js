function SVGMapDrawer (input){

	if(!input.tplServer)
		input.tplServer='http://localhost:8080';

	var default_style={
		region: [ 'string', 'kz'],
		colormap:[ 'object', {
			"KZ-AKT": '#CE88BE',
			"KZ-KUS": "#B8D9C8",
			"KZ-SEV": "#CAE095",
			"KZ-AKM": "#8DE9F1",
			"KZ-KAR": "#8DD0F3",
			"KZ-ALM": "#F9B95A",
			"KZ-ZHA": "#F99F81",
			"KZ-YUZ": "#F0CA97",
			"KZ-KZY": "#D9C0AA",
			"KZ-MAN": "#A4B8EA",
			"KZ-ATY": "#A28FE0",
			"KZ-ZAP": "#8493F9",
			"KZ-PAV": "#C0D5A3",
			"KZ-VOS": "#F98A95"
		}],
		color: [ 'string', '#000000' ],
		font_size: [ 'int', 12 ],
		font_family: [ 'string', "sans-serif" ],
		font_weight: [ 'string', "normal" ],
		value_font_size: [ 'int', 12 ],
		value_color: [ 'string', '#ffffff' ],
		value_font_weight: [ 'string', "normal" ],
		outline_width: [ 'int', 1 ],
		keep_void_objects: [ 'bool', false ], //keep objects with no values
		outline_color: [ 'string', '#000000' ],
		water_fill: [ 'string', '#29ABE2' ],
		land_fill: [ 'string', '#a0a0a0' ], //if colormap's value absent -- use this as default
		land_stroke: [ 'string', '#ffffff' ]
	}

// Prepare values

	input.x = input.x || 0;
	input.y = input.y || 0;
	input.height = input.height || 100;
	input.width = input.width || 100;

	var dataset = input.dataset || "";

	input.style = extendDefaults(default_style, input.style);

	var valueKey = input.dataset.datesRange.max;

	//fetch region template
	preparePars(input)

	$.ajax({
		dataType: 'text',
		cache: false,
		async: false,
		sync: true,
		url: input.tplServer + "/assets/svg-templates/map." + input.style.region + ".svg",
		success: goDraw,
		error: function(e){
			document.write('Map template request error')
		}
	})
	// Draw object

	function goDraw(tpl)
	{
		var svg = input.svg.append("svg")
					.attr("x", input.plot_box.x )
					.attr("y", input.plot_box.y )
					.attr("width", input.plot_box.width )
					.attr("height", input.plot_box.height )

		svg.append("defs")
			.append("style")

		var $mapRoot = $(svg[0][0]);

		$mapRoot.append(tpl);
		var mainGroup = $mapRoot.find('.map-main-group'),
			basicWidth = parseFloat(mainGroup.attr('basic-width')),
			basicHeight = parseFloat(mainGroup.attr('basic-height')),
			newWidth = input.plot_box.width / basicWidth,
			newHeight = input.plot_box.height / basicHeight,
			transformRatio = (newWidth>=newHeight) ? newHeight : newWidth;

		mainGroup.attr('transform',"scale("+transformRatio+")");

		mainGroup.find('g > *').attr('void',true) //mark everything as void

		//apply default land style
		$mapRoot.find('.map-lands > *')
			.attr('stroke',input.style.land_stroke)
			.attr('fill',input.style.land_fill);

		//waters
		$mapRoot.find('.map-waters polygon').attr('fill', input.style.water_fill)
		//outlines
		$mapRoot.find('.map-outlines *')
			.attr('stroke',input.style.outline_color)
			.attr('stroke-width',input.style.outline_width)


		$.each(input.dataset.charts, function(){
			var chart = this,
				chartKey = this.accentData.envkey,
				filter = '[for="'+chartKey+'"]';

			//find everything for me
			$mapRoot.find(filter).each(function(){
				var me = $(this).attr('void', null),
					type = me.parent().attr('class').replace(/map-([\w\d]+)/,'$1');


				switch(type)
				{
					case 'outline':
						break;
					case 'dots':
						break;
					case 'lands':
						if(input.style.colormap[chartKey])
							me.attr('fill', input.style.colormap[chartKey])
						break;
					case 'values':
						me.html(chart.data[valueKey].for_print);
						break;
				}

			})


		})

		//issue #357: Добавить признак редактируемости и некий атрибут с ID
		$mapRoot.find('.map-lands > *').each(function(i){ $(this).attr('editableMark', 'map_land'+i)})
		$mapRoot.find('.map-dots > *').each(function(i){ $(this).attr('editableMark', 'map_dot'+i)})
		$mapRoot.find('.map-values > *').each(function(i){ $(this).attr('editableMark', 'map_value'+i)})
		$mapRoot.find('.map-labels > *').each(function(i){ $(this).attr('editableMark', 'map_label'+i)})
		$mapRoot.find('.map-outlines > *').each(function(i){ $(this).attr('editableMark', 'map_outline'+i)})
		//

		if(!input.style.keep_void_objects)
		{
			//remove all dots
			$mapRoot.find('.map-dots [void="true"]').remove()
			$mapRoot.find('.map-values [void="true"]').remove()
			$mapRoot.find('.map-labels [void="true"]').remove()
			$mapRoot.find('.map-outlines [void="true"]').remove()
		}
		//set styles
		$mapRoot.find('.map-values > *')
			.attr('font-size', input.style.value_font_size)
			.attr('font-weight', input.style.value_font_weight)
			.attr('font-family', input.style.font_family)
			.attr('fill', input.style.value_color)

		$mapRoot.find('.map-labels > *')
			.attr('font-size', input.style.font_size)
			.attr('font-weight', input.style.font_weight)
			.attr('font-family', input.style.font_family)
			.attr('fill', input.style.color)
		//cleanup

		$mapRoot.find('[void="true"]').attr('void', null)

	}

}
