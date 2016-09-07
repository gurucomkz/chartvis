function SVGTextDrawer (input){

    var targetSelector = typeof input.targetSelector == 'string'
        ? 	d3.select(input.targetSelector)
        : 	input.targetSelector

    var default_style={
        vertical_indent: [ 'float', 1.5 ],
        color: [ 'string', "#000000" ],
        font_family: [ 'string', "sans-serif"],
        font_size: [ 'int', 15 ],
        font_weight: ['string', "normal"],
        padding_left: [ 'int', 10],
        padding_right: ['int', 10],
        padding_bottom: ['int', 10],
        padding_top: ['int', 10],
        align_vertical: ['string', 'top'],
        align_horizontal: ['string', 'left']
    }
    // Prepare values

    var dataset = (input.content ? input.content.value : null) || input.dataset || "";

    input.style = extendDefaults(default_style, input.style);


    // Draw object

    var svg;
    var cord_x = 0;
    var cord_y = 0;
    //prepare text positions
    var width = input.width
    var height = input.height


    if(!input.skip_own_container)
    {
        SVGBorderDrawer(input);
        svg = targetSelector.append("svg")
            .attr("x",input.x)
            .attr("y",input.y)
            .attr("width", input.width)
            .attr("height", input.height)
            .attr("id", "object_"+input.id);

    }else{
        svg = targetSelector
    }

    input.container = svg.append("g")

    if(input.editablePart) input.container.attr("editablepart", input.editablePart )
    if(input.editableClass) input.container.attr("editableclass", input.editableClass )

    var lineHeight = getTextHeight("A", input.style);

    var max_string_length = Math.round(width/(input.style.font_size*0.6))

    if (max_string_length<1) max_string_length=256;

    var data = splitText(dataset, max_string_length)

    var max_strings = Math.floor(height/(input.style.font_size*(input.style.vertical_indent)))

    if (data.length > max_strings) data = data.slice(0, max_strings)


    var text_x, text_y, anchor;

    var line_height = lineHeight*(input.style.vertical_indent),
        text_inline_offset = lineHeight*(input.style.vertical_indent - 1)

    var totalHeight = line_height * data.length + input.style.padding_bottom + input.style.padding_top;

    //calcs are over
    if(input.skip_own_container)
    {
        input.height = totalHeight;
        SVGBorderDrawer(input);
        cord_x += input.x;
        cord_y += input.y;

    }

    switch(input.style.align_vertical)
    {
        case 'middle':
        case 1:
            text_y = (height - line_height * Math.round(data.length)) / 2; break;
        case 'bottom':
        case 2:
            text_y = height - line_height * data.length; break;
        default: //top
            text_y = cord_y + line_height;
    }
    switch(input.style.align_horizontal)
    {
        case 'middle':
        case 'center':
        case 1:
            text_x = width/2
            anchor = "middle";
            break;
        case 'right':
        case 2:
            text_x = width;
            anchor = "end";
            break;
        default: //left
            text_x = cord_x
            anchor = "start"
    }

    var J=0

    input.container.selectAll("_")
        .data(data)
        .enter()
        .append("text")
            .attr("x",text_x)
            .attr("y",function(d){return text_y - text_inline_offset/2 + line_height * J++})
            .attr("class","content")
            .attr('font-size', input.style.font_size)
            .attr('font-family', input.style.font_family)
            .attr('font-weight', input.style.font_weight)
            .attr('fill', input.style.color)
            .attr("anchor",anchor)
            .text(function(d){ return d})

    return totalHeight

}
//aliases
var SVGtextDrawer = SVGTextDrawer;
