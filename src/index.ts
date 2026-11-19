import OpenAI from "openai";
import type { ChatCompletionTool, ChatCompletionMessage } from "openai/resources/chat/completions";
import { getSchema, getFunc } from "./tools.js";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const tools: ChatCompletionTool[] = getSchema()

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
    const func = getFunc(name)
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
