const res = {
  id: 'c5cd6c4f-df77-4291-a810-55c445a059bf',
  object: 'chat.completion',
  created: 1795055021,
  model: 'deepseek-flash',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: '',
        reasoning_content: 'Simple.',
        tool_calls: [
            {
                index: 0,
                id: 'call_00_LIWc8bglabdtFny7Hx9n9250',
                type: 'function',
                function: {
                    name: 'write_file',
                    arguments: '{"path": "index.js", "content": "console.log(\\"Hello, agent\\");\\n"}'
                }
            },
            {
                index: 1,
                id: 'call_01_LPy9uzxvCmsBtmokEGex7524',
                type: 'function',
                function: [Object]
            }
        ]
      },
      logprobs: null,
      finish_reason: 'tool_calls'
    }
  ],
  usage: {
    prompt_tokens: 469,
    completion_tokens: 69,
    total_tokens: 538,
    prompt_tokens_details: { cached_tokens: 0 },
    completion_tokens_details: { reasoning_tokens: 0 },
    prompt_cache_hit_tokens: 0,
    prompt_cache_miss_tokens: 469
  },
  system_fingerprint: 'bc19ba97cbe016479903222bb1578db6'
}