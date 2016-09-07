function SVGTableDrawer (input){

	var targetSelector = typeof input.targetSelector == 'string'
		?	d3.select(input.targetSelector)
		:	input.targetSelector,
	emptyStyle = !input.style || isObjectEmpty(input.style);

	if(!input.tplServer)
		input.tplServer ='http://localhost:8080';

	var default_style ={

	}


// Prepare values

	input.x = input.x || 0;
	input.y = input.y || 0;
	input.height = input.height || 100;
	input.width = input.width || 100;

	SVGBorderDrawer(input);

	var dataset = input.dataset || {};
	if(dataset.table)
		dataset = dataset.table;

	var style = extend(default_style, (input.style || {}));


	var presets = {},
		sizes = []

	var svg = targetSelector.append("svg")
				.attr("x",input.x)
				.attr("y",input.y)
				.attr("width", input.width)
				.attr("height", input.height)

	$(svg[0][0]).append(render(input.x, input.y, input.width, input.height))

	function  render(newX, newY, width, height)
	{
        newX = parseFloat(newX);
        newY = parseFloat(newY);
		_set_styles()
		_create_sizes()

        var basicHeight = 1,
			basicWidth = 1;
		for(var row in sizes)
			basicHeight += sizes[row][0][3]+1

        for(var col in sizes[0])
			basicWidth += sizes[0][col][2]+1

		if(!+width) width = 100;
		if(!+height) height = 100;

        var newWidth = width / basicWidth,
			newHeight = height / basicHeight,
			transformRatio = newWidth*basicHeight < height ? newWidth : newHeight;

        return format('<svg> <g transform="scale({2})" w="{3}" h="{4}" nw="{6}" nh="{7}">{5}</g></svg>',
						newX, newY, transformRatio, width, height, _set_table(), basicWidth, basicHeight)
	}

	function _set_table()
	{
        var result =''
        sheetContent = dataset['sheets']['Sheet1']

        sheet =sheetContent.data.dataTable
        rows = sheet.length
        cols = sheet[0].length
        for(var I in sheetContent.spans)
		{
            v = sheetContent.spans[I]
			try{
	            if(typeof sheet[v.row][v.col].style == 'string')
					style = presets[sheet[v.row][v.col].style]
				else
	                style = sheet[v.row][v.col].style
			}catch(e){
				style = {}
			}
			
            v.row = parseInt(v.row)
            v.col = parseInt(v.col)
            v.rowCount = parseInt(v.rowCount)
            v.colCount = parseInt(v.colCount)
            spanX = sizes[v.row][v.col][0]
            spanY = sizes[v.row][v.col][1]
            var spanWidth = v.colCount
            var spanHeight = v.rowCount - 1
            for(var col = v.col; col < v.colCount+v.col; col++)
                spanWidth += sizes[0][col][2]

            for(var row = v.row; row < v.rowCount+v.row; row++)
                spanHeight += sizes[row][0][3]

            if(sheet[v.row][v.col].value)
			{
                values = sheet[v.row][v.col].value.split("\n")
                if(values.length == 1)
                    values = sheet[v.row][v.col].value
            }else
                values = ''

            result += _draw_cell(spanX, spanY, spanWidth-1, spanHeight, style, values, v.row, v.col)
		}

        for(rowName in sheet)
		{
            row = sheet[rowName]
            for(var cellName in row)
			{
                var cell = row[cellName],
					values = '',
                 	draw = true
                for(var spanName in sheetContent.spans)
				{
                    span = sheetContent.spans[spanName]
                    if(rowName >= span.row && rowName <= (span.rowCount-1+span.row))
                        if(cellName >=span.col && cellName <= (span.colCount-1+span.col))
                            draw = false
                }
				if(!draw)
					continue

                if(!cell.style)
				{
                    style ={'font':"normal 12px Calibri",'vAlign':1,'hAlign':0}
                    cell.style =style
				}
                if(typeof cell.style !== 'string')
                    style = cell.style
                else
					style = presets[cell.style]
                cellX = sizes[rowName][cellName][0]
                cellY = sizes[rowName][cellName][1]
                cellWidth = sizes[rowName][cellName][2]
                cellHeight = sizes[rowName][cellName][3]

                if(cell.value)
                {
					values = cell.value.split("\n")
                    if(values.length == 1)
                        values = cell.value
                }

                result += _draw_cell(cellX, cellY, cellWidth, cellHeight, style, values, rowName, cellName)
			}
		}
		return result;
	}

	function _create_sizes()
	{

        sizes = []
        var rows = 0,
			cols = 0,
			sheetContent = dataset['sheets']['Sheet1'];

        for(var I in sheetContent.data.dataTable)
		{
			var l = propsCount(sheetContent.data.dataTable[I])
            cols = Math.max(l,cols)
			rows++
		}
        var curY =1.0
        for(var row = 0; row<rows; row++)
		{
            row_height = .0
            if(sheetContent.rows)
                if(sheetContent.rows[row] && sheetContent.rows[row].size)
                    row_height = parseFloat(sheetContent.rows[row].size)

            if (row_height == 0)
			{
                for(var col = 0; col <cols; col++)
				{
					var style, RC = sheetContent.data.dataTable[row][col];

                    if(!sheetContent.data.dataTable[row][col])
                        sheetContent.data.dataTable[row][col] = {"value":""}

					RC = sheetContent.data.dataTable[row][col]

                    if(!RC.style || typeof RC.style == 'string' && !presets[RC.style])
                    {
						style = RC.style = {'font':"normal 12px Calibri"}
                    }
					else
					if(typeof RC.style == 'string'){
                        style = presets[RC.style]
					}
					else
					{
                        style = RC.style
                        if(style.name && presets[style.name])
							style = extend(style, presets[style.name])
					}

                    var cell_font = parseFont(style.font);

                    if(row_height < parseFloat(cell_font.size)*4/3 )
                        row_height = parseFloat(cell_font.size)*4/3
				}
			}

            var curX =1.0,
				subsizes = [];
            for(var col = 0; col < cols; col++)
			{
                col_width = 80.0
                if(sheetContent.columns)
                    try{
                        colWidth = sheetContent.columns[col]
                        if(colWidth && colWidth.size)
                            col_width = parseFloat(colWidth.size)
                    }catch(e){}

					subsizes.push([curX, curY, col_width, row_height])
                curX += col_width+1
			}
            curY += row_height+1
            sizes.push(subsizes)
		}
	}

	function _draw_cell(cellX, cellY, cellWidth, cellHeight, cellStyle, values, row, col)
	{
		var result = '';
        if(cellStyle.backColor)
            result += format(' <rect x ="{0}" y ="{1}" width ="{2}" height ="{3}" fill ="{4}" cc="{5}x{6}"/>\n',
								cellX,cellY,
								cellWidth,cellHeight,
								cellStyle.backColor, row, col)
		if (cellStyle.borderLeft)
			result += format(' <line x1 ="{0}" y1 ="{1}" x2 ="{2}" y2 ="{3}" stroke ="{4}" cc="{5}x{6}"/>\n',
								cellX-0.5,cellY-1,
								cellX-0.5,cellY+cellHeight+0.5*(!!cellStyle.borderBottom),
								cellStyle.borderLeft.color, row, col)

		if(cellStyle.borderTop)
			result += format(' <line x1 ="{0}" y1 ="{1}" x2 ="{2}" y2 ="{3}" stroke ="{4}" cc="{5}x{6}"/>\n',
								cellX - 0.5*(!cellStyle.borderLeft),cellY - 0.5,
								cellX+cellWidth + 0.5*(!cellStyle.borderRight),cellY-0.5,
								cellStyle.borderTop.color, row, col)

		if(cellStyle.borderRight)
			result += format(' <line x1 ="{0}" y1 ="{1}" x2 ="{2}" y2 ="{3}" stroke ="{4}" cc="{5}x{6}"/>\n',
								cellX+cellWidth+0.5,cellY-0.5,
								cellX+cellWidth+0.5,cellY+cellHeight+0.5*(!!cellStyle.borderBottom),
								cellStyle.borderRight.color, row, col)

		if(cellStyle.borderBottom)
			result += format(' <line x1 ="{0}" y1 ="{1}" x2 ="{2}" y2 ="{3}" stroke ="{4}" cc="{5}x{6}"/>\n',
								cellX- 1*(!!cellStyle.borderLeft),cellY+cellHeight+0.5,
								cellX+cellWidth+ 0.5*(!cellStyle.borderRight),cellY+cellHeight+0.5,
								cellStyle.borderBottom.color, row, col)


        var color = cellStyle.foreColor || "#000000",
			vAlign = +cellStyle.vAlign,
			hAlign = +cellStyle.hAlign,
        	font = parseFont(cellStyle.font),
			anchor,
			textY,
			textX

        switch(vAlign)
		{
        case 1:
			textY = cellY+(cellHeight-1)/2+font.size/2; break;
        case 2:
			textY =cellY+cellHeight-font.size/6; break;
		default:
			textY = cellY+(font.size*7/6)
		}

		switch(hAlign)
		{
        case 1:
            textX =cellX+(cellWidth-1)/2
            anchor ='middle'
			break;
        case 2:
            textX =cellX+cellWidth-font.size/6
            anchor ='end'
			break;
        default:
            textX =cellX+font.size*1/6
            anchor ='start'
		}
        if(values.length>1 && Array.prototype.isPrototypeOf(values))
		{
            for(val in values)
			{
                switch(vAlign)
				{

                case 1:
					shift = !(values.length % 2) ? font.size/2 : 0;
                    tempTextY =textY+(font.size*(7/6)*(val-values.length/2))+shift

					break;
                case 2:
                    tempTextY =textY-(font.size*(7/6)*(values.length-(val+1)))
                	break;
				default:
					tempTextY =textY+font.size*(7/6)*val

				}
				result += format('<text x="{0}" y="{1}" font-size="{2}" font-family="{3}" font-style="{4}" font-weight="{5}" fill="{6}" text-anchor="{7}">{8}</text>\n',
								textX, tempTextY, font.size, font.name,
								font.style, font.weight, color, anchor, values[val])
			}
        }else{
			result += format('<text x="{0}" y="{1}" font-size="{2}" font-family="{3}" font-style="{4}" font-weight="{5}" fill="{6}" text-anchor="{7}">{8}</text>\n',
							textX, textY, font.size, font.name,
							font.style, font.weight, color, anchor,values)
		}
		return result;
	}

	function _set_styles(self)
	{
        if(!dataset || !dataset.sheets || !dataset.sheets.Sheet1 || !dataset.sheets.Sheet1.namedStyles)
			return;
		var ns = dataset.sheets.Sheet1.namedStyles
        for(var I in ns)
		{
            name = ns[I]['name']
			presets[name] = extend( presets[name] || {}, ns[I] )
		}
	}

}
