"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState([]);
  const [points, setPoints] = useState([]);
  const [advices, setAdvices] = useState([]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setResult(data.chatGPTResponse);
      const content = JSON.parse(data.chatGPTResponse);
      setScores(content.character.map((char) => char.score));
      setPoints(content.character.map((char) => char.points));
      setAdvices(content.character.map((char) => char.advice));
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-200 p-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6" style={{ color: "#000000" }}>VRC改変チェッカー</h1>
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle>ファイルをアップロード</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"
          />
          {image && (
            <div className="mt-4">
              <p className="text-gray-600">プレビュー:</p>
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="max-w-full rounded-lg shadow-md"
              />
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading ? "処理中..." : "採点する！"}
          </Button>
          {loading && <Progress className="mt-4" />}
          {error && (
            <p className="mt-4 text-red-600 text-sm">
              エラー: {error}
            </p>
          )}
        </CardContent>
      </Card>
      {result && (
        <div className="mt-6 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold text-gray-800">結果</h2>
          <div className="grid grid-cols-1 gap-4 mt-4">
            {scores.map((score, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader>
                  <CardTitle>キャラクター {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>スコア: {score}</p>
                  <p>ポイント: {points[index]}</p>
                  <p>アドバイス: {advices[index]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
