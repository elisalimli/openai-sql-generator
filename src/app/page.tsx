"use client";
import { Configuration, OpenAIApi } from "openai";
import { ChangeEvent, use, useRef, useState } from "react";

const configuration = new Configuration({
  apiKey: "YOUR_API_KEY",
});

const openai = new OpenAIApi(configuration);

async function handler(initialPrompt: string, tables: string[]) {
  // let promptData = req.body.promptData;
  // const response = await openai.createCompletion("gpt-3.5-turbo", {
  //   prompt: "say hello",
  //   temperature: 0.3,
  //   max_tokens: 60,
  //   top_p: 1,
  //   frequency_penalty: 0,
  //   presence_penalty: 0,
  // });

  /*
  Generate a number of SQL queries given a natural language instruction,
  and pick the best one based on the average log probability of explaining the
  candidate SQL query with the exact original instruction, when prompted for
  a natural language explanation of the candidate SQL query.

          get latest posts, select every column of the post, store tags of the post in tags column. 
tags should be an array of tag objects



  */

  const dbSchema = tables.join("\n");

  const prompt = `
  ${dbSchema ? `My database schema : """${dbSchema}"""` : null}
  
  Text : """
    ${initialPrompt}
  """
  `;
  console.log(prompt);
  const result = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: `system`,
        content: ` 
        You are a SQL expert.
        You will create efficient, scalable, optimal, best SQL queries according to user's request.
        Return the most optimal solution and follow the best practicies.
        Return only SQL query


        ${dbSchema ? `My PostgreSQL schema : """${dbSchema}""" \n\n` : null}
        `,
      },
      {
        role: "user",
        content: `
        Request : """
          ${initialPrompt}
        """
      `,
      },
    ],
    temperature: 0,
    max_tokens: 2048,
  });
  return result.data.choices[0].message?.content;
}

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [tables, setTables] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setPrompt(e.target.value);

  const handleSubmit = async () => {
    const res = await handler(prompt, tables);
    setAnswer(res);
  };

  const handleFileSubmit = (e) => {
    if (e?.target?.files?.length) {
      const reader = new FileReader();

      reader.addEventListener(
        "load",
        () => {
          if (reader?.result) {
            const regex = /CREATE TABLE[\s\S]*?\);/g;
            const content = reader?.result as string;
            const tables = content?.match(regex);
            setTables(tables ?? []);
          }
        },
        false
      );
      const file = e?.target?.files[0];

      if (file) {
        reader.readAsText(file);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <textarea
        className="bg-black border-white-500 border w-1/2 h-64"
        value={prompt}
        onChange={handleChange}
      />
      <button
        onClick={handleSubmit}
        className="bg-white text-black rounded-full p-4 font-semibold mt-4"
      >
        Generate query
      </button>
      <div className="my-4">
        <button type="button" onClick={() => fileInputRef?.current?.click()}>
          Select DB schema
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(event) => handleFileSubmit(event)}
          hidden
        />
      </div>
      {answer && (
        <div className="mx-auto max-w-md bg-red-300 rounded-lg p-4 mt-8">
          <code>{answer}</code>
        </div>
      )}
    </main>
  );
}
