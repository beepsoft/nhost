import chalk from 'chalk'
import fs from 'fs/promises'
import kebabCase from 'just-kebab-case'
import { snapshot } from 'valtio'

import { appState } from '../state'
import { GeneratorOptions, Signature } from '../types'

export type GenerateFunctionsOptions = GeneratorOptions & {
  /**
   * Whether or not to keep the original order of the functions.
   *
   * @default false
   */
  keepOriginalOrder?: boolean
}

/**
 * Generates the documentation for functions from the auto-generated JSON file.
 *
 * @param parsedContent - Content of the auto-generated JSON file.
 * @param outputPath - Path to the output directory.
 * @param options - Additional options.
 * @returns Results of the generation.
 */
export async function generateFunctions(
  parsedContent: Array<Signature>,
  outputPath: string,
  { originalDocument = null, keepOriginalOrder = false }: GenerateFunctionsOptions = {}
) {
  const finalOutputPath = `${outputPath}/content`
  const { verbose } = snapshot(appState)
  const { FunctionTemplate } = await import('../templates')
  const functions: Array<{ name: string; content: string }> = parsedContent
    .filter((document) => ['Function', 'Method'].includes(document.kindString))
    .map((props: Signature) => ({
      name: props.name,
      content: FunctionTemplate(props, originalDocument || parsedContent)
    }))

  const results = await Promise.allSettled(
    functions.map(async ({ name, content }, index) => {
      const fileName = keepOriginalOrder
        ? `${(index + 1).toString().padStart(2, '0')}-${kebabCase(name)}.mdx`
        : `${kebabCase(name)}.mdx`
      const fileOutput = `${finalOutputPath}/${fileName}`

      // we are creating the folder for functions
      try {
        await fs.mkdir(finalOutputPath)
      } catch {
        if (verbose) {
          console.info(chalk.blue`⏭️  Skipping: Functions folder already exists.\n`)
        }
      }

      // we are removing the file if it already exists
      try {
        await fs.rm(fileOutput)
      } catch {
        if (verbose) {
          console.info(chalk.blue`⏭️  Skipping: Function doesn't exist yet.\n`)
        }
      }

      // we are writing the documentation file
      await fs.writeFile(fileOutput, content, 'utf-8')

      return { fileName, fileOutput }
    })
  )

  results.forEach((result) => {
    if (result.status === 'rejected') {
      return console.error(
        chalk.red`🔴 ${result.reason.message}`,
        chalk.gray`\n${result.reason.stack}`
      )
    }

    if (verbose) {
      console.info(
        chalk.green`✅ Generated ${chalk.bold(result.value.fileName)}\n    ${chalk.italic.gray(
          `(Output: ${result.value.fileOutput})`
        )}`
      )
    }
  })

  return results
}

export default generateFunctions
