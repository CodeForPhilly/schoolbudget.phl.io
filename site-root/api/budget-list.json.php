<?php

$budgetClass = empty($_GET['normalized']) ? 'BudgetLine' : 'NormalizedBudgetLine';

JSON::translateAndRespond($budgetClass::getAll());