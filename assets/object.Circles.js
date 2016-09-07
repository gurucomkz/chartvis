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

function SVGCirclesDrawer(input){
    var default_style={
        date_format: 	    [ 'string', '%Y/%m' ],
        element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],
        highlight_values:   ['string',''], //max,min,all обводит жирным указанные значения
        highlight_dates:    ['string',''], //max,min,all обводит жирным указанные значения
        highlight_color:    ['string',''], //меняет цвет выделенного текста
        show_values:        ['bool',true],
        show_dates:         ['bool',true],


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
    for(var chart in dataset.charts){
        var subroot={}
        subroot.name=dataset.charts[chart].chart
        subroot.children=[]
        for (var date in dataset.charts[0].data){
            subroot.children.push({name:dataset.charts[chart].chart,size:dataset.charts[chart].data[date].real,
                 for_print:dataset.charts[chart].data[date].for_print, date:date})
            colors.push(input.style.element_fill[chart%input.style.element_fill.length])
        }
        root.children.push(subroot)
    }
    _add_graph(input,input.svg,input.plot_box.x,input.plot_box.y,input.plot_box.width,input.plot_box.height,root,colors)
}

function _add_graph(input,svg,x,y,width,height,root,colors) {

    var format = d3.format(",d")

    var bubble = d3.layout.pack()
        .sort(null)
        .size([width, height])
        .padding(1.5);

    var svg = svg.append("svg")
        .attr("x", x)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height)
        .attr("class", "bubble");

      var node = svg.selectAll(".node")
          .data(bubble.nodes(classes(root))
          .filter(function(d) { return !d.children; }))
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

          var I=0
      node.append("circle")
          .attr("r", function(d) { return d.r; })
          .style("fill", function(d) {
              return colors[I++]; });

      node.append("text")
          .attr("dy", (input.style.show_dates && input.style.show_values)? "1.3em" : "0.3em")
          .attr("text-anchor", "middle")
          .attr("font-family", input.style.font_family )
          .attr("font-size", input.style.font_size )
          .attr("font-weight", input.style.font_weight)
          .attr('fill',function(d){
              if (input.style.highlight_values){
                  return highlight_object[input.style.highlight_values](d,input)
              }
              return ''
          })
          .attr('stroke', function(d){
              if (input.style.highlight_values){
                  return highlight_object[input.style.highlight_values](d,input)
              }
              return ''
          })
          .text(function(d) { return (input.style.show_values)? d.for_print.substring(0, 2*d.r/getTextWidth('1', input.style.font_size)) : ''; });

      node.append("text")
          .attr("dy", (input.style.show_dates && input.style.show_values)? "-.3em" : "0.3em")
          .attr("text-anchor", "middle")
          .attr("font-family", input.style.font_family )
          .attr("font-size", input.style.font_size )
          .attr("font-weight", input.style.font_weight)
          .attr('fill',function(d){
              if (input.style.highlight_dates){
                  return highlight_object[input.style.highlight_dates](d,input)
              }
              return ''
          })
          .attr('stroke', function(d){
              if (input.style.highlight_dates){
                  return highlight_object[input.style.highlight_dates](d,input)
              }
              return ''
          })
          .text(function(d) { return (input.style.show_dates)? d.date.substring(0, 2*d.r/getTextWidth('1', input.style.font_size)): ''; });

    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(root) {
      var classes = [];

      function recurse(name, node) {
        if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
        else {
    		var d = new Date(node.date)
    		node.date_fmt = d.strftime
    							? d.strftime(input.style.date_format)
    							: node.date.substr(8,2)+"."+node.date.substr(5,2)+"."+node.date.substr(0,4);

            classes.push({packageName: name, className: node.name, value: node.size, for_print:node.for_print, date:node.date_fmt});
        }
      }

      recurse(null, root);
      return {children: classes};
    }

    d3.select(self.frameElement).style("height", height + "px");
}
