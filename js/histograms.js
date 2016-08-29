// Assumes that D3 v.4 is loaded
function drawBarChart(svg, data) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .align(0.1);

  var y = d3.scaleLinear()
      .rangeRound([height, 0]);

  var xs = Object.keys(data);
  xs.sort();
  var barData = xs.map(function(x) { return {x:x, y:data[x]}; });

  x.domain(xs);
  y.domain([0, d3.max(barData.map(function(d) { return d.y; }))]).nice();

  var bars = g.selectAll('.bar')
      .data(barData)
      .enter().append('rect')
          .attr('x', function(d) { return x(d.x); })
          .attr('y', function(d) { return y(d.y); })
          .attr('height', function(d) { return y(0)-y(d.y); })
          .attr('width', x.bandwidth());

  g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    .append("text")
      .attr("x", width/2)
      .attr("y", 25)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .text("Number of papers an author is on");

  g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y).ticks(10, "s"))
    .append("text")
      .attr("x", -d3.max(y.range())/2)
      .attr("y", -35)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .attr('transform', 'rotate(-90)')
      .text("Frequency (# of Authors)");
}

function drawAuthorHistogram(svg, rawAuthors) {
  // Process authors to get total paper count across conferences
  function histFormatAuthor(author) {
    var aData = rawAuthors[author],
        conferences = aData.map(function(d) { return d.conference; }),
        formatted = {},
        total = 0;
    conferenceNames.forEach(function(cname) {
      var data =  aData.filter(function(d) { return d.conference === cname; });
      formatted[cname] = data.length;
      total += data.length;
    });
    formatted.author = author;
    formatted.total = total;
    return formatted;
  }

  var data = Object.keys(rawAuthors).map(histFormatAuthor);
  data.sort(function(a,b) {
    if(b.total === a.total) { // sort by first paper difference if totals match
      return conferenceNames.reduce(function(prev,conf) {
        return prev > 0 ? prev : b[conf] - a[conf];
      }, 0);
    }
    return b.total - a.total;
  });
  data.columns = conferenceNames;

  var margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .align(0.1);

  var y = d3.scaleLinear()
      .rangeRound([height, 0]);

  var z = d3.scaleOrdinal()
      .range(["rgb(79,140,157)", "rgb(67,220,197)", "rgb(11,82,46)", "rgb(129,204,76)", "rgb(202,219,165)"]);

  var stack = d3.stack();

  x.domain(data.map(function(d) { return d.author; }));
  y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
  z.domain(conferenceNames);

  g.selectAll(".column")
    .data(stack.keys(conferenceNames)(data))
    .enter().append("g")
      .attr("class", "column")
      .attr("fill", function(d) { return z(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("x", function(d) { return x(d.data.author); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth());

  g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "s"))
      .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks(10).pop()))
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("fill", "#000")
        .text("# of Papers");

    var legend = g.selectAll(".legend")
      .data(conferenceNames.reverse())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
        .style("font", "10px sans-serif");

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(function(d) { return d; });
}

// Expects data as an object where the key is category, value is the # of
// absolute occurences (not percent)
function drawPercentageStack(container, data, w) {
  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      barHeight = 25,
      svg = container.append('svg')
          .attr('width', w).attr('height', barHeight+margin.top+margin.bottom),
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleLinear().rangeRound([0, width]);

  var y = d3.scaleOrdinal()
      .range(d3.schemeCategory10);

  var stack = d3.stack();

  var categories = Object.keys(data),
      totalValues = categories.reduce(function(total, cat) { return total+data[cat]; }, 0);
  categories.sort();
  x.domain([0, totalValues]);
  y.domain(categories);

  g.selectAll(".column")
    .data(stack.keys(categories)([data]))
    .enter().append("g")
      .attr("class", "column")
      .attr("fill", function(d) { return y(d.key); })
    .selectAll("rect")
    .data(function(d) { return d; })
    .enter().append("rect")
      .attr("y", 0)
      .attr("x", function(d) { return x(d[0]); })
      .attr('height', barHeight)
      .attr("width", function(d) { return x(d[1])-x(d[0]); });

  var tbl = container.append('table');
  categories.unshift('# Publications:');
  tbl.append('thead').append('tr').selectAll('td')
      .data(categories)
      .enter()
      .append('td')
          .style('background-color', function(d,i) { return i === 0 ? '#fff' : d3.schemeCategory10[i-1]; })
          .text(function(d) { return d; });
  categories.shift();
  categories.unshift('Frequency (# Authors)');
  tbl.append('tbody').append('tr').selectAll('td')
      .data(categories.map(function(d,i) { return i === 0 ? d : data[d]; }))
      .enter()
      .append('td')
        .style('background-color', function(d,i) {
          if (i===0) return '#fff';
          var c = d3.color(d3.schemeCategory10[i-1]);
          return 'rgba('+[c.r, c.g, c.b, 0.5].map(String).join(',')+')';
        })
        .text(function(d) { return d; });
  tbl.style('border-collapse', 'collapse').style('border-spacing', 0);
  tbl.selectAll('td')
      .style('font-size','12px')
      .style('min-width', '15px')
      .style('padding-left', '3px')
      .style('padding-right', '3px')
      .style('text-align', 'right');
}

(function() {
  var svgContainer = d3.select('#allAuthorAnalysis');
  // calculate histogram of total papers
  var totalPapers = {};
  Object.keys(visAuthors)
      .map(function(author) { return visAuthors[author].length; })
      .forEach(function(total) {
        totalPapers[total] = totalPapers[total] ? totalPapers[total]+1 : 1;
      });
  drawPercentageStack(svgContainer, totalPapers, 400);

  var svg_authors = svgContainer.append('svg').attr('width', '650').attr('height', '200');
  drawAuthorHistogram(svg_authors, visAuthors);

  var firstAuthorContainer = d3.select('#firstAuthorAnalysis'),
      totalPapers_firstAuthor = {},
      totalFirstAuthorPapers = {};
  Object.keys(visFirstAuthors)
      .map(function(author) { return visAuthors[author].length; })
      .forEach(function(total) {
        totalPapers_firstAuthor[total] = totalPapers_firstAuthor[total] ? totalPapers_firstAuthor[total]+1 : 1;
      });
  Object.keys(visFirstAuthors)
      .map(function(author) { return visFirstAuthors[author].length; })
      .forEach(function(total) {
        totalFirstAuthorPapers[total] = totalFirstAuthorPapers[total] ? totalFirstAuthorPapers[total]+1 : 1;
      });
  firstAuthorContainer.append('p').text('Number of first-authors that are first- or co-authors on other papers:');
  drawPercentageStack(firstAuthorContainer, totalPapers_firstAuthor, 400);
  firstAuthorContainer.append('p').text('Number of first-authors that are first-authors on multiple papers:');
  drawPercentageStack(firstAuthorContainer, totalFirstAuthorPapers, 400);
})();
