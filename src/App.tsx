/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Type, 
  Layout,
  ChevronRight,
  History,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateThumbnailPrompt, generateThumbnailImage } from "@/lib/gemini";
import { cn } from "@/lib/utils";

interface Thumbnail {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

export default function App() {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<Thumbnail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem("thumbnail_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (url: string, title: string) => {
    const newThumbnail: Thumbnail = {
      id: Date.now().toString(),
      url,
      title,
      timestamp: Date.now(),
    };
    const newHistory = [newThumbnail, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("thumbnail_history", JSON.stringify(newHistory));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError("Please enter a video title");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = await generateThumbnailPrompt(title, !!image);
      const url = await generateThumbnailImage(prompt, image || undefined);
      setGeneratedUrl(url);
      saveToHistory(url, title);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate thumbnail. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, "_")}_thumbnail.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("thumbnail_history", JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">AI Thumbnail Maker</h1>
            </div>
            <p className="text-zinc-400 max-w-md">
              Create high-CTR YouTube thumbnails in seconds using advanced AI.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1 border-zinc-800 text-zinc-400 bg-zinc-900/50">
              <Sparkles className="w-3 h-3 mr-1 text-orange-500" />
              Powered by Gemini 2.5
            </Badge>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Type className="w-4 h-4 text-orange-500" />
                  Video Details
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Enter your video title and optional headshot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-300">Video Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. How I Made $10,000 in 30 Days"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 focus:ring-orange-500/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Headshot Photo (Optional)</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "group relative border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[160px]",
                      image 
                        ? "border-orange-500/50 bg-orange-500/5" 
                        : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30"
                    )}
                  >
                    {image ? (
                      <>
                        <img 
                          src={image} 
                          alt="Headshot" 
                          className="w-full h-32 object-cover rounded-lg shadow-2xl"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImage(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <p className="text-xs text-zinc-400">Click to change photo</p>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-zinc-300">Upload Headshot</p>
                          <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !title}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-orange-600/20"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Thumbnail
                    </>
                  )}
                </Button>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <p className="text-xs text-zinc-500">Use short, punchy titles for better text placement.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <p className="text-xs text-zinc-500">High-quality headshots with clear expressions work best.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <p className="text-xs text-zinc-500">Vibrant colors increase CTR by up to 40%.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview & Results */}
          <div className="lg:col-span-8 space-y-8">
            {/* Main Preview */}
            <div className="relative aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl group">
              <AnimatePresence mode="wait">
                {generatedUrl ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full"
                  >
                    <img 
                      src={generatedUrl} 
                      alt="Generated Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <Button 
                        onClick={() => downloadImage(generatedUrl, title)}
                        className="bg-white text-black hover:bg-zinc-200"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download 4K
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleGenerate}
                        className="bg-black/50 border-white/20 text-white hover:bg-black/80"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Crafting your masterpiece...</h3>
                      <p className="text-zinc-500 max-w-sm">
                        Our AI is analyzing your title and designing a high-impact layout with cinematic lighting.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-12 text-center"
                  >
                    <div className="p-6 bg-zinc-800/50 rounded-full">
                      <ImageIcon className="w-12 h-12 text-zinc-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-medium text-zinc-400">Your thumbnail will appear here</h3>
                      <p className="text-zinc-600">Enter a title and click generate to start.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Aspect Ratio Guide */}
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-zinc-300 border-zinc-700">
                  1280 x 720 (16:9)
                </Badge>
              </div>
            </div>

            {/* History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-500" />
                  Recent Generations
                </h2>
                {history.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-zinc-500 hover:text-white"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("thumbnail_history");
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {history.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
                    >
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 bg-black/40 hover:bg-red-500 text-white rounded-full"
                            onClick={() => deleteFromHistory(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium text-white line-clamp-2 leading-tight">
                            {item.title}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] flex-1 bg-white text-black hover:bg-zinc-200"
                              onClick={() => setGeneratedUrl(item.url)}
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] flex-1 bg-zinc-800 text-white hover:bg-zinc-700"
                              onClick={() => downloadImage(item.url, item.title)}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-zinc-800 rounded-2xl text-center">
                  <p className="text-zinc-600">No recent generations yet.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-sm">
          <p>© 2026 AI Thumbnail Maker. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
