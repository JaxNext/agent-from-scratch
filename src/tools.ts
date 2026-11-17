import fs from "fs";

async function read_file(path: string) {
    return await fs.readFileSync(path)
}

async function write_file(path: string, content: string) {
    await fs.writeFileSync(path, content)
}

async function run_shell(command: string) {
    if (!command) return

    
}

export {
    read_file,
    write_file,
}