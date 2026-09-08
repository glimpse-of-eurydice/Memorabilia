import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGraph} from './graph.mjs';
test('empty map is a valid choice',()=>assert.deepEqual(validateGraph({nodes:[],edges:[]}),{nodes:[],edges:[]}));
test('free relation labels and descriptive fields survive',()=>{const g={nodes:[{id:'a',label:'a',summary:'x'},{id:'b',label:'b'}],edges:[{id:'e',source:'a',target:'b',label:'interrupts without replacing',evidence:'p1'}]}; assert.equal(validateGraph(g),g);});
test('dangling and duplicate IDs are rejected',()=>{assert.throws(()=>validateGraph({nodes:[{id:'a',label:'a'},{id:'a',label:'b'}],edges:[]}));assert.throws(()=>validateGraph({nodes:[],edges:[{id:'e',source:'a',target:'b',label:'x'}]}));});
