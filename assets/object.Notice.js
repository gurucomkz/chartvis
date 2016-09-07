function SVGNoticeDrawer (input){

    input.targetSelector = typeof input.targetSelector == 'string'
        ? 	d3.select(input.targetSelector)
        : 	input.targetSelector

    var default_style={
        text_background_color: [ 'string', "#f0f0f0" ],
        color: [ 'string', '#000000'],
        circle_fill: [ 'string', "#cccccc" ],
        circle_radius: [ 'float', 20 ],
        shadow_size: [ 'float', 5 ],
    }

    input.style = extendDefaults(default_style, input.style);

//    SVGBorderDrawer(input);

    var background_width =  input.width - input.style.circle_radius - input.style.shadow_size;
    var background_height =  input.height - input.style.circle_radius - input.style.shadow_size;
    var background_x = input.style.circle_radius;
    var background_y = input.style.circle_radius;


  // Draw object

  var svg = input.targetSelector.append("svg")
      .attr("x",input.x)
      .attr("y",input.y)
      .attr("width", input.width)
      .attr("height", input.height)
      .attr("id", "object_"+input.id);


  svg.append("defs")


  var filter1=svg.select("defs")
                .append("filter")
                  .attr("id","blur2")
                  .attr("y","-10")
                  .attr("height","20")
                  .attr("x","-10")
                  .attr("width","20")

  filter1.append("feOffset")
            .attr("in","SourceAlpha")
            .attr("dx","3")
            .attr("dy","3")
            .attr("result","offset2")

  filter1.append("feGaussianBlur")
            .attr("in","offset2")
            .attr("stdDeviation","3")
            .attr("result","blur2")

  var FeMerge = filter1.append("feMerge")

  FeMerge.append("feMergeNode")
          .attr("in","blur2")

  FeMerge.append("feMergeNode")
          .attr("in","SourceGraphic")


//shadow

    svg.append("rect")
            .attr("x", background_x + input.style.shadow_size)
            .attr("y", background_y + input.style.shadow_size)
            .attr("width", background_width )
            .attr("height", background_height)
            .attr("fill", '#000000')

    var txbox = {
        content: input.content,
        targetSelector: svg,
        x: background_x,
        y: background_y,
        width: background_width,
        height: background_height,
        style: {
            padding_top : 5,
            padding_left: input.style.circle_radius,
            color: input.style.color,
            background_color: input.style.text_background_color,
        }
    }


    SVGTextDrawer(txbox)
  //prepare text positions

  var g = svg.append("g");
      g.append("circle")
          .attr("cx",background_x)
          .attr("cy",background_y)
          .attr("r", input.style.circle_radius)
          .attr("fill", input.style.circle_fill)
          .attr("filter","url(#blur2)")

      g.append("line")
          .attr("x1",background_x)
          .attr("y1",background_y-input.style.circle_radius*.6)
          .attr("x2",background_x)
          .attr("y2",background_y+input.style.circle_radius*.2)
          .attr("style","stroke:white; stroke-width:"+input.style.circle_radius*.2+";")

      g.append("line")
          .attr("x1",background_x)
          .attr("y1",background_y+input.style.circle_radius*.4)
          .attr("x2",background_x)
          .attr("y2",background_y+input.style.circle_radius*.6)
          .attr("style","stroke:white; stroke-width:"+input.style.circle_radius*.2+";")



}
//aliases
var SVGnoticeDrawer = SVGNoticeDrawer;
