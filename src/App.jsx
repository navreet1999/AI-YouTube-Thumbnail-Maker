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
  Zap, 
  Type, 
  Loader2,
  History,
  Trash2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateThumbnailPrompt, generateThumbnailImage } from "@/lib/gemini";
import { cn } from "@/lib/utils";

export default function App() {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

  const saveToHistory = (url, title) => {
    const newThumbnail = {
      id: Date.now().toString(),
      url,
      title,
      timestamp: Date.now(),
    };
    
    // Limit history to 6 items to save space
    let newHistory = [newThumbnail, ...history].slice(0, 6);
    
    const trySave = (data) => {
      try {
        localStorage.setItem("thumbnail_history", JSON.stringify(data));
        setHistory(data);
        return true;
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          return false;
        }
        throw e;
      }
    };

    // If saving fails, remove the oldest item and try again
    while (newHistory.length > 0 && !trySave(newHistory)) {
      newHistory.pop();
    }
    
    if (newHistory.length === 0) {
      console.warn("Could not save to history: Item too large for localStorage quota.");
      // We still update the state so the user sees it in the current session
      setHistory([newThumbnail]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (PNG, JPG, etc.)");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setImage(result);
        setError(null);
      } else {
        setError("Failed to process image data. Please try another file.");
      }
    };

    reader.onerror = () => {
      setError("Error reading file. The file might be corrupted or inaccessible.");
    };

    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Read attempt failed:", err);
      setError("Could not start reading the file. Please try again.");
    }

    // Reset input value so the same file can be selected again
    e.target.value = "";
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
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate thumbnail. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url, fileName) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, "_")}_thumbnail.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteFromHistory = (id) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("thumbnail_history", JSON.stringify(newHistory));
  };

  return (
    <div className="app-shell">
      {/* Background Glows */}
      <div className="glow-background">
        <div className="glow-top-left" />
        <div className="glow-bottom-right" />
      </div>

      <div className="main-container">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-[#D4AF37]/10 py-4 mb-12">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="header-logo-group"
            >
              <img 
                src="/logo.png" 
                alt="Navreet Kaur Logo" 
                className="header-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-lg shadow-lg shadow-[#D4AF37]/20">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <h1 className="header-title text-2xl">Navreet Kaur</h1>
              </div>
              <div className="hidden md:block ml-6 border-l border-zinc-800 pl-6">
                <h1 className="header-title text-2xl">AI Thumbnail Maker</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60 font-bold">Premium Visual Studio</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Badge variant="outline" className="px-4 py-1.5 border-[#D4AF37]/30 text-[#D4AF37] bg-[#D4AF37]/5 backdrop-blur-md font-bold tracking-widest text-[10px] uppercase">
                <Zap className="w-3 h-3 mr-2 fill-current" />
                Elite Access
              </Badge>
            </motion.div>
          </div>
        </header>

        <main className="main-grid">
          {/* Left Column: Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="controls-column"
          >
            <Card className="custom-card">
              <CardHeader>
                <CardTitle className="text-xl font-black font-heading flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]/20" />
                  Premium Configuration
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Enter your video title and optional headshot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-400 font-medium">Video Title</Label>
                  <Textarea
                    id="title"
                    placeholder="Enter your compelling video title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    rows={4}
                    className="resize-none bg-zinc-950/50 border-zinc-800 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 transition-all text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-zinc-400 font-medium">Your Headshot (Optional)</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "upload-zone group",
                      image ? "upload-zone-active" : "upload-zone-empty"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {image ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={image} 
                          alt="Preview" 
                          className="max-h-[180px] rounded-lg shadow-2xl border border-zinc-800"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <p className="text-white text-sm font-bold">Change Photo</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon-wrapper">
                          <Upload className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">Upload Headshot</p>
                          <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !title}
                  className="generate-button"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Crafting Masterpiece...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2 fill-current" />
                      Generate Premium Thumbnail
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
          </motion.div>

          {/* Right Column: Preview & Results */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="preview-column"
          >
            {/* Main Preview */}
            <div className="main-preview-container group">
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
                    <div className="preview-overlay">
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
            <div className="space-y-6">
              <div className="history-section-header">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                    <History className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-widest text-sm font-heading">Creation Vault</h2>
                </div>
                {history.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-zinc-500 hover:text-[#D4AF37] transition-colors text-xs uppercase tracking-tighter"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem("thumbnail_history");
                    }}
                  >
                    Purge All
                  </Button>
                )}
              </div>
              
              {history.length > 0 ? (
                <div className="history-grid">
                  {history.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="history-item-card group"
                    >
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="history-item-overlay">
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
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="footer-layout border-zinc-800/30">
          <div className="flex items-center gap-2 text-[#D4AF37]/60">
            <Sparkles className="w-4 h-4" />
            <p>© 2026 Navreet Kaur. Premium AI Design.</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-[#D4AF37] transition-colors uppercase tracking-widest text-[10px]">Terms of Service</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors uppercase tracking-widest text-[10px]">Privacy Policy</a>
            <a href="#" className="hover:text-[#D4AF37] transition-colors uppercase tracking-widest text-[10px]">Concierge Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
