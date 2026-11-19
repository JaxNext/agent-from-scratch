import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getSchema, callTool } from "./tools.js";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const tools = getSchema()

async function sendMessage(messages: ChatCompletionMessageParam[]) {
  return openai.chat.completions.create({
    model: 'deepseek-flash',
    messages,
    stream: false,
    tools
  })
}

async function runToolCalls(msg: ChatCompletionMessageParam): Promise<ChatCompletionMessageParam[]> {
  const tool_calls = (msg as { tool_calls?: { id: string; function: { name: string; arguments: string } }[] }).tool_calls ?? []
  return await Promise.all(tool_calls.map(async x => {
    const { name, arguments: args } = x.function
    return {
      role: 'tool' as const,
      tool_call_id: x.id,
      content: await callTool(name, args)
    }
  }))
}

async function main(): Promise<void> {
  const MAX_LOOP = 10
  let loopCount = 0
  let messages: ChatCompletionMessageParam[] = [
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
