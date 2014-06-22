d3.json("/api/budget-tree.json?normalized=1", function(error, root) {

    var totals = {
            current_total: 0,
            next_total: 0
        },
        leafCount = 0;

    function _crawlChildren(children) {
        for (var i = 0, child; i < children.length; i++) {
            child = children[i];

            if ('children' in child) {
                _crawlChildren(child.children);
            } else {
                leafCount++;
                totals.current_total += child.current.total;
                totals.next_total += child.next.total;
            }
        }
    }

    _crawlChildren(root.children);
    console.log('Tree -- found %o leafs', leafCount);
    console.log('Tree -- totals', totals);
});

d3.json("data/budget-list-normalized.json", function(error, root) {

    var totals = {
        current_total: 0,
        next_total: 0
    };

    for (var i = 0, line; i < root.length; i++) {
        line = root[i];

        totals.current_total += parseFloat(line.CurrentTotal);
        totals.next_total += parseFloat(line.ProposedTotal);
    }

    console.log('List -- found %o lines', root.length);
    console.log('List -- totals', totals);
});