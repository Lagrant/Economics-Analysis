var padding = 15;
var size = 160;
var margin = {left: 50, right: 50, top: 50, bottom: 50};
var width;
var height;

var setBandSize = function(plotID, bandSize) {
    d3.select('#slider-value')
        .text(bandSize);
    if (d3.select(plotID).selectAll('*')[0].length === 0) {
        return;
    }
    drawPlot(plotID, bandSize);
}

var drawPlot = function (plotID, bandSize = 5) {
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
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    
    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);
    var y = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);
    
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
        .attr('transform', (_, i) => { return 'translate(' + i * size + ',' + height + ')'; })
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
        .attr('transform', (c) => { return 'translate(' + c.i * size + ',' + c.j * size + ')' });
    
    cell.append('rect')
        .attr('fill', 'none')
        .attr('stroke', '#aaa')
        .attr('x', padding / 2 + 0.5)
        .attr('y', padding / 2 + 0.5)
        .attr('width', size - padding)
        .attr('height', size - padding);
    
    cell.each(function (c) {
        x.domain(d3.extent(data[c.i]));
        y.domain(d3.extent(data[c.j]));

        const contours = d3.contourDensity()
            .x((d) => { return x(d[cols[c.i]]); })
            .y((d) => { return y(d[cols[c.j]]); })
            .size([size - padding, size - padding])
            .bandwidth(bandSize)(mtx);
        
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
        .style("font", "bold 10px sans-serif")
        .selectAll("text")
        .data(cols).enter()
        .append("text")
        .attr("transform", (d, i) => { return'translate(' + i * size + ',' + i * size + ')'})
        .attr('text-anchor', 'end')
        .attr("x", size - padding / 2)
        .attr("y", padding)
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
}