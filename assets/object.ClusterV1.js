/*!
 * @license Open source under BSD 2-clause (http://choosealicense.com/licenses/bsd-2-clause/)
 * Copyright (c) 2015, Curtis Bratton
 * All rights reserved.
 */
 var highlight_object={
         'max':function(d,i){return (d.value==i.max)? this.color:''},
         'min':function(d,i){return (d.value==i.min)? this.color:''},
         'min,max':function(d,i){return (d.value==i.min || d.value==i.max)? this.color:''},
         'max,min':function(d,i){return (d.value==i.min || d.value==i.max)? this.color:''},
         'all': function(){return this.color},
         'color':'#000000'
     }

function SVGClusterV1Drawer(input){
    var default_style={
        date_format:            [ 'string', '%Y/%m' ],
        element_fill: 		    [ 'array', ["steelblue","red","green","yellow","purple"] ],
        circles_stroke_color:   [ 'string', 'steelblue'],
        circles_fill_color:     ['string', 'white'],
        circles_radius:         ['float',5],
        circles_stroke_width:   ['float',1],
        connections_color:      [ 'string', 'steelblue'],
        connections_width:      ['float',1],

    }



// Prepare values

    var dataset = input.dataset || {};

    input.style = extendDefaults(default_style, input.style);
    preparePars(input,{circle:true})

    input.plot_box.style = optionsByPrefix(input.style, 'plot_');
	input.plot_box.targetSelector = input.svg;

    SVGBorderDrawer(input.plot_box);

    if (input.style.highlight_color) highlight_object.color = input.style.highlight_color

    var root={}
    var colors=[]
    root.name='foo'
    root.children=[]
    var dataMaxTextWidth=0

    for(var chart in dataset.charts){
        var subroot={}
        subroot.name=dataset.charts[chart].chart
        subroot.children=[]
        for (var date in dataset.charts[0].data){
            subroot.children.push({name:dataset.charts[chart].chart,size:dataset.charts[chart].data[date].real,
                 for_print:dataset.charts[chart].data[date].for_print, date:date})
            colors.push(input.style.element_fill[chart%input.style.element_fill.length])
            dataMaxTextWidth = Math.max(dataMaxTextWidth, getTextWidth(dataset.charts[chart].chart, input.style.font_size))
        }
        root.children.push(subroot)
    }
    _add_graph(input,input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,root,colors)


    function _add_graph(input,svg,x,y,width,height,root,colors) {

        var cluster = d3.layout.cluster()
            .size([height, width-dataMaxTextWidth*2]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        var svg = svg.append("svg")
            .attr("x", x)
            .attr("y", y)
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(0,0)");


        var nodes = cluster.nodes(root),
          links = cluster.links(nodes);

        var link = svg.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("fill","none")
          .attr("stroke",input.style.connections_color)
          .attr("stroke-width",input.style.connections_width)
          .attr("class", "link")
          .attr("transform","translate("+dataMaxTextWidth+",0)")
          .attr("d", diagonal);

        var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + (d.y + dataMaxTextWidth) + "," + d.x + ")"; })

        node.append("circle")
        .attr("stroke",input.style.circles_stroke_color)
        .attr("stroke-width",input.style.circles_stroke_width)
        .attr('fill',input.style.circles_fill_color)
        .attr("r", input.style.circles_radius);

        node.append("text")
          .attr("dx", function(d) { return d.children ? -8 : 8; })
          .attr("dy", 3)
          
          .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
          .text(function(d) { return d.name; });


        d3.select(self.frameElement).style("height", height + "px");
    }
}
