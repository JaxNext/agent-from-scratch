import OpenAI from "openai";
import type { ChatCompletionTool, ChatCompletionMessage } from "openai/resources/chat/completions";
import { read_file, write_file, run_shell } from "./tools.js";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const toolFuncs = {
  read_file,
  write_file,
  run_shell
}

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file by a given path',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path of the given file'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write given content into a file by a given path',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path of the given file'
          },
          content: {
            type: 'string',
            description: 'The content that needs to be written'
          }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_shell',
      description: 'Run a command-line in shell',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The command that needs to be run'
          }
        },
        required: ['command']
      }
    }
  }
]

async function sendMessage(messages) {
  return openai.chat.completions.create({
    model: 'deepseek-flash',
    messages,
    stream: false,
    tools
  })
}

async function runToolCalls(msg) {
  const { tool_calls } = msg
  return await Promise.all(tool_calls.map(async x => {
    const { name, arguments: args } = x.function
    const func = toolFuncs[name]
    if (!func) return Promise.reject(`Function ${name} does not exist`)
    const argsObj = JSON.parse(args)
    const res = await func(...Object.values(argsObj))
    return {
      role: 'tool',
      tool_call_id: x.id,
      content: res
    }
  }))
}

async function main(): Promise<void> {
  const MAX_LOOP = 10
  let loopCount = 0
  let messages: ChatCompletionMessage[] = [
    {
      role: 'user',
      content: 'In current directory, create a file index.js for the purpose of printing string "Hello, agent", then run it' 
    }
  ]

  while (true) {
    const response = await sendMessage(messages)
    // console.log('RRR', ...(response.choices[0].message.tool_calls?.map(x => x.function)));
    const currentMsg = response.choices[0].message
    messages.push(currentMsg)

    if (loopCount >= MAX_LOOP || !currentMsg.tool_calls?.length) {
      console.log('RRR', currentMsg.content);
      
      return
    }

    const toolCallResMsgs = await runToolCalls(currentMsg)
    messages.push(...toolCallResMsgs)

    loopCount ++
  }

  // for await (const chunk of stream) {
  //   console.log(chunk?.choices?.[0]?.delta?.content);
  // }
}

main();
