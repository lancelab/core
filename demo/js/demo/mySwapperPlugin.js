/* eslint-env browser */

'use strict';

module.exports = ( function() {

    'use strict'

    //=======================================
    // //\\ configuration and local variables
    //=======================================
    var ccc = window.console && window.console.log;
    var hypergridWrap,
        clipCanvas,
        clipCtx,
        clipStyle,
        grid,
        downloadDataIncrment = 1000;

    //test control sugar through URL-query: ?lim=NNNN
    var match = (location.search || '' ).match( /(?:\?|&)lim=(\d+)/i );
        match = match && parseInt(match[1]);
    downloadDataIncrment = match && match<downloadDataIncrment ? match : downloadDataIncrment;

    var LIMIT = 80000;
    var LIMIT = 50000;
    var LIMIT = match || 800;
    var downloadedIdStart,
        downloadedIdEnd=0,
        totallyDownloaded = 0;

    var SERVER = 'http://localhost/bwork/hypergrid/test/material/do-query-database.php';
    var SERVER = 'data/fg-data.json';
    var SERVER = 'data/fg-small.json';
    //var SERVER = 'data/none';
    configureGlobalCss();
    //=======================================
    // \\// configuration and local variables
    //=======================================





    //===================================
    // //\\ chunkified data download
    //===================================
    //var stashedData = { data: [] };
    function downloadNextDataChunk(ajy) {
        //ccc( ajy.xml.responseText );
        try{
            var response = JSON.parse(ajy.xml.responseText);
        } catch (error) {
            displayStatus( 'ajax/JSON/server error ... ', error );
            return;
        }
        if( !Array.isArray(response) ) {
            //completeGridAfterFirstDataChunk(stashedData.data);
            displayStatus( response );
            return;
        }
        if(downloadedIdStart===0) {
            completeGridAfterFirstDataChunk(response);
        } else {
            var rows = response;
            var counter = 0;
            //stashedData.data = stashedData.data.concat( rows );
            rows.forEach( function( row ) {
                //appar behav. exists only after first data population
                grid.behavior.dataModel.dataSource.data.push(row);
            })
        }
        totallyDownloaded += response.length;
        displayStatus( 'totallyDownloaded=' + totallyDownloaded );
        downloadedIdStart = downloadedIdEnd;
        downloadedIdEnd = downloadedIdEnd + downloadDataIncrment;
        var url = SERVER + '?id_start=' + downloadedIdStart + '&id_end=' + downloadedIdEnd;
        if(totallyDownloaded>=LIMIT-1) {
            //completeGridAfterFirstDataChunk(stashedData.data);
            //delete stashedData.data;
            return;
        }
   		ajy.send200( 
            url,
            'get',
            downloadNextDataChunk
        );
    }

    function completeGridAfterFirstDataChunk(response)
    {
        grid.setData(response);
        grid.addProperties({
            foregroundSelectionFont: '13px Tahoma, Geneva, sans-serif',
            backgroundColor: 'white',
            columnClip: false,
            editor: 'textfield'
        });
        activateListeners();
    }

    function activateListeners()
    {
        grid.addEventListener( 'fin-mousedown', finMouseDown );
        hypergridWrap.addEventListener( 'mousemove', mouseMove );
        document.body.addEventListener( 'mouseup', mouseUp );
    }
    //===================================
    // \\// chunkified data download
    //===================================



    //=================================================
    // //\\ alternative internally generated test data
    //=================================================
    function generateRandomData () {
        var data =
        [
            {game:"River", score:1000, player:'Bim'},
            {game:"Forest", score:1000, player:'Tim'},
            {game:"Rock", score:1000, player:'Kim'},
            {game:"Valley", score:1000, player:'Lim'},
            {game:"Shore", score:1000, player:'Him'}
        ];
        for( var ii=0; ii<5; ii++ ) {
            data = data.concat( data );
        }
        return data;
    }
    //=================================================
    // \\// alternative internally generated test data
    //=================================================


    //===================================
    // //\\ plugin Constructor singleton
    //===================================
    var self = null; //enforces singleton
    var MySwapperPlugin = window.MySwapperPlugin = function (grid_)
    {
        if( self ) return self; //singleton
        var self = this;
        grid = grid_;

        // //\\ making aux. canvas
        clipCanvas = document.createElement('canvas');
        clipCanvas.setAttribute('class', 'drag-clip');
        hypergridWrap = document.getElementById( 'hypergrid-wrap' );
        hypergridWrap.appendChild(clipCanvas);
        //fails: no 3d ... why? ... grid.div.appendChild(clipCanvas);

        clipCtx=clipCanvas.getContext('2d');
        clipStyle = clipCanvas.style;
        var gst = grid.div.style;
        // \\// making aux. canvas

        this.grid = grid;
        if( window.standaloneMySwapPlugin ) {
            this.data = generateRandomData();
            //grid.setData(this.data);
            downloadedIdStart = 0;
            downloadedIdEnd = downloadDataIncrment;
            var url = SERVER + '?id_start=' + downloadedIdStart + '&id_end=' + downloadedIdEnd;
       		ajy.send200(
                url,
                'get',
                downloadNextDataChunk
            );
        } else {
            activateListeners();
        }
    }
    MySwapperPlugin.prototype = {
        $$CLASS_NAME: 'myswapperplugin',
        constructor: MySwapperPlugin
    };
    //===================================
    // \\// plugin Constructor singleton
    //===================================







    //===================================
    // //\\ mouse handlers
    //===================================
    var startColumnIx = null;
    var currentColumnIx;
    var currentDragPosition = null;
    var startColor;
    var startDragX;
    var visibleCols;
    function finMouseDown( event )
    {
        var originalEvent = event.detail.primitiveEvent.primitiveEvent.detail.primitiveEvent;
        //ccc( originalEvent, originalEvent.button );
        var columnIx = event.detail.gridCell.x;
        if( typeof originalEvent.button === 'undefined' || originalEvent.button !== 0 || event.detail.gridCell.y !== 0 || columnIx < 0 ) {
            return;
        }
        if( startColumnIx === null ) {

            startDragX = originalEvent.x;
            startColumnIx = columnIx;

            var pcol = grid.behavior.columns[columnIx];
            var props = pcol.properties;
            startColor = props.backgroundColor;

            //.hg changes this array, grid.renderer.visibleColumns, during the move ... an API surprise ...
            //let's stash it in visibleCols
            visibleCols = grid.renderer.visibleColumns.slice();

            var visibleCol = visibleCols[columnIx];
            var canvCtx = grid.canvas.gc;
            var width = visibleCol.width;
            var height = canvCtx.canvas.height;
            var left = visibleCol.left;

            var clipData = canvCtx.getImageData( left, 0, width, height );

            clipCanvas.width = width;
            clipCanvas.height = height;
            clipCtx.putImageData( clipData, 0, 0 );

            clipStyle.left = startDragX + 'px';
            clipCanvas.setAttribute('class', 'drag-clip activated');

            cloneColumnTwins();
        }
    }


    function mouseMove( event ) 
    {
        if( startColumnIx !== null ) {
            var pos = event.clientX;
            ///tod? to forum ... they change ... why?: var cols = grid.renderer.visibleColumns;
            ///estimates column for replacement
            var selCix=null;
            visibleCols.forEach( function( col, cix ) {
                var vcLeft = col.left;
                var vcRight = col.right;
                //c cc( ' pos=' + cix + ' left=' + vcLeft +  ' ' + vcRight );
                if( pos >= vcLeft && pos <= vcRight ) {
                    selCix = cix;
                }
            });
            if( selCix !== null ) {
                currentDragPosition = pos;
                clipStyle.left = pos + 'px';
                if(currentColumnIx !== selCix) {
                     //makeDragInTwins(); //todo ... why breaks here
                }
                currentColumnIx = selCix;
            }
            makeDragInTwins();
        }
    }

    function mouseUp() 
    {
        if( startColumnIx !== null && currentDragPosition !== null ) {
            currentDragPosition = null;
            finalizeColumnMove();
        }
    }
    //===================================
    // \\// mouse handlers
    //===================================





    //===================================
    // //\\ drag in View Model
    //===================================
    var twinColumns;
    var twinColumnsOriginal;
    function cloneColumnTwins()
    {
        twinColumns = grid.renderer.visibleColumns.map( function( visibleCol, cix ) {
            var canvCtx = grid.canvas.gc;
            var width = visibleCol.width;
            var height = canvCtx.canvas.height;
            var left = visibleCol.left;
            if( twinCanvas ) {
                var twinCanvas = twinColumns[cix];
            } else {
                var twinCanvas = document.createElement('canvas');
                hypergridWrap.appendChild(twinCanvas);
            }
            var twinCtx=twinCanvas.getContext('2d');
            var twinData = canvCtx.getImageData( left, 0, width, height );

            twinCanvas.width = width;
            twinCanvas.height = height;
            twinCtx.putImageData( twinData, 0, 0 );
            twinCanvas.style.left = left + 'px';
            twinCanvas.setAttribute('class', 'fg-twin-col');
            var twin = { left:left, width:width, ctx:twinCtx, canvas:twinCanvas, visibleCol:visibleCol, cix:cix };
            return twin;
        });
        var currTwin=twinColumns[startColumnIx];
        currTwin.ctx.fillStyle="#aaaaaa";
        currTwin.ctx.fillRect(0,0, currTwin.canvas.width,currTwin.canvas.height);

        //.keeps original copy to be used in drag display animation
        twinColumnsOriginal = twinColumns.slice();
        setTimeout( function() {
                startOrEndTwinScenario('start');
            },
            1
        );
    }

    var proposedDragInTwinsLeft=null;
    function makeDragInTwins()
    {
        twinColumns = twinColumnsOriginal.slice();
        var cols = twinColumns;
        //c cc( 'grid.behavior.columns=', grid.behavior.columns ); //f.e. 157 as in test
        var dragEndIx = currentColumnIx;
        var dragStartIx = startColumnIx;
        var columnStart = cols[dragStartIx];

        ///moves N-1 columns
        var direction = dragEndIx < dragStartIx ? -1 : 1;
        for( var ix=dragStartIx; ix!==dragEndIx; ix+=direction ) {
            cols[ix] = cols[ix+direction];
        }
        //moves 1 column
        cols[dragEndIx] = columnStart;

        //makes shifts
        var left = twinColumnsOriginal[0].left;
        cols.forEach( function( col, ix ) {
            col.canvas.style.left = left + 'px';
            if( ix===dragEndIx ) {
                proposedDragInTwinsLeft = left;
            }
            left += col.canvas.width;
        });
    }
    //===================================
    // \\// drag in View Model
    //===================================



    //===================================
    // //\\ drags in Data Model
    //===================================
    function finalizeColumnMove()
    {
        makeDragInDataModel();
        startOrEndTwinScenario(!'start');
        currentDragPosition = null
        startColumnIx = null;
    }

    function makeDragInDataModel()
    {
        if( currentColumnIx !== startColumnIx ) {
            var cols = grid.behavior.columns;
            //c cc( 'grid.behavior.columns=', grid.behavior.columns ); //f.e. 157 as in test
            var dragEndIx = visibleCols[currentColumnIx].columnIndex;
            var dragStartIx = visibleCols[startColumnIx].columnIndex;
            var columnStart = cols[dragStartIx];

            ///moves N-1 columns
            var direction = dragEndIx < dragStartIx ? -1 : 1;
            for( var ix=dragStartIx; ix!==dragEndIx; ix+=direction ) {
                cols[ix] = cols[ix+direction];
            }
            //moves 1 column
            cols[dragEndIx] = columnStart;
            grid.behavior.changed();
            grid.repaint();
       }
    }

    function startOrEndTwinScenario( start_or_end )
    {
        if( start_or_end === 'start' ) {
            hypergridWrap.setAttribute('class', 'fg-drag-activated');
            grid.canvas.gc.canvas.style.visibility = 'hidden'; 

        } else {
            //:starts css-animation to final strip-hole position
            clipCanvas.setAttribute('class', 'drag-clip');
            if( proposedDragInTwinsLeft !== null ) {
                clipCanvas.style.left = proposedDragInTwinsLeft + 'px';
                proposedDragInTwinsLeft = null;
            }
            hypergridWrap.setAttribute('class', '');
            grid.canvas.gc.canvas.style.visibility = 'visible'; //todo ... overkill

            ///discards twins ... every resize of window
            ///will have own twins
            if( twinColumns ) { //todo overkill
                var tmpTwinColumns = twinColumns;
                twinColumns = null;
                setTimeout( function() {
                        tmpTwinColumns.forEach( function( twin, cix ) {
                            twin.canvas.remove();
                            delete twin.canvas;
                        });
                    },
                    500
                );
            }
        }
    }
    //===================================
    // \\// drags in Data Model
    //===================================





    //=====================================
    // //\\ custom ajax to load data
    //=====================================
    //  original from: /var/www/html/bids/e.../f...-parts/94afternoon-ch-game-put-on-hold.zip
    var ajy = {};
	( function () {

		var xml = null;

		( function () {
			if( typeof XMLHttpRequest !== 'undefined' )
			{
				xml = new XMLHttpRequest();
                /*
                //todo ... is this just a quirk from the past? 
				if( xml.overrideMimeType )
				{
                    xml.overrideMimeType("text/plain; charset=x-user-defined");
					//xml.overrideMimeType('text/xml'); //for quirky FF or FireBug.
				}
                */
			} else {
				try { xml = new ActivXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try { xml = new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) { 
						throw "Cannot find ajax in this browser";
    				}
   				}
			}
		}) ();
		ajy.xml = xml;


		///	Sets, sends, and digests response if status is 200
		//	Input:	first three pars are as in xml.open('GET', 'http://localhost/ajy_feedback.txt', true);
		//			"true" stands for => asyn
		//			onchange	can be used to check xml.state and take xml.responseText,
		//						is suppied ajy itself as a parameter.

		ajy.send200 = function ( aurl, method, onchange )
		{
			//	c onsole.log( aurl, method, onchange );
			var flag = true;
			method = method || 'GET';

			var onchangeWrap = function ( ajy ) 
			{
				var xml = ajy.xml;
				if ( xml.readyState === 4 ) 
				{
					var resp = xml.responseText;
					if( xml.status === 200 )
					{
						onchange( ajy );
					}else{
						//console.log('Test1. Problem.');
					}
				}
			};
			var request = function () 
			{
				try { 
					xml.open( method, aurl, flag );  
					//	c onsole.log('setting "send" for ajy ' + ' method='+method+" aurl="+aurl+" flag="+flag);

                    //https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
                    //XMLHttpRequest.setRequestHeader(header, value)
                    xml.setRequestHeader('Content-Type', 'application/json'); //todo move to application
                    //xml.setRequestHeader("Content-Type", oData.contentType);


					xml.send( null );
				} catch ( e ) {	//	TODM
					//Give up.
					//xml.send(null);
				}
			};
			xml.onreadystatechange = function() { onchangeWrap( ajy ); };
			request();
		};    

	}) ();
    //=====================================
    // \\// custom ajax to load data
    //=====================================

    function displayStatus( text )
    {
       var status = document.getElementById('fb-status');
       status && ( status.textContent = text );
    }

    function configureGlobalCss()
    {
        var css =
        [
            "        #hypergrid-wrap {",
            "           position:relative;",
            "           perspective:2000px;",
            "           transform-style:preserve-3d;",
            "           perspective-origin:225px 225px;",
            "        }",
            "",
            "        #hypergrid-wrap #json-example {",
            "             transform: translate3d(0px,0px,0px);",
            "             transition: transform 1s ease;",
            "        }",
            "",
            "        /* moves actual grid far to scene background */",
            "        #hypergrid-wrap.fg-drag-activated #json-example {",
            "             transform: translate3d(0px,0px,-50px);",
            "             transition: transform 1.5s ease;",
            "        }",
            "",
            "        /* //\\ drag clip */",
            "        .drag-clip {",
            "             /* clip-column returns to final stip-hole */",
            "             position:absolute;",
            "             top:0px;",
            "             transform: translate3d(0px,0px,-2px);",
            "             transition: transform 0.5s ease, left 1s ease;",
            "        }",
            "        .drag-clip.activated {",
            "            /* clip-column raises above grid to start drag */",
            "            display:inline-block;",
            "            transform: translate3d(0px,0px,60px) rotateY(-60deg);",
            "            transition: transform 0.3s ease;",
            "            transform-origin:0px 0px 0px;",
            "        }",
            "        /* \\// drag clip */",
            "",
            "",
            "        /* //\\ twin column */",
            "        .fg-twin-col {",
            "             position:absolute;",
            "             top:0px;",
            "             transform: translate3d(0px,0px,-10px);",
            "             transition: transform 0.5s ease;",
            "        }",
            "        #hypergrid-wrap.fg-drag-activated .fg-twin-col {",
            "            transform: translate3d(0px,0px,-5px);",
            "            transition: transform 0.5s ease;",
            "            transform-origin:0px 0px 0px;",
            "        }",
            "        /* \\// twin column */"
        ].join('\n');

        var globalStyle = document.createElement( 'style' );
        document.head.appendChild( globalStyle );
        globalStyle.textContent = css;
    }
    return MySwapperPlugin;

})();

