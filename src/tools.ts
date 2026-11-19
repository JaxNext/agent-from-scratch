import fs from "fs";
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

export {
    read_file,
    write_file,
    run_shell,
}