<?php

$budgetClass = empty($_GET['normalized']) ? 'BudgetLine' : 'NormalizedBudgetLine';

// group by category
$names = array();
$hash = array();
foreach ($budgetClass::getAllByWhere('CurrentTotal > 0') AS $Line) {
    $hash[$Line->FunctionClass][$Line->FunctionGroup][$Line->Function][] = $Line;

    $names[$Line->FunctionClass] = $Line->FunctionClassName;
    $names[$Line->FunctionGroup] = $Line->FunctionGroupName;
    $names[$Line->Function] = $Line->FunctionName;
}

// rearrange into tree
$treeRoot = array(
    'name' => 'School District of Philadelphia Budget',
    'yearCurrent' => 2014,
    'yearNext' => 2015,
    'children' => array()
);

function _writeToTree(&$treeNode, &$hash, &$names) {
    foreach ($hash AS $category => $children) {
        if (is_array($children)) {
            $childNode = array(
                'name' => $names[$category],
                'code' => $category,
                'children' => array()
            );
            _writeToTree($childNode, $children, $names);
            $treeNode['children'][] = $childNode;
        } elseif(is_a($children, 'BudgetLine')) {
            $treeNode['children'][] = empty($_GET['simple']) ? array(
                'name' => $children->ActivityName,
                'code' => $children->ActivityCode,
                'current' => array(
                    'operating' => (float)$children->CurrentOperating,
                    'grant' => (float)$children->CurrentGrant,
                    'capital' => (float)$children->CurrentCapital,
                    'other' => (float)$children->CurrentOther,
                    'total' => (float)$children->CurrentTotal
                ),
                'next' => array(
                    'operating' => (float)$children->ProposedOperating,
                    'grant' => (float)$children->ProposedGrant,
                    'capital' => (float)$children->ProposedCapital,
                    'other' => (float)$children->ProposedOther,
                    'total' => (float)$children->ProposedTotal
                )
            ) : array(
                'name' => $children->ActivityName,
                'value' => (float)$children->CurrentTotal
            );
        }
    }
};

_writeToTree($treeRoot, $hash, $names);

JSON::respond($treeRoot);