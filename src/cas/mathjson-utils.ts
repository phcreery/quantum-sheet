// import { Expression } from '@cortex-js/compute-engine'
// import { Expression } from '../../math-json/math-json-format'

import { ComputeEngine, BoxedExpression } from '@cortex-js/compute-engine'
import { LatexDictionary, Expression } from '@cortex-js/compute-engine/dist/types/math-json'

// const ce = new ComputeEngine()

export const dictionary = <LatexDictionary>[]

export type ExpressionValue =
  | {
      type: 'number'
      value: number | bigint | string | null
    }
  | {
      type: 'symbol'
      value: string
    }
  | {
      type: 'string'
      value: string
    }
  | {
      type: 'function'
      value: {
        /** The function name or an expression in the case of function composition, like [["InverseFunction", "Sin"], "x"] */
        head: string | Expression
        args: Expression[]
      }
    }
  | {
      type: 'dictionary'
      value: {
        [key: string]: Expression
      }
    }

export function handleExpressionValue(
  expr: Expression,
  handler: {
    number?: (value: number | bigint | string) => void
    symbol?: (value: string) => void
    string?: (value: string) => void
    function?: (value: { head: string | Expression[]; args: Expression[] }) => void
    dictionary?: (value: { [key: string]: Expression }) => void
  }
) {
  const value = getExpressionValue(expr)
  handler[value.type]?.(value.value as any)
}

export function getExpressionValue(expr: Expression): ExpressionValue {
  // See https://cortexjs.io/math-json/
  switch (typeof expr) {
    case 'bigint': {
      return {
        type: 'number',
        value: expr,
      }
    }
    case 'boolean': {
      throw new Error('Expression cannot contain booleans')
    }
    case 'function': {
      throw new Error('Expression cannot contain Javascript functions')
    }
    case 'number': {
      return {
        type: 'number',
        value: expr,
      }
    }
    case 'object': {
      if (Array.isArray(expr)) {
        if (expr.length >= 1) {
          return {
            type: 'function',
            value: {
              head: expr[0] as any,
              args: expr.slice(1),
            },
          }
        } else {
          throw new Error('Expression contained an illegal function value ' + expr)
        }
      } else {
        const exprObj = expr as { [key: string]: any }
        if (exprObj.num) {
          if (typeof exprObj.num === 'string') {
            // Remove the endings
            if (exprObj.num.endsWith('n') || exprObj.num.endsWith('d')) {
              return {
                type: 'number',
                value: exprObj.num.slice(0, exprObj.num.length - 1),
              }
            }
          }
          return {
            type: 'number',
            value: exprObj.num,
          }
        } else if (exprObj.sym) {
          return {
            type: 'symbol',
            value: exprObj.sym,
          }
        } else if (exprObj.str) {
          return {
            type: 'string',
            value: exprObj.str,
          }
        } else if (exprObj.fn) {
          if (Array.isArray(exprObj.fn) && exprObj.fn.length >= 1) {
            return {
              type: 'function',
              value: {
                head: exprObj.fn[0],
                args: exprObj.fn.slice(1),
              },
            }
          } else {
            throw new Error('Expression contained an illegal function value ' + expr)
          }
        } else if (exprObj.dict) {
          return {
            type: 'dictionary',
            value: exprObj.dict,
          }
        } else {
          throw new Error('Expression contained an illegal value ' + expr)
        }
      }
      break
    }
    case 'string': {
      // It's probably a symbol
      // However, there are 3 number cases
      if (expr === 'NaN') {
        return {
          type: 'number',
          value: NaN,
        }
      }
      if (expr === '+Infinity') {
        return {
          type: 'number',
          value: Infinity,
        }
      }
      if (expr === '-Infinity') {
        return {
          type: 'number',
          value: -Infinity,
        }
      }
      // And one 'string' case
      if (expr.length >= 2 && expr[0] === "'" && expr[expr.length - 1] === "'") {
        return {
          type: 'string',
          // TODO: I'm not sure if this handles escaped stuff in strings entirely correctly
          value: expr.slice(1, expr.length - 1),
        }
      }
      return {
        type: 'symbol',
        value: expr,
      }
    }
    case 'symbol': {
      throw new Error('Expression cannot contain Symbol() ' + expr)
    }
    case 'undefined': {
      throw new Error('Expression was undefined')
    }
    default: {
      throw new Error('Expression contained an illegal value ' + expr)
    }
  }

  // if (expr === undefined) {
  //   throw new Error('Expression unknown: ' + expr)
  // }
  // try {
  //   if (expr.isNumber) {
  //     if (expr.isNaN) {
  //       return {
  //         type: 'number',
  //         value: NaN,
  //       }
  //     }
  //     if (expr.isInfinity) {
  //       return {
  //         type: 'number',
  //         value: Infinity,
  //       }
  //     }
  //     return {
  //       type: 'number',
  //       value: expr.asFloat,
  //     }
  //   }
  //   if (expr.symbol) {
  //     return {
  //       type: 'symbol',
  //       value: expr.symbol,
  //     }
  //   }
  //   if (expr.string) {
  //     return {
  //       type: 'string',
  //       value: expr.string,
  //     }
  //   }
  //   if (expr.head === 'Equal') {
  //     return {
  //       type: 'function',
  //       value: { head: expr.head, args: expr.json.slice(1) },
  //     }
  //   }
  //   if (expr.nops > 0) {

  //     console.log('uh oh, todo')
  //   }
  // } catch (error) {
  //   console.error(error)
  //   throw new Error('Expression contained an illegal value ' + expr)
  // }
  // throw new Error('Expression unknown ' + expr)
}
