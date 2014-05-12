<?php
$GLOBALS['Session']->requireAccountLevel('Developer');

$requiredColumns = [
    'FUNCTION_CLASS',
    'FUNCTION_CLASS_NAME',
    'FUNCTION_GROUP',
    'FUNCTION_GROUP_NAME',
    'FUNCTION',
    'FUNCTION_NAME',
    'ACTIVITY_CODE',
    'ACTIVITY_NAME',
    'OPERATING_CYEST_LUMPSUM_AMT',
    'GRANT_CYEST_LUMPSUM_AMT',
    'CAPITAL_CYEST_LUMPSUM_AMT',
    'OTHER_CYEST_LUMPSUM_AMT',
    'CYEST_LUMPSUM_TOT',
    'OPERATING_ACT_LUMPSUM_AMT',
    'GRANT_ACT_LUMPSUM_AMT',
    'CAPITAL_ACT_LUMPSUM_AMT',
    'OTHER_ACT_LUMPSUM_AMT',
    'ACT_LUMPSUM_TOT',
    'RUN_DATE'
];


if (!empty($_FILES['budget'])) {
    $reader = SpreadsheetReader::createFromFile($_FILES['budget']['tmp_name']);


    if (!$reader->hasColumns($requiredColumns)) {
        throw new Exception(
            'Spreadsheet is missing required column(s): '
            .join(',',array_diff($requiredColumns, $reader->getColumnNames()))
        );
    }

    try {
        DB::nonQuery('TRUNCATE TABLE `%s`', BudgetLine::$tableName);
        DB::nonQuery('TRUNCATE TABLE `%s`', NormalizedBudgetLine::$tableName);
    } catch (QueryException $e) {
        // ignore
    }
    
    $count = 0;
    while ($line = $reader->getNextRow()) {
        $BudgetLine = BudgetLine::create([
            'FunctionClass' => $line['FUNCTION_CLASS'],
            'FunctionClassName' => $line['FUNCTION_CLASS_NAME'],
            'FunctionGroup' => $line['FUNCTION_GROUP'],
            'FunctionGroupName' => $line['FUNCTION_GROUP_NAME'],
            'Function' => $line['FUNCTION'],
            'FunctionName' => $line['FUNCTION_NAME'],
            'ActivityCode' => $line['ACTIVITY_CODE'],
            'ActivityName' => $line['ACTIVITY_NAME'],
            'CurrentOperating' => $line['OPERATING_CYEST_LUMPSUM_AMT'],
            'CurrentGrant' => $line['GRANT_CYEST_LUMPSUM_AMT'],
            'CurrentCapital' => $line['CAPITAL_CYEST_LUMPSUM_AMT'],
            'CurrentOther' => $line['OTHER_CYEST_LUMPSUM_AMT'],
            'CurrentTotal' => $line['CYEST_LUMPSUM_TOT'],
            'ProposedOperating' => $line['OPERATING_ACT_LUMPSUM_AMT'],
            'ProposedGrant' => $line['GRANT_ACT_LUMPSUM_AMT'],
            'ProposedCapital' => $line['CAPITAL_ACT_LUMPSUM_AMT'],
            'ProposedOther' => $line['OTHER_ACT_LUMPSUM_AMT'],
            'ProposedTotal' => $line['ACT_LUMPSUM_TOT'],
            'RunDate' => strtotime($line['RUN_DATE'])
        ], true);
        $count++;
    }




    // clone data to normalized table
    DB::nonQuery(
        'INSERT INTO `%s` SELECT * FROM `%s`'
        ,[
            NormalizedBudgetLine::$tableName
            ,BudgetLine::$tableName
        ]
    );
    
    DB::nonQuery('UPDATE `%s` SET Class = "NormalizedBudgetLine"', NormalizedBudgetLine::$tableName);



    // list all the money columns
    $valueColumnsCurrent = ['CurrentOperating', 'CurrentGrant', 'CurrentCapital', 'CurrentOther', 'CurrentTotal'];
    $valueColumnsProposed = ['ProposedOperating', 'ProposedGrant', 'ProposedCapital', 'ProposedOther', 'ProposedTotal'];
    $valueColumns = array_merge($valueColumnsCurrent, $valueColumnsProposed);
    
    // this method generates a where SQL from an array of one or more line conditions
    $generateWhere = function($conditions) {
        if (!is_array($conditions[0])) {
            $conditions = array($conditions);
        }
        
        return '(' . implode(') OR (', array_map(function($conditions) {
            return implode(' AND ', NormalizedBudgetLine::mapConditions($conditions));
        }, $conditions)) . ')';
    };

    // this method removes lines matching one of the supplied conditions and returns their totals
    $extractLines = function($conditions) use ($valueColumns, $generateWhere) {
        $totals = array();
        foreach (NormalizedBudgetLine::getAllByWhere($generateWhere($conditions)) AS $Line) {
            foreach ($valueColumns AS $column) {
                $totals[$column] += $Line->$column;
            }
            $Line->destroy();
        }
        
        return $totals;
    };
    
    // this method proportionally distributes amounts among lines matching the supplied conditions
    $distributeAmounts = function($amounts, $conditions) use ($generateWhere) {
        $columns = array_keys($amounts);
        $lines = NormalizedBudgetLine::getAllByWhere($generateWhere($conditions));

        // first pass through target lines -- sum existing amounts
        $totals = array();
        foreach ($lines AS $Line) {
            foreach ($columns AS $column) {
                $totals[$column] += $Line->$column;
            }
        }
        
        // second pass -- distribute amounts proportionally
        $newTotals = array();
        $defaultProportion = 1 / count($lines);
        foreach ($lines AS $Line) {
            foreach ($totals AS $column => $total) {
                if ($total) {
                    $proportion = $Line->$column / $total;
                } else {
                    $proportion = $defaultProportion;
                }

                $Line->$column += round($amounts[$column] * $proportion, 2);
                $newTotals[$column] += $Line->$column;
            }
            $Line->save();
        }
    };




    // extract gap closing cuts and undistributed budgetary adjustments
    $gapClosingAmounts = $extractLines([
        ['Function' => 'F49992', 'ActivityCode' => '114A']  // Budget Reductions - Instructional & Instructional Support
        ,['Function' => 'F49995', 'ActivityCode' => '114C'] // Budget Reductions - Operating Support
        ,['Function' => 'F49994', 'ActivityCode' => '114E'] // Budget Reductions - Administration
        ,['Function' => 'F49991', 'ActivityCode' => '114B'] // Budget Reductions - Pupil & Family Support
        ,['Function' => 'F41073', 'ActivityCode' => '5999'] // Undistributed Budgetary Adjustments - Other
        ,['Function' => 'F41073', 'ActivityCode' => '5221'] // Undistributed Budgetary Adjustments - Other
        ,['Function' => 'F41073', 'ActivityCode' => '5130'] // Undistributed Budgetary Adjustments - Other
        ,['Function' => 'F41073', 'ActivityCode' => '2817'] // Undistributed Budgetary Adjustments - Other
    ]);

    // split up gap closing / undistributed budgetary adjustments for District Operated Schools and Administrative budget lines by SDP-estimated ratios
    $gapClosingAmountsSchools = array();
    $gapClosingAmountsAdministrative = array();
    
    foreach ($gapClosingAmounts AS $column => $amount) {
        if (in_array($column, $valueColumnsCurrent)) {
            $gapClosingAmountsSchools[$column] = round($amount * 0.95183129854, 2); // 95.18% distribution of FY14 funds to schools
            $gapClosingAmountsAdministrative[$column] = $amount - $gapClosingAmountsSchools[$column];
        } elseif (in_array($column, $valueColumnsProposed)) {
            $gapClosingAmountsSchools[$column] = round($amount * 0.95441584049, 2); // 95.18% distribution of FY15 funds to schools
            $gapClosingAmountsAdministrative[$column] = $amount - $gapClosingAmountsSchools[$column];
        } else {
            throw new Exception('Unexpected column');
        }
    }

    // distribute split amounts
    $distributeAmounts($gapClosingAmountsSchools, [
        ['FunctionGroup' => 'F31330']   // District Operated Schools - Instructional
        ,['FunctionGroup' => 'F31350']  // District Operated Schools - Instructional Support
        ,['FunctionGroup' => 'F31620']  // District Operated Schools - Operational Support
        ,['FunctionGroup' => 'F31360']  // District Operated Schools - Pupil - Family Support
    ]);

    $distributeAmounts($gapClosingAmountsAdministrative, [
        ['FunctionClass' => 'F21001'] // Administrative Support Operations
    ]);




    // misc distributions
    $distributeAmounts(
        $extractLines(['Function' => 'F49000', 'ActivityCode' => '5221']) // Food Service > Allocated Costs
        ,['FunctionGroup' => 'F31620', '(Function != "F41071" OR ActivityCode != "5221")'] // Operating Support group, except Transportation -- Regular Services > Allocated Costs
    );

    $distributeAmounts(
        $extractLines(['Function' => 'F41071', 'ActivityCode' => '5221']) // Transportation -- Regular Services > Allocated Costs
        ,['Function' => 'F41071', 'ActivityCode != "5221"'] // Transportation -- Regular Services, except Allocated Costs
    );

    $distributeAmounts(
        $extractLines(['Function' => 'F41073', 'ActivityCode' => '2515']) // Undistributed Budgetary Adjustments - Other > ACCOUNTING SERVICES
        ,['Function' => 'F49027'] // Accounting & Audit Coordination
    );

    $distributeAmounts(
        $extractLines(['Function' => 'F41073', 'ActivityCode' => '2520']) // Undistributed Budgetary Adjustments - Other > CITY CONTROLLER
        ,['Function' => 'F41099'] // Financial Services Function
    );

    $distributeAmounts(
        $extractLines(['Function' => 'F41073', 'ActivityCode' => '2512']) // Undistributed Budgetary Adjustments - Other > OFFICE OF MANAGEMENT & BUDGET
        ,['Function' => 'F49026'] // Management & Budget Office function
    );

    $distributeAmounts(
        $extractLines(['Function' => 'F41073', 'ActivityCode' => '2519']) // Undistributed Budgetary Adjustments - Other > OFFICE OF MANAGEMENT & BUDGET
        ,['Function' => 'F49026'] // Management & Budget Office function
    );



    // check accuracy of normalization
    $originalSums = DB::oneRecord(
        'SELECT '
        . implode(', ', array_map(function($column) { return "SUM($column) AS $column"; }, $valueColumns))
        . ' FROM `%s`'
        ,BudgetLine::$tableName
    );

    $normalizedSums = DB::oneRecord(
        'SELECT '
        . implode(', ', array_map(function($column) { return "SUM($column) AS $column"; }, $valueColumns))
        . ' FROM `%s`'
        ,NormalizedBudgetLine::$tableName
    );

    $sumDifferences = array();
    foreach ($normalizedSums AS $column => $normalizedSum) {
        $sumDifferences[$column] = $normalizedSum - $originalSums[$column];
    }

    Debug::dumpVar($sumDifferences, false, 'Normalized table net differences');


    die("Imported $count rows");
}

?>
<html>
    <head>
        <title>Budget Importer</title>
    </head>
    <body>
        <form enctype='multipart/form-data' method='POST'>
            <input type='file' name='budget'>
            <input type='submit' value='Upload'> (Existing table will be erased)
        </form>
    </body>
</html>