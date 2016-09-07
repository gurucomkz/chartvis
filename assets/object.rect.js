function SVGrectDrawer(opts)
{
	var root = typeof opts.targetSelector == 'string'
				? 	d3.select(opts.targetSelector)
				: 	opts.targetSelector;

	var g = root.append('g')
			.attr("id", opts.id)
			.attr("rel", opts.content)
			.attr("index", opts.zIndex||'0')

}
