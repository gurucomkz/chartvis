
function SVGDrawer(data, stdHeight)
{
	if(!stdHeight) stdHeight = 1000;
	if(data.style && window.document)
	{
		$('head').append("<style>"+data.style+"</style>")
	}
	if(data.page)
	{
		var page = data.page;

		if(!page.properties) page.properties = {};
		if(!page.style) page.style = {};
		if(!page.properties.aspectRatio) page.properties.aspectRatio = 1;
		page.x = 0;
		page.y = 0;
		if(page.properties.width && page.properties.height)
		{
			page.width = page.properties.width;
			page.height = page.properties.height;
		}else
		{
			page.width = stdHeight*page.properties.aspectRatio;
			page.height = stdHeight;
		}
		page.targetSelector = 'body';

		var cnt = page.targetSelector = prepareContainer(page);
		//document style, yo!
		SVGBorderDrawer(page);

		//

		var markupObjects = fixMarkup(page.markup || page.content, page.x, page.y, page.width, page.height);



		var relmap = {};
		for(var x in markupObjects)
		{
			var o = markupObjects[x],
				fName = 'SVG'+o.type+'Drawer';
			o.targetSelector = cnt;
			SVGBorderDrawer(o);
			if(o.content)
				relmap[o.content] = o

			if(window[fName])
				window[fName](o);
		}

		for(var x in page.objects)
		{
			var o = page.objects[x],
				container = relmap[o.id],
				fName = 'SVG'+o.type+'Drawer';

			if(container)
			{
				o.targetSelector = '#'+container.id;
				o.x = container.cntX;
				o.y = container.cntY;
				o.height = container.cntHeight;
				o.width = container.cntWidth;
			}else{
				o.targetSelector = cnt; //kind'a workaround for #320
				//сперва их по-хорошему отсортировать по z-index
				convertPcSizes(o, page)
				//fix according to borders
				o.x += page.x
				o.y += page.y
			}

			o.targetSelector = cnt.append('g');
			o.targetSelector.attr('opacity', (o.style || {}).opacity || 1);

			if(data.datasets && data.datasets[x])
				o.dataset = data.datasets[x];
			if(!o.dataset && o.content)
				o.dataset = o.content;

			SVGBorderDrawer(o)

			if(window[fName])
				window[fName](o);
		}
	}else{
		var o = data.object,
			cnt = prepareContainer({
				targetSelector: 'body',
				width: o.width,
				height: o.height
			});
		if(o.type == 'graph')
			o.type = 'Verbar'//o.content.type;

		o.targetSelector = cnt.append('g');
		o.targetSelector.attr('opacity', (o.style || {}).opacity || 1);

		if(o.size && o.size!='NaN')
		{
			//implement zooming
			var prevW = o.width,
				whRatio = o.height / o.width,
				vSize = o.size * whRatio / 100;

			o.height = stdHeight * vSize
			o.width = o.height / whRatio

			var docRatio = prevW/o.width;
			o.targetSelector.attr('transform', format('scale({0})', docRatio) )
		}
		if(data.datasets && data.datasets['0'])
			o.dataset = data.datasets['0'];
		if(!o.dataset && o.content)
			o.dataset = o.content;

		var fName = 'SVG'+o.type+'Drawer'
		SVGBorderDrawer(o)
		if(window[fName])
			try{
				window[fName](o);
			}catch(e){
				document.write(fName + " error " + e)
			}
		else
			document.write(fName + " not found")
	}

	$('*').each(function(){
		$(this).attr('xlink:href',$(this).attr('href'))
	})
	$('*').contents().each(function() {
        if(this.nodeType == 8) {
            $(this).remove()
        }
    });

}
