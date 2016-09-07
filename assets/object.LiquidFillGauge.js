/*!
 * @license Open source under BSD 2-clause (http://choosealicense.com/licenses/bsd-2-clause/)
 * Copyright (c) 2015, Curtis Bratton
 * All rights reserved.
 */
function SVGLiquidFillGaugeDrawer(input){
    var default_style={
        edge_indent:        ['string', '5%'],
        minValue:           ['int', 0], // The gauge minimum value.
        maxValue:           ['int', 100], // The gauge maximum value.
        circleThickness:    ['string', '5%'], // The outer circle thickness as a percentage of it's radius.
        circleFillGap:      ['string', '100%'], // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor:        [ 'string', "#000000"], // The color of the outer circle.
        waveHeight:         ['string', '10%'], // The wave height as a percentage of the radius of the wave circle.
        waveCount:          ['int', 2], // The number of full waves per width of the wave circle.
        waveHeightScaling:  ['bool', true], // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveColor:          [ 'string', "#178BCA"], // The color of the fill wave.
        waveOffset:         ['string', '0%'], // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition:   ['string', '50%'], // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize:           ['int', 1], // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp:       ['bool', true], // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent:     ['bool', true], // If true, a % symbol is displayed after the value.
        textColor:          [ 'string', "#000000"], // The color of the value text when the wave does not overlap it.
        waveTextColor:      [ 'string', "#ffffff"], // The color of the value text when the wave overlaps it.
        element_fill: 		[ 'array', ["steelblue","red","green","yellow","purple"] ],

    }

// Prepare values

    var dataset = input.dataset || {};

    input.style = extendDefaults(default_style, input.style);

    preparePars(input)

    //проверочный прямоугольник
    /*input.svg.append('rect')
                .attr('x',input.plot_box.x+1)
                .attr('y',input.plot_box.y+1)
                .attr('width',input.plot_box.width-2)
                .attr('height',input.plot_box.height-2)
                .attr('stroke','white')
                .attr('strike-width',1)
                .attr('fill','none')
    */
    input.plot_box.style = optionsByPrefix(input.style, 'plot_');
    input.plot_box.targetSelector = input.svg;

    var len=0
    for (var I=0;I<dataset.charts.length;I++ )
        for (var v in dataset.charts[I].data){
            len++
        }
    len =55
    var itemcolor = function(d,I){ return rrItemIn(I, input.style.element_fill)}

    var sub_bar_width=input.plot_box.width
    input.plot_box.style = optionsByPrefix(input.style, 'plot_');
    input.plot_box.targetSelector = input.svg;
    //поиск наиболее подходящего соотношения
    var res = create_optsizes(len,input.plot_box.width,input.plot_box.height)
    var available_width = res[0],
    available_height = res[1],
    rows = res[2],
    cols = res[3]
    temp_x = input.plot_box.x
    temp_y = input.plot_box.y

    //тест
    for (var I=0;I<rows;I++){
        for (var G=0;G<cols;G++){
            input.svg.append('g')
                        .attr('class','location_'+(G+cols*I))
                        .attr('x',temp_x)
                        .attr('y',temp_y)
                        .attr('width',available_width)
                        .attr('height',available_height)

            temp_x+=available_width
        }
        temp_x = input.plot_box.x
        temp_y+=available_height
    }
    var I=0
    for (var date in dataset.charts[0].data){
        var data =[]
        for(var chart in dataset.charts){
            input.style.waveColor=itemcolor(null,I)
            _add_graph(('location_' + I),dataset.charts[chart].data[date],input.style)
            I++
            //data.push({'name':dataset.charts[chart].chart,'value':, 'date': date})
        }
    }
}

function _add_graph(elementId, value, config) {
    if(config == null) config = input.style;

    var gauge = d3.select("." + elementId);
    var radius = Math.min(parseInt(gauge.attr("width")), parseInt(gauge.attr("height")))/2
    radius-=topc(config.edge_indent,radius);
    var locationX = parseFloat(gauge.attr("width"))/2 - radius + parseFloat(gauge.attr("x"));
    var locationY = parseFloat(gauge.attr("height"))/2 - radius + parseFloat(gauge.attr("y"));
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value.real))/config.maxValue;

    var waveHeightScale;
    if(config.waveHeightScaling){
        waveHeightScale = d3.scale.linear()
            .range([0,topc(config.waveHeight),0])
            .domain([0,50,100]);
    } else {
        waveHeightScale = d3.scale.linear()
            .range([topc(config.waveHeight),topc(config.waveHeight)])
            .domain([0,100]);
    }

    var textPixels = (config.textSize*radius/2);
    var textFinalValue = parseFloat(value.real).toFixed(2);
    var textStartValue = config.valueCountUp?config.minValue:textFinalValue;
    var percentText = config.displayPercent?"%":"";
    var circleThickness = topc(config.circleThickness,radius);
    var circleFillGap = topc(config.circleFillGap,radius);
    var fillCircleMargin = topc(config.circleThickness,circleFillGap);
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius*waveHeightScale(fillPercent*100);

    var waveLength = fillCircleRadius*2/config.waveCount;
    var waveClipCount = 1+config.waveCount;
    var waveClipWidth = waveLength*waveClipCount;

    // Data for building the clip wave area.
    var data = [];
    for(var i = 0; i <= 40*waveClipCount; i++){
        data.push({x: i/(40*waveClipCount), y: (i/(40))});
    }

    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0,2*Math.PI]).domain([0,1]);
    var gaugeCircleY = d3.scale.linear().range([0,radius]).domain([0,radius]);

    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0,waveClipWidth]).domain([0,1]);
    var waveScaleY = d3.scale.linear().range([0,waveHeight]).domain([0,1]);

    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
        // such that the it will won't overlap the fill circle at all when at 0%, and will totally cover the fill
        // circle at 100%.
        .range([(fillCircleMargin+fillCircleRadius*2+waveHeight),(fillCircleMargin-waveHeight)])
        .domain([0,1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth-fillCircleRadius*2]) // Push the clip area one full wave then snap back.
        .domain([0,1]);

    // Scale for controlling the position of the text within the gauge.
    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin+fillCircleRadius*2,(fillCircleMargin+textPixels*0.7)])
        .domain([0,1]);

    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform','translate('+locationX+','+locationY+')');

    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius-circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform','translate('+radius+','+radius+')');

    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text((value.for_print)? value.for_print + percentText : '-')
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(topc(config.textVertPosition))+')');

    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function(d) { return waveScaleX(d.x); } )
        .y0(function(d) { return waveScaleY(Math.sin(Math.PI*2*topc(config.waveOffset)*-1 + Math.PI*2*(1-config.waveCount) + d.y*2*Math.PI));} )
        .y1(function(d) { return (fillCircleRadius*2 + waveHeight); } );
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea);

    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);

    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text((value.for_print)? value.for_print + percentText : '-')
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform','translate('+radius+','+textRiseScaleY(topc(config.textVertPosition))+')');




    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin+fillCircleRadius*2-waveClipWidth;
        waveGroup.attr('transform','translate('+waveGroupXPosition+','+waveRiseScale(fillPercent)+')');
}
