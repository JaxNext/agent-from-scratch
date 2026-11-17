import { expect, test } from "vitest";
import { read_file, write_file } from "./tools.js";
import fs from "fs";

test('Read content a.txt', async () => {
    expect((await read_file('./src/a.txt')).toString()).toBe('abcde')
})

test('Create a new file b.txt and write bbbbb into it', async () => {
    await write_file('./src/b.txt', 'bbbbb')
    expect((await fs.readFileSync('./src/b.txt', 'utf-8'))).toBe('bbbbb')
})