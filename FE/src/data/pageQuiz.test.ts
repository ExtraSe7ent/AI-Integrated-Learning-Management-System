import {describe,it,expect} from 'vitest';
import {pageQuiz} from './content';
const questions=[1,2,3,4,5].map(i=>({id:'q'+i,lessonId:'lesson',page:1,approved:true,text:'Question '+i,options:['A','B','C','D'],correct:0,explanation:'A'}));
describe('multiple quizzes on one slide',()=>{
 it('keeps every approved question and moves to the next unanswered',()=>{
  expect(pageQuiz(questions,'lesson',1,{}).items).toHaveLength(5);
  const state=pageQuiz(questions,'lesson',1,{q1:0});expect(state.current?.id).toBe('q2');expect(state.complete).toBe(false);
 });
 it('allows review of an answered question and completes only after all answers',()=>{
  expect(pageQuiz(questions,'lesson',1,{q1:1},'q1').current?.id).toBe('q1');
  expect(pageQuiz(questions,'lesson',1,{q1:0,q2:0,q3:1,q4:0,q5:0}).complete).toBe(true);
 });
 it('excludes other lessons, pages and unapproved questions',()=>{
  expect(pageQuiz([...questions,{...questions[0],id:'pending',approved:false}],'lesson',1,{}).items).toHaveLength(5);
  expect(pageQuiz(questions,'other',1,{}).items).toHaveLength(0);
  expect(pageQuiz(questions,'lesson',2,{}).items).toHaveLength(0);
 });
});
