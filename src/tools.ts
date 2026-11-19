import fs from "fs";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const execAsync = promisify(exec);

async function read_file(path: string) {
    return await fs.readFileSync(path)
}

async function write_file(path: string, content: string) {
    await fs.writeFileSync(path, content)
    return `Successfully write file ${path}`
}

async function confirm(question:string): Promise<boolean> {
    const rl = createInterface({
        input: stdin,
        output: stdout
    })
    try {
        const answer = await rl.question(`${question} (y/N) `)
        return /^y(es)?$/i.test(answer.trim())
    } catch (error) {
        return false
    } finally {
        rl.close()
    }
}

type Approve = (question: string) => Promise<boolean>;

async function run_shell(command: string, approve: Approve = confirm): Promise<string> {
    if (!command.trim()) return ""
    const confirmation = await approve(`Are you sure to run [${command}]?`)
    if (!confirmation) return "User declined to run the command."

    try {
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30_000,
            maxBuffer: 10 * 1024 * 1024,
        })
        return [stdout, stderr].filter(Boolean).join("\n").trim() || "(no output)"
    } catch (error) {
        const err = error as { code?: number | string; stdout?: string; stderr?: string; message: string }
        return `Command failed (exit ${err.code ?? "?"}):\n${(err.stderr || err.stdout || err.message).trim()}`
    }
}

const definitions = {
    read_file: {
        description: 'Read a file by a given path',
        parameters: {
            properties: {
                path: { type: 'string', description: 'The path of the given file' },
            },
            required: ['path'],
        },
        run: read_file,
    },
    write_file: {
        description: 'Write given content into a file by a given path',
        parameters: {
            properties: {
                path: { type: 'string', description: 'The path of the given file' },
                content: { type: 'string', description: 'The content that needs to be written' },
            },
            required: ['path', 'content'],
        },
        run: write_file,
    },
    run_shell: {
        description: 'Run a command-line in shell',
        parameters: {
            properties: {
                command: { type: 'string', description: 'The command that needs to be run' },
            },
            required: ['command'],
        },
        run: run_shell,
    },
}

const registry = {}

for (const [name, definition] of Object.entries(definitions)) {
    registry[name] = {
        schema: {
            type: 'function',
            function: {
                name,
                description: definition.description,
                parameters: {
                    type: 'object',
                    properties: definition.parameters.properties,
                    required: definition.parameters.required,
                },
            },
        },
        run: definition.run,
    }
}

function getSchema(): ChatCompletionTool[] {
    return Object.values(registry).map(tool => tool.schema)
}

async function callTool(name: string, rawArgs: string): Promise<string> {
    const tool = registry[name]
    if (!tool) return `Unknown tool: ${name}`

    let args: unknown = {}
    if (rawArgs.trim()) {
        try {
            args = JSON.parse(rawArgs)
        } catch {
            return `Invalid JSON arguments for ${name}: ${rawArgs}`
        }
    }

    return tool.run(...(Object.values(args)))
}

export {
    read_file,
    write_file,
    run_shell,
    getSchema,
    callTool,
}