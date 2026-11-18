import { expect, test, vi } from "vitest";
import { read_file, write_file, run_shell } from "./tools.js";
import fs from "fs";

const approve = async () => true
const decline = async () => false

test('Read content a.txt', async () => {
    expect((await read_file('./src/a.txt')).toString()).toBe('abcde')
})

test('Create a new file b.txt and write bbbbb into it', async () => {
    await write_file('./src/b.txt', 'bbbbb')
    expect((await fs.readFileSync('./src/b.txt', 'utf-8'))).toBe('bbbbb')
})

test('run_shell returns stdout when the user approves', async () => {
    expect(await run_shell('echo hello', approve)).toBe('hello')
})

test('run_shell includes stderr in the output', async () => {
    expect(await run_shell('echo oops >&2', approve)).toBe('oops')
})

test('run_shell runs nothing when the user declines', async () => {
    expect(await run_shell('echo hello', decline)).toBe('User declined to run the command.')
})

test('run_shell skips the prompt for an empty command', async () => {
    const spy = vi.fn(approve)
    expect(await run_shell('   ', spy)).toBe('')
    expect(spy).not.toHaveBeenCalled()
})

test('run_shell reports the exit code and stderr of a failing command', async () => {
    const output = await run_shell('echo boom >&2; exit 3', approve)
    expect(output).toContain('Command failed (exit 3)')
    expect(output).toContain('boom')
})

test('run_shell does not throw on a command that cannot be found', async () => {
    const output = await run_shell('this-command-does-not-exist', approve)
    expect(output).toContain('Command failed')
})