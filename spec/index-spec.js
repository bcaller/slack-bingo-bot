var index = require("../index");

describe("Bingos accepting behaviour", function () {
  it("should accept full sentences", function () {
    expect(index.containsSentence("This is a sentence.")).toBeTruthy();
    expect(index.containsSentence("Sentence.")).toBeFalsy();
    expect(index.containsSentence("blue cheese won't fit")).toBeFalsy();
  });
  it("should accept multiple sentences", function () {
    expect(index.containsSentence("This is a text. But it has another sentence.")).toBeTruthy();
  });
});    