import test from 'node:test';
import assert from 'node:assert/strict';
import {toolStarts, buildProbePrompt} from './probe-prompt.mjs';
test('input messages are not tool calls; actual and unknown tools remain visible', () => {
  const records = ['userMessage','reasoning','agentMessage','commandExecution','mcpToolCall','futureTool'].map(type => ({method:'item/started',params:{item:{type}}}));
  assert.deepEqual(toolStarts(records).map(p=>p.params.item.type), ['commandExecution','mcpToolCall','futureTool']);
});
test('empty-memory probe retains situation and envelope with no experience content', () => {
  const prompt = buildProbePrompt('',{nodes:[],edges:[]},'SITUATION_SENTINEL','QUESTION_SENTINEL');
  assert.ok(prompt.includes('NOTEBOOK\n\n\nCONCEPT MAP\n{"nodes":[],"edges":[]}'));
  assert.ok(prompt.endsWith('SITUATION\nSITUATION_SENTINEL\n\nQUESTION_SENTINEL'));
});
