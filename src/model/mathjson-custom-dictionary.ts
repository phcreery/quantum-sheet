// import { Expression, LatexSyntax } from '@cortex-js/compute-engine'
import { ComputeEngine } from '@cortex-js/compute-engine'
// import { LatexSyntax } from '@cortex-js/cortex'
import { Parser } from '@cortex-js/compute-engine/dist/types/compute-engine/latex-syntax/public' // LatexDictionary, ParserFunction, Scanner, SerializerFunction
import { LatexDictionary, Expression } from '@cortex-js/compute-engine/dist/types/math-json'

// export const ce = new ComputeEngine()

const MISSING = 'Missing'

/*
References:

> I haven't had the chance to document  the custom parsers yet (but that's the intent at some point). 
  Note that rather than the quite clever `dictionary.find((v) => v.name == "Equal").parse = ` 
  I would recommend that you pass a custom `FunctionDefinition` to the `dictionary` argument of `new LatexSyntax()`. 
> Anyway, the tuple returned by the parse function is `[remainder, result]`. 
  In other words, you would return something else than `null` if you had not been able to parse some or all of it 
  (like `return [lhs, null]` which basically says: "I wasn't able to consume any of it").
> That said, with the default parser, if you enter `x =` you will get back `["Equal", "x", "Missing"]`. 
  The `"Missing"` symbol indicates... er... that something is missing when there is a "mandatory" argument.
> --@ arnog


https://github.com/cortex-js/compute-engine/blob/680462ea46b9d5c4c53d046d807bd9eeab4b853c/src/latex-syntax/definitions-arithmetic.ts
*/
/**
 * The dictionary has to be customized a bit for QuantumSheet
 * Things include, but are not limited to
 * `==` meaning equality
 * `=` being used to (numerically) evaluate something
 * `->` being used to symbolically evaluate something
 */
export const dictionary = ComputeEngine.getLatexDictionary() //ce.latexOptions..latexSyntax.getDictionary() // as LatexDictionary // A bit of a hack
// console.log(dictionary)

// `a == b =` should be parsed as `(a == b) =`
// Basically, it should first check whether the two are equivalent and then calculate the result
// TODO: Add solve argument
// dictionary.find((v) => v.name === 'EqualEqual')!.precedence = 265

// dictionary.find((v) => v.name === 'Equal')!.associativity = 'left'

// TODO: Check out the precedences for things like LessEqual
// TODO: Document those custom symbols, because they're non-standard mathjson. They're a part of the QuantumSheet backend

// Evaluate should be special, as to not conflict with things like `lim_{n \to 3}`
// `x^2 + 3x + c == 0 -> ` should evaluate the quadratic equation

export const EVALUATE = 'Evaluate'

// dictionary.push({
//   precedence: 260,
//   name: EVALUATE,
//   optionalLatexArg: 1,
//   requiredLatexArg: 1,
//   associativity: 'left',
//   trigger: { infix: '\\xrightarrow' },
//   serialize: <SerializerFunction<number>>function (emitter, expr) {
//     if (!Array.isArray(expr)) throw new Error('Expect array expression')

//     return (
//       emitter.wrap(expr[1], 260) +
//       `\\xrightarrow{${
//         Array.isArray(expr[2]) && expr[2][0] == MISSING // TODO: Make this more elegant
//           ? '\\placeholder{}'
//           : expr[2]
//       }}` +
//       emitter.wrap(expr[3], 260)
//     )
//   },
//   parse: function (parser: Parser, lhs, minPrec): Expression {
//     if (260 < minPrec) return [lhs, null]
//     if (!parser.match('\\xrightarrow')) return [lhs, null]

//     parser.matchOptionalLatexArgument()
//     //const solveArgument = parser.matchRequiredLatexArgument(); // TODO: Add the solve keyword to known stuff
//     let solveArgument: string | string[] = ''
//     parser.skipSpace()
//     if (parser.match('<{>')) {
//       let level = 1
//       while (!parser.atEnd && level !== 0) {
//         if (parser.match('<{>')) {
//           level += 1
//         } else if (parser.match('<}>')) {
//           level -= 1
//         } else if (parser.match('<space>')) {
//           solveArgument += ' '
//         } else {
//           solveArgument += parser.next()
//         }
//       }
//     }
//     if (solveArgument.startsWith('\\placeholder')) {
//       solveArgument = [MISSING, solveArgument.replace(/^\\placeholder/, '')]
//     }

//     const rhs = parser.matchExpression(260)
//     return [null, ['Evaluate', lhs, solveArgument, rhs]]
//   },
// })

// TODO: This is a bit of a hack
// dictionary.push({
//   precedence: 260,
//   name: 'Text',
//   requiredLatexArg: 1,
//   associativity: 'non',
//   trigger: { symbol: '\\text' },
//   serialize: function (emitter, expr) {
//     if (!Array.isArray(expr)) throw new Error('Expect array expression')
//     return ` \\text{${expr[1].str}} `
//   },
//   parse: <ParserFunction<number>>function (lhs, scanner, minPrec) {
//     if (260 < minPrec) return [lhs, null]
//     if (!scanner.match('\\text')) return [lhs, null]

//     let text: string = ''
//     scanner.skipSpace()
//     if (scanner.match('<{>')) {
//       let level = 1
//       while (!scanner.atEnd && level !== 0) {
//         if (scanner.match('<{>')) {
//           level += 1
//         } else if (scanner.match('<}>')) {
//           level -= 1
//         } else if (scanner.match('<space>')) {
//           text += ' '
//         } else {
//           text += scanner.next()
//         }
//       }
//     }

//     return [null, ['Text', { str: text }]]
//   },
// })
