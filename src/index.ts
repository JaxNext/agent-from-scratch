import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

async function main(): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: 'deepseek-flash',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant',
      }
    ],
    stream: true
  })

  for await (const chunk of stream) {
    console.log(chunk?.choices?.[0]?.delta?.content);
  }
}

main();
