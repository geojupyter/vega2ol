import { vega2ol, Vega2OLError } from "../main.js";

// Simple assertion helper
function assertEqual(actual: any, expected: any, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr === expectedStr) {
    console.log(`   ✅ ${message}`);
    return true;
  } else {
    console.log(`   ❌ ${message}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Got:      ${actualStr}`);
    return false;
  }
}

// Assert that vega2ol throws a Vega2OLError for the given expression
async function assertThrows(
  expr: string,
  message: string,
  messageContains?: string
) {
  try {
    const result = await vega2ol(expr);
    console.log(`   ❌ ${message}`);
    console.log(
      `   Expected a Vega2OLError, but got result: ${JSON.stringify(result)}`
    );
    return false;
  } catch (error) {
    if (!(error instanceof Vega2OLError)) {
      console.log(`   ❌ ${message}`);
      console.log(
        `   Expected Vega2OLError, got: ${(error as Error).constructor.name}: ${
          (error as Error).message
        }`
      );
      return false;
    }
    if (messageContains && !error.message.includes(messageContains)) {
      console.log(`   ❌ ${message}`);
      console.log(`   Error message did not contain "${messageContains}"`);
      console.log(`   Got message: ${error.message}`);
      return false;
    }
    console.log(`   ✅ ${message}`);
    return true;
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Testing vega2ol transpiler\n");

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Literal values
    console.log("📋 Literal Values");
    if (assertEqual(await vega2ol("42"), 42, "Number literal")) passed++;
    else failed++;
    if (assertEqual(await vega2ol("'hello'"), "hello", "String literal"))
      passed++;
    else failed++;
    if (assertEqual(await vega2ol("true"), true, "Boolean literal")) passed++;
    else failed++;

    // Test 2: Member access
    console.log("\n📋 Member Access (datum.field)");
    if (
      assertEqual(
        await vega2ol("datum.value"),
        ["get", "value"],
        "Simple datum access"
      )
    )
      passed++;
    else failed++;
    if (
      assertEqual(
        await vega2ol("datum.population"),
        ["get", "population"],
        "Datum field access"
      )
    )
      passed++;
    else failed++;

    // Test 3: Comparison operators
    console.log("\n📋 Comparison Operators");
    if (
      assertEqual(
        await vega2ol("datum.value > 100"),
        [">", ["get", "value"], 100],
        "Greater than operator"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("datum.value == 100"),
        ["==", ["get", "value"], 100],
        "Equality operator"
      )
    )
      passed++;
    else failed++;

    // Test 4: Ternary/Conditional (the main example from docs)
    console.log("\n📋 Conditional Expressions");
    if (
      assertEqual(
        await vega2ol("datum.value > 100 ? 'red' : 'blue'"),
        ["case", [">", ["get", "value"], 100], "red", "blue"],
        "Simple ternary expression"
      )
    )
      passed++;
    else failed++;

    // Test 5: Complex nested conditional
    if (
      assertEqual(
        await vega2ol(
          "datum.value > 100 ? 'red' : datum.value > 50 ? 'yellow' : 'green'"
        ),
        [
          "case",
          [">", ["get", "value"], 100],
          "red",
          ["case", [">", ["get", "value"], 50], "yellow", "green"],
        ],
        "Nested ternary expression"
      )
    )
      passed++;
    else failed++;

    // Test 6: Logical operators
    console.log("\n📋 Logical Operators");
    if (
      assertEqual(
        await vega2ol("datum.x > 0 && datum.y < 100"),
        ["all", [">", ["get", "x"], 0], ["<", ["get", "y"], 100]],
        "AND operator"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("datum.a > 1 || datum.b < 5"),
        ["any", [">", ["get", "a"], 1], ["<", ["get", "b"], 5]],
        "OR operator"
      )
    )
      passed++;
    else failed++;

    // Test 7: Arithmetic operators
    console.log("\n📋 Arithmetic Operators");
    if (
      assertEqual(
        await vega2ol("datum.a + datum.b"),
        ["+", ["get", "a"], ["get", "b"]],
        "Addition operator"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("datum.a * datum.b"),
        ["*", ["get", "a"], ["get", "b"]],
        "Multiplication operator"
      )
    )
      passed++;
    else failed++;

    // Test 8: Unary operations
    console.log("\n📋 Unary Operations");
    if (
      assertEqual(
        await vega2ol("!datum.active"),
        ["!", ["get", "active"]],
        "Negation operator"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("-datum.value"),
        ["*", ["get", "value"], -1],
        "Unary minus"
      )
    )
      passed++;
    else failed++;

    // Test 9: Function calls
    console.log("\n📋 Function Calls");
    if (
      assertEqual(
        await vega2ol("floor(datum.value)"),
        ["floor", ["get", "value"]],
        "Floor function"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("ceil(datum.value)"),
        ["ceil", ["get", "value"]],
        "ceil()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("round(datum.value)"),
        ["round", ["get", "value"]],
        "round()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("abs(datum.value)"),
        ["abs", ["get", "value"]],
        "abs()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("sqrt(datum.value)"),
        ["sqrt", ["get", "value"]],
        "sqrt()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("sin(datum.value)"),
        ["sin", ["get", "value"]],
        "sin()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("cos(datum.value)"),
        ["cos", ["get", "value"]],
        "cos()"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("pow(datum.base, 2)"),
        ["^", ["get", "base"], 2],
        "pow() maps to OL's '^' operator, not a 'pow' function"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("atan(datum.value)"),
        ["atan", ["get", "value"]],
        "atan() single-arg form"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("atan2(datum.x, datum.y)"),
        ["atan", ["get", "x"], ["get", "y"]],
        "atan2() two-arg form"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("clamp(datum.value, 0, 100)"),
        ["clamp", ["get", "value"], 0, 100],
        "clamp() preserves (value, min, max) arg order"
      )
    )
      passed++;
    else failed++;

    // Test 10: Real-world example - Color mapping
    console.log("\n📋 Real-world Examples");
    if (
      assertEqual(
        await vega2ol(
          "datum.population > 1000000 ? '#FF0000' : datum.population > 500000 ? '#FFA500' : '#FFFF00'"
        ),
        [
          "case",
          [">", ["get", "population"], 1000000],
          "#FF0000",
          ["case", [">", ["get", "population"], 500000], "#FFA500", "#FFFF00"],
        ],
        "Color mapping by population size"
      )
    )
      passed++;
    else failed++;

    // Test 11: Array expressions
    console.log("\n📋 Array Expressions");

    if (assertEqual(await vega2ol("[1, 2, 3]"), [1, 2, 3], "Array literal"))
      passed++;
    else failed++;

    // Test 12: Constants

    console.log("\n📋 Vega Constants");

    if (assertEqual(await vega2ol("PI"), Math.PI, "PI constant")) passed++;
    else failed++;

    // Test 13: Binary expressions
    console.log("\n📋 Binary Expressions");
    if (
      assertEqual(
        await vega2ol("indexof(['USA', 'India'], datum.country) != -1"),
        ["in", ["get", "country"], ["USA", "India"]],
        "indexOf with != -1 (is in)"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("-1 != indexof(['USA', 'India'], datum.country)"),
        ["in", ["get", "country"], ["USA", "India"]],
        "reverse indexOf with != -1 (is in)"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol(
          "indexof(['hot', 'warm'], datum.temperature) != -1 ? 'red' : 'blue'"
        ),
        [
          "case",
          ["in", ["get", "temperature"], ["hot", "warm"]],
          "red",
          "blue",
        ],
        "indexOf in ternary (if in)"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("indexof(['USA', 'India'], datum.country) == -1"),
        ["!", ["in", ["get", "country"], ["USA", "India"]]],
        "indexOf with == -1 (is not in)"
      )
    )
      passed++;
    else failed++;

    if (
      assertEqual(
        await vega2ol("-1 == indexof(['USA', 'India'], datum.country)"),
        ["!", ["in", ["get", "country"], ["USA", "India"]]],
        "reverse indexOf with == -1 (is not in)"
      )
    )
      passed++;
    else failed++;

    // Test 14: Unsupported / unknown function errors
    console.log("\n📋 Errors: Vega Functions With No OL Equivalent");

    if (
      await assertThrows(
        "upper(datum.name)",
        "upper() throws (no OL string case operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "lower(datum.name)",
        "lower() throws (no OL string case operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "toString(datum.value)",
        "toString() throws (no OL type coercion operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "isValid(datum.value)",
        "isValid() throws (no OL type-checking operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "length(datum.items)",
        "length() throws (no OL length operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "format(datum.value, ',.2f')",
        "format() throws (no OL number-formatting operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "now()",
        "now() throws (no OL date/time operators)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "min(datum.a, datum.b)",
        "min() throws (no OL aggregate min/max operator)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "tan(datum.value)",
        "tan() throws (OL only supports sin/cos/atan)",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "indexof(datum.items, 'x')",
        "bare indexof() outside the != -1 / == -1 pattern throws a specific error",
        "indexof is only supported in the pattern"
      )
    )
      passed++;
    else failed++;

    console.log("\n📋 Errors: Names That Don't Exist In Vega Or OL");

    if (
      await assertThrows(
        "totallyMadeUpFunction(datum.value)",
        "Nonexistent function name throws",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    if (
      await assertThrows(
        "fooBarBaz(1, 2, 3)",
        "Another nonexistent function name throws",
        "Unsupported function"
      )
    )
      passed++;
    else failed++;

    // Test 15: Error handling
    console.log("\n📋 Error Handling");
    try {
      await vega2ol(null as any);
      console.log("❌ Should throw for null input");
      failed++;
    } catch (error) {
      if (error instanceof Vega2OLError) {
        console.log("   ✅ Throws Vega2OLError for invalid input");
        passed++;
      } else {
        console.log("❌ Wrong error type");
        failed++;
      }
    }
  } catch (error) {
    console.error("🔥 Test suite error:", error);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  return failed === 0 ? 0 : 1;
}

// Run the tests
runTests().then((code) => process.exit(code));
