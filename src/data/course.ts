export type DatabaseEngine = 'DuckDB' | 'PostgreSQL' | 'MySQL' | 'Cross-database';

export type CodeLanguage = 'sql' | 'yaml' | 'jinja' | 'shell' | 'python';

export interface CodeExample {
  title: string;
  language: CodeLanguage;
  filename: string;
  code: string;
}

export interface Exercise {
  prompt: string;
  starterSql: string;
  solutionSql: string;
  expectedColumns: string[];
  hints: [string, string, string];
}

export interface Quiz {
  question: string;
  options: [string, string, string, string];
  /** Zero-based index into options. */
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface Lesson {
  id: string;
  number: string;
  title: string;
  minutes: number;
  lab: boolean;
  engine: DatabaseEngine;
  summary: string;
  objectives: [string, string] | [string, string, string];
  explanation: [string, string] | [string, string, string];
  codeExample: CodeExample;
  exercise: Exercise;
  quiz: Quiz;
}

export interface CourseModule {
  id: string;
  number: number;
  title: string;
  description: string;
  outcomes: string[];
  lessons: Lesson[];
}

export interface CourseDataset {
  name: string;
  grain: string;
  description: string;
  keyColumns: string[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  prerequisites: string[];
  engines: DatabaseEngine[];
  lessonCount: number;
  labCount: number;
  estimatedHours: number;
  narrative: string;
  datasets: CourseDataset[];
  modules: CourseModule[];
}

const sql = String.raw;

export const courseModules: CourseModule[] = [
  {
    id: 'foundations',
    number: 1,
    title: 'Warehouse Thinking & dbt Foundations',
    description: 'Learn where dbt fits in a modern ELT platform and build a safe local analytics environment around an ecommerce warehouse.',
    outcomes: ['Explain the dbt compiler and runner', 'Read warehouse data at its natural grain', 'Run and inspect a first dbt model'],
    lessons: [
      {
        id: 'm01-l01',
        number: '1.1',
        title: 'ELT, Analytics Engineering, and dbt',
        minutes: 22,
        lab: false,
        engine: 'Cross-database',
        summary: 'Place dbt between ingestion and consumption, with a clear boundary between raw data, transformations, and orchestration.',
        objectives: ['Distinguish ETL from ELT', 'Describe what dbt does and deliberately does not do', 'Recognize the compile-run-test-document loop'],
        explanation: [
          'Our fictional retailer, Northstar Shop, lands operational orders, customers, products, payments, and shipments in a raw schema. In ELT, ingestion preserves those records first; warehouse SQL then turns them into trusted analytical relations. dbt owns that transformation layer without replacing extraction, BI, or the warehouse itself.',
          'A dbt model is primarily a SELECT statement plus configuration. dbt resolves dependencies, renders Jinja into warehouse SQL, executes models in dependency order, tests assumptions, and publishes metadata. This separation gives data engineers version control, reviewable changes, reproducible builds, and observable lineage.'
        ],
        codeExample: {
          title: 'A model is a select statement',
          language: 'sql',
          filename: 'models/staging/stg_orders.sql',
          code: sql`select
    order_id,
    customer_id,
    cast(order_created_at as timestamp) as ordered_at,
    lower(order_status) as order_status
from raw.orders`
        },
        exercise: {
          prompt: 'Write a read-only profiling query that counts raw orders and reports the earliest and latest order timestamps.',
          starterSql: sql`select
    -- total rows
    -- first timestamp
    -- last timestamp
from raw.orders`,
          solutionSql: sql`select
    count(*) as order_count,
    min(order_created_at) as first_order_at,
    max(order_created_at) as last_order_at
from raw.orders`,
          expectedColumns: ['order_count', 'first_order_at', 'last_order_at'],
          hints: ['Use count(*) for row volume.', 'Use min and max on the event timestamp.', 'Alias every expression so downstream users get stable names.']
        },
        quiz: {
          question: 'Which responsibility normally belongs to dbt?',
          options: ['Extracting changes from a SaaS API', 'Transforming loaded warehouse tables with versioned SQL', 'Rendering a BI dashboard', 'Provisioning a PostgreSQL server'],
          answerIndex: 1,
          explanation: 'dbt begins once data is available in a supported platform and turns that data into governed analytical relations.'
        }
      },
      {
        id: 'm01-l02',
        number: '1.2',
        title: 'Grain, Keys, and Warehouse Layers',
        minutes: 28,
        lab: false,
        engine: 'DuckDB',
        summary: 'Reason about row grain before writing transformations and organize models into source, staging, intermediate, and mart layers.',
        objectives: ['State a relation grain precisely', 'Find candidate primary and foreign keys', 'Choose an appropriate dbt layer'],
        explanation: [
          'Grain is the business meaning of one row. raw.orders has one row per order, while raw.order_items has one row per order-product line. Joining these tables without respecting grain multiplies order values; declaring grain first prevents one of the most common warehouse defects.',
          'Northstar uses sources for loaded tables, staging models for light cleanup, intermediate models for reusable business transformations, and marts for consumption-ready facts and dimensions. Layer names are conventions, not dbt requirements, but they make ownership and allowed transformations obvious.'
        ],
        codeExample: {
          title: 'Check a candidate key at the declared grain',
          language: 'sql',
          filename: 'analysis/profile_order_items.sql',
          code: sql`select
    order_id,
    order_item_id,
    count(*) as duplicate_count
from raw.order_items
group by order_id, order_item_id
having count(*) > 1`
        },
        exercise: {
          prompt: 'Profile the payments table at one row per payment and identify orders with more than one payment attempt.',
          starterSql: sql`select
    -- group at the order grain
from raw.payments
group by -- key
having -- more than one attempt`,
          solutionSql: sql`select
    order_id,
    count(*) as payment_attempts,
    sum(amount) as attempted_amount
from raw.payments
group by order_id
having count(*) > 1`,
          expectedColumns: ['order_id', 'payment_attempts', 'attempted_amount'],
          hints: ['The payment table grain is finer than order.', 'Group by order_id to move to order grain.', 'A HAVING clause filters aggregate results.']
        },
        quiz: {
          question: 'What is the best grain statement for order_items?',
          options: ['One row per customer', 'One row per order status', 'One row per product sold', 'One row per line item within an order'],
          answerIndex: 3,
          explanation: 'The composite business key order_id plus order_item_id identifies a line within its order.'
        }
      },
      {
        id: 'm01-l03',
        number: '1.3',
        title: 'Lab: Your First DuckDB Project',
        minutes: 45,
        lab: true,
        engine: 'DuckDB',
        summary: 'Initialize a dbt-duckdb project, connect to a local warehouse file, build a model, and inspect the generated relation and compiled SQL.',
        objectives: ['Configure a local DuckDB profile', 'Run dbt debug and dbt build', 'Locate compiled SQL and warehouse output'],
        explanation: [
          'DuckDB makes the first lab reproducible because the warehouse is a local file and requires no server. The project profile targets northstar.duckdb, while dbt_project.yml tells dbt where models live and how the project should be named.',
          'Run dbt debug before building to separate connection failures from model failures. After dbt build, compare target/compiled with the authored SQL and query the analytics relation directly; that compiler-to-warehouse path is the core debugging loop used throughout the course.'
        ],
        codeExample: {
          title: 'Minimal DuckDB profile',
          language: 'yaml',
          filename: 'profiles.yml',
          code: sql`northstar_shop:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: northstar.duckdb
      threads: 4`
        },
        exercise: {
          prompt: 'Create the first model, dim_order_status, with one row per distinct normalized status and a count of orders in that status.',
          starterSql: sql`select
    -- normalized status,
    -- number of orders
from raw.orders
group by -- normalized status`,
          solutionSql: sql`select
    lower(trim(order_status)) as order_status,
    count(*) as order_count
from raw.orders
group by lower(trim(order_status))`,
          expectedColumns: ['order_status', 'order_count'],
          hints: ['Normalize before grouping.', 'DuckDB supports lower and trim.', 'Save the SELECT in models/dim_order_status.sql, then run dbt build --select dim_order_status.']
        },
        quiz: {
          question: 'Where does dbt place rendered model SQL by default?',
          options: ['logs/compiled', 'target/compiled', 'models/rendered', 'dbt_packages/target'],
          answerIndex: 1,
          explanation: 'The target directory contains compiled and run artifacts, including rendered SQL useful for debugging.'
        }
      }
    ]
  },
  {
    id: 'testing',
    number: 4,
    title: 'Data Quality as Code',
    description: 'Encode structural and business expectations as tests, interpret failures, and build a practical quality gate for the ecommerce graph.',
    outcomes: ['Choose tests from business risk', 'Debug failing rows', 'Design severity-aware quality gates'],
    lessons: [
      {
        id: 'm04-l01',
        number: '4.1',
        title: 'Generic Tests and Data Contracts',
        minutes: 27,
        lab: false,
        engine: 'Cross-database',
        summary: 'Translate grain, required fields, accepted domains, and referential integrity into reusable generic tests.',
        objectives: ['Configure built-in generic tests', 'Connect tests to declared grain', 'Avoid redundant low-value test coverage'],
        explanation: [
          'Tests should protect assumptions that would make an output misleading if broken. For stg_orders, not_null plus unique on order_id protects one-row-per-order grain, accepted_values protects status semantics, and relationships exposes orphaned customers. Testing every column indiscriminately creates noise without reducing meaningful risk.',
          'Generic tests are parameterized queries that return failing rows. dbt treats zero failures as success. In current project YAML, data_tests is the unambiguous key; test configuration can set severity, warning thresholds, and stored failure behavior.'
        ],
        codeExample: {
          title: 'Tests tied to an order contract',
          language: 'yaml',
          filename: 'models/staging/_staging.yml',
          code: sql`version: 2
models:
  - name: stg_orders
    columns:
      - name: order_id
        data_tests: [not_null, unique]
      - name: customer_id
        data_tests:
          - relationships:
              arguments:
                to: ref('stg_customers')
                field: customer_id
      - name: order_status
        data_tests:
          - accepted_values:
              arguments:
                values: ['pending', 'paid', 'shipped', 'delivered', 'cancelled']`
        },
        exercise: {
          prompt: 'Define tests for stg_order_items that protect its composite grain, required product key, and positive quantity.',
          starterSql: sql`models:
  - name: stg_order_items
    # model-level composite key test
    columns:
      - name: product_id
        # required
      - name: quantity
        # positive expression`,
          solutionSql: sql`models:
  - name: stg_order_items
    data_tests:
      - dbt_utils.unique_combination_of_columns:
          arguments:
            combination_of_columns: [order_id, order_item_id]
    columns:
      - name: product_id
        data_tests: [not_null]
      - name: quantity
        data_tests:
          - dbt_utils.expression_is_true:
              arguments:
                expression: '> 0'`,
          expectedColumns: ['order_id', 'order_item_id', 'product_id', 'quantity'],
          hints: ['The key spans two columns.', 'dbt_utils provides a composite uniqueness test.', 'An expression test can compare each quantity with zero.']
        },
        quiz: {
          question: 'What does a dbt data test query return on success?',
          options: ['Every valid row', 'Exactly one row', 'No failing rows', 'A boolean column'],
          answerIndex: 2,
          explanation: 'dbt test queries select violations; an empty result means the assertion holds.'
        }
      },
      {
        id: 'm04-l02',
        number: '4.2',
        title: 'Lab: Test the Ecommerce Graph',
        minutes: 58,
        lab: true,
        engine: 'DuckDB',
        summary: 'Implement model and source tests across customers, orders, items, products, and payments, then inspect deliberately injected failures.',
        objectives: ['Build a risk-based test suite', 'Use dbt test selectors', 'Trace failed relationships to source records'],
        explanation: [
          'This lab injects a duplicate order, an orphaned item, and an unsupported payment status into a copy of the raw data. Run targeted tests first, inspect generated failure SQL, and query stored failures. The objective is not merely a red or green command; it is a repeatable path from assertion to offending business records.',
          'Select tests by parent model during development and use build for dependency-aware production validation. dbt build can skip downstream resources after an upstream failure, preventing a known-bad relation from feeding customer-facing marts.'
        ],
        codeExample: {
          title: 'Store failed rows for investigation',
          language: 'yaml',
          filename: 'dbt_project.yml',
          code: sql`data_tests:
  northstar_shop:
    +store_failures: true
    +schema: dbt_test_failures`
        },
        exercise: {
          prompt: 'Write a singular diagnostic query that returns order items whose order_id does not exist in staged orders.',
          starterSql: sql`select
    -- failing row identifiers
from {{ ref('stg_order_items') }} as i
left join {{ ref('stg_orders') }} as o
  on -- key
where -- missing parent`,
          solutionSql: sql`select
    i.order_id,
    i.order_item_id,
    i.product_id
from {{ ref('stg_order_items') }} as i
left join {{ ref('stg_orders') }} as o
  on i.order_id = o.order_id
where o.order_id is null`,
          expectedColumns: ['order_id', 'order_item_id', 'product_id'],
          hints: ['Start from the child relation.', 'A left join preserves orphaned items.', 'A null parent key after the join identifies a failure.']
        },
        quiz: {
          question: 'Why can dbt build be safer than an unrelated sequence of run then test?',
          options: ['It automatically repairs source data', 'It executes and validates resources in DAG order', 'It removes all warnings', 'It always performs a full refresh'],
          answerIndex: 1,
          explanation: 'build interleaves resource creation and testing according to dependencies and can prevent bad upstream nodes from feeding descendants.'
        }
      },
      {
        id: 'm04-l03',
        number: '4.3',
        title: 'Singular Tests, Thresholds, and Severity',
        minutes: 31,
        lab: false,
        engine: 'Cross-database',
        summary: 'Express business-specific assertions and calibrate warning versus error behavior without hiding genuine defects.',
        objectives: ['Write singular tests as failing-row queries', 'Configure severity and failure thresholds', 'Separate anomaly monitoring from hard invariants'],
        explanation: [
          'A singular test is ordinary SQL saved under tests/ and should return violating rows. Northstar asserts that delivered orders have a shipment delivery timestamp and that successful payment totals do not exceed the order total beyond a rounding tolerance. Keep the failing record identifiers in the output so incidents are actionable.',
          'Hard invariants such as unique order IDs should fail immediately. Distribution shifts and freshness delays may warn at a lower threshold and error at a higher one. Thresholds must be justified by operational tolerance; setting warn_if merely to make CI green converts a control into decoration.'
        ],
        codeExample: {
          title: 'Delivered orders require delivery evidence',
          language: 'sql',
          filename: 'tests/assert_delivered_orders_have_timestamp.sql',
          code: sql`select
    order_id,
    order_status,
    delivered_at
from {{ ref('int_orders_with_shipping') }}
where order_status = 'delivered'
  and delivered_at is null`
        },
        exercise: {
          prompt: 'Return successful payments with non-positive amounts as failing rows and configure the test to warn rather than error.',
          starterSql: sql`{{ config(severity='___') }}

select
    -- identifiers and amount
from {{ ref('stg_payments') }}
where -- success
  and -- invalid amount`,
          solutionSql: sql`{{ config(severity='warn') }}

select
    payment_id,
    order_id,
    amount
from {{ ref('stg_payments') }}
where payment_status = 'success'
  and amount <= 0`,
          expectedColumns: ['payment_id', 'order_id', 'amount'],
          hints: ['A singular test is a SELECT of failures.', 'Use the model config function at the top.', 'Both payment state and amount belong in the predicate.']
        },
        quiz: {
          question: 'Which assertion is usually a hard error?',
          options: ['Daily volume is 8% below average', 'A declared primary key contains duplicates', 'A source is ten minutes late', 'A category has an unusual share'],
          answerIndex: 1,
          explanation: 'Duplicate primary keys violate the stated grain and can corrupt every downstream aggregation.'
        }
      },
      {
        id: 'm04-l04',
        number: '4.4',
        title: 'Lab: Diagnose a Revenue Incident',
        minutes: 65,
        lab: true,
        engine: 'PostgreSQL',
        summary: 'Investigate a doubled revenue metric, prove that a fanout join caused it, and add tests that prevent recurrence.',
        objectives: ['Measure join fanout', 'Reconcile metrics before and after joins', 'Add a grain-preserving regression test'],
        explanation: [
          'The finance dashboard suddenly reports nearly twice the expected revenue. The raw order-item total is correct, but joining order-level payments directly to line items duplicates each payment once per line. Compare row counts and sums at every CTE boundary to localize the first divergence.',
          'The fix aggregates successful payments to order grain before joining to an order-grain model. Regression coverage then asserts one row per order and reconciles paid amount with the independently aggregated payment source. Quality engineering should capture the causal invariant, not only today’s numeric total.'
        ],
        codeExample: {
          title: 'Aggregate before joining across grains',
          language: 'sql',
          filename: 'models/intermediate/int_payments_by_order.sql',
          code: sql`select
    order_id,
    sum(amount) as paid_amount,
    count(*) as successful_payment_count
from {{ ref('stg_payments') }}
where payment_status = 'success'
group by order_id`
        },
        exercise: {
          prompt: 'Write a fanout diagnostic comparing item rows before and after joining order-level payments.',
          starterSql: sql`with joined as (
    select -- item and payment fields
    from {{ ref('stg_order_items') }} as i
    left join {{ ref('int_payments_by_order') }} as p
      on -- key
)
select
    -- original count,
    -- joined count,
    -- difference`,
          solutionSql: sql`with joined as (
    select i.order_id, i.order_item_id, p.paid_amount
    from {{ ref('stg_order_items') }} as i
    left join {{ ref('int_payments_by_order') }} as p
      on i.order_id = p.order_id
)
select
    (select count(*) from {{ ref('stg_order_items') }}) as original_item_rows,
    count(*) as joined_item_rows,
    count(*) - (select count(*) from {{ ref('stg_order_items') }}) as fanout_rows
from joined`,
          expectedColumns: ['original_item_rows', 'joined_item_rows', 'fanout_rows'],
          hints: ['Aggregate payments before the join.', 'A many-to-one join should preserve item count.', 'Compare counts in one result so the failure is visible.']
        },
        quiz: {
          question: 'What is the correct way to join many payments into a one-row-per-order fact?',
          options: ['Join raw payments and use distinct', 'Aggregate payments to order grain first', 'Multiply totals by item count', 'Remove orders with multiple payments'],
          answerIndex: 1,
          explanation: 'Pre-aggregation aligns grains and prevents the payment amount from being repeated by lower-grain rows.'
        }
      }
    ]
  },
  {
    id: 'jinja-macros',
    number: 5,
    title: 'Jinja & Reusable Macros',
    description: 'Use Jinja deliberately, write readable macros, and isolate cross-database behavior without obscuring the compiled SQL.',
    outcomes: ['Explain parse, compile, and execute contexts', 'Build reusable SQL generators', 'Dispatch adapter-specific implementations'],
    lessons: [
      {
        id: 'm05-l01',
        number: '5.1',
        title: 'How Jinja Becomes SQL',
        minutes: 30,
        lab: false,
        engine: 'Cross-database',
        summary: 'Understand expressions, statements, variables, loops, whitespace, and the boundary between compile time and query time.',
        objectives: ['Render Jinja into valid SQL', 'Distinguish compile-time values from row-level values', 'Inspect compiled output before debugging the warehouse'],
        explanation: [
          'Jinja runs before the warehouse sees a query. A loop can generate twelve SQL expressions, but it cannot iterate over query rows at warehouse execution time. Keep that distinction clear: Jinja controls text generation, while SQL controls set-based data processing.',
          'Use {{ ... }} to emit a value and {% ... %} for control flow. Generated SQL should remain readable in target/compiled. When a macro-heavy model fails, inspect the rendered query first; the adapter error refers to compiled SQL, not the template you authored.'
        ],
        codeExample: {
          title: 'Generate status counts with a loop',
          language: 'jinja',
          filename: 'models/marts/order_status_summary.sql',
          code: sql`{% set statuses = ['paid', 'shipped', 'delivered', 'cancelled'] %}

select
    order_date,
    {% for status in statuses %}
    sum(case when order_status = '{{ status }}' then 1 else 0 end)
        as {{ status }}_orders{% if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('fct_orders') }}
group by order_date`
        },
        exercise: {
          prompt: 'Use a Jinja loop to generate gross revenue columns for card, wallet, and bank_transfer payment methods.',
          starterSql: sql`{% set methods = [___] %}
select
    order_date,
    {% for method in methods %}
    -- conditional sum
    {% endfor %}
from {{ ref('fct_payments') }}
group by order_date`,
          solutionSql: sql`{% set methods = ['card', 'wallet', 'bank_transfer'] %}
select
    order_date,
    {% for method in methods %}
    sum(case when payment_method = '{{ method }}' then amount else 0 end)
        as {{ method }}_amount{% if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('fct_payments') }}
group by order_date`,
          expectedColumns: ['order_date', 'card_amount', 'wallet_amount', 'bank_transfer_amount'],
          hints: ['The list contains quoted strings.', 'Use loop.last to avoid a trailing comma.', 'The generated alias may safely use the method value.']
        },
        quiz: {
          question: 'When does a Jinja for-loop execute?',
          options: ['For every warehouse row', 'While dbt renders the SQL', 'Only after tests finish', 'Inside the BI tool'],
          answerIndex: 1,
          explanation: 'Jinja is evaluated by dbt during parsing or compilation and produces SQL text for the warehouse.'
        }
      },
      {
        id: 'm05-l02',
        number: '5.2',
        title: 'Macros, Packages, and Safe Abstractions',
        minutes: 34,
        lab: false,
        engine: 'Cross-database',
        summary: 'Create focused macros, return SQL fragments, consume packages intentionally, and avoid abstractions that hide business logic.',
        objectives: ['Define and call a macro', 'Choose between a macro and a model', 'Pin and audit package dependencies'],
        explanation: [
          'A macro is useful when the same SQL pattern must be generated consistently, such as cents-to-decimal conversion or safe division. A model is better when the reuse unit is a dataset with lineage. If reviewers must mentally execute a macro to understand core business logic, the abstraction is probably too broad.',
          'Packages such as dbt_utils provide tested generic patterns, but they are production dependencies. Pin compatible versions, read release notes, and run dependency installation deterministically in CI. Never pass untrusted runtime text into a macro that emits identifiers or SQL fragments.'
        ],
        codeExample: {
          title: 'A small, auditable safe-divide macro',
          language: 'jinja',
          filename: 'macros/safe_divide.sql',
          code: sql`{% macro safe_divide(numerator, denominator) %}
    ({{ numerator }}) / nullif(({{ denominator }}), 0)
{% endmacro %}`
        },
        exercise: {
          prompt: 'Write a macro cents_to_currency(column_name) that returns a decimal(18,2) value divided by 100, then call it for price_cents.',
          starterSql: sql`{% macro cents_to_currency(column_name) %}
    -- expression
{% endmacro %}

select
    {{ cents_to_currency('___') }} as unit_price
from {{ ref('stg_products_raw') }}`,
          solutionSql: sql`{% macro cents_to_currency(column_name) %}
    cast({{ column_name }} as decimal(18, 2)) / 100
{% endmacro %}

select
    {{ cents_to_currency('price_cents') }} as unit_price
from {{ ref('stg_products_raw') }}`,
          expectedColumns: ['unit_price'],
          hints: ['The macro argument represents SQL text, not a row value.', 'Emit the column expression inside {{ }}.', 'Cast before division to preserve precision.']
        },
        quiz: {
          question: 'When is a model preferable to a macro?',
          options: ['When the reusable object is a lineage-bearing dataset', 'When one cast syntax repeats twice', 'When generating a comma-separated list', 'When dispatching one date function'],
          answerIndex: 0,
          explanation: 'Reusable data relations should usually remain explicit graph nodes with tests, owners, and lineage.'
        }
      },
      {
        id: 'm05-l03',
        number: '5.3',
        title: 'Lab: Adapter Dispatch for Date Differences',
        minutes: 60,
        lab: true,
        engine: 'Cross-database',
        summary: 'Implement a days_between macro for DuckDB, PostgreSQL, and MySQL using adapter dispatch and prove equivalent results.',
        objectives: ['Create default and adapter-specific macro implementations', 'Call adapter.dispatch safely', 'Test semantic equivalence across targets'],
        explanation: [
          'Delivery duration is conceptually identical across Northstar warehouses, but date-difference syntax is not. The public days_between macro delegates to a namespaced implementation chosen by the active adapter. This keeps models readable and confines dialect logic to one reviewed location.',
          'Equivalence requires fixtures with same-day, multi-day, month-boundary, and null timestamps. Define whether partial days truncate and whether the end is exclusive before coding; identical column names with subtly different meanings are more dangerous than a compile failure.'
        ],
        codeExample: {
          title: 'Dispatch a portable date difference',
          language: 'jinja',
          filename: 'macros/days_between.sql',
          code: sql`{% macro days_between(start_expression, end_expression) %}
  {{ return(adapter.dispatch('days_between', 'northstar_shop')
      (start_expression, end_expression)) }}
{% endmacro %}

{% macro duckdb__days_between(start_expression, end_expression) %}
  date_diff('day', {{ start_expression }}, {{ end_expression }})
{% endmacro %}

{% macro postgres__days_between(start_expression, end_expression) %}
  (cast({{ end_expression }} as date) - cast({{ start_expression }} as date))
{% endmacro %}

{% macro mysql__days_between(start_expression, end_expression) %}
  timestampdiff(day, {{ start_expression }}, {{ end_expression }})
{% endmacro %}`
        },
        exercise: {
          prompt: 'Use days_between to calculate delivery_days and return only delivered shipments with non-negative durations.',
          starterSql: sql`select
    shipment_id,
    {{ days_between('___', '___') }} as delivery_days
from {{ ref('stg_shipments') }}
where -- delivered
  and -- non-negative`,
          solutionSql: sql`select
    shipment_id,
    {{ days_between('shipped_at', 'delivered_at') }} as delivery_days
from {{ ref('stg_shipments') }}
where delivered_at is not null
  and {{ days_between('shipped_at', 'delivered_at') }} >= 0`,
          expectedColumns: ['shipment_id', 'delivery_days'],
          hints: ['Pass SQL expressions as quoted macro arguments.', 'A delivered row has a non-null delivered_at.', 'Reuse the macro in both projection and predicate.']
        },
        quiz: {
          question: 'What is adapter dispatch designed to isolate?',
          options: ['Business ownership differences', 'Warehouse-specific SQL implementations', 'Git branch names', 'Source ingestion schedules'],
          answerIndex: 1,
          explanation: 'Dispatch selects an adapter-specific implementation behind one stable macro interface.'
        }
      }
    ]
  },
  {
    id: 'materializations',
    number: 6,
    title: 'Materializations & Physical Design',
    description: 'Choose how logical models become physical relations and align warehouse design with access patterns, cost, and freshness.',
    outcomes: ['Select view, table, ephemeral, or incremental behavior', 'Apply engine-aware physical design', 'Measure rather than guess performance'],
    lessons: [
      {
        id: 'm06-l01',
        number: '6.1',
        title: 'Views, Tables, Ephemeral Models, and Incrementals',
        minutes: 29,
        lab: false,
        engine: 'Cross-database',
        summary: 'Compare dbt materializations by build cost, query cost, storage, debuggability, and freshness behavior.',
        objectives: ['Explain each built-in materialization', 'Choose materialization from workload evidence', 'Recognize environment-specific tradeoffs'],
        explanation: [
          'A view is cheap to build but pushes work to every consumer query. A table pays transformation cost at build time and serves repeated reads efficiently. Ephemeral models inline as CTEs and reduce relation clutter, but can produce large compiled queries and cannot be queried independently. Incrementals update only selected rows and require additional correctness design.',
          'Materialization is physical behavior, not data-layer identity. Northstar may keep lightweight staging cleanup as views, expensive reusable intermediates as tables, and high-volume facts as incrementals. Start with the simplest correct choice, then use execution evidence to optimize.'
        ],
        codeExample: {
          title: 'Configure a table at model level',
          language: 'sql',
          filename: 'models/marts/fct_orders.sql',
          code: sql`{{ config(
    materialized='table',
    tags=['finance', 'daily']
) }}

select *
from {{ ref('int_orders_enriched') }}`
        },
        exercise: {
          prompt: 'Choose and configure a materialization for a tiny reusable CTE that only supports one downstream model and does not need direct inspection.',
          starterSql: sql`{{ config(materialized='___') }}

select order_id, sum(gross_line_amount) as gross_order_amount
from {{ ref('stg_order_items') }}
group by order_id`,
          solutionSql: sql`{{ config(materialized='ephemeral') }}

select order_id, sum(gross_line_amount) as gross_order_amount
from {{ ref('stg_order_items') }}
group by order_id`,
          expectedColumns: ['order_id', 'gross_order_amount'],
          hints: ['The relation has one consumer.', 'It does not need to exist physically.', 'Inspect the downstream compiled SQL to see the injected CTE.']
        },
        quiz: {
          question: 'Which materialization shifts transformation work to consumer query time?',
          options: ['Table', 'View', 'Seed', 'Snapshot'],
          answerIndex: 1,
          explanation: 'A view stores query logic, so the warehouse evaluates that logic when consumers query it.'
        }
      },
      {
        id: 'm06-l02',
        number: '6.2',
        title: 'Lab: Design PostgreSQL Relations',
        minutes: 60,
        lab: true,
        engine: 'PostgreSQL',
        summary: 'Materialize Northstar marts in PostgreSQL, add useful indexes through hooks, and validate plans with EXPLAIN.',
        objectives: ['Choose physical relations for access patterns', 'Create indexes idempotently', 'Interpret a basic PostgreSQL query plan'],
        explanation: [
          'PostgreSQL does not automatically optimize every analytical access path. Northstar’s support team filters fct_orders by customer_id and ordered_at, so a post-hook creates a composite index after dbt replaces the table. Hooks are database mutations and must be idempotent, reviewed, and environment-aware.',
          'Use EXPLAIN (ANALYZE, BUFFERS) on representative queries, but remember that tiny tables may rationally use sequential scans. Compare elapsed time, rows, and buffer activity at realistic volume rather than treating the presence of an index scan as the goal.'
        ],
        codeExample: {
          title: 'Add a PostgreSQL access-path index',
          language: 'sql',
          filename: 'models/marts/fct_orders.sql',
          code: sql`{{ config(
    materialized='table',
    post_hook="create index if not exists {{ this.name }}__customer_date_idx on {{ this }} (customer_id, ordered_at)"
) }}

select * from {{ ref('int_orders_enriched') }}`
        },
        exercise: {
          prompt: 'Write the representative query used to verify the customer/date index and request runtime plus buffer information.',
          starterSql: sql`explain (___, ___)
select
    order_id,
    order_status,
    net_order_amount
from analytics.fct_orders
where -- customer
  and -- date range`,
          solutionSql: sql`explain (analyze, buffers)
select
    order_id,
    order_status,
    net_order_amount
from analytics.fct_orders
where customer_id = 1042
  and ordered_at >= timestamp '2026-01-01'
  and ordered_at < timestamp '2026-02-01'`,
          expectedColumns: ['order_id', 'order_status', 'net_order_amount'],
          hints: ['Use ANALYZE to execute and time the query.', 'Use a half-open time interval.', 'Filter on the leading index column and then timestamp.']
        },
        quiz: {
          question: 'Why might PostgreSQL ignore a valid index on a tiny table?',
          options: ['dbt disabled indexes', 'A sequential scan is estimated cheaper', 'The table materialization forbids indexes', 'EXPLAIN removes indexes'],
          answerIndex: 1,
          explanation: 'Reading a small table sequentially can cost less than traversing an index and fetching heap pages.'
        }
      },
      {
        id: 'm06-l03',
        number: '6.3',
        title: 'Engine-Aware Physical Design',
        minutes: 32,
        lab: false,
        engine: 'Cross-database',
        summary: 'Contrast row-store indexes, DuckDB columnar scans, and MySQL access paths while preserving logical model contracts.',
        objectives: ['Relate engine architecture to model design', 'Avoid cargo-cult configuration', 'Keep engine optimizations behind stable model outputs'],
        explanation: [
          'DuckDB is an in-process analytical column store and often excels at scanning Parquet or local tables without manual indexes. PostgreSQL and MySQL are row-oriented systems where indexing, statistics, and table maintenance influence analytical queries. The same dbt model contract can therefore require different physical tuning.',
          'Use target-aware configurations sparingly and document why they exist. A logical fct_orders model should expose the same grain and fields everywhere, even if PostgreSQL adds an index and MySQL uses a different post-hook. Cross-engine parity concerns data meaning first, performance second.'
        ],
        codeExample: {
          title: 'Keep target-specific behavior explicit',
          language: 'jinja',
          filename: 'models/marts/fct_orders.sql',
          code: sql`{% set build_tags = ['orders', target.type] %}
{{ config(materialized='table', tags=build_tags) }}

select
    order_id,
    customer_id,
    ordered_at,
    net_order_amount
from {{ ref('int_orders_enriched') }}`
        },
        exercise: {
          prompt: 'Create a query that represents the same selective workload on every engine: delivered orders for one customer in June.',
          starterSql: sql`select
    -- stable contract
from {{ ref('fct_orders') }}
where customer_id = -- value
  and order_status = -- value
  and ordered_at >= -- start
  and ordered_at < -- end`,
          solutionSql: sql`select
    order_id,
    customer_id,
    ordered_at,
    net_order_amount
from {{ ref('fct_orders') }}
where customer_id = 1042
  and order_status = 'delivered'
  and ordered_at >= cast('2026-06-01' as timestamp)
  and ordered_at < cast('2026-07-01' as timestamp)`,
          expectedColumns: ['order_id', 'customer_id', 'ordered_at', 'net_order_amount'],
          hints: ['Keep the selected columns identical.', 'Use a half-open month boundary.', 'Tune the physical relation separately on each target.']
        },
        quiz: {
          question: 'What should stay stable across database adapters?',
          options: ['Every physical index', 'Every query plan node', 'Model grain and output semantics', 'Every date function spelling'],
          answerIndex: 2,
          explanation: 'Physical strategies vary, but consumers need the same logical contract and business meaning.'
        }
      },
      {
        id: 'm06-l04',
        number: '6.4',
        title: 'Lab: Benchmark Materialization Choices',
        minutes: 62,
        lab: true,
        engine: 'DuckDB',
        summary: 'Benchmark a repeated customer-order aggregation as a view and table, record build/query tradeoffs, and choose from evidence.',
        objectives: ['Design a fair materialization benchmark', 'Measure build and consumption time', 'Document a defensible decision'],
        explanation: [
          'Generate a sufficiently large order-items fixture and run the same analytical query against view and table variants. Warm-up effects, caching, and different row counts can invalidate a comparison, so use identical SQL, validate checksums, repeat runs, and report medians rather than one favorable timing.',
          'The decision includes more than speed. Tables consume storage and can become stale between builds; views stay logically current but repeatedly spend compute. Record workload frequency, service-level expectation, warehouse cost, and rebuild cadence beside the measurements.'
        ],
        codeExample: {
          title: 'Benchmark query at customer grain',
          language: 'sql',
          filename: 'analysis/benchmark_customer_rollup.sql',
          code: sql`select
    customer_id,
    count(*) as order_count,
    sum(net_order_amount) as lifetime_value
from {{ ref('fct_orders_benchmark') }}
group by customer_id
order by lifetime_value desc
limit 100`
        },
        exercise: {
          prompt: 'Write a checksum query that proves the view and table variants contain equivalent order-grain results before timing them.',
          starterSql: sql`select
    -- relation label,
    count(*) as row_count,
    sum(net_order_amount) as amount_checksum
from {{ ref('___') }}
union all
select
    -- relation label,
    count(*),
    sum(net_order_amount)
from {{ ref('___') }}`,
          solutionSql: sql`select
    'view' as relation_type,
    count(*) as row_count,
    sum(net_order_amount) as amount_checksum
from {{ ref('fct_orders_view') }}
union all
select
    'table' as relation_type,
    count(*) as row_count,
    sum(net_order_amount) as amount_checksum
from {{ ref('fct_orders_table') }}`,
          expectedColumns: ['relation_type', 'row_count', 'amount_checksum'],
          hints: ['Compare both cardinality and a business-value checksum.', 'UNION ALL preserves both result rows.', 'Only benchmark performance after equivalence passes.']
        },
        quiz: {
          question: 'Which result is sufficient for a fair materialization decision?',
          options: ['One fastest run', 'A repeated benchmark with equivalent outputs and stated workload', 'The default materialization', 'The relation with more rows'],
          answerIndex: 1,
          explanation: 'Repeated measurements plus correctness and workload context support a defensible engineering choice.'
        }
      }
    ]
  },
  {
    id: 'project-graph',
    number: 2,
    title: 'Projects, Sources & ref()',
    description: 'Turn isolated SQL files into a configured dependency graph with explicit raw-data sources and deterministic model references.',
    outcomes: ['Configure model paths and defaults', 'Declare and validate sources', 'Build a DAG with ref and source'],
    lessons: [
      {
        id: 'm02-l01',
        number: '2.1',
        title: 'Anatomy of a dbt Project',
        minutes: 24,
        lab: false,
        engine: 'Cross-database',
        summary: 'Understand dbt_project.yml, profiles, resources, paths, targets, and configuration precedence.',
        objectives: ['Identify the files dbt needs', 'Separate project configuration from credentials', 'Apply folder-level configurations'],
        explanation: [
          'dbt_project.yml belongs in version control and defines project behavior. profiles.yml contains environment-specific connection details and should normally stay outside the repository or be injected securely in CI. Models, tests, seeds, snapshots, macros, and analyses are separate resource types with distinct execution behavior.',
          'Configuration flows from project defaults to folder scopes and finally to resource-level config calls. Northstar defaults staging models to views and marts to tables, which expresses an architectural policy once instead of repeating it in every SQL file.'
        ],
        codeExample: {
          title: 'Folder-scoped model defaults',
          language: 'yaml',
          filename: 'dbt_project.yml',
          code: sql`name: northstar_shop
version: 1.0.0
config-version: 2
profile: northstar_shop
model-paths: ["models"]
models:
  northstar_shop:
    staging:
      +materialized: view
    marts:
      +materialized: table`
        },
        exercise: {
          prompt: 'Write the model configuration block that places staging models in schema stg and mart models in schema analytics.',
          starterSql: sql`models:
  northstar_shop:
    staging:
      # schema
    marts:
      # schema`,
          solutionSql: sql`models:
  northstar_shop:
    staging:
      +schema: stg
    marts:
      +schema: analytics`,
          expectedColumns: ['stg', 'analytics'],
          hints: ['Configurations in dbt_project.yml use a leading plus.', 'Scope each config beneath its folder name.', 'Schema configuration changes relation placement, not source SQL.']
        },
        quiz: {
          question: 'Which file should avoid committed production passwords?',
          options: ['dbt_project.yml', 'packages.yml', 'profiles.yml', 'models/schema.yml'],
          answerIndex: 2,
          explanation: 'Connection credentials belong in a local profile, environment variables, or a secrets manager rather than source control.'
        }
      },
      {
        id: 'm02-l02',
        number: '2.2',
        title: 'Lab: Declare and Test Sources',
        minutes: 48,
        lab: true,
        engine: 'DuckDB',
        summary: 'Describe Northstar raw tables as dbt sources, add freshness metadata, and replace hard-coded relation names with source().',
        objectives: ['Declare source relations in YAML', 'Use source() in model SQL', 'Apply source tests and freshness expectations'],
        explanation: [
          'A source declaration gives raw relations stable logical names and makes them visible in lineage. The database and schema can vary by environment while model SQL keeps calling source("northstar_raw", "orders"). Source tests establish assumptions at the platform boundary.',
          'Freshness measures the delay between the newest loaded_at value and the warehouse clock. It is not the same as event recency: a historical backfill may load today but contain old business events, so use a true ingestion timestamp for source freshness.'
        ],
        codeExample: {
          title: 'Orders source with freshness',
          language: 'yaml',
          filename: 'models/staging/_sources.yml',
          code: sql`version: 2
sources:
  - name: northstar_raw
    schema: raw
    loaded_at_field: _loaded_at
    freshness:
      warn_after: {count: 6, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: orders
        columns:
          - name: order_id
            data_tests: [not_null, unique]`
        },
        exercise: {
          prompt: 'Build a source declaration for raw.customers and query it through source() while exposing customer_id, email, and loaded timestamp.',
          starterSql: sql`select
    customer_id,
    -- email,
    -- loaded timestamp
from {{ source('northstar_raw', '___') }}`,
          solutionSql: sql`select
    customer_id,
    lower(trim(email)) as email,
    _loaded_at as loaded_at
from {{ source('northstar_raw', 'customers') }}`,
          expectedColumns: ['customer_id', 'email', 'loaded_at'],
          hints: ['Add customers beneath the same source tables list.', 'source takes the source name and table name.', 'Normalize email at the staging boundary.']
        },
        quiz: {
          question: 'Which timestamp best supports source freshness?',
          options: ['Customer birth date', 'Order business date', 'Warehouse ingestion timestamp', 'Model build start time'],
          answerIndex: 2,
          explanation: 'Freshness should measure when the source most recently arrived, so an ingestion timestamp is the reliable field.'
        }
      },
      {
        id: 'm02-l03',
        number: '2.3',
        title: 'Build the DAG with ref()',
        minutes: 26,
        lab: false,
        engine: 'Cross-database',
        summary: 'Use ref() to create dependency edges, resolve environment-specific relations, and select graph neighborhoods.',
        objectives: ['Replace hard-coded model names with ref()', 'Interpret upstream and downstream selectors', 'Explain why ref enables deterministic ordering'],
        explanation: [
          'ref("stg_orders") compiles to the correct physical relation for the active target and also records a dependency edge. dbt topologically sorts those edges, so an upstream model is ready before a downstream model starts. Hard-coded schema.table references bypass both capabilities.',
          'Graph selection makes large builds practical. stg_orders+ selects the model and all descendants; +fct_orders includes its ancestors; 2+fct_orders+1 limits traversal depth. Use dbt ls before an expensive build to verify exactly what a selector includes.'
        ],
        codeExample: {
          title: 'Join two referenced staging models',
          language: 'sql',
          filename: 'models/intermediate/int_orders_with_customers.sql',
          code: sql`select
    o.order_id,
    o.ordered_at,
    c.customer_id,
    c.customer_name
from {{ ref('stg_orders') }} as o
left join {{ ref('stg_customers') }} as c
  on o.customer_id = c.customer_id`
        },
        exercise: {
          prompt: 'Write a model that joins staged order items to staged products and computes line revenue.',
          starterSql: sql`select
    i.order_id,
    i.order_item_id,
    -- product attributes,
    -- line revenue
from {{ ref('___') }} as i
join {{ ref('___') }} as p
  on -- join key`,
          solutionSql: sql`select
    i.order_id,
    i.order_item_id,
    p.product_id,
    p.product_name,
    i.quantity * i.unit_price as gross_line_revenue
from {{ ref('stg_order_items') }} as i
join {{ ref('stg_products') }} as p
  on i.product_id = p.product_id`,
          expectedColumns: ['order_id', 'order_item_id', 'product_id', 'product_name', 'gross_line_revenue'],
          hints: ['Use ref for both staged relations.', 'Join on product_id.', 'Revenue at line grain is quantity multiplied by unit price.']
        },
        quiz: {
          question: 'What does dbt gain from ref() besides a rendered relation name?',
          options: ['Automatic source ingestion', 'A dependency edge in the DAG', 'A dashboard chart', 'A database user'],
          answerIndex: 1,
          explanation: 'ref records lineage, allowing dbt to order execution and apply graph-aware selection.'
        }
      },
      {
        id: 'm02-l04',
        number: '2.4',
        title: 'Lab: Seeds, Selectors, and Build Artifacts',
        minutes: 50,
        lab: true,
        engine: 'DuckDB',
        summary: 'Load a small country mapping seed, use it in the graph, run targeted builds, and inspect manifest and run results artifacts.',
        objectives: ['Use seeds for small version-controlled reference data', 'Preview graph selection with dbt ls', 'Read manifest.json and run_results.json'],
        explanation: [
          'Northstar maintains a small ISO country-to-region mapping as a CSV seed. Seeds are appropriate for slow-changing, reviewable reference data, not large operational extracts. Once loaded, ref("country_regions") treats the seed like any other graph node.',
          'manifest.json describes parsed resources, configurations, dependencies, and compiled metadata; run_results.json records execution outcomes and timing. These artifacts let orchestration and observability systems reason about dbt without scraping console output.'
        ],
        codeExample: {
          title: 'Reference a seed from a model',
          language: 'sql',
          filename: 'models/intermediate/int_customers_with_region.sql',
          code: sql`select
    c.customer_id,
    c.country_code,
    coalesce(r.region_name, 'Unknown') as region_name
from {{ ref('stg_customers') }} as c
left join {{ ref('country_regions') }} as r
  on c.country_code = r.country_code`
        },
        exercise: {
          prompt: 'Create a payment_method_groups seed and aggregate successful staged payments by its reporting group.',
          starterSql: sql`select
    -- reporting group,
    count(*) as payment_count,
    sum(p.amount) as paid_amount
from {{ ref('stg_payments') }} as p
left join {{ ref('payment_method_groups') }} as g
  on -- key
where -- successful only
group by -- reporting group`,
          solutionSql: sql`select
    coalesce(g.reporting_group, 'Other') as reporting_group,
    count(*) as payment_count,
    sum(p.amount) as paid_amount
from {{ ref('stg_payments') }} as p
left join {{ ref('payment_method_groups') }} as g
  on p.payment_method = g.payment_method
where p.payment_status = 'success'
group by coalesce(g.reporting_group, 'Other')`,
          expectedColumns: ['reporting_group', 'payment_count', 'paid_amount'],
          hints: ['The seed needs payment_method and reporting_group columns.', 'Run dbt seed before selecting the model.', 'Coalesce unmatched methods so they remain visible.']
        },
        quiz: {
          question: 'Which data is the best candidate for a dbt seed?',
          options: ['A billion-row clickstream', 'Hourly order CDC files', 'A 40-row country-to-region mapping', 'Customer passwords'],
          answerIndex: 2,
          explanation: 'Seeds are designed for small, static, version-controlled reference datasets.'
        }
      }
    ]
  },
  {
    id: 'staging',
    number: 3,
    title: 'Staging the Ecommerce Warehouse',
    description: 'Create disciplined, source-conformed staging models for realistic ecommerce entities and messy operational values.',
    outcomes: ['Apply staging conventions', 'Normalize types and values', 'Preserve grain while deduplicating source records'],
    lessons: [
      {
        id: 'm03-l01',
        number: '3.1',
        title: 'Build a staging model',
        minutes: 25,
        lab: false,
        engine: 'Cross-database',
        summary: 'Turn raw orders into a clean, trusted contract while keeping the source grain visible.',
        objectives: ['Apply rename-cast-recode staging rules', 'Separate cleanup from business logic', 'Use CTEs to make transformations reviewable'],
        explanation: [
          'A staging model is the clean interface to one source relation. It renames technical fields, casts types, normalizes simple codes, and removes ingestion-only columns. Revenue allocation, customer segmentation, and multi-entity joins belong later because mixing them into staging makes source changes harder to isolate.',
          'A predictable CTE structure—source, renamed, final—lets reviewers distinguish extraction from cleanup. Keep the original grain unless deduplication is required, name booleans with is_ or has_, and express timestamps in a consistent warehouse timezone.'
        ],
        codeExample: {
          title: 'A disciplined orders staging model',
          language: 'sql',
          filename: 'models/staging/stg_orders.sql',
          code: sql`with source as (
    select * from {{ source('northstar_raw', 'orders') }}
),
renamed as (
    select
        order_id,
        customer_id,
        cast(order_created_at as timestamp) as ordered_at,
        lower(trim(order_status)) as order_status,
        currency_code
    from source
)
select * from renamed`
        },
        exercise: {
          prompt: 'Stage products by renaming id, trimming the name, casting cents to a decimal price, and deriving an active boolean.',
          starterSql: sql`select
    id as -- key,
    -- clean name,
    -- cents to price,
    -- active flag
from {{ source('northstar_raw', 'products') }}`,
          solutionSql: sql`select
    id as product_id,
    trim(product_name) as product_name,
    cast(price_cents as decimal(18, 2)) / 100 as unit_price,
    lower(status) = 'active' as is_active
from {{ source('northstar_raw', 'products') }}`,
          expectedColumns: ['product_id', 'product_name', 'unit_price', 'is_active'],
          hints: ['Use a semantic key name ending in _id.', 'Divide cents only after a decimal cast.', 'A comparison can produce the boolean directly.']
        },
        quiz: {
          question: 'Which transformation least belongs in stg_orders?',
          options: ['Rename created_ts to ordered_at', 'Normalize status casing', 'Calculate customer lifetime value', 'Cast an identifier to text'],
          answerIndex: 2,
          explanation: 'Lifetime value combines business rules and multiple orders, so it belongs in an intermediate or mart model.'
        }
      },
      {
        id: 'm03-l02',
        number: '3.2',
        title: 'Lab: Stage Orders, Items, and Payments',
        minutes: 60,
        lab: true,
        engine: 'DuckDB',
        summary: 'Build the transactional staging layer while preserving order, line-item, and payment grains.',
        objectives: ['Create three source-aligned staging models', 'Normalize monetary and status fields', 'Validate row counts and keys after cleanup'],
        explanation: [
          'Orders, items, and payments represent different grains, so each gets its own staging model. The source stores money inconsistently: item prices use cents, while payment amounts arrive as decimal text. Explicit casts and clear column names prevent implicit coercion later.',
          'After staging, reconcile counts with raw data and test candidate keys. A model that silently filters failed payments would no longer be a faithful source interface; retain all valid source rows and let downstream models choose successful transactions.'
        ],
        codeExample: {
          title: 'Normalize payment records without filtering history',
          language: 'sql',
          filename: 'models/staging/stg_payments.sql',
          code: sql`select
    payment_id,
    order_id,
    lower(trim(payment_method)) as payment_method,
    lower(trim(payment_status)) as payment_status,
    cast(amount as decimal(18, 2)) as amount,
    cast(processed_at as timestamp) as processed_at
from {{ source('northstar_raw', 'payments') }}`
        },
        exercise: {
          prompt: 'Build stg_order_items at line-item grain and calculate gross_line_amount without aggregating.',
          starterSql: sql`select
    order_id,
    line_id as order_item_id,
    product_id,
    cast(quantity as integer) as quantity,
    -- unit price,
    -- line amount
from {{ source('northstar_raw', 'order_items') }}`,
          solutionSql: sql`select
    order_id,
    line_id as order_item_id,
    product_id,
    cast(quantity as integer) as quantity,
    cast(unit_price_cents as decimal(18, 2)) / 100 as unit_price,
    cast(quantity as integer)
        * cast(unit_price_cents as decimal(18, 2)) / 100 as gross_line_amount
from {{ source('northstar_raw', 'order_items') }}`,
          expectedColumns: ['order_id', 'order_item_id', 'product_id', 'quantity', 'unit_price', 'gross_line_amount'],
          hints: ['Do not group; preserve one row per line.', 'Cast before division to preserve cents.', 'The composite key is order_id plus order_item_id.']
        },
        quiz: {
          question: 'Why retain failed payment attempts in staging?',
          options: ['They increase revenue', 'Staging should faithfully expose valid source history', 'dbt cannot filter rows', 'Failed rows compile faster'],
          answerIndex: 1,
          explanation: 'Filtering business states belongs downstream; staging should not hide legitimate source events.'
        }
      },
      {
        id: 'm03-l03',
        number: '3.3',
        title: 'Deduplication and Late-Arriving Records',
        minutes: 32,
        lab: false,
        engine: 'Cross-database',
        summary: 'Resolve duplicate CDC records deterministically with window functions and reason about late-arriving events.',
        objectives: ['Deduplicate with row_number()', 'Define deterministic tie breakers', 'Distinguish event time from load time'],
        explanation: [
          'Northstar CDC can deliver several versions of an order. row_number partitions by the business key and sorts newest source updates first, then newest load timestamp. A second ordering field matters because equal update times otherwise produce nondeterministic winners.',
          'Late arrival means load order differs from business-event order. Use updated_at to choose the newest entity state and _loaded_at to break ties or measure ingestion. Do not globally discard old event dates: legitimate corrections and backfills often refer to the past.'
        ],
        codeExample: {
          title: 'Select one deterministic version per order',
          language: 'sql',
          filename: 'models/staging/stg_orders.sql',
          code: sql`with ranked as (
    select
        *,
        row_number() over (
            partition by order_id
            order by updated_at desc, _loaded_at desc
        ) as version_rank
    from {{ source('northstar_raw', 'orders') }}
)
select * exclude (version_rank)
from ranked
where version_rank = 1`
        },
        exercise: {
          prompt: 'Deduplicate customer CDC rows, preferring the latest updated_at and then the highest ingestion_sequence.',
          starterSql: sql`with ranked as (
    select
        *,
        row_number() over (
            partition by -- key
            order by -- tie breakers
        ) as row_num
    from {{ source('northstar_raw', 'customers') }}
)
select -- fields
from ranked
where -- winner`,
          solutionSql: sql`with ranked as (
    select
        *,
        row_number() over (
            partition by customer_id
            order by updated_at desc, ingestion_sequence desc
        ) as row_num
    from {{ source('northstar_raw', 'customers') }}
)
select customer_id, email, country_code, updated_at
from ranked
where row_num = 1`,
          expectedColumns: ['customer_id', 'email', 'country_code', 'updated_at'],
          hints: ['Partition by the entity business key.', 'Sort both tie breakers descending.', 'Filter row_num after the window is calculated.']
        },
        quiz: {
          question: 'What makes a deduplication order deterministic?',
          options: ['Ordering only by a frequently tied timestamp', 'Using distinct on every column', 'Adding sufficient tie breakers to select one stable winner', 'Running with one thread'],
          answerIndex: 2,
          explanation: 'A complete ordering rule ensures the same source state wins every time the model is rebuilt.'
        }
      },
      {
        id: 'm03-l04',
        number: '3.4',
        title: 'Lab: Cross-Database Staging',
        minutes: 55,
        lab: true,
        engine: 'Cross-database',
        summary: 'Adapt staging SQL for DuckDB, PostgreSQL, and MySQL while keeping the model contract stable.',
        objectives: ['Identify SQL dialect differences', 'Use dbt abstractions where practical', 'Verify equivalent output schemas across adapters'],
        explanation: [
          'Portable models avoid unnecessary adapter-specific syntax, but warehouses differ in date arithmetic, boolean representation, JSON functions, and column exclusion. Northstar keeps the output contract fixed while dispatching only the expressions that genuinely vary.',
          'Start with ANSI-style casts, CASE, joins, and window functions. When a dialect difference remains, hide it behind a macro and test outputs on every supported target. Portability is a verified behavior, not an assumption based on SQL looking generic.'
        ],
        codeExample: {
          title: 'A portable active flag',
          language: 'sql',
          filename: 'models/staging/stg_products.sql',
          code: sql`select
    product_id,
    product_name,
    case
        when lower(status) = 'active' then 1
        else 0
    end as is_active_int
from {{ source('northstar_raw', 'products') }}`
        },
        exercise: {
          prompt: 'Write a portable staged shipments query that derives delivered_at and an integer delivered flag without database-specific functions.',
          starterSql: sql`select
    shipment_id,
    order_id,
    cast(delivered_ts as timestamp) as delivered_at,
    case
        when -- condition then -- value
        else -- value
    end as is_delivered_int
from {{ source('northstar_raw', 'shipments') }}`,
          solutionSql: sql`select
    shipment_id,
    order_id,
    cast(delivered_ts as timestamp) as delivered_at,
    case
        when delivered_ts is not null then 1
        else 0
    end as is_delivered_int
from {{ source('northstar_raw', 'shipments') }}`,
          expectedColumns: ['shipment_id', 'order_id', 'delivered_at', 'is_delivered_int'],
          hints: ['CASE is portable across all three engines.', 'Use nullness rather than a vendor boolean cast.', 'Keep the aliases identical on every target.']
        },
        quiz: {
          question: 'What is the safest response to a necessary dialect difference?',
          options: ['Copy the entire project per database', 'Ignore it until production', 'Isolate it in a dispatched macro and test each adapter', 'Convert every model to Python'],
          answerIndex: 2,
          explanation: 'A small adapter-dispatched abstraction contains dialect differences while preserving one model contract.'
        }
      }
    ]
  },
  {
    id: 'incremental',
    number: 7,
    title: 'Incremental Models at Scale',
    description: 'Process changing warehouse data efficiently without sacrificing correctness, idempotency, or recoverability.',
    outcomes: ['Design an incremental boundary', 'Handle updates and late data', 'Operate full-refresh and recovery paths'],
    lessons: [
      {
        id: 'm07-l01',
        number: '7.1',
        title: 'Incremental Mechanics and Idempotency',
        minutes: 33,
        lab: false,
        engine: 'Cross-database',
        summary: 'Understand is_incremental(), unique keys, adapter strategies, target-aware filters, and the conditions for repeatable updates.',
        objectives: ['Explain the first and subsequent build paths', 'Choose a stable unique key', 'Write an idempotent incremental transformation'],
        explanation: [
          'is_incremental() is true only when the model is configured as incremental, the target relation already exists, and full refresh is not requested. SQL outside the conditional runs on every path, so the complete query must remain valid both with and without the filter.',
          'A unique_key tells update-capable strategies how to match incoming records to existing rows. It must reflect model grain and remain non-null. Reprocessing the same input should produce the same target state; nondeterministic values or append-only handling of mutable entities violate that idempotency.'
        ],
        codeExample: {
          title: 'Filter mutable orders with a lookback anchor',
          language: 'sql',
          filename: 'models/marts/fct_orders.sql',
          code: sql`{{ config(materialized='incremental', unique_key='order_id') }}

select *
from {{ ref('int_orders_enriched') }}
{% if is_incremental() %}
where updated_at >= (
    select max(updated_at) - interval '3 day' from {{ this }}
)
{% endif %}`
        },
        exercise: {
          prompt: 'Configure an incremental payment fact at payment_id grain and filter new builds using processed_at from the current target.',
          starterSql: sql`{{ config(
    materialized='___',
    unique_key='___'
) }}
select *
from {{ ref('stg_payments') }}
{% if is_incremental() %}
where processed_at >= (select -- anchor from {{ this }})
{% endif %}`,
          solutionSql: sql`{{ config(
    materialized='incremental',
    unique_key='payment_id'
) }}
select *
from {{ ref('stg_payments') }}
{% if is_incremental() %}
where processed_at >= (select max(processed_at) from {{ this }})
{% endif %}`,
          expectedColumns: ['payment_id', 'order_id', 'payment_method', 'payment_status', 'amount', 'processed_at'],
          hints: ['The model grain determines unique_key.', 'Reference the existing target with {{ this }}.', 'Keep the model valid when the conditional is omitted.']
        },
        quiz: {
          question: 'When is is_incremental() false?',
          options: ['The target exists during a normal incremental run', 'A full refresh is requested', 'The model has a unique key', 'The source has new rows'],
          answerIndex: 1,
          explanation: 'A full refresh deliberately disables the incremental branch and rebuilds the relation from all selected input.'
        }
      },
      {
        id: 'm07-l02',
        number: '7.2',
        title: 'Lab: Build a Merge-Based Order Fact',
        minutes: 68,
        lab: true,
        engine: 'PostgreSQL',
        summary: 'Implement an order fact that updates changed orders, inserts new ones, and reconciles an incremental build with a full rebuild.',
        objectives: ['Implement a merge-capable incremental fact', 'Test updates and inserts', 'Compare incremental and full-refresh checksums'],
        explanation: [
          'Orders can change from pending to paid to shipped, so append-only behavior is incorrect. Configure order_id as the unique key and select a rolling window of updated records. The adapter materialization then replaces matching target rows and inserts unseen keys.',
          'The lab mutates source statuses and adds orders after the first build. Validate both cases, then build the same logic into a scratch full-refresh target and compare row count, key count, and financial checksum. Incremental performance is valuable only when it converges to the full model truth.'
        ],
        codeExample: {
          title: 'Incremental order fact configuration',
          language: 'sql',
          filename: 'models/marts/fct_orders.sql',
          code: sql`{{ config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    on_schema_change='fail'
) }}

select
    order_id,
    customer_id,
    order_status,
    net_order_amount,
    updated_at
from {{ ref('int_orders_enriched') }}`
        },
        exercise: {
          prompt: 'Add a three-day lookback filter and a non-null fallback for an empty existing target.',
          starterSql: sql`{% if is_incremental() %}
where updated_at >= (
    select -- safe maximum with lookback
    from {{ this }}
)
{% endif %}`,
          solutionSql: sql`{% if is_incremental() %}
where updated_at >= (
    select coalesce(
        max(updated_at) - interval '3 day',
        cast('1900-01-01' as timestamp)
    )
    from {{ this }}
)
{% endif %}`,
          expectedColumns: ['order_id', 'customer_id', 'order_status', 'net_order_amount', 'updated_at'],
          hints: ['Subtract the lookback from max(updated_at).', 'max is null for an empty relation.', 'Coalesce to a timestamp old enough to include all records.']
        },
        quiz: {
          question: 'Why is append-only inappropriate for mutable orders?',
          options: ['It cannot insert new orders', 'It creates another row for each changed version instead of updating order grain', 'It always drops the table', 'It requires no timestamp'],
          answerIndex: 1,
          explanation: 'An order-grain fact expects one current row per order, so changed keys must update or replace existing rows.'
        }
      },
      {
        id: 'm07-l03',
        number: '7.3',
        title: 'Late Data, Lookbacks, and Schema Evolution',
        minutes: 36,
        lab: false,
        engine: 'Cross-database',
        summary: 'Balance scan reduction with late-arriving correctness and choose explicit behavior for upstream schema changes.',
        objectives: ['Size a lookback from observed latency', 'Explain entropy in incremental targets', 'Choose an on_schema_change policy'],
        explanation: [
          'A max-timestamp filter misses events that arrive late with an older business timestamp. A rolling lookback reprocesses recent history and merge removes duplicates, trading extra scan volume for lower error probability. Size it from arrival-latency distributions and business tolerance, not a copied constant.',
          'No finite window guarantees correction of arbitrarily late records, so schedule periodic reconciliation or full refreshes. on_schema_change can ignore, append columns, sync columns, or fail depending on adapter support. Failing is a safe default for governed facts because silent contract drift reaches consumers quickly.'
        ],
        codeExample: {
          title: 'Measure arrival latency before choosing a window',
          language: 'sql',
          filename: 'analysis/payment_arrival_latency.sql',
          code: sql`select
    date_diff('day', processed_at, _loaded_at) as latency_days,
    count(*) as payment_count
from {{ source('northstar_raw', 'payments') }}
group by date_diff('day', processed_at, _loaded_at)
order by latency_days`
        },
        exercise: {
          prompt: 'Calculate the percentage of payments that arrived more than three days after processing to assess a proposed lookback.',
          starterSql: sql`select
    -- late count,
    -- total count,
    -- percentage
from {{ source('northstar_raw', 'payments') }}`,
          solutionSql: sql`select
    sum(case when _loaded_at > processed_at + interval '3 day' then 1 else 0 end) as late_payment_count,
    count(*) as total_payment_count,
    100.0 * sum(case when _loaded_at > processed_at + interval '3 day' then 1 else 0 end)
        / nullif(count(*), 0) as late_payment_pct
from {{ source('northstar_raw', 'payments') }}`,
          expectedColumns: ['late_payment_count', 'total_payment_count', 'late_payment_pct'],
          hints: ['Compare load time with event time plus three days.', 'Conditional aggregation counts late rows.', 'Protect percentage division with nullif.']
        },
        quiz: {
          question: 'What does a finite incremental lookback guarantee?',
          options: ['All late records are captured forever', 'Records inside the window can be reconsidered', 'Source schemas never change', 'A full refresh is unnecessary'],
          answerIndex: 1,
          explanation: 'A lookback improves recovery within its window but cannot catch arbitrarily old late arrivals.'
        }
      },
      {
        id: 'm07-l04',
        number: '7.4',
        title: 'Lab: Reconcile and Recover an Incremental Model',
        minutes: 70,
        lab: true,
        engine: 'DuckDB',
        summary: 'Detect intentionally missed late payments, backfill a bounded period, and document a safe full-refresh recovery runbook.',
        objectives: ['Write source-to-target reconciliation checks', 'Perform a bounded backfill', 'Define a production-safe recovery sequence'],
        explanation: [
          'The fixture includes a payment loaded today with a processed_at value ten days old, beyond the current three-day window. Aggregate source and target by processing date to identify the earliest divergence. Reconciliation should compare counts and sums, since one can match while the other does not.',
          'For recovery, widen the predicate through a controlled variable or run a full refresh in an isolated schema before swapping. Estimate runtime, preserve the prior relation, communicate freshness impact, and validate checksums before promotion. A bare production full refresh is a command, not a runbook.'
        ],
        codeExample: {
          title: 'Daily reconciliation by independent paths',
          language: 'sql',
          filename: 'tests/reconcile_payment_fact.sql',
          code: sql`with source_daily as (
    select cast(processed_at as date) as payment_date,
           count(*) as source_count, sum(amount) as source_amount
    from {{ ref('stg_payments') }}
    group by cast(processed_at as date)
), target_daily as (
    select payment_date, count(*) as target_count, sum(amount) as target_amount
    from {{ ref('fct_payments') }}
    group by payment_date
)
select *
from source_daily s
left join target_daily t using (payment_date)
where s.source_count <> coalesce(t.target_count, 0)
   or s.source_amount <> coalesce(t.target_amount, 0)`
        },
        exercise: {
          prompt: 'Parameterize the incremental lookback with var("lookback_days", 3) so an operator can run a bounded ten-day recovery.',
          starterSql: sql`{% set lookback_days = var('___', ___) %}
{% if is_incremental() %}
where processed_at >= (
    select max(processed_at) - -- parameterized interval
    from {{ this }}
)
{% endif %}`,
          solutionSql: sql`{% set lookback_days = var('lookback_days', 3) %}
{% if is_incremental() %}
where processed_at >= (
    select max(processed_at) - (interval '1 day' * {{ lookback_days }})
    from {{ this }}
)
{% endif %}`,
          expectedColumns: ['payment_id', 'order_id', 'amount', 'processed_at'],
          hints: ['Give the variable a safe default.', 'Multiply a one-day interval by the integer.', 'The recovery invocation can pass --vars {lookback_days: 10}.']
        },
        quiz: {
          question: 'What should happen before replacing production with a rebuilt incremental fact?',
          options: ['Delete the previous relation immediately', 'Validate the isolated rebuild against independent checksums', 'Disable all tests', 'Shorten the lookback'],
          answerIndex: 1,
          explanation: 'An isolated and reconciled rebuild reduces downtime and preserves a rollback path.'
        }
      }
    ]
  },
  {
    id: 'snapshots',
    number: 8,
    title: 'Snapshots & Slowly Changing Dimensions',
    description: 'Capture mutable source history, query validity intervals, and turn customer changes into a reliable type-2 dimension.',
    outcomes: ['Choose a snapshot strategy', 'Interpret validity metadata', 'Join facts to historical dimension state'],
    lessons: [
      {
        id: 'm08-l01',
        number: '8.1',
        title: 'Snapshot Strategies and History',
        minutes: 30,
        lab: false,
        engine: 'Cross-database',
        summary: 'Compare timestamp and check strategies and understand how dbt stores changing entity versions.',
        objectives: ['Explain type-2 history', 'Choose timestamp or check strategy', 'Identify a trustworthy unique key'],
        explanation: [
          'Operational customer rows overwrite country, tier, and email values. A snapshot records a new version when tracked state changes and closes the prior validity interval. The unique key identifies the entity across time; it does not make the snapshot table unique because multiple versions are expected.',
          'The timestamp strategy is preferred when updated_at is reliable because new source columns do not require expanding check_cols. The check strategy compares selected values and is useful when no dependable change timestamp exists, but every tracked business field must be maintained intentionally.'
        ],
        codeExample: {
          title: 'Timestamp-based customer snapshot',
          language: 'sql',
          filename: 'snapshots/customers_snapshot.yml',
          code: sql`snapshots:
  - name: customers_snapshot
    relation: source('northstar_raw', 'customers')
    config:
      schema: snapshots
      unique_key: customer_id
      strategy: timestamp
      updated_at: updated_at`
        },
        exercise: {
          prompt: 'Configure a product snapshot using the check strategy for name, category, price, and status.',
          starterSql: sql`snapshots:
  - name: products_snapshot
    relation: source('northstar_raw', 'products')
    config:
      schema: snapshots
      unique_key: ___
      strategy: ___
      check_cols: [___]`,
          solutionSql: sql`snapshots:
  - name: products_snapshot
    relation: source('northstar_raw', 'products')
    config:
      schema: snapshots
      unique_key: product_id
      strategy: check
      check_cols: [product_name, category, price_cents, status]`,
          expectedColumns: ['product_id', 'product_name', 'category', 'price_cents', 'status'],
          hints: ['The stable entity key is product_id.', 'Use strategy: check when no reliable updated_at exists.', 'List every business attribute whose change needs history.']
        },
        quiz: {
          question: 'When is the timestamp strategy usually preferable?',
          options: ['A reliable updated_at exists', 'There is no entity key', 'Every run should create a version', 'The source is append-only facts'],
          answerIndex: 0,
          explanation: 'A trustworthy update timestamp provides efficient, maintainable change detection for mutable entities.'
        }
      },
      {
        id: 'm08-l02',
        number: '8.2',
        title: 'Validity Intervals and Point-in-Time Joins',
        minutes: 34,
        lab: false,
        engine: 'Cross-database',
        summary: 'Interpret dbt_valid_from, dbt_valid_to, and current records, then join facts to the dimension version valid at event time.',
        objectives: ['Query current and historical versions', 'Write a half-open interval join', 'Detect overlapping validity ranges'],
        explanation: [
          'Snapshot rows expose a validity interval. Treat it as half-open: valid_from is inclusive and valid_to is exclusive, while a null valid_to identifies the current version under the default configuration. This boundary prevents one event from matching two adjacent versions.',
          'A current-state join answers where the customer belongs now; a point-in-time join answers which tier or country applied when an order occurred. Finance and attribution often require the latter. Test that validity ranges for one key never overlap, or a fact can fan out across versions.'
        ],
        codeExample: {
          title: 'Join an order to its historical customer version',
          language: 'sql',
          filename: 'models/intermediate/int_orders_customer_history.sql',
          code: sql`select
    o.order_id,
    o.ordered_at,
    c.customer_tier,
    c.country_code
from {{ ref('stg_orders') }} o
join {{ ref('customers_snapshot') }} c
  on o.customer_id = c.customer_id
 and o.ordered_at >= c.dbt_valid_from
 and (o.ordered_at < c.dbt_valid_to or c.dbt_valid_to is null)`
        },
        exercise: {
          prompt: 'Return the current version of each customer with a stable current-record flag.',
          starterSql: sql`select
    customer_id,
    customer_tier,
    country_code,
    -- flag
from {{ ref('customers_snapshot') }}
where -- current`,
          solutionSql: sql`select
    customer_id,
    customer_tier,
    country_code,
    1 as is_current
from {{ ref('customers_snapshot') }}
where dbt_valid_to is null`,
          expectedColumns: ['customer_id', 'customer_tier', 'country_code', 'is_current'],
          hints: ['The open-ended version has no valid-to boundary.', 'Filter before exposing a simple flag.', 'The output returns one row per customer if source keys are sound.']
        },
        quiz: {
          question: 'Why use an exclusive dbt_valid_to boundary?',
          options: ['To drop the newest version', 'To prevent an event on a change boundary matching two versions', 'To make dates nullable', 'To remove the unique key'],
          answerIndex: 1,
          explanation: 'Half-open intervals assign the exact transition instant to only the new version.'
        }
      },
      {
        id: 'm08-l03',
        number: '8.3',
        title: 'Lab: Build Customer History',
        minutes: 65,
        lab: true,
        engine: 'PostgreSQL',
        summary: 'Run repeated customer snapshots, mutate realistic source attributes, and produce both current and point-in-time dimensions.',
        objectives: ['Execute and inspect snapshot versions', 'Build a current customer dimension', 'Attribute historical orders correctly'],
        explanation: [
          'Run the customer snapshot, change one customer from Bronze to Gold and another from US to CA, advance updated_at, and run it again. Verify that old versions close and new versions open without changing customers whose tracked state stayed constant.',
          'Build dim_customers_current for operational reporting and int_orders_customer_history for historical attribution. Compare a current-country revenue report with an order-time-country report; both may be valid, but the metric definition must say which question it answers.'
        ],
        codeExample: {
          title: 'Current customer dimension from snapshot history',
          language: 'sql',
          filename: 'models/marts/dim_customers_current.sql',
          code: sql`{{ config(materialized='table') }}

select
    customer_id,
    customer_name,
    customer_tier,
    country_code,
    dbt_valid_from as current_since
from {{ ref('customers_snapshot') }}
where dbt_valid_to is null`
        },
        exercise: {
          prompt: 'Aggregate net order revenue by the customer tier valid when each order occurred.',
          starterSql: sql`select
    -- historical tier,
    count(*) as order_count,
    sum(o.net_order_amount) as net_revenue
from {{ ref('fct_orders') }} o
join {{ ref('customers_snapshot') }} c
  on -- entity key
 and -- lower validity bound
 and -- upper validity bound
group by -- tier`,
          solutionSql: sql`select
    c.customer_tier,
    count(*) as order_count,
    sum(o.net_order_amount) as net_revenue
from {{ ref('fct_orders') }} o
join {{ ref('customers_snapshot') }} c
  on o.customer_id = c.customer_id
 and o.ordered_at >= c.dbt_valid_from
 and (o.ordered_at < c.dbt_valid_to or c.dbt_valid_to is null)
group by c.customer_tier`,
          expectedColumns: ['customer_tier', 'order_count', 'net_revenue'],
          hints: ['Join on both customer key and time.', 'Use the half-open validity interval.', 'Group by the historical tier, not the current dimension.']
        },
        quiz: {
          question: 'Which report requires a point-in-time customer join?',
          options: ['Current customer contact list', 'Revenue by tier as classified on order date', 'Count of current Gold customers', 'Latest customer country'],
          answerIndex: 1,
          explanation: 'Historical attribution must use the dimension version valid when the fact event occurred.'
        }
      }
    ]
  },
  {
    id: 'marts-metrics',
    number: 9,
    title: 'Marts, Facts, Dimensions & Metrics',
    description: 'Turn conformed transformations into a star schema and define trustworthy ecommerce metrics at explicit grains.',
    outcomes: ['Design facts and dimensions', 'Prevent aggregation fanout', 'Define governed metrics and dimensions'],
    lessons: [
      {
        id: 'm09-l01',
        number: '9.1',
        title: 'Dimensional Modeling for Ecommerce',
        minutes: 36,
        lab: false,
        engine: 'Cross-database',
        summary: 'Design order and order-item facts, conformed dimensions, surrogate keys, and additive measures from business processes.',
        objectives: ['Choose fact grain before measures', 'Separate facts from descriptive dimensions', 'Classify additive and non-additive metrics'],
        explanation: [
          'A fact table represents a measurable business process at a declared grain. fct_orders contains one row per order; fct_order_items contains one row per line. Customer, product, and date dimensions provide descriptive slicing. Mixing both fact grains in one relation invites duplicated order-level values.',
          'Revenue is additive across orders and time, while conversion rate and average order value must be recomputed from component measures. Stable surrogate keys can standardize compound natural keys and unknown members, but they do not replace testing the underlying business key.'
        ],
        codeExample: {
          title: 'Order-grain fact from aligned components',
          language: 'sql',
          filename: 'models/marts/fct_orders.sql',
          code: sql`select
    o.order_id,
    o.customer_id,
    cast(o.ordered_at as date) as order_date,
    o.order_status,
    i.gross_order_amount,
    coalesce(p.paid_amount, 0) as paid_amount,
    i.gross_order_amount - coalesce(o.discount_amount, 0) as net_order_amount
from {{ ref('stg_orders') }} o
join {{ ref('int_items_by_order') }} i using (order_id)
left join {{ ref('int_payments_by_order') }} p using (order_id)`
        },
        exercise: {
          prompt: 'Build a product dimension with a generated surrogate key and an explicit unknown-category fallback.',
          starterSql: sql`select
    {{ dbt_utils.generate_surrogate_key([___]) }} as product_key,
    product_id,
    product_name,
    coalesce(category, ___) as category,
    unit_price
from {{ ref('stg_products') }}`,
          solutionSql: sql`select
    {{ dbt_utils.generate_surrogate_key(['product_id']) }} as product_key,
    product_id,
    product_name,
    coalesce(category, 'Unknown') as category,
    unit_price
from {{ ref('stg_products') }}`,
          expectedColumns: ['product_key', 'product_id', 'product_name', 'category', 'unit_price'],
          hints: ['Generate the key from stable business identifiers.', 'Pass column expressions as strings to the macro.', 'Do not leave missing categories as ambiguous nulls.']
        },
        quiz: {
          question: 'Where should unit-level product quantity usually live?',
          options: ['dim_customers', 'fct_order_items', 'dim_date', 'A source freshness result'],
          answerIndex: 1,
          explanation: 'Quantity is a measure of the order-line business process and belongs at line-item grain.'
        }
      },
      {
        id: 'm09-l02',
        number: '9.2',
        title: 'Metrics, Semantic Meaning, and Time',
        minutes: 35,
        lab: false,
        engine: 'Cross-database',
        summary: 'Specify measures, dimensions, entities, time grains, filters, and metric formulas so teams compute KPIs consistently.',
        objectives: ['Define metric components explicitly', 'Choose an event-time dimension', 'Protect ratios from incompatible grains'],
        explanation: [
          'Net revenue needs a measure expression, order-grain entity, order-date time dimension, currency policy, and status inclusion rule. A name alone is not a definition. Semantic-layer configuration makes those decisions reusable and exposes valid joins and groupings to downstream tools.',
          'Ratio metrics should aggregate numerator and denominator independently before division. Average order value is sum(net_order_amount) divided by distinct completed orders, not an average of pre-aggregated daily averages. Time-zone and late-data policies are part of metric semantics.'
        ],
        codeExample: {
          title: 'A semantic model for order measures',
          language: 'yaml',
          filename: 'models/marts/semantic_models.yml',
          code: sql`semantic_models:
  - name: orders
    model: ref('fct_orders')
    defaults:
      agg_time_dimension: ordered_at
    entities:
      - name: order
        type: primary
        expr: order_id
    dimensions:
      - name: ordered_at
        type: time
        type_params: {time_granularity: day}
    measures:
      - name: net_revenue
        agg: sum
        expr: net_order_amount`
        },
        exercise: {
          prompt: 'Write a SQL reference calculation for monthly average order value using delivered orders only.',
          starterSql: sql`select
    -- month,
    -- net revenue divided by orders
from {{ ref('fct_orders') }}
where -- delivered
group by -- month`,
          solutionSql: sql`select
    date_trunc('month', ordered_at) as order_month,
    sum(net_order_amount) / nullif(count(distinct order_id), 0) as average_order_value
from {{ ref('fct_orders') }}
where order_status = 'delivered'
group by date_trunc('month', ordered_at)`,
          expectedColumns: ['order_month', 'average_order_value'],
          hints: ['Filter the eligible order population first.', 'Aggregate revenue and distinct orders at the month grain.', 'Use nullif to protect division.']
        },
        quiz: {
          question: 'Why is averaging daily average order values usually wrong for a monthly metric?',
          options: ['SQL cannot average decimals', 'Days have different order counts and need weighting', 'date_trunc removes revenue', 'Distinct keys are not allowed'],
          answerIndex: 1,
          explanation: 'An average of averages weights each day equally rather than each order, producing bias when daily volumes differ.'
        }
      },
      {
        id: 'm09-l03',
        number: '9.3',
        title: 'Lab: Build the Northstar Star Schema',
        minutes: 80,
        lab: true,
        engine: 'DuckDB',
        summary: 'Build and validate order facts plus customer, product, and date dimensions, then answer a stakeholder revenue question.',
        objectives: ['Assemble a tested star schema', 'Reconcile fact measures to staging', 'Query a mart without fanout'],
        explanation: [
          'Build dim_customers, dim_products, dim_date, fct_orders, and fct_order_items. Every model declares grain, owner, and core tests. Facts keep business keys for traceability while also exposing dimension keys used by downstream joins.',
          'Reconcile gross line revenue to staged items and paid amount to successful payments before answering the commercial question. The final query reports monthly net revenue, distinct customers, orders, and average order value by customer region without joining order-level payment totals to line grain.'
        ],
        codeExample: {
          title: 'A safe regional monthly mart query',
          language: 'sql',
          filename: 'models/marts/rpt_monthly_region.sql',
          code: sql`select
    date_trunc('month', f.ordered_at) as order_month,
    c.region_name,
    count(distinct f.order_id) as order_count,
    count(distinct f.customer_id) as customer_count,
    sum(f.net_order_amount) as net_revenue
from {{ ref('fct_orders') }} f
join {{ ref('dim_customers') }} c using (customer_id)
where f.order_status <> 'cancelled'
group by date_trunc('month', f.ordered_at), c.region_name`
        },
        exercise: {
          prompt: 'Extend the regional monthly result with average_order_value and revenue_per_customer while preserving its grain.',
          starterSql: sql`select
    date_trunc('month', f.ordered_at) as order_month,
    c.region_name,
    sum(f.net_order_amount) as net_revenue,
    -- AOV,
    -- revenue per customer
from {{ ref('fct_orders') }} f
join {{ ref('dim_customers') }} c using (customer_id)
where f.order_status <> 'cancelled'
group by date_trunc('month', f.ordered_at), c.region_name`,
          solutionSql: sql`select
    date_trunc('month', f.ordered_at) as order_month,
    c.region_name,
    sum(f.net_order_amount) as net_revenue,
    sum(f.net_order_amount) / nullif(count(distinct f.order_id), 0) as average_order_value,
    sum(f.net_order_amount) / nullif(count(distinct f.customer_id), 0) as revenue_per_customer
from {{ ref('fct_orders') }} f
join {{ ref('dim_customers') }} c using (customer_id)
where f.order_status <> 'cancelled'
group by date_trunc('month', f.ordered_at), c.region_name`,
          expectedColumns: ['order_month', 'region_name', 'net_revenue', 'average_order_value', 'revenue_per_customer'],
          hints: ['Keep all measures derived from order-grain rows.', 'Use distinct entities in each denominator.', 'The GROUP BY remains month plus region.']
        },
        quiz: {
          question: 'Which validation most directly protects the star schema revenue?',
          options: ['The README has a diagram', 'Fact totals reconcile to independently aggregated staged transactions', 'Every model is a table', 'All dimensions have the same row count'],
          answerIndex: 1,
          explanation: 'Independent reconciliation verifies that transformations preserved the financial measures through the graph.'
        }
      }
    ]
  },
  {
    id: 'docs-lineage',
    number: 10,
    title: 'Documentation, Contracts & Lineage',
    description: 'Publish model meaning, ownership, constraints, and end-to-end lineage as deployable engineering metadata.',
    outcomes: ['Write useful resource documentation', 'Enforce model contracts', 'Use artifacts and exposures for impact analysis'],
    lessons: [
      {
        id: 'm10-l01',
        number: '10.1',
        title: 'Documentation that Answers Engineering Questions',
        minutes: 29,
        lab: false,
        engine: 'Cross-database',
        summary: 'Document purpose, grain, ownership, update behavior, and column semantics where dbt can compile and publish them.',
        objectives: ['Write model and column descriptions', 'Reuse doc blocks without losing specificity', 'Include grain and operational context'],
        explanation: [
          'Useful documentation answers what one row means, who owns the model, how often it changes, which business rules it applies, and how sensitive fields should be used. “Contains order data” does none of that. Treat descriptions as part of the reviewed model contract.',
          'YAML keeps metadata beside resources, while doc blocks reuse longer concepts such as the Northstar net-revenue policy. Reuse shared definitions carefully: a copied phrase should not erase model-specific caveats such as excluded cancellations or point-in-time customer attribution.'
        ],
        codeExample: {
          title: 'Document grain, owner, and a financial measure',
          language: 'yaml',
          filename: 'models/marts/_marts.yml',
          code: sql`version: 2
models:
  - name: fct_orders
    description: One row per order, including cancelled orders for operational reconciliation.
    config:
      meta:
        owner: data-platform
        contains_pii: false
    columns:
      - name: order_id
        description: Stable operational order identifier and model grain key.
      - name: net_order_amount
        description: Gross item amount less order discounts, in order currency.`
        },
        exercise: {
          prompt: 'Write documentation metadata for dim_customers_current including its grain, owner, PII flag, and email meaning.',
          starterSql: sql`models:
  - name: dim_customers_current
    description: ___
    config:
      meta:
        owner: ___
        contains_pii: ___
    columns:
      - name: email
        description: ___`,
          solutionSql: sql`models:
  - name: dim_customers_current
    description: One row per customer containing the latest known descriptive attributes.
    config:
      meta:
        owner: customer-analytics
        contains_pii: true
    columns:
      - name: email
        description: Normalized current contact email; restricted to approved operational use.`,
          expectedColumns: ['customer_id', 'email', 'customer_tier', 'country_code'],
          hints: ['State “one row per customer” explicitly.', 'Use a team rather than an individual as owner.', 'Email is personally identifiable information and needs a usage note.']
        },
        quiz: {
          question: 'Which description is most useful for a fact model?',
          options: ['Order stuff', 'A table made by dbt', 'One row per order with cancellation and currency rules stated', 'Do not delete'],
          answerIndex: 2,
          explanation: 'Grain and business-policy details let consumers interpret and safely aggregate the model.'
        }
      },
      {
        id: 'm10-l02',
        number: '10.2',
        title: 'Contracts, Exposures, and Artifact Lineage',
        minutes: 35,
        lab: false,
        engine: 'Cross-database',
        summary: 'Enforce output names and data types, register downstream consumers, and use manifest metadata for impact analysis.',
        objectives: ['Enable a model contract', 'Declare a dashboard exposure', 'Trace dependencies through manifest.json'],
        explanation: [
          'An enforced contract validates that a model emits declared columns with compatible types before replacement. It protects interface shape, while data tests protect row-level values. Contract changes require deliberate versioning or coordinated consumer migration; they should not be weakened just to accept accidental drift.',
          'Exposures add dashboards, notebooks, applications, and ML systems to lineage. Combined with manifest.json, they reveal which customer-facing assets a model change can affect. Lineage is only complete when SQL dependencies use ref/source and non-dbt consumers are declared.'
        ],
        codeExample: {
          title: 'Contract an order-grain interface',
          language: 'yaml',
          filename: 'models/marts/_marts.yml',
          code: sql`models:
  - name: fct_orders
    config:
      contract:
        enforced: true
    columns:
      - name: order_id
        data_type: bigint
        constraints:
          - type: not_null
      - name: net_order_amount
        data_type: decimal(18,2)

exposures:
  - name: executive_revenue_dashboard
    type: dashboard
    depends_on: [ref('fct_orders')]
    owner: {name: Finance Analytics, email: finance-analytics@example.com}`
        },
        exercise: {
          prompt: 'Declare an application exposure for the customer health portal that depends on dim_customers_current and fct_orders.',
          starterSql: sql`exposures:
  - name: ___
    type: ___
    depends_on:
      - ref('___')
      - ref('___')
    owner:
      name: ___
      email: ___`,
          solutionSql: sql`exposures:
  - name: customer_health_portal
    type: application
    depends_on:
      - ref('dim_customers_current')
      - ref('fct_orders')
    owner:
      name: Customer Analytics
      email: customer-analytics@example.com`,
          expectedColumns: ['customer_health_portal', 'dim_customers_current', 'fct_orders'],
          hints: ['Use application as the exposure type.', 'Each dependency is a ref expression.', 'Assign a durable team owner and contact.']
        },
        quiz: {
          question: 'What does an enforced model contract primarily protect?',
          options: ['Source extraction frequency', 'Output column names and compatible data types', 'Dashboard colors', 'Git commit messages'],
          answerIndex: 1,
          explanation: 'Contracts validate relation interface shape, complementing tests that validate the data within it.'
        }
      },
      {
        id: 'm10-l03',
        number: '10.3',
        title: 'Lab: Publish and Audit the Lineage Site',
        minutes: 58,
        lab: true,
        engine: 'DuckDB',
        summary: 'Generate project documentation, audit missing descriptions and owners, and trace a source-to-dashboard lineage path.',
        objectives: ['Generate and inspect dbt docs artifacts', 'Find metadata coverage gaps', 'Perform downstream impact analysis'],
        explanation: [
          'Run dbt docs generate after a successful build to produce catalog and manifest metadata, then serve it locally. Trace raw.orders through staging and intermediate nodes to fct_orders and the executive exposure. A missing edge usually indicates a hard-coded relation or undeclared external consumer.',
          'Use artifact queries to list public models without descriptions, owners, or tests. Documentation coverage is not a vanity percentage: prioritize high-use marts and sensitive datasets, then make the audit a CI warning or error according to governance policy.'
        ],
        codeExample: {
          title: 'Generate and inspect documentation',
          language: 'shell',
          filename: 'terminal',
          code: sql`dbt build --target dev
dbt docs generate --target dev
dbt docs serve --port 8081`
        },
        exercise: {
          prompt: 'Write a manifest jq query that lists model unique IDs with an empty description so the team can close coverage gaps.',
          starterSql: sql`jq -r '
  .nodes
  | to_entries[]
  | select(.value.resource_type == "___")
  | select((.value.description // "") == "")
  | ___
' target/manifest.json`,
          solutionSql: sql`jq -r '
  .nodes
  | to_entries[]
  | select(.value.resource_type == "model")
  | select((.value.description // "") == "")
  | .key
' target/manifest.json`,
          expectedColumns: ['unique_id'],
          hints: ['manifest nodes are keyed by unique ID.', 'Filter resource_type to model.', 'An absent description can be coalesced to an empty string.']
        },
        quiz: {
          question: 'What most often causes a missing model lineage edge?',
          options: ['A model uses ref()', 'A relation is hard-coded instead of referenced', 'The docs server uses port 8081', 'A column has a description'],
          answerIndex: 1,
          explanation: 'Hard-coded relation names bypass dbt dependency parsing and therefore disappear from graph lineage.'
        }
      }
    ]
  },
  {
    id: 'deployment-ci',
    number: 11,
    title: 'Production Deployment & CI',
    description: 'Promote tested dbt changes across isolated environments with state-aware CI, secure credentials, and observable artifacts.',
    outcomes: ['Separate development and production targets', 'Build modified graph slices safely', 'Design an operational deployment job'],
    lessons: [
      {
        id: 'm11-l01',
        number: '11.1',
        title: 'Environments, Jobs, and Secure Configuration',
        minutes: 32,
        lab: false,
        engine: 'Cross-database',
        summary: 'Structure developer, CI, and production targets and place dbt commands inside a dependable orchestration boundary.',
        objectives: ['Isolate schemas by environment', 'Inject credentials with environment variables', 'Define build, freshness, and artifact steps'],
        explanation: [
          'Developers and pull requests must not replace production relations. Target-specific schemas or databases isolate outputs, while the same project code and selectors preserve behavioral parity. profiles.yml can read environment variables so credentials remain in the runner’s secret store.',
          'A production job installs pinned dependencies, checks source freshness, builds the selected graph, and persists artifacts even on failure. Scheduling, retries, alert routing, concurrency, and service accounts belong to orchestration; dbt supplies deterministic commands and metadata within that job.'
        ],
        codeExample: {
          title: 'Environment-driven PostgreSQL profile',
          language: 'yaml',
          filename: 'profiles.yml',
          code: sql`northstar_shop:
  target: dev
  outputs:
    prod:
      type: postgres
      host: "{{ env_var('DBT_HOST') }}"
      user: "{{ env_var('DBT_USER') }}"
      password: "{{ env_var('DBT_PASSWORD') }}"
      dbname: analytics
      schema: analytics
      threads: 8`
        },
        exercise: {
          prompt: 'Write a safe production command sequence that installs packages, checks freshness, builds the production target, and generates docs.',
          starterSql: sql`dbt ___
dbt ___ --target prod
dbt ___ --target prod
dbt ___ --target prod`,
          solutionSql: sql`dbt deps
dbt source freshness --target prod
dbt build --target prod
dbt docs generate --target prod`,
          expectedColumns: ['deps', 'source freshness', 'build', 'docs generate'],
          hints: ['Install pinned packages first.', 'Check source readiness before transformation.', 'Generate artifacts from the same target after the build.']
        },
        quiz: {
          question: 'Where should a production database password be stored?',
          options: ['Committed profiles.yml', 'A model comment', 'The CI or orchestration secret store', 'manifest.json'],
          answerIndex: 2,
          explanation: 'The runner should inject secrets at execution time rather than persisting them in source control or artifacts.'
        }
      },
      {
        id: 'm11-l02',
        number: '11.2',
        title: 'Slim CI with State and Defer',
        minutes: 38,
        lab: false,
        engine: 'Cross-database',
        summary: 'Compare manifests, select modified resources and their descendants, and defer unchanged dependencies to a trusted environment.',
        objectives: ['Use state:modified selectors', 'Explain --defer relation resolution', 'Avoid false state comparisons'],
        explanation: [
          'Slim CI compares the pull-request project with a prior production manifest. state:modified+ selects changed nodes and their descendants, while --defer resolves unbuilt upstream refs to production relations. This creates realistic validation without rebuilding the entire warehouse in every pull request.',
          'The comparison manifest must come from the intended baseline and live outside the current target path so dbt does not overwrite it. Source-code changes, configuration changes, dependency upgrades, and macro impacts can broaden selection; always preview with dbt ls before assuming CI scope is small.'
        ],
        codeExample: {
          title: 'Preview and execute a state-aware build',
          language: 'shell',
          filename: 'ci/run_slim_ci.sh',
          code: sql`dbt deps
dbt ls --select state:modified+ --state artifacts/prod
dbt build \
  --select state:modified+ \
  --state artifacts/prod \
  --defer \
  --target ci`
        },
        exercise: {
          prompt: 'Write the selector that includes modified models, their first-degree parents, and all descendants, then preview it.',
          starterSql: sql`dbt ls \
  --select ___ \
  --state artifacts/prod`,
          solutionSql: sql`dbt ls \
  --select 1+state:modified+ \
  --state artifacts/prod`,
          expectedColumns: ['selected_unique_id'],
          hints: ['A leading 1+ includes first-degree ancestors.', 'A trailing + includes all descendants.', 'Use dbt ls to preview without building.']
        },
        quiz: {
          question: 'What does --defer do for an unchanged upstream ref absent from the CI schema?',
          options: ['Deletes it', 'Resolves it to the state environment relation', 'Marks every test as passed', 'Copies its data into Git'],
          answerIndex: 1,
          explanation: 'Defer lets selected CI nodes depend on trusted upstream relations represented by the supplied state manifest.'
        }
      },
      {
        id: 'm11-l03',
        number: '11.3',
        title: 'Lab: Build a Pull-Request Quality Gate',
        minutes: 70,
        lab: true,
        engine: 'PostgreSQL',
        summary: 'Create a CI workflow that runs isolated builds, reuses production state, uploads artifacts, and fails on model or test errors.',
        objectives: ['Assemble a reproducible CI job', 'Use an isolated PostgreSQL schema', 'Preserve logs and artifacts for diagnosis'],
        explanation: [
          'The lab starts a disposable PostgreSQL service, loads a bounded ecommerce fixture, downloads a known production manifest, and assigns each pull request a unique schema. Dependency installation and dbt version are pinned so CI failures describe code changes rather than moving toolchains.',
          'The gate previews state selection, executes dbt build, and uploads manifest, run_results, catalog, and logs even if a step fails. Add concurrency cancellation for superseded commits and destroy temporary schemas after completion. Credentials are least-privileged and scoped to the runner.'
        ],
        codeExample: {
          title: 'Core CI quality-gate commands',
          language: 'shell',
          filename: 'ci/quality_gate.sh',
          code: sql`set -euo pipefail
dbt deps
dbt debug --target ci
dbt seed --target ci --full-refresh
dbt build --target ci --select 1+state:modified+ \
  --state artifacts/prod --defer
dbt docs generate --target ci`
        },
        exercise: {
          prompt: 'Write a post-build shell check that verifies manifest.json and run_results.json exist before artifact upload.',
          starterSql: sql`test ___ target/manifest.json
test ___ target/run_results.json
echo "dbt artifacts ready"`,
          solutionSql: sql`test -s target/manifest.json
test -s target/run_results.json
echo "dbt artifacts ready"`,
          expectedColumns: ['manifest.json', 'run_results.json'],
          hints: ['The shell -s operator requires a non-empty file.', 'Check both files independently.', 'Preserve artifact upload with an always-run workflow condition.']
        },
        quiz: {
          question: 'Why assign every pull request a unique schema?',
          options: ['To make SQL longer', 'To prevent concurrent CI builds from replacing one another’s relations', 'To bypass tests', 'To remove the need for credentials'],
          answerIndex: 1,
          explanation: 'Schema isolation makes parallel builds deterministic and prevents one branch from contaminating another.'
        }
      }
    ]
  },
  {
    id: 'capstone',
    number: 12,
    title: 'Cross-Database Capstone',
    description: 'Deliver a production-minded ecommerce analytics project that runs locally on DuckDB and validates on PostgreSQL or MySQL.',
    outcomes: ['Configure multiple adapters', 'Deliver an end-to-end dbt project', 'Defend design and operations with evidence'],
    lessons: [
      {
        id: 'm12-l01',
        number: '12.1',
        title: 'DuckDB, PostgreSQL, and MySQL Targets',
        minutes: 34,
        lab: false,
        engine: 'Cross-database',
        summary: 'Configure adapter targets, understand practical dialect boundaries, and define a cross-engine validation matrix.',
        objectives: ['Configure three profile outputs', 'Identify adapter-specific behavior', 'Define contract and result parity checks'],
        explanation: [
          'DuckDB gives every learner a fast local path, while PostgreSQL and MySQL introduce server credentials, schemas or databases, concurrency, indexes, and operational permissions. The model graph remains shared; target outputs and a small number of dispatched macros isolate platform details.',
          'Cross-database validation checks compilation, output columns and types, row grain, test outcomes, and metric checksums. Exact physical plans and some numeric types differ, so define acceptable parity precisely—for example, monetary totals equal to the cent and timestamps normalized to UTC.'
        ],
        codeExample: {
          title: 'One profile with local and server targets',
          language: 'yaml',
          filename: 'profiles.yml',
          code: sql`northstar_shop:
  target: duckdb
  outputs:
    duckdb:
      type: duckdb
      path: northstar.duckdb
      threads: 4
    postgres:
      type: postgres
      host: "{{ env_var('PGHOST') }}"
      user: "{{ env_var('PGUSER') }}"
      password: "{{ env_var('PGPASSWORD') }}"
      dbname: northstar
      schema: analytics
      threads: 8
    mysql:
      type: mysql
      server: "{{ env_var('MYSQL_HOST') }}"
      username: "{{ env_var('MYSQL_USER') }}"
      password: "{{ env_var('MYSQL_PASSWORD') }}"
      schema: northstar
      port: 3306`
        },
        exercise: {
          prompt: 'Write the commands that compile all targets and then build only the order mart on MySQL with its ancestors.',
          starterSql: sql`dbt compile --target ___
dbt compile --target ___
dbt compile --target ___
dbt build --target ___ --select ___`,
          solutionSql: sql`dbt compile --target duckdb
dbt compile --target postgres
dbt compile --target mysql
dbt build --target mysql --select +fct_orders`,
          expectedColumns: ['duckdb', 'postgres', 'mysql', 'fct_orders'],
          hints: ['Compile each named output separately.', 'Use mysql for the server build in this check.', 'A leading + selects all ancestors.']
        },
        quiz: {
          question: 'What is the most important cross-database parity target?',
          options: ['Identical query-plan text', 'Identical file paths', 'Equivalent model grain and business results', 'Identical index names'],
          answerIndex: 2,
          explanation: 'Consumers rely on data meaning and results; physical implementations can legitimately differ by engine.'
        }
      },
      {
        id: 'm12-l02',
        number: '12.2',
        title: 'Lab: Port the Warehouse to MySQL',
        minutes: 75,
        lab: true,
        engine: 'MySQL',
        summary: 'Run the Northstar graph on MySQL, resolve controlled dialect failures, and compare its ecommerce checksums with DuckDB.',
        objectives: ['Connect dbt to MySQL securely', 'Fix portability at narrow abstraction points', 'Reconcile results with DuckDB'],
        explanation: [
          'Start a local MySQL service, load the same bounded source CSVs, and compile before executing. The provided branch contains date_diff and boolean syntax that works only on DuckDB. Replace those expressions through existing macros rather than forking whole models.',
          'Run staging and marts, then compare row counts, distinct keys, null rates, and currency totals with the DuckDB target. Explain any type representation difference and prove it does not change business semantics. A passing build without parity evidence is incomplete.'
        ],
        codeExample: {
          title: 'MySQL date implementation behind dispatch',
          language: 'jinja',
          filename: 'macros/days_between.sql',
          code: sql`{% macro mysql__days_between(start_expression, end_expression) %}
    timestampdiff(day, {{ start_expression }}, {{ end_expression }})
{% endmacro %}`
        },
        exercise: {
          prompt: 'Write a portable checksum query for delivered order count and net revenue; round the monetary result to cents.',
          starterSql: sql`select
    count(distinct case when -- delivered then order id end) as delivered_order_count,
    round(sum(case when -- delivered then -- amount else 0 end), ___)
        as delivered_net_revenue
from {{ ref('fct_orders') }}`,
          solutionSql: sql`select
    count(distinct case when order_status = 'delivered' then order_id end) as delivered_order_count,
    round(sum(case when order_status = 'delivered' then net_order_amount else 0 end), 2)
        as delivered_net_revenue
from {{ ref('fct_orders') }}`,
          expectedColumns: ['delivered_order_count', 'delivered_net_revenue'],
          hints: ['Conditional distinct count is portable here.', 'Apply the same status filter to both measures.', 'Round only the final aggregate, to two decimal places.']
        },
        quiz: {
          question: 'A model fails only on MySQL because of date syntax. What is the preferred fix?',
          options: ['Duplicate every model for MySQL', 'Use a narrowly dispatched date macro', 'Remove the date calculation', 'Skip the MySQL build'],
          answerIndex: 1,
          explanation: 'Dispatch contains the legitimate dialect difference while keeping one model and one output contract.'
        }
      },
      {
        id: 'm12-l03',
        number: '12.3',
        title: 'Capstone Architecture and Acceptance Criteria',
        minutes: 38,
        lab: false,
        engine: 'Cross-database',
        summary: 'Turn stakeholder questions into a scoped graph, quality plan, deployment design, and measurable definition of done.',
        objectives: ['Translate requirements into model grains', 'Write acceptance criteria', 'Plan failure recovery and demonstration evidence'],
        explanation: [
          'The capstone stakeholder asks which regions and product categories drive delivered revenue, repeat purchasing, and delivery delay. Design sources, staging models, intermediate grain-aligning models, facts, dimensions, metrics, and one exposure. Each node exists to answer a requirement or protect a dependency—not to maximize model count.',
          'Acceptance requires reproducible setup, 42-day realistic ecommerce data, two engine targets, tests at key grains, one incremental fact, one customer snapshot, documentation, lineage, and a CI command. Include reconciliation evidence and a runbook for late data, source failure, and incremental recovery.'
        ],
        codeExample: {
          title: 'Capstone graph selection for release',
          language: 'shell',
          filename: 'capstone/acceptance.sh',
          code: sql`dbt deps
dbt seed --full-refresh
dbt snapshot
dbt build --select +fct_orders+ +fct_order_items+
dbt source freshness
dbt docs generate`
        },
        exercise: {
          prompt: 'Write acceptance SQL that proves fct_orders is one row per order and has no negative net amount for delivered orders.',
          starterSql: sql`select
    order_id,
    count(*) as row_count,
    min(net_order_amount) as minimum_net_amount
from {{ ref('fct_orders') }}
group by order_id
having -- duplicate or invalid delivered amount`,
          solutionSql: sql`select
    order_id,
    count(*) as row_count,
    min(net_order_amount) as minimum_net_amount
from {{ ref('fct_orders') }}
group by order_id
having count(*) <> 1
    or min(case when order_status = 'delivered' then net_order_amount end) < 0`,
          expectedColumns: ['order_id', 'row_count', 'minimum_net_amount'],
          hints: ['A passing acceptance query returns zero rows.', 'Group by the declared grain key.', 'Only apply the amount rule to delivered orders.']
        },
        quiz: {
          question: 'Which acceptance criterion is verifiable?',
          options: ['The project feels production-ready', 'The SQL is elegant', 'DuckDB and PostgreSQL delivered-revenue checksums match to the cent', 'There are enough models'],
          answerIndex: 2,
          explanation: 'A named cross-engine checksum with explicit tolerance can be executed and independently reviewed.'
        }
      },
      {
        id: 'm12-l04',
        number: '12.4',
        title: 'Lab: Deliver the Northstar Analytics Platform',
        minutes: 120,
        lab: true,
        engine: 'Cross-database',
        summary: 'Complete the end-to-end capstone, demonstrate stakeholder insights, simulate a late-data incident, and present engineering evidence.',
        objectives: ['Deliver a tested multi-engine dbt graph', 'Operate an incremental recovery', 'Present lineage, metric, and performance evidence'],
        explanation: [
          'Build the full project first on DuckDB and then on PostgreSQL or MySQL. The required output is a monthly region-category performance mart with delivered net revenue, orders, customers, repeat-customer rate, average order value, and delivery days. Trace every measure to its fact grain and document historical customer attribution.',
          'Inject a late payment and a customer tier change, run normal jobs, explain the observed gaps, and recover through the documented procedures. Finish with a five-minute engineering review: architecture, tests, lineage, cross-engine parity, benchmark decision, CI selection, and one stakeholder finding grounded in the mart.'
        ],
        codeExample: {
          title: 'Final stakeholder mart at month-region-category grain',
          language: 'sql',
          filename: 'models/marts/rpt_region_category_performance.sql',
          code: sql`select
    date_trunc('month', i.ordered_at) as order_month,
    c.region_name,
    p.category,
    count(distinct i.order_id) as delivered_orders,
    count(distinct i.customer_id) as purchasing_customers,
    sum(i.net_line_amount) as delivered_net_revenue,
    sum(i.net_line_amount) / nullif(count(distinct i.order_id), 0) as average_order_value,
    avg(i.delivery_days) as average_delivery_days
from {{ ref('fct_order_items') }} i
join {{ ref('dim_customers') }} c using (customer_id)
join {{ ref('dim_products') }} p using (product_id)
where i.order_status = 'delivered'
group by date_trunc('month', i.ordered_at), c.region_name, p.category`
        },
        exercise: {
          prompt: 'Complete the capstone with repeat_customer_rate: customers with at least two delivered orders divided by all delivered purchasing customers, calculated without line-item fanout.',
          starterSql: sql`with customer_orders as (
    select
        date_trunc('month', ordered_at) as order_month,
        customer_id,
        count(distinct order_id) as delivered_orders
    from {{ ref('fct_orders') }}
    where order_status = 'delivered'
    group by -- month and customer
)
select
    order_month,
    -- repeat rate
from customer_orders
group by order_month`,
          solutionSql: sql`with customer_orders as (
    select
        date_trunc('month', ordered_at) as order_month,
        customer_id,
        count(distinct order_id) as delivered_orders
    from {{ ref('fct_orders') }}
    where order_status = 'delivered'
    group by date_trunc('month', ordered_at), customer_id
)
select
    order_month,
    sum(case when delivered_orders >= 2 then 1 else 0 end)
        / nullif(count(*), 0) as repeat_customer_rate
from customer_orders
group by order_month`,
          expectedColumns: ['order_month', 'repeat_customer_rate'],
          hints: ['First collapse the fact to month-customer grain.', 'Count repeat customers with conditional aggregation.', 'The denominator is all customer rows in that month.']
        },
        quiz: {
          question: 'What best demonstrates capstone completion?',
          options: ['A successful compile only', 'A screenshot of one table', 'Tested outputs, reconciliations, lineage, cross-engine evidence, and incident recovery', 'The largest possible DAG'],
          answerIndex: 2,
          explanation: 'A production-minded delivery proves correctness, portability, observability, and operation—not merely SQL generation.'
        }
      }
    ]
  }
];

courseModules.sort((left, right) => left.number - right.number);

const computedLessonCount = courseModules.reduce(
  (total, module) => total + module.lessons.length,
  0
);

const computedLabCount = courseModules.reduce(
  (total, module) => total + module.lessons.filter((lesson) => lesson.lab).length,
  0
);

if (computedLessonCount !== 42 || computedLabCount !== 18) {
  throw new Error(
    `Course invariant failed: expected 42 lessons and 18 labs, received ${computedLessonCount} lessons and ${computedLabCount} labs.`
  );
}

export const course: Course = {
  id: 'dbt-data-engineering',
  title: 'dbt for Data Engineering',
  subtitle: 'Build, test, optimize, and ship a real ecommerce warehouse',
  description: 'A rigorous, hands-on path from warehouse grain and staging to incremental pipelines, historical dimensions, governed metrics, CI, and a cross-database capstone.',
  audience: 'Data engineers and SQL practitioners who want production-level dbt skills, not only templated SELECT statements.',
  prerequisites: [
    'Comfort writing SELECT, JOIN, GROUP BY, and window-function SQL',
    'Basic command-line and Git familiarity',
    'Python 3.11+ and Docker recommended for local adapter labs'
  ],
  engines: ['DuckDB', 'PostgreSQL', 'MySQL', 'Cross-database'],
  lessonCount: computedLessonCount,
  labCount: computedLabCount,
  estimatedHours: 34,
  narrative: 'You are the data engineer for Northstar Shop. Its operational ecommerce data is realistic, imperfect, mutable, and late-arriving. Across the course you turn raw extracts into a tested analytics platform and operate it through incidents and release gates.',
  datasets: [
    {
      name: 'customers',
      grain: 'One current source row per customer, with CDC updates across fixture loads',
      description: 'Names, normalized and malformed emails, country codes, acquisition channels, tiers, update timestamps, and ingestion metadata.',
      keyColumns: ['customer_id', 'updated_at', '_loaded_at']
    },
    {
      name: 'orders',
      grain: 'One source version per order update',
      description: 'Forty-two days of ecommerce orders across statuses, currencies, promotions, late updates, and controlled duplicate CDC records.',
      keyColumns: ['order_id', 'customer_id', 'order_created_at', 'updated_at']
    },
    {
      name: 'order_items',
      grain: 'One row per line item within an order',
      description: 'Products, quantities, integer-cent prices, discounts, and line values suitable for grain and fanout exercises.',
      keyColumns: ['order_id', 'line_id', 'product_id']
    },
    {
      name: 'payments',
      grain: 'One row per payment attempt',
      description: 'Successful, failed, refunded, duplicate, and late-arriving attempts using card, wallet, and bank transfer methods.',
      keyColumns: ['payment_id', 'order_id', 'processed_at', '_loaded_at']
    },
    {
      name: 'products_and_shipments',
      grain: 'One row per product and one row per shipment event respectively',
      description: 'Product catalog history plus shipping timestamps, carriers, destinations, and delivery-delay edge cases.',
      keyColumns: ['product_id', 'shipment_id', 'order_id']
    }
  ],
  modules: courseModules
};
