// Detect for ie
var ie = (function () {
    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
        all[0]
    );

    return v > 4 ? v : undef;

}());

function init() {

    // Alert users if they are using ie 8 or lower
    if (ie < 9) {
        alert("This site requires a modern web browser.  Please install Google Chrome, Mozilla Firefox, Apple Safari, or Internet Explorer 9 or higher.");
    }

    // Check to see if we're searching for something right away (e.g. from a linked url)
    var linksearch = getParameterByName("search");

    // If so, search away
    if (linksearch != null) {

        // Set search box and run the query
        $('#search').val(linksearch);
        updateResults('', '', '', 0);
    }


    var margin = {
            top: 30,
            right: 0,
            bottom: 0,
            left: 0
        },
        width = 960,
        height = 500 - margin.top - margin.bottom,
        formatNumber = d3.format(",d"),
        transitioning;

    // We used to use this when using d3's standard color schemes
    //var color = d3.scale.category20();

    var color = function (id) {

        c = {
            '100': '#B2C2D1',
            '200': '#F76e4a',
            '300': '#efdfbb',
            '400': '#335d6b',
            '500': '#7aBa7f',
            '600': '#5CADFF',
            '700': '#88898b',
            '800': '#FF99CC',
            '900': '#99FFCC',
            '1000': '#FF8F1F'
        };
        rc = c[id];

        // Give it a d3 color in case we missed something
        if (rc == "") {
            rc = d3.scale.category20();
        }

        return rc;
    }

    var x = d3.scale.linear()
        .domain([0, width])
        .range([0, width]);

    var y = d3.scale.linear()
        .domain([0, height])
        .range([0, height]);

    var treemap = d3.layout.treemap()
        .children(function (d, depth) {
            return depth ? null : d.children;
        })
        .sort(function (a, b) {
            return a.value - b.value;
        })
        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
        .round(false);

    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .style("margin-left", -margin.left + "px")
        .style("margin.right", -margin.right + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");

    var grandparent = svg.append("g")
        .attr("class", "grandparent");

    grandparent.append("rect")
        .attr("y", -margin.top)
        .attr("width", width)
        .attr("height", margin.top);
    grandparent.append("text")
        .attr("fill", "#777")
        .style("letter-spacing", "+0.05em")
        .attr("x", 6)
        .attr("y", margin.top - 60)
        .attr("dy", "0.5em");

    // Initialize tooltips
    $(document).ready(function () {
        $("[rel=tooltip]").tooltip();
    });

    d3.json("data/budget-tree-simple.json", function (root) {

        initialize(root);
        accumulate(root);
        layout(root);
        display(root);

        function initialize(root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
            root.depth = 0;
        }

        // Aggregate the values for internal nodes. This is normally done by the
        // treemap layout, but not here because of our custom implementation.
        function accumulate(d) {
            return d.children ? d.value = d.children.reduce(function (p, v) {
                return p + accumulate(v);
            }, 0) : d.value;
        }

        // Compute the treemap layout recursively such that each group of siblings
        // uses the same size (1x1) rather than the dimensions of the parent cell.
        // This optimizes the layout for the current zoom state. Note that a wrapper
        // object is created for the parent node for each group of siblings so that
        // the parent's dimensions are not discarded as we recurse. Since each group
        // of sibling was laid out in 1x1, we must rescale to fit using absolute
        // coordinates. This lets us use a viewport to zoom.
        function layout(d) {
            if (d.children) {
                treemap.nodes({
                    children: d.children
                });
                d.children.forEach(function (c) {
                    c.x = d.x + c.x * d.dx;
                    c.y = d.y + c.y * d.dy;
                    c.dx *= d.dx;
                    c.dy *= d.dy;
                    c.parent = d;
                    layout(c);
                });
            }
        }

        function display(d) {

            grandparent
                .datum(d.parent)
                .on("click", transition)
                .select("text")
                .attr("dy", "1.5em")
                .text(name(d) + " : " + accounting.formatMoney(d.value));

            var g1 = svg.insert("g", ".grandparent")
                .datum(d)
                .attr("class", "depth");

            var g = g1.selectAll("g")
                .data(d.children)
                .enter().append("g");

            g.filter(function (d) {
                return d.children;
            })
                .classed("children", true)
                .on("click", transition);

            g.selectAll(".child")
                .data(function (d) {
                    return d.children || [d];
                })
                .enter().append("rect")
                .attr("class", "child")
                .call(rect);

            g.append("rect")
                .attr("class", "parent")
                .attr("data-placement", "top")
                .attr("title", "Tooltip test")
                .attr("rel", "tooltip")
                .call(rect)
                .append("title")
                .text(function (d) {
                    return formatNumber(d.value);
                });

            g.append("text")
                .attr("dy", ".75em")
                .attr("fill", "#333")
                .text(function (d) {
                    var w = (d.dx / d.parent.dx) * 960;
                    if (d.name.length * 6.5 < ((d.dx / d.parent.dx) * 960) && ((d.dy / d.parent.dy) * 500) > 18 && (w > 100)) {
                        d.hiddendata = false;
                        return d.name;
                    } else {
                        d.hiddendata = true;
                        return "";
                    }
                })
                .call(text);
            g.append("text")
                .attr("dy", "1.75em")
                .attr("fill", "#333")
                .text(function (d) {
                    if (accounting.formatMoney(d.value).length * 6 > ((d.dx / d.parent.dx) * 960) || d.hiddendata) {
                        d.hiddendata = true;
                        return "";
                    } else {
                        return accounting.formatMoney(d.value);
                    }
                })
                .call(text);

            function transition(d) {
                if (transitioning || !d) return;
                transitioning = true;

                var g2 = display(d),
                    t1 = g1.transition().duration(750),
                    t2 = g2.transition().duration(750);

                // Update the domain only after entering new elements.
                x.domain([d.x, d.x + d.dx]);
                y.domain([d.y, d.y + d.dy]);

                // Enable anti-aliasing during the transition.
                svg.style("shape-rendering", null);

                // Draw child nodes on top of parent nodes.
                svg.selectAll(".depth").sort(function (a, b) {
                    return a.depth - b.depth;
                });

                // Fade-in entering text.
                g2.selectAll("text").style("fill-opacity", 0);

                // Transition to the new view.
                t1.selectAll("text").call(text).style("fill-opacity", 0);
                t2.selectAll("text").call(text).style("fill-opacity", 1);
                t1.selectAll("rect").call(rect);
                t2.selectAll("rect").call(rect);

                // Remove the old node when the transition is finished.
                t1.remove().each("end", function () {
                    svg.style("shape-rendering", "crispEdges");
                    transitioning = false;
                });
            }

            return g;
        }

        function text(text) {
            text.attr("x", function (d) {
                return x(d.x) + 6;
            })
                .style("font-size", function (d) {
                    var size = "12px";
                    d.namedisplay = d.name;
                    return size;
                })
                .attr("y", function (d) {
                    return y(d.y) + 6;
                });
        }

        function rect(rect) {
            rect.attr("x", function (d) {
                return x(d.x);
            })
                .attr("y", function (d) {
                    return y(d.y);
                })
                .attr("width", function (d) {
                    tempwidth = x(d.x + d.dx) - x(d.x);
                    return tempwidth > 0 ? tempwidth : 0;
                })
                .attr("height", function (d) {
                    return y(d.y + d.dy) - y(d.y);
                })
                .style("fill", function (d) {
                    if (d.parent.parent != null) {
                        if (d.parent.parent.parent != null) {
                            return color(d.parent.name.substr(6, 3));
                        } else {
                            return color(d.name.substr(6, 3));
                        }
                    } else {
                        return "none";
                    }
                });
            rect.attr("onclick", "javascript:getRecords(evt)");
            rect.attr("onmouseover", "javascript:showInfo(evt)");
            rect.attr("onmouseout", "javascript:hideInfo(evt)");
        }

        function name(d) {
            return d.parent ? name(d.parent) + " : " + d.name : "Home : " + d.name;
        }
    });
}

function showInfo(evt) {
    evt.target.setAttributeNS(null, "opacity", 0.5);
    evt.target.setAttributeNS(null, "fill", "#000000");
    var data = evt.target.__data__;
    var d = $('#budgetinfo');

    tooltip.show(data.name + "<br>" + accounting.formatMoney(data.value));
}

function hideInfo(evt) {
    tooltip.hide();
}

 // Have we clicked down to see the detailed transactions?  If so, get them
function getRecords(evt) {
    n = evt.target.__data__;
    p = n.parent;
    g = p.parent;

    // Check to make sure we'll get back something.
    if (evt.target.__data__.children == undefined) {
        updateResults(g.dept_id, p.sub_object_code, n.name, 0);
    }
}

function getParameterByName(name) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

 // Update the search results with what we've clicked down to
function updateResults(dept, cat, desc, page) {
    var html = "";
    var khtml = "";
    var first = true;
    var search = $('#search').val();
    var url = "";
    var linkurl = "";

    // Replace any ampersands
    desc = desc.replace(/&/g, '%26');

    $('#working').activity();

    if (dept == "") {
        url = "jrequest.rb?search0=" + $('#search').val() + "&page=" + page;
        linkurl = "http://budget.brettmandel.com/?search=" + $('#search').val();;
    } else {
        url = "jrequest.rb?dept=" + dept + "&cat=" + cat + "&desc=" + desc + "&page=" + page;
    }

    //alert(url);
    // $('#debug').html(url);

    if (page == 0) {
        $('#resultstable').empty();
        //$('#resultstable').append('');
    }
    // Update our results table with the new search results
    $.ajax({
        url: url,
        dataType: 'json',
        success: function (data) {
            $('#searchtitle').html("Search Results");

            if (linkurl != "") {
                // Replace spaces with %20
                linkurl = linkurl.replace(/\s/g, "%20");

                $('#linkshare').html("Share this search:  Be sure to use the hashtag <a href=\"https://twitter.com/search/realtime?q=%23bulldogbudget&src=hash\">#bulldogbudget</a><br><input type=\"text\" class=\"input-xxlarge\" value=\"" + linkurl + "\">")
            }

            var counttext = "Found " + data.length + " results";
            $('#more').empty();
            if (data.length == 1) {
                counttext = counttext.slice(0, -1);
            } else if (data.length > 500) {
                counttext = "Found more than 500 results. Scroll down for more.";
                $('#more').html("<input value='View 500 more results' type=button onclick='updateResults(\"" + dept + "\",\"" + cat + "\",\"" + desc + "\",\"" + (parseInt(page) + 1) + "\")'>");
            }

            $('#searchcount').html(counttext);

            if (data == "") {
                $('#resultstable').html("No results found");
            } else {
                // In Ruby 1.8 the hashed aren't sorted, so we have to sort them here
                var keys = Object.keys(data[0]);
                var orderedKeys = new Array;

                for (i in keys) {
                    orderedKeys[i] = keys[i];
                }

                orderedKeys.sort();
                keys = orderedKeys;
                var rowhtml = "";
                var khtml = "";
                var th;

                if (page == 0) {
                    for (k in keys) {

                        if (keys[k].match(/Employee.*/) || keys[k].match(/Pay Class Title/)) {} else {
                            khtml += "<th>" + keys[k] + "</th>";
                        }
                    }

                    khtml = "<thead><tr>" + khtml + "</tr></thead>";
                    //alert(khtml);
                    document.th = $('#resultstable').append(khtml);
                }

                for (d in data) {
                    rowhtml = "";
                    document.th.append('');
                    for (k in keys) {
                        if (keys[k] == "Total Expenditures") {
                            rowhtml += "<td>" + accounting.formatMoney(data[d][keys[k]], "") + "</td>";
                            //rowhtml += "<td>" + data[d][keys[k]] + "</td>";
                        } else if (keys[k].match(/Employee.*/) || keys[k].match(/Pay Class Title/)) {

                        } else {
                            rowhtml += "<td>" + data[d][keys[k]] + "</td>";
                        }
                    }
                    // rowhtml = "<tr>" + rowhtml + "</tr>\n";
                    document.th.append("<tr>" + rowhtml + "</tr>\n");
                }
                document.th.append('');

                if (page == 0) {
                    // add parser through the tablesorter addParser method
                    $.tablesorter.addParser({
                        // set a unique id
                        id: 'money',
                        is: function (s) {
                            // return false so this parser is not auto detected
                            return false;
                        },
                        format: function (s) {
                            // format your data for normalization
                            //console.log(s);
                            return s.replace(",", "");
                        },
                        // set type, either numeric or text
                        type: 'numeric'
                    });

                    $("#resultstable").tablesorter({
                        headers: {
                            4: {
                                sorter: 'money'
                            }
                        }
                    });
                } else {

                    $("#resultstable").trigger('update');
                }

            }
            $('#working').activity(false);
            window.scrollTo(0, $('#searchtitle').position().top - 60);
        },
        timeout: 1000 * 60 * 10,
        error: function (jqXHR, status, errorThrown) { //the status returned will be "timeout"
            //do something
            $('#working').activity(false);
            $('#debug').html = "There was a problem retrieving the data.<br>Error:  " + status + "<br>E:  " + errorThrown + "<br>";
        }
    });

    return false;
}