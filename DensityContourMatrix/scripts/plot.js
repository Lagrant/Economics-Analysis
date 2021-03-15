var padding = 15;
var size = 160, bandSize = 6;
var margin = {left: 60, right: 60, top: 50, bottom: 50};
var width;
var height;

var setBandSize = function(plotID, _bandSize) {
    d3.select('#slider-value').text(_bandSize);
    if (d3.select(plotID).selectAll('*')[0].length === 0) {
        return;
    }
    bandSize = _bandSize;
    drawPlot(plotID);
}

var setBlockSize = function(plotID, blockSize) {
    d3.select('#block-value').text(blockSize);
    if (d3.select(plotID).selectAll('*')[0].length === 0) {
        return;
    }
    size = blockSize;
    var blocks = d3.keys(mtx[0]).length;
    height = width = blocks * size;
    d3.select('#vis')
        .style('width', (width + margin.left + margin.right) + 'px')
        .style('height', (height + margin.top + margin.bottom) + 'px');
    drawPlot(plotID);
}

var rotateXAxis = function(plotID, ob) {
    if (d3.select(plotID).selectAll('*')[0].length === 0) {
        return;
    }
    (ob.checked) ? d3.selectAll('.x').selectAll('text').attr('transform','rotate(45)').style('text-anchor', 'start') 
        : d3.selectAll('.x').selectAll('text').attr('transform','rotate(0)').style('text-anchor', 'center');
}

var rotateYAxis = function(plotID, ob) {
    if (d3.select(plotID).selectAll('*')[0].length === 0) {
        return;
    }
    (ob.checked) ? d3.selectAll('.y').selectAll('text').attr('transform','rotate(45)')
        : d3.selectAll('.y').selectAll('text').attr('transform','rotate(0)');
}

var drawPlot = function (plotID) {
    var div = d3.select(plotID);
    div.selectAll('*').remove();
    var cols = d3.keys(mtx[0]);
    // width = width - margin.left - margin.right;
    // height = height -margin.top - margin.bottom;

    var data = new Array(cols.length);
    for (let i = 0, len = cols.length; i < len; i++) {
        data[i] = new Array();
    }
    mtx.forEach(function (d) {
        cols.forEach(function (col, i) {
            data[i].push(d[col]);
        });
    });

    div.selectAll('*').remove();
    var svg = div.append('svg')
        .attr('width', width + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);
    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);
    
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(6)
        .orient('bottom');
    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(6)
        .orient('left');

    svg.selectAll('.x.axis')
        .data(data).enter()
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', (_, i) => { return 'translate(' + (cols.length - 1 - i) * size + ',' + height + ')'; })
        .each(function (d) {
            x.domain(d3.extent(d));
            d3.select(this).call(xAxis);
        });
    svg.selectAll('.y.axis')
        .data(data).enter()
        .append('g')
        .attr('class', 'y axis')
        .attr('transform', (_, i) => { return 'translate(0,' + i * size + ')'; })
        .each(function (d) {
            y.domain(d3.extent(d));
            d3.select(this).call(yAxis);
        });

    var cell = svg.append('g')
        .selectAll('g')
        .data(cross(cols, cols)).enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', (c) => { return 'translate(' + (cols.length - 1 - c.i) * size + ',' + c.j * size + ')' });
    
    cell.append('rect')
        .attr('fill', 'none')
        .attr('stroke', '#aaa')
        .attr('x', padding / 2 + 0.5)
        .attr('y', padding / 2 + 0.5)
        .attr('width', size - padding)
        .attr('height', size - padding);
    
    cell.each(function (c) {
        if (c.i === c.j) {
            return;
        }
        x.domain(d3.extent(data[c.i]));
        y.domain(d3.extent(data[c.j]));
        const contours = d3.contourDensity()
            .x((d) => { return x(d[cols[c.i]]); })
            .y((d) => { return y(d[cols[c.j]]); })
            .size([size - padding, size - padding])
            .bandwidth(bandSize)(mtx);
        
        var xy = extents(contours);
        xExt = d3.extent(xy.x);
        yExt = d3.extent(xy.y);
        rescaleContour(contours, xExt, yExt, [padding / 2, size - padding / 2], [size - padding / 2, padding / 2]);

        const color = d3.scaleSequential(d3.interpolateViridis)
            .domain(d3.extent(contours, (d) => { return d.value; }));
        
        d3.select(this)
            .append('g')
            .attr('class', 'contours')
            .selectAll('path')
            .data(contours).enter()
            .append('path')
            .attr('class', 'hex')
            .attr('d', d3.geoPath())
            .style('fill', (d) => { return color(d.value); });
    });

    svg.append("g")
        .style("font", "bold 15px sans-serif")
        .selectAll("text")
        .data(cols).enter()
        .append("text")
        .attr("transform", (_, i) => { return'translate(' + (cols.length - 1 - i) * size + ',' + i * size + ')'})
        .attr('text-anchor', 'center')
        .attr("x", 0)
        .attr("y", size / 2)
        .attr("dy", ".71em")
        .text((d) => { return d; });

    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = 0; i < n; i++) { 
            for (j = 0; j < m; j++) {
                c.push({x: a[i], i: i, y: b[j], j: j});
            }
        }
        return c;
    }

    function extents(coors) {
        var xExt = [], yExt = [];
        for (let i = 0; i < coors.length; i++) {
            if (coors[i] instanceof Array) {
                xy = extents(coors[i]);
                xExt = xExt.concat(xy.x);
                yExt = yExt.concat(xy.y);
            } else if (coors[i] instanceof Object) {
                xy = extents(coors[i].coordinates);
                xExt = xExt.concat(xy.x);
                yExt = yExt.concat(xy.y);
            } else {
                xExt.push(coors[0]);
                yExt.push(coors[1]);
                break;
            }
        }
        return {x: xExt, y: yExt};
    }
    function rescaleContour(coors, xExt, yExt, xRg, yRg) {
        for (let i = 0; i < coors.length; i++) {
            if (coors[i] instanceof Array) {
                rescaleContour(coors[i], xExt, yExt, xRg, yRg);
            } else if (coors[i] instanceof Object) {
                rescaleContour(coors[i].coordinates, xExt, yExt, xRg, yRg);
            } else {
                coors[0] = (coors[0] - xExt[0]) / (xExt[1] - xExt[0]);
                coors[0] = coors[0] * (xRg[1] - xRg[0]) + xRg[0];

                coors[1] = (coors[1] - yExt[0]) / (yExt[1] - yExt[0]);
                coors[1] = coors[1] * (yRg[1] - yRg[0]) + yRg[0];
                break;
            }
        }
    }
}