import assert from "node:assert/strict";
import { test } from "node:test";
import { answerQuestion } from "./guide.ts";

test("ranks Michigan from a plain question", () => {
  assert.equal(answerQuestion("Where does Michigan rank?").id, "rankings");
  assert.equal(answerQuestion("What did the Princeton Review say?").id, "rankings");
});

test("routes program questions", () => {
  assert.equal(answerQuestion("Tell me about I-Corps").id, "icorps");
  assert.equal(answerQuestion("When is the i corps deadline?").id, "icorps");
  assert.equal(answerQuestion("What is ELP?").id, "elp");
  assert.equal(answerQuestion("What is the graduate certificate?").id, "certificate");
  assert.equal(answerQuestion("Who is speaking at EHour?").id, "ehour");
  assert.equal(answerQuestion("Perot Jain Mcity").id, "techlabs");
  assert.equal(answerQuestion("Can a Ross student take ENTR courses?").id, "eligibility");
  assert.equal(answerQuestion("Where is the Center?").id, "visit");
  assert.equal(answerQuestion("I am a PhD student with a research idea").id, "icorps");
});

test("does not invent an answer for noise", () => {
  assert.equal(answerQuestion("asdf widget quartz").id, "fallback");
  assert.equal(answerQuestion("   ").id, "fallback");
});
