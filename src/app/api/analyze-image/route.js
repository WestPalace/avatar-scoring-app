// // 以下はローカル環境版（dummyURL）
// import { NextResponse } from "next/server";
// import { writeFile, unlink } from "fs/promises";
// import path from "path";
// import OpenAI from "openai";
// import { v4 as uuidv4 } from "uuid"; // 一意のファイル名生成用

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // 環境変数からAPIキーを取得
// });

// export async function POST(req) {
//   let filePath = null; // ファイルパスを後で削除できるように保持

//   try {
//     const formData = await req.formData();
//     const file = formData.get("image");

//     if (!file || file.size === 0) {
//       return NextResponse.json(
//         { error: "No image provided" },
//         { status: 400 }
//       );
//     }

//     // 一時保存用ディレクトリ (public/uploads) にファイルを保存
//     const tempFileName = `${uuidv4()}.jpg`;
//     filePath = path.join(process.cwd(), "public/uploads", tempFileName);
//     const buffer = Buffer.from(await file.arrayBuffer());
//     await writeFile(filePath, buffer);

//     // URLを生成
//     const fileUrl = `${req.headers.get("origin")}/uploads/${tempFileName}`;

//     const dummyURL = "https://pbs.twimg.com/media/GaQ-cURbUAQapaL?format=jpg&name=large";

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           "role": "user",
//           "content": [
//             {
//               "type": "image_url",
//               "image_url": {
//                 "url": dummyURL
//               }
//             },
//             {
//               "type": "text",
//               "text": "添付した画像中のキャラクタの見た目を100点満点で評価してください(評価は厳しくする)．また，キャラクタのポイントと，さらに見た目を良くするためのアドバイスをそれぞれ200文字以内で記述してください．\n画像中にキャラクタが複数いれば，個別に評価してください．回答はjson形式で行なってください．jsonは\"character\"配列において,左側のキャラクタから順に配列の要素とし，それぞれ\"score\"(数字),\"points\"(文字列),\"advice\"(文字列)の3つの属性を持つようにしてください．"
//             }
//           ]
//         },
//       ],
//       response_format: {
//         "type": "json_object"
//       },
//       temperature: 1,
//       max_completion_tokens: 2048,
//       top_p: 1,
//       frequency_penalty: 0,
//       presence_penalty: 0
//     }); 

//     const content = JSON.parse(completion.choices[0].message.content);

//     return NextResponse.json({
//       chatGPTResponse: completion.choices[0].message.content,
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to process the image" },
//       { status: 500 }
//     );
//   } finally {
//     // ファイルを削除
//     if (filePath) {
//       try {
//         await unlink(filePath);
//         console.log(`Deleted file: ${filePath}`);
//       } catch (unlinkError) {
//         console.error(`Failed to delete file: ${filePath}`, unlinkError);
//       }
//     }
//   }
// }


// 以下は実環境版
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid"; // 一意のファイル名生成用

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 環境変数からAPIキーを取得
});

export async function POST(req) {
  let filePath = null; // ファイルパスを保存して後で削除する

  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // 一時保存用ディレクトリ (public/uploads) にファイルを保存
    const tempFileName = `${uuidv4()}.jpg`;
    filePath = path.join(process.cwd(), "public/uploads", tempFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // 実際の画像URLを生成
    const fileUrl = `${req.headers.get("origin")}/uploads/${tempFileName}`;

    // OpenAI API に画像URLを渡す
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          "role": "user",
          "content": [
            {
              "type": "image_url",
              "image_url": {
                "url": fileUrl  // 実際の画像URLを使用
              }
            },
            {
              "type": "text",
              "text": "添付した画像中のキャラクタの見た目を100点満点で評価してください(評価は厳しくする)．また，キャラクタのポイントと，さらに見た目を良くするためのアドバイスをそれぞれ200文字以内で記述してください．\n画像中にキャラクタが複数いれば，個別に評価してください．回答はjson形式で行なってください．jsonは\"character\"配列において,左側のキャラクタから順に配列の要素とし，それぞれ\"score\"(数字),\"points\"(文字列),\"advice\"(文字列)の3つの属性を持つようにしてください．"
            }
          ]
        },
      ],
      response_format: {
        "type": "json_object"
      },
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const content = JSON.parse(completion.choices[0].message.content);

    return NextResponse.json({
      chatGPTResponse: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process the image" },
      { status: 500 }
    );
  } finally {
    // ファイルを削除
    if (filePath) {
      try {
        await unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (unlinkError) {
        console.error(`Failed to delete file: ${filePath}`, unlinkError);
      }
    }
  }
}
