import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid"; // 一意のファイル名生成用

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 環境変数からAPIキーを取得
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Vercel Blobへ画像をアップロード
    const fileName = `${uuidv4()}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { url: fileUrl } = await put(fileName, buffer, { access: 'public' });

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
                "url": fileUrl  // Vercel Blob のURLを使用
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
  }
}
