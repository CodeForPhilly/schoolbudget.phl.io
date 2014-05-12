<?php

class BudgetLine extends ActiveRecord
{
    public static $tableName = 'budget_lines';
    public static $singularNoun = 'budget line';
    public static $pluralNoun = 'budget lines';
    
    public static $fields = array(
        'FunctionClass',
        'FunctionClassName',
        'FunctionGroup',
        'FunctionGroupName',
        'Function',
        'FunctionName',
        'ActivityCode',
        'ActivityName',
        'CurrentOperating' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'CurrentGrant' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'CurrentCapital' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'CurrentOther' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'CurrentTotal' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'ProposedOperating' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'ProposedGrant' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'ProposedCapital' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'ProposedOther' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'ProposedTotal' => array(
            'type' => 'decimal',
            'length' => '15,2'
        ),
        'RunDate' => 'date'
    );
}