import { parseExpression } from "vega-expression";
import type { ExpressionValue } from "ol/expr/expression.js";

/**
 * OpenLayers expression types
 * OL expressions are arrays: ['operator', arg1, arg2, ...] or ['case', condition, value, ...]
 */

/**
 * Vega AST node types (simplified)
 */
interface VegaNode {
  type: string;
  [key: string]: any;
}

/**
 * Operator mapping from Vega operators to OpenLayers operators
 */
const OPERATOR_MAPPING: Record<string, string> = {
  // Comparison operators
  "==": "==",
  "!=": "!=",
  "<": "<",
  "<=": "<=",
  ">": ">",
  ">=": ">=",

  // Logical operators
  "&&": "all",
  "||": "any",

  // Arithmetic operators
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "%": "%",

  // Other
  "**": "pow",
};

/**
* Constants mapping from Vega constants to OpenLayers constants
*/
const CONSTANTS_MAPPING: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
  SQRT1_2: Math.SQRT1_2,
  SQRT2: Math.SQRT2,
  MIN_VALUE: Number.MIN_VALUE,
  MAX_VALUE: Number.MAX_VALUE,
};

/**
 * Function mapping from Vega functions to OpenLayers functions
 */
const FUNCTION_MAPPING: Record<string, string> = {
  // Math functions
  abs: "abs",
  floor: "floor",
  ceil: "ceil",
  round: "round",
  sqrt: "sqrt",
  pow: "pow",
  log: "log",
  exp: "exp",
  sin: "sin",
  cos: "cos",
  tan: "tan",

  // String functions
  tostring: "toString",
  upper: "toUpperCase",
  lower: "toLowerCase",
  substring: "substring",

  // Array functions
  length: "length",
  indexof: "indexOf",
  slice: "slice",

  // Type functions
  type: "type",
  isvalid: "isValid",
  isnumber: "isNumber",
  isstring: "isString",
  isboolean: "isBoolean",

  // Aggregation functions
  min: "min",
  max: "max",
};

/**
 * Custom error class for Vega2OL transpilation errors
 */
export class Vega2OLError extends Error {
  constructor(message: string) {
    const fullMessage = `${message}, note that only a subset of Vega is supported`;
    super(fullMessage);
    this.name = "Vega2OLError";
  }
}

/**
 * Visitor class to convert Vega AST to OpenLayers expressions
 */
class VegaToOLVisitor {
  private scope: Record<string, ExpressionValue> = {};

  visit(node: VegaNode): ExpressionValue {
    if (!node || !node.type) {
      throw new Vega2OLError("Invalid AST node");
    }

    const method = `visit${node.type}`;
    if (typeof (this as any)[method] === "function") {
      return (this as any)[method](node);
    }

    throw new Vega2OLError(`Unsupported ${node.type} node`);
  }

  // Literal values
  visitLiteral(node: VegaNode): ExpressionValue {
    const { value } = node;

    if (value === null) return null as unknown as ExpressionValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;

    throw new Vega2OLError(`Unsupported literal type: ${typeof value}`);
  }

  // Member access: datum.value, datum['value']
  visitMemberExpression(node: VegaNode): ExpressionValue {
    const { object, property } = node;

    if (object.type === "Identifier" && object.name === "datum") {
      if (typeof property === "string") {
        return ["get", property];
      }
      // For computed properties - if property is an Identifier with 'name'
      if (property.type === "Identifier" && property.name) {
        return ["get", property.name];
      }
      // For computed properties like datum[variable]
      return ["get", this.visit(property)];
    }

    throw new Vega2OLError(`Unsupported member access`);
  }

  // Binary operations: a + b, a > b, etc.
  visitBinaryExpression(node: VegaNode): ExpressionValue {
    const { operator, left, right } = node;
    const leftOL = this.visit(left);
    const rightOL = this.visit(right);

    const olOp = OPERATOR_MAPPING[operator];
    if (!olOp) {
      throw new Vega2OLError(`Unsupported binary operator: ${operator}`);
    }

    return [olOp, leftOL, rightOL];
  }

  // Unary operations: !x, -x, +x
  visitUnaryExpression(node: VegaNode): ExpressionValue {
    const { operator, argument } = node;
    const argOL = this.visit(argument);

    if (operator === "!") {
      return ["!", argOL];
    }
    if (operator === "-") {
      return ["*", argOL, -1];
    }
    if (operator === "+") {
      return argOL;
    }

    throw new Vega2OLError(`Unsupported unary operator: ${operator}`);
  }

  // Conditional: test ? consequent : alternate
  visitConditionalExpression(node: VegaNode): ExpressionValue {
    const { test, consequent, alternate } = node;
    const testOL = this.visit(test);
    const consequentOL = this.visit(consequent);
    const alternateOL = this.visit(alternate);

    // OL 'case' expression: ['case', condition1, value1, condition2, value2, ..., defaultValue]
    return ["case", testOL, consequentOL, alternateOL];
  }

  // Function calls: floor(x), ceil(y), etc.
  visitCallExpression(node: VegaNode): ExpressionValue {
    const { callee, arguments: args } = node;

    let funcName: string;
    if (callee.type === "Identifier") {
      funcName = callee.name;
    } else if (
      callee.type === "MemberExpression" &&
      callee.object.name === "Math"
    ) {
      funcName = callee.property;
    } else {
      throw new Vega2OLError(`Unsupported function call`);
    }

    const olFunc = FUNCTION_MAPPING[funcName.toLowerCase()];
    if (!olFunc) {
      throw new Vega2OLError(`Unsupported function: ${funcName}`);
    }

    const olArgs = args.map((arg: VegaNode) => this.visit(arg));
    return [olFunc, ...olArgs];
  }

  // Array literal: [1, 2, 3]
  visitArrayExpression(node: VegaNode): ExpressionValue {
    const { elements } = node;
    return elements.map((elem: VegaNode) => this.visit(elem));
  }

  // Logical expressions
  visitLogicalExpression(node: VegaNode): ExpressionValue {
    const { operator, left, right } = node;

    const leftOL = this.visit(left);
    const rightOL = this.visit(right);

    const olOp = OPERATOR_MAPPING[operator];
    if (!olOp) {
      throw new Vega2OLError(`Unsupported logical operator: ${operator}`);
    }

    return [olOp, leftOL, rightOL];
  }

  // Identifier/Variable: x, PI, etc.
  visitIdentifier(node: VegaNode): ExpressionValue {
    const { name } = node;

    // Check if it's in the current scope
    if (name in this.scope) {
      return this.scope[name];
    }

    if (name in CONSTANTS_MAPPING) {
      return CONSTANTS_MAPPING[name];
    }

    // Return as string (might be a function or field)
    return name;
  }
}

/**
 * Main transpiler function
 * @param vegaExpressionStr - A Vega expression string (e.g., "datum.value > 100 ? 'red' : 'blue'")
 * @returns OpenLayers expression array
 */
export async function vega2ol(
  vegaExpressionStr: string
): Promise<ExpressionValue> {
  if (typeof vegaExpressionStr !== "string") {
    throw new Vega2OLError("Input must be a string");
  }

  try {
    // Parse Vega expression to AST
    const ast = parseExpression(vegaExpressionStr);

    // Visit the AST and convert to OL expression
    const visitor = new VegaToOLVisitor();
    const olExpression = visitor.visit(ast);

    return olExpression;
  } catch (error) {
    if (error instanceof Vega2OLError) {
      throw error;
    }
    throw new Vega2OLError(
      `Failed to parse expression: ${(error as Error).message}`
    );
  }
}

export { ExpressionValue as OLExpression, VegaNode };
