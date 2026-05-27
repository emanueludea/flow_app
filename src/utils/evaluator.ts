import Jexl from 'jexl'

export type VarMap = Record<string, unknown>

/**
 * Evaluate an expression against a variable context.
 * Returns the result or throws a descriptive error.
 */
export function evaluate(expression: string, context: VarMap = {}): unknown {
  const trimmed = expression.trim()
  if (!trimmed) throw new Error('La expresión está vacía.')
  return Jexl.evalSync(trimmed, context)
}

/**
 * Evaluate an expression and coerce the result to boolean.
 * Used by the simulator for Decision nodes.
 */
export function evaluateBool(expression: string, context: VarMap = {}): boolean {
  const result = evaluate(expression, context)
  return Boolean(result)
}

/**
 * Parse and execute an assignment statement of the form:
 *   varName = expression
 *
 * Returns the updated variable map (shallow copy + new binding).
 * Throws if the statement is not a valid assignment.
 */
export function executeAssignment(statement: string, context: VarMap = {}): VarMap {
  const trimmed = statement.trim()
  // Match "identifier = expr" — the identifier may not contain operators
  const match = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/)
  if (!match) {
    throw new Error(
      `Instrucción inválida: "${trimmed}". Se esperaba una asignación del tipo "variable = expresión".`
    )
  }
  const [, varName, expr] = match
  const value = evaluate(expr, context)
  return { ...context, [varName]: value }
}

/**
 * Execute a Process node body, which may contain one or more
 * semicolon-separated assignment statements.
 *   e.g.  "x = 0"  or  "x = x + 1; y = y - 1"
 */
export function executeProcess(body: string, context: VarMap = {}): VarMap {
  const statements = body.split(';').map((s) => s.trim()).filter(Boolean)
  if (statements.length === 0) throw new Error('El bloque de proceso está vacío.')
  let ctx = { ...context }
  for (const stmt of statements) {
    ctx = executeAssignment(stmt, ctx)
  }
  return ctx
}
