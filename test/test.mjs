const { describe, test,expect } = require('mocha');
import OpenAIAPIBot from '../src/bots/openai/OpenAIAPIBot.js';

describe('OpenAIAPIBot', () => {
  // 测试代码编写示例
  test('test case description', () => {
    const bot = new OpenAIAPIBot();
    // 执行测试
    expect(bot._sendPrompt('hello')).toBe('hello');
  });
});
