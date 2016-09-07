var sys = require("sys"),
	phantom = require("node-phantom"),
	http = require('http'),
	server = http.createServer(handler),
	nstatic = require('node-static'),
	path = require("path"),
	url = require("url"),
	vow = require("vow"),
	pi, piErr,
	qs = require('querystring'),
	qss = require('qs'),
	tools = require('./lib/tools.js'),
	fs = require("fs"); // for serving files

var port = 8080;

var fileServer = new nstatic.Server('.', { cache: false });

var phantomOptions = {
	phantomPath : './node_modules/.bin/phantomjs',
	parameters:{
		'web-security': false,
//		"remote-debugger-port" :9000,
		'local-to-remote-url-access': true,
		'debug': true
		}
	};

phantom.create(
	function (err, instance) {
		if(instance) pi = instance;
		else piErr = err;
		console.log("PHANTOM CALLBACK")
	}
	,
	phantomOptions
);

setupProcessEvents();

server.listen(port);


// If the URL of the socket server is opened in a browser
function handler (request, response) {
	sys.puts("server handler");
	function errorResponse(err)
	{
		response.writeHeader(500, {"Content-Type": "text/plain"});
		response.write("REQUEST ERROR: " + err)
		response.end();
	}

	var POSTBody = '';
	if (request.method == 'POST') {
        request.on('data', function (data) {
			POSTBody += data;

            // Too much POST data, kill the connection!
            if (POSTBody.length > 1024*1024*1024*1024)
			{
            //    request.connection.destroy();
			}
        });
	}

    request.addListener('end', function () {

		var uri = url.parse(request.url).pathname;

		sys.puts("I got kicked + "+ uri);

		if(uri.match(/^\/assets\//)) //serve static files only from /assets/ dir
		{
			response.setHeader("Access-Control-Allow-Origin", "*");

        	fileServer.serve(request, response); // this will return the correct file
			return;
		}
		//now serve the request

		if(uri != '/svg')
		{
			response.writeHeader(200, {"Content-Type": "text/json"});
			response.write("Hello World "+ uri + " -- " + request.url);
			response.end();
			return;
		}

		if(!pi)
			return errorResponse("phantomjs not ready. check logs. ");

		var GET = url.parse(request.url, true).query,
			POST = qs.parse(POSTBody),
			requestParams = tools.extend(GET,POST);

		console.log("PARAMS = " + JSON.stringify(requestParams))

		var opts = {
				width: 1000,
				height: 500,
				page: null,
				requestParams: requestParams
			},
			dataSources = [];

		if(typeof requestParams.tofile == 'string' &&
			requestParams.tofile.match(/^png|gif|jpeg|pdf$/i))
			opts.renderToFile = requestParams.tofile.toUpperCase()

		var viewPort = { height: 1000, width: 1000 };

		if(requestParams.page)
		{
			try{
				opts.page = JSON.parse(requestParams.page);

				if(opts.page.properties.height )
					viewPort.height = opts.page.properties.height;

				if(opts.page.properties.width)
					viewPort.width = opts.page.properties.width;
				else if(opts.page.properties.aspectRatio)
					viewPort.width = viewPort.height * opts.page.properties.aspectRatio;
			}catch(e){
				return errorResponse("JSON Page parsing error: " + e);
			}
			dataSources = tools.collectDataSources(opts.page.objects || {})
		}else
		if(requestParams.obj)
		{
			try{
				opts.object = JSON.parse(requestParams.obj);
				viewPort.width = opts.object.width;
				viewPort.height = opts.object.height;
			}catch(e){
				return errorResponse("JSON Object parsing error: " + e);
			}
			dataSources = tools.collectDataSources(opts.object)
		}else
			return errorResponse("NOTHING TO DRAW");

		vow.when(null)
			.then(getData(dataSources))
			.done(
				function(datasets) //data got ok
				{
					opts.datasets = datasets;
					console.log("RESULT DATASET = " + JSON.stringify(datasets))
					pi.createPage(function (err, page) {
						sys.puts("create page error: " + err);
						vow.when(null)
							.then(pageSetViewport(page, viewPort))
							.then(pageSetPaperSize(page, {format: 'A4', orientation: 'portrait', margin: '1cm'}))
							.then(pageSetClipRect(page, {top:0,left:0,width:viewPort.width,height:viewPort.height}))
							.then(injectLib_(page, './assets/d3.js'))
							.then(injectLib_(page, './lib/strftime.js'))
							.then(injectLib_(page, './lib/tools.js'))
							.then(injectLib_(page, './lib/jquery.js'))
							.then(injectLib_(page, './lib/radar-chart.js'))
							.then(injectLib_(page, './assets/drawer.js'))
							.then(injectLib_(page, './assets/object.rect.js'))
							.then(injectLib_(page, './assets/object.Text.js'))
							.then(injectLib_(page, './assets/object.Notice.js'))
							.then(injectLib_(page, './assets/object.Drawing.js'))
							.then(injectLib_(page, './assets/object.Verbar.js'))
							.then(injectLib_(page, './assets/object.VerbarEqualized.js'))
							.then(injectLib_(page, './assets/object.Verbar3DEqualized.js'))
							.then(injectLib_(page, './assets/object.VerbarSepVertic.js'))
							.then(injectLib_(page, './assets/object.Verbar3DSepVertic.js'))
							.then(injectLib_(page, './assets/object.Horbar.js'))
							.then(injectLib_(page, './assets/object.Horbar3D.js'))
							.then(injectLib_(page, './assets/object.Radar.js'))
							.then(injectLib_(page, './assets/object.Map.js'))
							.then(injectLib_(page, './assets/object.Table.js'))
							.then(injectLib_(page, './assets/object.Legend.js'))
							.then(injectLib_(page, './assets/object.Line.js'))
							.then(injectLib_(page, './assets/object.Border.js'))
							.then(injectLib_(page, './assets/object.Stackedline.js'))
							.then(injectLib_(page, './assets/object.Stackedbar.js'))
							.then(injectLib_(page, './assets/object.Stackedbar3D.js'))
							.then(injectLib_(page, './assets/object.StackedHorbar.js'))
							.then(injectLib_(page, './assets/object.StackedHorbar3D.js'))
							.then(injectLib_(page, './assets/object.Pie.js'))
							.then(injectLib_(page, './assets/object.Pie3D.js'))
							.then(injectLib_(page, './assets/object.PieLegended.js'))
							.then(injectLib_(page, './assets/object.Area.js'))
							.then(injectLib_(page, './assets/object.Circles.js'))
							.then(injectLib_(page, './assets/object.LiquidFillGauge.js'))
							.then(injectLib_(page, './assets/object.Aster.js'))
							.then(injectLib_(page, './assets/object.ClusterV1.js'))
							.then(readCssStyles_("./assets/common.css"))
							.then(drawStruct(page, opts))
							.done(
								function(res){
									page.close();
									try{
										if(opts.renderToFile)
										{
											response.writeHeader(200, {"Content-Type": "text/plain"});
											response.write(''+res+'')
										}else
										{
											response.writeHeader(200, {"Content-Type": "image/svg+xml"});
											response.write('<?xml version="1.0" encoding="utf-8"?>\n'+res+'\n')
										}
									}catch(e){
										response.write(''+e)
									}
									response.end();
								},
								errorResponse)
					})
				},
				errorResponse
			)


    });

	//You need this line for it to work
    request.resume();
}

function pageSetPaperSize(page, params)
{
	return function()
	{
		var defer = vow.defer();
		page.set('paperSize', params, function(){
			defer.resolve()
		})

		return defer.promise();
	}
}

function pageSetViewport(page, params)
{
	return function()
	{
		var defer = vow.defer();
		page.set('viewportSize', params, function(){
			defer.resolve()
		})

		return defer.promise();
	}
}

function pageSetClipRect(page, params)
{
	return function()
	{
		var defer = vow.defer();
		page.set('clipRect', params, function(){
			defer.resolve()
		})

		return defer.promise();
	}
}

function drawStruct(page, data)
{
	return function(cssText){
		sys.puts("drawChart_");
		data.style = cssText;
		var defer = vow.defer()

		page.evaluate(
			function (data) {
				console.log("drawStruct evaluate");
				data = JSON.parse(data); //convert data back to object -- FIRST THING TO DO

				data.targetSelector = 'body'

				SVGDrawer(data, data.requestParams.width || 1000);
				return document.querySelector(data.targetSelector).innerHTML;
			},
			function(err,res)
			{
				console.log("drawStruct evaluate done with error=" + err + " and result = "+res);
				if(err)
					defer.reject("drawStruct phantomjs evaluation failed : " + err)
				else
				{
					if(!data.renderToFile)
						defer.resolve(''+res)
					else
					{
						var ext = data.renderToFile.toLowerCase(),
							tmpfname = tools.newUUID()+'.'+ext,
							MIMEmap = {
								'pdf': 'application/pdf',
								'jpeg': 'image/jpeg',
								'png': 'image/png',
								'gif': 'image/gif'
							};

						page.render(tmpfname, { format: data.renderToFile, quality: '100'}, function(e,r)
						{
							vow.when(null)
								.then(readBinaryFile(tmpfname))
								.done(
									function(res){
										fs.unlinkSync(tmpfname);
										defer.resolve('data:'+MIMEmap[ext]+';base64,'+res)
									},
									function(){
										defer.reject('page not rendered')
									}
								)
						})
					}
				}
			},
			JSON.stringify(data)
		);

		return defer.promise();
	}
}

// считываем стили из файла в буфер (строку)
function readCssStyles_(chartCss) {
	return function(){
		var defer = vow.defer();
		fs.readFile(chartCss, 'utf8', function (err,innerCss) {
			if (err) {
				sys.puts(chartCss + ": read failed, err: " + err);
				defer.reject(chartCss + ": read failed, err: " + err);
			} else {
				sys.puts(chartCss + " read");
				defer.resolve(innerCss);
			}
		});
		return defer.promise();
	}
}

// считываем стили из файла в буфер (строку)
function readBinaryFile(filePath) {
	return function(){
		var defer = vow.defer();
		fs.readFile(filePath, function (err,fileCnt) {
			if (err) {
				sys.puts(filePath + ": read failed, err: " + err);
				defer.reject(filePath + ": read failed, err: " + err);
			} else {
				sys.puts(filePath + " read");
				defer.resolve(new Buffer(fileCnt, 'binary').toString('base64'));
			}
		});
		return defer.promise();
	}
}

function injectLib_(page, path) {
	return function(){
		var defer = vow.defer();

		// этот вызов вставит скрипт в страницу, но не выполнит его до вызова page.evaluate
		page.injectJs(path, function (err) {
			if (err) {
				console.log(path + " injection failed")
				defer.reject(path + " injection failed");
			} else {
				console.log(path + " injected")
				defer.resolve();
			}
		});
		return defer.promise();
	}
}

function getData(dataSources)
{
	return function()
	{
		var defer = vow.defer(),
			result = {};

		var queue = vow.when(result);

		for(var x in dataSources)
		{
			console.log("QUEUEING FOR DATASET '"+x+"' = " + JSON.stringify(dataSources[x]))
			queue = queue.then(_goLoadDataset(dataSources[x], x))
		}

		queue.done(
			function(rrr){
				defer.resolve(rrr)
			},
			function(err){
				defer.reject("DATASERVER FAIL" + err);
			}
		)

		return defer.promise();
	}
}

function _goLoadDataset( linkdesc , id)
{
	return function (result)
	{
		var defer = vow.defer(),
			linkSplitter = new RegExp(/^(\w+)?:\/\/?([\w\.\d-]+)(.*)/)
		if(!result) result = {};
		if(!id) id = 0;
		result[id] = {};

	//	if(linkdesc.url.match(/\/{3}/))//ANTI-PYTHON
	//		linkdesc.url = linkdesc.url.replace(/\/\//g,'/')

		var linksplit = linkSplitter.exec(linkdesc.url)
		// http request
		var options = {
		  	host: linksplit[2],
		  	path: linksplit[3],
			port: linksplit[1]=='http'? 80 : 443,
			rejectUnauthorized: false,
      		requestCert: true,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				"Connection": "close"
			}
		},
		callback = function(response) {
			var str = ''
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function ()
			{
				console.log("DATASERVER RESPONSE = " + str);
				try{
					result[id] = JSON.parse(str)
				}catch(e){
					console.log("Dataset retrieval returned " + str)
				}
				defer.resolve(result);
			})
		},
		postData = {
			username: '****HARDCODED_USERNAME****',
			passwd: '****HARDCODED_PASSWORD****',
			dologin: 1,
			nullFill: 1,
			noZeroWrap: 1,
			asobjects: 1
		}
		for(var x in linkdesc)
			if(x!='url')
			postData[x] = linkdesc[x];

		var postDataString = qss.stringify(postData);
		options.headers['Content-Length'] = postDataString.length

		var req = http.request(options, callback)
		console.log("req inited")
		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
			defer.resolve();
		});

		req.write(postDataString);
		req.end();

		console.log("req written " + postDataString)

		return defer.promise();
	}
}

function killPhantom() {
	if(pi){
		try{
			pi.exit();
			pi = null;
		}catch(e){}
		sys.puts('Killed Phantom')
	}
}
function killMe()
{
	killPhantom();
	process.exit()
}

function setupProcessEvents()
{
	process.on('uncaughtException', function(err) {
		console.log('Caught exception: ' + err);
	});

	process.on('SIGHUP', killMe);
	process.on('SIGINT', killMe);
	process.on('SIGTERM', killMe);
	process.on('exit', killPhantom);
	process.on('beforeExit', killPhantom);
}
