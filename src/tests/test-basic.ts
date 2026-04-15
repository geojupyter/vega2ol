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
        await vega2ol("pow(datum.base, 2)"),
        ["pow", ["get", "base"], 2],
        "Pow function with multiple args"
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

    // Test 13: Error handling
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
