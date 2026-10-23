#!/usr/bin/env python3
"""
PromptFlow AI - Web-based Teleprompter Server
Lightweight Python HTTP server with AI assistant endpoints powered by .env_duolingoClone.
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import json
import os
import sys

PORT = 8080

def load_env():
    config = {}
    candidate_files = [".env", ".env_duolingoClone", ".env.local"]
    for filepath in candidate_files:
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, val = line.split("=", 1)
                        config[key.strip()] = val.strip().strip('"').strip("'")
            break

    # Also fallback to OS environment variables if set in cloud/deployment platforms
    for key in [
        "PUBLIC_OPEN_ROUTER_API_KEY", "OPENROUTER_API_KEY",
        "PUBLIC_ASSEMBLY_AI_API_KEY", "ASSEMBLYAI_API_KEY",
        "PUBLIC_GROK_WHISPER_API", "GROQ_API_KEY", "GROK_WHISPER_API",
        "PUBLIC_GEMINI_API_KEY", "GEMINI_API_KEY", "PUBLIC_GEMINI_API_KEY_BACKUP"
    ]:
        if key in os.environ and key not in config:
            config[key] = os.environ[key]

    return config

ENV = load_env()
OPENROUTER_KEY = ENV.get("PUBLIC_OPEN_ROUTER_API_KEY") or ENV.get("OPENROUTER_API_KEY", "")
ASSEMBLY_KEY = ENV.get("PUBLIC_ASSEMBLY_AI_API_KEY") or ENV.get("ASSEMBLYAI_API_KEY", "")
GROQ_KEY = ENV.get("PUBLIC_GROK_WHISPER_API") or ENV.get("GROQ_API_KEY") or ENV.get("GROK_WHISPER_API", "")
GEMINI_KEY = ENV.get("PUBLIC_GEMINI_API_KEY") or ENV.get("GEMINI_API_KEY") or ENV.get("PUBLIC_GEMINI_API_KEY_BACKUP", "")

def call_ai(prompt, system_instruction="You are an expert speechwriter and teleprompter coach."):
    """Calls OpenRouter with fallback models."""
    if not OPENROUTER_KEY:
        raise ValueError("No OpenRouter API key found in .env or environment")

    models_to_try = [
        "openrouter/auto",
        "nvidia/nemotron-3.5-lightning:free",
        "liquid/lfm-2.5-2.6b:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "google/gemini-2.0-flash-exp:free"
    ]

    last_error = None
    for model in models_to_try:
        try:
            req_data = json.dumps({
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1500
            }).encode("utf-8")

            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8080",
                    "X-Title": "PromptFlow Teleprompter"
                },
                data=req_data
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                content = res_body["choices"][0]["message"]["content"]
                return content.strip(), model
        except Exception as e:
            last_error = e
            continue

    raise RuntimeError(f"All AI models failed. Last error: {last_error}")

class TeleprompterHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching for development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            status = {
                "openrouter": bool(OPENROUTER_KEY),
                "assemblyai": bool(ASSEMBLY_KEY),
                "groq": bool(GROQ_KEY),
                "gemini": bool(GEMINI_KEY),
            }
            self.wfile.write(json.dumps(status).encode("utf-8"))
            return

        # Default static file serving
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/ai/generate":
            self.handle_ai_generate()
        elif self.path == "/api/ai/enhance":
            self.handle_ai_enhance()
        elif self.path == "/api/ai/transcribe":
            self.handle_ai_transcribe()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_ai_transcribe(self):
        content_len = int(self.headers.get("Content-Length", 0))
        audio_data = self.rfile.read(content_len)
        try:
            if not GROQ_KEY:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "No Groq API key found"}).encode("utf-8"))
                return

            boundary = "----PromptFlowBoundary" + os.urandom(8).hex()
            body = bytearray()

            # model field
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="model"\r\n\r\n')
            body.extend(b'whisper-large-v3-turbo\r\n')

            # language field
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="language"\r\n\r\n')
            body.extend(b'en\r\n')

            # response_format
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="response_format"\r\n\r\n')
            body.extend(b'json\r\n')

            # file field
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(b'Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n')
            body.extend(b'Content-Type: audio/webm\r\n\r\n')
            body.extend(audio_data)
            body.extend(b'\r\n')

            # closing boundary
            body.extend(f"--{boundary}--\r\n".encode("utf-8"))

            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={
                    "Authorization": f"Bearer {GROQ_KEY}",
                    "Content-Type": f"multipart/form-data; boundary={boundary}"
                },
                data=bytes(body)
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                text = res_body.get("text", "").strip()

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "text": text}).encode("utf-8"))
        except urllib.error.HTTPError as he:
            err_msg = he.read().decode("utf-8")
            print(f"[Transcribe Groq HTTPError {he.code}]: {err_msg}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": err_msg}).encode("utf-8"))
        except Exception as e:
            print(f"[Transcribe Exception]: {e}")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

    def handle_ai_generate(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            topic = data.get("topic", "").strip()
            format_type = data.get("format", "speech")
            tone = data.get("tone", "conversational")
            target_time = data.get("target_time", "60 seconds")

            if not topic:
                self.send_error(400, "Topic is required")
                return

            system_instruction = (
                "You are an elite speechwriter for world-class speakers and content creators. "
                "Write spoken teleprompter scripts optimized for live reading. "
                "Use short, punchy sentences, natural breath marks, and bracketed stage cues like [PAUSE 1s], [SMILE], [EMPHASIZE]. "
                "Do NOT include markdown titles or extra chit-chat. Return ONLY the spoken teleprompter script."
            )

            prompt = (
                f"Write a {format_type} about '{topic}'.\n"
                f"Tone: {tone}.\n"
                f"Target duration: {target_time} (approx {int(target_time.split()[0]) * 130 // 60 if target_time.split()[0].isdigit() else 150} words).\n"
                f"Format it with clear paragraph breaks for effortless teleprompter scrolling."
            )

            script, model = call_ai(prompt, system_instruction)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "script": script, "model": model}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

    def handle_ai_enhance(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            raw_text = data.get("text", "").strip()
            mode = data.get("mode", "teleprompter_polish")

            if not raw_text:
                self.send_error(400, "Text is required")
                return

            system_instruction = (
                "You are an expert teleprompter script editor. "
                "Your job is to transform raw written text into oral, spoken-word excellence for teleprompter delivery. "
                "Format with: short natural breath chunks, clear capitalization for emphasis, phonetic pronunciation in parentheses for difficult words, and cues like [PAUSE 2s]. "
                "Return ONLY the refined teleprompter script without meta commentary."
            )

            if mode == "add_pauses":
                prompt = f"Add dramatic pauses [PAUSE 1s] or [PAUSE 2s] and emphasis to this script to make the delivery sound confident and natural:\n\n{raw_text}"
            elif mode == "bullet_cues":
                prompt = f"Condense this text into punchy speaking cues and bullet teleprompter notes for a keynote speaker:\n\n{raw_text}"
            elif mode == "simplify":
                prompt = f"Rewrite this text into simple, crystal-clear conversational language that rolls off the tongue without stuttering:\n\n{raw_text}"
            else:
                prompt = f"Optimize this text specifically for a teleprompter. Break long sentences into short breath units, emphasize key takeaway words, and format for effortless reading:\n\n{raw_text}"

            refined, model = call_ai(prompt, system_instruction)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "refined": refined, "model": model}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))

def main():
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TeleprompterHandler) as httpd:
        print(f"[PromptFlow Teleprompter] Server running at http://localhost:{PORT}")
        print(f"AI Provider: OpenRouter ({'Active' if OPENROUTER_KEY else 'Missing Key'})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()
