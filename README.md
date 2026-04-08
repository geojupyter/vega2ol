# vega2ol

A TypeScript library to transpile [Vega expressions](https://vega.github.io/vega/docs/expressions/) to [OpenLayers](https://openlayers.org/) expressions.

## Overview

`vega2ol` automatically converts Vega expression syntax to OpenLayers array-based expression format. This enables seamless integration between Vega-Lite/Vega visualization specifications and OpenLayers map styling.

### Example

**Vega Expression:**
```javascript
datum.value > 100 ? 'red' : 'blue'
```

**OpenLayers Expression:**
```javascript
['case', ['>', ['get', 'value'], 100], 'red', 'blue']
```

## Installation

```bash
npm install vega2ol
```

## Quick Start

```typescript
import { vega2ol } from 'vega2ol';

// Simple conditional styling
const olExpr = vega2ol("datum.population > 1000000 ? '#FF0000' : '#0000FF'");
// Returns: ['case', ['>', ['get', 'population'], 1000000], '#FF0000', '#0000FF']

// Use in OpenLayers style
const style = {
  'fill-color': olExpr
};
```

## Supported Features

### Literals
- Numbers: `42`, `3.14`, `-10`
- Strings: `'hello'`, `"world"`
- Booleans: `true`, `false`
- Null: `null`

### Member Access
- `datum.fieldName` → `['get', 'fieldName']`
- Works with any data field

### Operators

**Comparison:**
- `==`, `!=`, `<`, `<=`, `>`, `>=`

**Logical:**
- `&&` (AND) → maps to `all`
- `||` (OR) → maps to `any`
- `!` (NOT) → maps to `!`

**Arithmetic:**
- `+`, `-`, `*`, `/`, `%`

### Conditional Expressions
- Ternary operator: `condition ? true_value : false_value`
- Nested ternaries supported for multiple conditions

### Functions

**Math Functions:**
- `floor()`, `ceil()`, `round()`, `abs()`, `sqrt()`
- `pow()`, `log()`, `exp()`, `sin()`, `cos()`, `tan()`
- `min()`, `max()`

**String Functions:**
- `tostring()`, `upper()`, `lower()`, `substring()`

**Array Functions:**
- `length()`, `indexof()`, `slice()`

**Type Functions:**
- `type()`, `isvalid()`, `isnumber()`, `isstring()`, `isboolean()`

### Vega Constants
- Math: `PI`, `E`, `LN2`, `LN10`, `LOG2E`, `LOG10E`, `SQRT1_2`, `SQRT2`
- Number: `MIN_VALUE`, `MAX_VALUE`

## Development

### Setup

```bash
# Install dependencies
npm install

# Build
npm run build
```

### Testing

```bash
# Run tests
npm test
```

### Architecture

The transpiler uses a **visitor pattern** similar to AST walkers:

1. **Parser**: Uses `vega-expression` to parse Vega expressions into an Abstract Syntax Tree (AST)
2. **Visitor**: `VegaToOLVisitor` class walks the AST and converts each node type to OpenLayers format
3. **Output**: Returns OpenLayers expression array

## Examples

### Color Mapping Based on Value

```typescript
const vegaExpr = `
  datum.value > 100 ? 'red' :
  datum.value > 50 ? 'yellow' :
  'green'
`;
const olExpr = vega2ol(vegaExpr);
// Use with OpenLayers style
style['fill-color'] = olExpr;
```

### Opacity Based on Category

```typescript
const vegaExpr = "datum.category == 'important' ? 1 : 0.5";
const olExpr = vega2ol(vegaExpr);
style['fill-opacity'] = olExpr;
```

### Complex Conditions

```typescript
const vegaExpr = `
  (datum.x > 0 && datum.y < 100) ? 'inside' : 'outside'
`;
const olExpr = vega2ol(vegaExpr);
```

## Resources

- [Vega Expression Documentation](https://vega.github.io/vega/docs/expressions/)
- [Vega Expression Parser](https://github.com/vega/vega/tree/main/packages/vega-expression)
- [OpenLayers Documentation](https://openlayers.org/)
