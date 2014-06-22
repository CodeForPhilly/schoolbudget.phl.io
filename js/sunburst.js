// Dimensions of sunburst.
var width = 750;
var height = 600;
var radius = Math.min(width, height) / 2;

// Mapping of step names to colors.
var colors = {
    'F21001': '#53B4BF',    // Administrative Support Operations
    'F21003': '#163033',    // School Budgets including Non-District Operated Schools
    'F31330': '#ADBF00',    // L_ District Operated Schools - Instructional
    'F41035': '#CFE600',    //    L_ Elementary K-8 Education
    'F41063': '#DAEA46',    //    L_ Secondary Education
    'F31350': '#BFD400',    // L_ District Operated Schools - Instructional Support
    'F31360': '#738000',    // L_ District Operated Schools - Pupil - Family Support
    'F31620': '#3A4000',    // L_ District Operated Schools - Operational Support
    'F31361': '#326C73',    // L_ Non-District Operated Schools
  //'F49012': '#324359',    //    L_All Other Philadelphia Charters
    'F41038': '#CB1E0A'     // L_ Debt Service
};

var legendLabels = {};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0,
    selectedYear = 'current',
    selectedFund = 'total',
    yearCurrent,
    yearNext;

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d[selectedYear][selectedFund]; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

// Main function to draw and set up the visualization, once we have the data.
d3.json("data/budget-tree-normalized.json", function(error, root) {
    yearCurrent = root.yearCurrent;
    yearNext = root.yearNext;

    d3.select('#headline')
        .text(root.name);

    d3.select('#yearCurrent')
        .text(yearCurrent);

    d3.select('#yearNext')
        .text(yearNext);

    d3.select('#budget-header')
        .style('visibility', '');

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);
//debugger;
//    var nodes = partition.nodes(root).filter(function(d) {
//        return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
//    });

    var path = vis.data([root]).selectAll("path")
        .data(partition)
        .enter().append("svg:path")
        .attr("display", function(d) {
            return d.depth ? null : "none";
        })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", getColorForNode)
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .each(stash);

    // Basic setup of page elements.
    drawLegend(path);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.value;

    // Show explanation
    setRootExplanation();
    d3.select("#explanation")
        .style("visibility", "");

    d3.selectAll("input").on("change", function change() {
        var yearFund = this.value.split('.');

        selectedYear = yearFund[0];
        selectedFund = yearFund[1];

        partition
            .sort(null);

        path
            .data(partition.value(function(d) {
                return d[selectedYear][selectedFund];
            }).nodes)
            .style("fill", getColorForNode)
            .transition()
            .duration(1500)
            .attrTween("d", arcTween);

        // update total size
        totalSize = path.node().__data__.value;

        setRootExplanation();
    });
});

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

    var percentage = (100 * d.value / totalSize).toPrecision(3);
    var percentageString = percentage + "%";
    var totalString = '$'+numberWithCommas(Math.round(d.value));

    if (percentage < 0.1) {
        percentageString = "< 0.1%";
    }

    d3.select("#percentage")
        .text(percentageString)
        .style("visibility", "");

    d3.select('#total')
        .text(totalString);

    d3.select('#category')
        .text(d.name);

    var sequenceArray = getAncestors(d);
    updateBreadcrumbs(sequenceArray, percentageString, totalString);

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.3);

    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .each("end", function() {
            d3.select(this).on("mouseover", mouseover);
        });

    d3.select("#sequence")
        .transition()
        .duration(1000)
        .style("visibility", "hidden");

    setRootExplanation();
}

// update the explanation content at the center to reflect
// the entire budget
function setRootExplanation() {
    var title;

    if (selectedYear == 'current') {
        title = 'Estimated ' + yearCurrent;
    } else {
        title = 'Proposed ' + yearNext;
    }

    title += ' budget &mdash; ' + selectedFund + ' funds.';

    d3.select("#percentage")
        .style("visibility", "hidden");

    d3.select('#total')
        .text('$'+numberWithCommas(Math.round(totalSize)));

    d3.select('#category')
        .html(title);
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString, totalString) {
    var crumbsList = d3.select('#sequence .crumbs'),
        crumbs = crumbsList.selectAll('li'),
        crumbsLen = crumbs.size(),
        i = 0, nodesLen = nodeArray.length, node;

    for (; i < nodesLen; i++) {
        node = nodeArray[i];
        if (i < crumbsLen) {
            d3.select(crumbs[0][i]).text(node.name).style({
                display: '',
                'background-color': getColorForNode(node)
            });
        } else {
            crumbsList.append('li').text(node.name);
        }
    }

    while (i < crumbsLen) {
        d3.select(crumbs[0][i++]).style("display", "none");
    }

    d3.select('#sequence .total').text(totalString);

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#sequence")
        .style("visibility", "");
}

// Creates legend list
function drawLegend(path) {
    // discover full names
    path.each(function(d) {
        if (d.code in colors && !(d.code in legendLabels)) {
            legendLabels[d.code] = d.name;
        }
    });

    d3.select('#legend')
        .selectAll('li')
        .data(d3.entries(legendLabels))
        .enter().append('li')
            .text(function(d) { return d.value; })
            .style('background-color', function(d) { return colors[d.key]; });
}

// Gets color for a node by searching up the hierarchy for a code
// that has an assigned color
function getColorForNode(node) {
    var current = node;
    while (current.parent) {
        if (current.code in colors) {
            return colors[current.code];
        }
        current = current.parent;
    }
    return '#000000';
}

// Stash the old values for transition.
function stash(d) {
    d.x0 = d.x;
    d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
    return function(t) {
        var b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return arc(b);
    };
}

// Add thousands separators
function numberWithCommas(n) {
    var parts=n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}